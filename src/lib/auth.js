import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  PhoneAuthState,
  linkWithCredential,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  verifyPhoneNumber,
} from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import {
  parseEmailIdentity,
  formatStudentId,
  displayNameFromEmail,
} from './emailIdentity';
import { computeProfileComplete, emptyProfile } from './userProfile';

let googleConfigured = false;
let pendingPhone = null;

function errorCode(error) {
  return String(error?.code ?? '');
}

function errorMessage(error) {
  return String(error?.message ?? '');
}

function isUnavailable(error) {
  const code = errorCode(error);
  const message = errorMessage(error);
  return (
    code.includes('unavailable') ||
    /firestore\/unavailable/i.test(code) ||
    /service is currently unavailable/i.test(message)
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withBackoff(fn, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!isUnavailable(error) || i === attempts - 1) throw error;
      await sleep(400 * 2 ** i);
    }
  }
  throw last;
}

function mapAuthError(error) {
  const code = errorCode(error);
  const message = errorMessage(error);
  const status = code.includes('/') ? code.slice(code.lastIndexOf('/') + 1) : code;

  if (isUnavailable(error)) {
    return new Error(
      'Cloud database is unreachable. In Firebase Console (scalerone-746d8) create the default Firestore database named (default), then retry. Google sign-in itself already succeeded.'
    );
  }
  if (code.includes('invalid-verification-code')) {
    return new Error('Invalid OTP. Check the code and try again.');
  }
  if (code.includes('provider-already-linked')) {
    return new Error('This phone number is already linked to this account.');
  }
  if (code.includes('credential-already-in-use')) {
    return new Error('This phone number is already linked to another account.');
  }
  if (code.includes('session-expired')) {
    return new Error('OTP expired. Send a new code.');
  }
  if (code.includes('too-many-requests')) {
    return new Error('Too many attempts. Wait a bit and try again.');
  }
  if (code.includes('invalid-phone-number')) {
    return new Error('Enter a 10-digit Indian mobile number.');
  }
  if (code.includes('operation-not-allowed')) {
    return new Error(
      'Phone sign-in is off. In Firebase Console (scalerone-746d8) open Authentication → Sign-in method → enable Phone. SMS may also need Blaze billing.'
    );
  }
  if (code.includes('missing-client-identifier') || code.includes('app-not-authorized')) {
    return new Error('Phone auth is not set up for this Android build. Add the app SHA-1 in Firebase.');
  }

  const playStatus =
    code === '8' ||
    code === '10' ||
    code === '13' ||
    status === '8' ||
    status === '10' ||
    status === '13' ||
    status === 'INTERNAL' ||
    status === 'INTERNAL_ERROR' ||
    status === 'ERROR' ||
    code.includes('DEVELOPER_ERROR') ||
    code.includes('INTERNAL_ERROR') ||
    /system error/i.test(message) ||
    error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE;

  if (playStatus) {
    if (code === '10' || status === '10' || code.includes('DEVELOPER_ERROR')) {
      return new Error(
        'Google Sign-In is misconfigured. Use the Web OAuth client ID from this Firebase project and add the APK SHA-1 in Firebase.'
      );
    }
    return new Error(
      'Google Play Services had a system error. Update Play Services, check network, and try again.'
    );
  }

  if (error instanceof Error && error.message) return error;
  return new Error(message || 'Something went wrong');
}

function ensureGoogleConfigured() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new Error('Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env (Web OAuth client ID from Google Cloud).');
  }
  // hostedDomain cannot cover both @sst.scaler.com and @scaler.com; keep the picker open.
  GoogleSignin.configure({ webClientId });
  googleConfigured = true;
}

function stripLocalFlags(profile) {
  const next = { ...profile };
  delete next.firestoreSynced;
  return next;
}

export async function loadProfile(uid) {
  return withBackoff(async () => {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data();
  });
}

export async function upsertProfile(profile) {
  const next = {
    ...stripLocalFlags(profile),
    profileComplete: computeProfileComplete(profile),
  };
  await withBackoff(async () => {
    const db = getFirebaseDb();
    await setDoc(
      doc(db, 'users', next.uid),
      { ...next, updatedAt: serverTimestamp() },
      { merge: true }
    );
  });
  return next;
}

export function subscribeAuth(cb) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

function profileFromIdentity(uid, email, extras = {}) {
  const identity = parseEmailIdentity(email);
  const fullName = extras.fullName?.trim() || displayNameFromEmail(email);
  const next = {
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
  return { ...next, profileComplete: computeProfileComplete(next) };
}

export function profileFromAuthUser(user, extras = {}) {
  return profileFromIdentity(user.uid, user.email ?? '', {
    fullName: extras.fullName || user.displayName || '',
    photoUrl: extras.photoUrl || user.photoURL || '',
    phone: extras.phone ?? user.phoneNumber ?? '',
    phoneVerified: extras.phoneVerified ?? Boolean(user.phoneNumber),
  });
}

async function persistProfile(profile) {
  try {
    const saved = await upsertProfile(profile);
    return { ...saved, firestoreSynced: true };
  } catch (error) {
    if (!isUnavailable(error)) throw mapAuthError(error);
    return {
      ...profile,
      profileComplete: computeProfileComplete(profile),
      firestoreSynced: false,
    };
  }
}

export async function signInWithGoogle() {
  ensureGoogleConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch (error) {
    throw mapAuthError(error);
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED || error?.code === statusCodes.IN_PROGRESS) {
      return null;
    }
    throw mapAuthError(error);
  }

  if (response?.type !== 'success') return null;
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
  }

  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  let result;
  try {
    result = await signInWithCredential(auth, credential);
  } catch (error) {
    throw mapAuthError(error);
  }

  const email = result.user.email ?? '';
  const identity = parseEmailIdentity(email);
  if (!identity.domainAllowed) {
    await firebaseSignOut(auth);
    await GoogleSignin.signOut().catch(() => undefined);
    throw new Error('Scaler users only. Use @sst.scaler.com or @scaler.com');
  }
  await assertScalerEmailRemote(email).catch(() => undefined);

  let existing = null;
  try {
    existing = await loadProfile(result.user.uid);
  } catch (error) {
    if (!isUnavailable(error)) throw mapAuthError(error);
  }

  const profile = {
    ...(existing ?? emptyProfile(result.user.uid, email)),
    ...profileFromIdentity(result.user.uid, email, {
      fullName: result.user.displayName || existing?.fullName,
      photoUrl: result.user.photoURL || existing?.photoUrl || '',
      phone: existing?.phone ?? result.user.phoneNumber ?? '',
      phoneVerified: existing?.phoneVerified ?? Boolean(result.user.phoneNumber),
    }),
  };
  return persistProfile(profile);
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

export async function startPhoneVerification(phone) {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Sign in with Google first');
  const e164 = toIndiaE164(phone);

  const snapshot = await new Promise((resolve, reject) => {
    verifyPhoneNumber(auth, e164).on(
      'state_changed',
      (snap) => {
        if (snap.state === PhoneAuthState.CODE_SENT || snap.state === PhoneAuthState.AUTO_VERIFIED) {
          resolve(snap);
        }
        if (snap.state === PhoneAuthState.ERROR) {
          reject(mapAuthError(snap.error));
        }
      },
      (err) => reject(mapAuthError(err))
    );
  });

  if (!snapshot.verificationId) {
    throw new Error('Firebase did not return a verification ID. Check Phone auth and the app SHA-1.');
  }

  const autoVerified = snapshot.state === PhoneAuthState.AUTO_VERIFIED;
  pendingPhone = {
    verificationId: snapshot.verificationId,
    autoCode: snapshot.code,
    autoVerified,
  };
  return {
    verificationId: snapshot.verificationId,
    autoCode: snapshot.code,
    autoVerified,
  };
}

export async function confirmPhoneCode(verificationId, code, fullName, phoneInput) {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Sign in with Google first');

  const id = verificationId || pendingPhone?.verificationId;
  if (id) {
    try {
      const credential = PhoneAuthProvider.credential(id, String(code || '').trim());
      await linkWithCredential(auth.currentUser, credential);
    } catch (error) {
      const codeName = errorCode(error);
      if (!codeName.includes('provider-already-linked')) {
        throw mapAuthError(error);
      }
    }
    pendingPhone = null;
  } else if (!phoneInput) {
    throw new Error('Enter a 10-digit Indian mobile number and the 6-digit OTP.');
  }

  let existing;
  try {
    existing = (await loadProfile(auth.currentUser.uid)) ?? profileFromAuthUser(auth.currentUser);
  } catch (error) {
    if (!isUnavailable(error)) throw mapAuthError(error);
    existing = profileFromAuthUser(auth.currentUser);
  }
  const fallbackPhone = phoneInput ? toIndiaE164(phoneInput) : existing.phone;
  const profile = {
    ...existing,
    fullName: fullName?.trim() || existing.fullName,
    phone: auth.currentUser.phoneNumber ?? fallbackPhone,
    phoneVerified: true,
  };
  return persistProfile(profile);
}

export async function saveFullName(fullName) {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Not signed in');
  let existing;
  try {
    existing = (await loadProfile(auth.currentUser.uid)) ?? profileFromAuthUser(auth.currentUser);
  } catch (error) {
    if (!isUnavailable(error)) throw mapAuthError(error);
    existing = profileFromAuthUser(auth.currentUser);
  }
  return persistProfile({ ...existing, fullName: fullName.trim() });
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google session may not exist (cold start, revoked).
  }
  await firebaseSignOut(getFirebaseAuth());
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
