export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  accountType: 'employee' | 'student' | 'unknown';
  batchYear?: number;
  passOutYear?: number;
  rollNumber?: string;
  programCode?: string;
  profileComplete: boolean;
};

export function computeProfileComplete(
  partial: Pick<UserProfile, 'fullName' | 'phoneVerified' | 'email' | 'accountType'>
): boolean {
  const nameOk = partial.fullName.trim().length >= 2;
  const emailOk =
    partial.accountType === 'employee' ||
    partial.accountType === 'student' ||
    // allow if domain valid even when parse soft-fails
    /@(sst\.)?scaler\.com$/i.test(partial.email);
  return nameOk && partial.phoneVerified && emailOk;
}
