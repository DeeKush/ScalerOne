export function computeProfileComplete(partial) {
  const nameOk = String(partial.fullName || '').trim().length >= 2;
  const emailOk =
    partial.accountType === 'employee' ||
    partial.accountType === 'student' ||
    /@(sst\.)?scaler\.com$/i.test(partial.email || '');
  return nameOk && Boolean(partial.phoneVerified) && emailOk;
}

export function emptyProfile(uid, email = '') {
  return {
    uid,
    email,
    fullName: '',
    phone: '',
    phoneVerified: false,
    accountType: 'unknown',
    photoUrl: '',
    studentId: '',
    profileComplete: false,
  };
}
