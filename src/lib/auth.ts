import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getFirebaseAuth, getFirebaseDb, useMockAuth } from './firebase';
import { parseEmailIdentity } from './emailIdentity';
import { computeProfileComplete, type UserProfile } from './userProfile';

WebBrowser.maybeCompleteAuthSession();

const MOCK_UID = 'mock-user';

type MockSession = {
  profile: UserProfile;
  phoneCode: string;
  pendingPhone?: string;
};

let mockSession: MockSession | null = null;

function emptyProfile(uid: string, email = ''): UserProfile {
  return {
    uid,
    email,
    fullName: '',
    phone: '',
    phoneVerified: false,
    accountType: 'unknown',
    profileComplete: false,
  };
}

export async function loadProfile(uid: string): Promise<UserProfile | null> {
  if (useMockAuth()) {
    return mockSession?.profile.uid === uid ? mockSession.profile : null;
  }
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
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

export function subscribeAuth(cb: (user: User | null) => void): () => void {
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

export async function signInWithGoogleIdToken(idToken: string): Promise<UserProfile> {
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
  // Optional Cloud Function domain assert (best-effort)
  await assertScalerEmailRemote(email).catch(() => undefined);

  const existing = await loadProfile(result.user.uid);
  const profile: UserProfile = {
    ...(existing ?? emptyProfile(result.user.uid, email)),
    uid: result.user.uid,
    email,
    accountType: identity.accountType === 'unknown' ? 'student' : identity.accountType,
    batchYear: identity.batchYear,
    passOutYear: identity.passOutYear,
    rollNumber: identity.rollNumber,
    programCode: identity.programCode,
  };
  profile.profileComplete = computeProfileComplete(profile);
  await upsertProfile(profile);
  return profile;
}

export async function completeMockGoogle(email: string, fullName: string): Promise<UserProfile> {
  const identity = parseEmailIdentity(email);
  if (!identity.domainAllowed) {
    throw new Error('Scaler users only. Use @sst.scaler.com or @scaler.com');
  }
  const profile: UserProfile = {
    uid: MOCK_UID,
    email: identity.email,
    fullName,
    phone: mockSession?.profile.phone ?? '',
    phoneVerified: mockSession?.profile.phoneVerified ?? false,
    accountType: identity.accountType === 'unknown' ? 'student' : identity.accountType,
    batchYear: identity.batchYear,
    passOutYear: identity.passOutYear,
    rollNumber: identity.rollNumber,
    programCode: identity.programCode,
    profileComplete: false,
  };
  profile.profileComplete = computeProfileComplete(profile);
  mockSession = { profile, phoneCode: '123456', pendingPhone: mockSession?.pendingPhone };
  return profile;
}

export async function startPhoneVerification(phone: string): Promise<{ verificationId: string }> {
  if (useMockAuth()) {
    if (!mockSession) {
      mockSession = { profile: emptyProfile(MOCK_UID), phoneCode: '123456' };
    }
    mockSession.pendingPhone = phone;
    return { verificationId: 'mock-verification' };
  }
  // Native Firebase phone auth typically needs a Recaptcha / native module.
  // For Expo Go we surface a clear error; production should use a dev build or CF SMS.
  throw new Error(
    'Phone OTP requires a native Firebase build or Cloud Function SMS. Enable mock auth or configure native phone auth.'
  );
}

export async function confirmPhoneCode(
  verificationId: string,
  code: string,
  fullName: string
): Promise<UserProfile> {
  if (useMockAuth()) {
    if (!mockSession) throw new Error('Sign in with Google first');
    if (code.trim() !== mockSession.phoneCode) {
      throw new Error('Invalid OTP. Use 123456 in mock mode.');
    }
    const phone = mockSession.pendingPhone ?? mockSession.profile.phone;
    const profile: UserProfile = {
      ...mockSession.profile,
      fullName: fullName.trim() || mockSession.profile.fullName,
      phone,
      phoneVerified: true,
    };
    profile.profileComplete = computeProfileComplete(profile);
    mockSession.profile = profile;
    return profile;
  }

  const auth = getFirebaseAuth();
  if (!auth?.currentUser) throw new Error('Sign in with Google first');
  const credential = PhoneAuthProvider.credential(verificationId, code);
  await linkWithCredential(auth.currentUser, credential);
  const existing = (await loadProfile(auth.currentUser.uid)) ?? emptyProfile(auth.currentUser.uid);
  const profile: UserProfile = {
    ...existing,
    fullName: fullName.trim() || existing.fullName,
    phone: auth.currentUser.phoneNumber ?? existing.phone,
    phoneVerified: true,
  };
  profile.profileComplete = computeProfileComplete(profile);
  await upsertProfile(profile);
  return profile;
}

export async function saveFullName(fullName: string): Promise<UserProfile> {
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

export async function signOut(): Promise<void> {
  if (useMockAuth()) {
    mockSession = null;
    return;
  }
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}

export function getMockProfile(): UserProfile | null {
  return mockSession?.profile ?? null;
}

/** Satisfies expo-auth-session validation when mock auth / IDs are unset (never used for real OAuth). */
const PLACEHOLDER_GOOGLE_CLIENT_ID = 'mock.apps.googleusercontent.com';

export function useGoogleAuthRequest() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  // Always pass non-empty IDs so Android/iOS don't throw on mount (mock auth never calls promptAsync).
  return Google.useAuthRequest({
    clientId: clientId || webClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    iosClientId: iosClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    androidClientId: androidClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    webClientId: webClientId || PLACEHOLDER_GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });
}

async function assertScalerEmailRemote(email: string): Promise<void> {
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
