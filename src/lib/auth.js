import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getFirebaseAuth, getFirebaseDb, useMockAuth } from './firebase';
import {
  parseEmailIdentity,
  formatStudentId,
  displayNameFromEmail,
} from './emailIdentity';
import { computeProfileComplete, emptyProfile } from './userProfile';

WebBrowser.maybeCompleteAuthSession();

const MOCK_UID = 'mock-user';

let mockSession = null;

export async function loadProfile(uid) {
  if (useMockAuth()) {
    return mockSession?.profile.uid === uid ? mockSession.profile : null;
  }
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function upsertProfile(profile) {
  const next = {
    ...profile,
    profileComplete: computeProfileComplete(profile),
  };
  if (useMockAuth()) {
    mockSession = {
      profile: next,
      phoneCode: mockSession?.phoneCode ?? '123456',
      pendingPhone: mockSession?.pendingPhone,
    };
    return;
  }
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore not configured');
  await setDoc(
    doc(db, 'users', profile.uid),
    { ...next, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function subscribeAuth(cb) {
  if (useMockAuth()) {
    cb(null);
    return () => undefined;
  }
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, cb);
}

function profileFromIdentity(uid, email, extras = {}) {
  const identity = parseEmailIdentity(email);
  const fullName = extras.fullName?.trim() || displayNameFromEmail(email);
  return {
    ...emptyProfile(uid, identity.email || email),
    ...extras,
    uid,
    email: identity.email || email,
    fullName,
    accountType: identity.accountType === 'unknown' ? 'student' : identity.accountType,
    batchYear: identity.batchYear,
    passOutYear: identity.passOutYear,
    rollNumber: identity.rollNumber,
    programCode: identity.programCode,
    studentId: formatStudentId(identity),
  };
}

export async function signInWithGoogleIdToken(idToken) {
  if (useMockAuth()) {
    throw new Error('Mock auth: use completeMockGoogle instead');
  }
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not configured');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const email = result.user.email ?? '';
  const identity = parseEmailIdentity(email);
  if (!identity.domainAllowed) {
    await firebaseSignOut(auth);
    throw new Error('Scaler users only. Use @sst.scaler.com or @scaler.com');
  }
  await assertScalerEmailRemote(email).catch(() => undefined);

  const existing = await loadProfile(result.user.uid);
  const profile = {
    ...(existing ?? emptyProfile(result.user.uid, email)),
    ...profileFromIdentity(result.user.uid, email, {
      fullName: result.user.displayName || existing?.fullName,
      photoUrl: result.user.photoURL || existing?.photoUrl || '',
      phone: existing?.phone ?? '',
      phoneVerified: existing?.phoneVerified ?? false,
    }),
  };
  profile.profileComplete = computeProfileComplete(profile);
  await upsertProfile(profile);
  return profile;
}

export async function completeMockGoogle(email, fullName) {
  const identity = parseEmailIdentity(email);
  if (!identity.domainAllowed) {
    throw new Error('Scaler users only. Use @sst.scaler.com or @scaler.com');
  }
  const profile = profileFromIdentity(MOCK_UID, identity.email, {
    fullName: fullName?.trim() || displayNameFromEmail(email),
    phone: mockSession?.profile.phone ?? '',
    phoneVerified: mockSession?.profile.phoneVerified ?? false,
    photoUrl: mockSession?.profile.photoUrl ?? '',
  });
  profile.profileComplete = computeProfileComplete(profile);
  mockSession = { profile, phoneCode: '123456', pendingPhone: mockSession?.pendingPhone };
  return profile;
}

export function toIndiaE164(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('Enter a 10-digit Indian mobile number.');
  }
  return `+91${digits}`;
}

function storedPhone(phoneInput, fallback) {
  const raw = phoneInput || fallback || '';
  if (!String(raw).trim()) {
    throw new Error('Enter a 10-digit Indian mobile number.');
  }
  try {
    return toIndiaE164(raw);
  } catch {
    return String(raw).trim();
  }
}

export async function startPhoneVerification(phone) {
  if (useMockAuth()) {
    if (!mockSession) {
      mockSession = { profile: emptyProfile(MOCK_UID), phoneCode: '123456' };
    }
    mockSession.pendingPhone = phone;
    return { verificationId: 'mock-verification' };
  }
  throw new Error(
    'Phone OTP requires a native Firebase build or Cloud Function SMS. Enable mock auth or configure native phone auth.'
  );
}

export async function confirmPhoneCode(verificationId, code, fullName, phoneInput) {
  if (useMockAuth()) {
    if (!mockSession) throw new Error('Sign in with Google first');
    if (code.trim() !== mockSession.phoneCode) {
      throw new Error('Invalid OTP. Use 123456 in mock mode.');
    }
    const phone = storedPhone(phoneInput, mockSession.pendingPhone ?? mockSession.profile.phone);
    const profile = {
      ...mockSession.profile,
      fullName: fullName?.trim() || mockSession.profile.fullName,
      phone,
      phoneVerified: true,
    };
    profile.profileComplete = computeProfileComplete(profile);
    mockSession.profile = profile;
    mockSession.pendingPhone = phone;
    return profile;
  }

  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Sign in with Google first');
  if (!verificationId) {
    throw new Error(
      'Phone OTP requires a native Firebase build or Cloud Function SMS. Enable mock auth or configure native phone auth.'
    );
  }
  const credential = PhoneAuthProvider.credential(verificationId, code);
  await linkWithCredential(auth.currentUser, credential);
  const existing = (await loadProfile(auth.currentUser.uid)) ?? emptyProfile(auth.currentUser.uid);
  const profile = {
    ...existing,
    fullName: fullName?.trim() || existing.fullName,
    phone: auth.currentUser.phoneNumber ?? storedPhone(phoneInput, existing.phone),
    phoneVerified: true,
  };
  profile.profileComplete = computeProfileComplete(profile);
  await upsertProfile(profile);
  return profile;
}

export async function saveFullName(fullName) {
  if (useMockAuth()) {
    if (!mockSession) throw new Error('No session');
    const profile = { ...mockSession.profile, fullName: fullName.trim() };
    profile.profileComplete = computeProfileComplete(profile);
    mockSession.profile = profile;
    return profile;
  }
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Not signed in');
  const existing = (await loadProfile(auth.currentUser.uid)) ?? emptyProfile(auth.currentUser.uid);
  const profile = { ...existing, fullName: fullName.trim() };
  profile.profileComplete = computeProfileComplete(profile);
  await upsertProfile(profile);
  return profile;
}

export async function signOut() {
  if (useMockAuth()) {
    mockSession = null;
    return;
  }
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

export function getMockProfile() {
  return mockSession?.profile ?? null;
}

const PLACEHOLDER_GOOGLE_CLIENT_ID = 'mock.apps.googleusercontent.com';

export function useGoogleAuthRequest() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  return Google.useAuthRequest({
    clientId: clientId || webClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    iosClientId: iosClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    androidClientId: androidClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    webClientId: webClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });
}

async function assertScalerEmailRemote(email) {
  const base = process.env.EXPO_PUBLIC_FUNCTIONS_URL;
  if (!base) return;
  const res = await fetch(`${base}/assertScalerEmail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? 'Email domain rejected');
  }
}

export { PhoneAuthProvider };
