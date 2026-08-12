export type AccountType = 'employee' | 'student' | 'unknown';

export type EmailIdentity = {
  email: string;
  domainAllowed: boolean;
  accountType: AccountType;
  batchYear?: number;
  passOutYear?: number;
  rollNumber?: string;
  programCode?: string;
  parseError?: string;
};

const ALLOWED_SUFFIXES = ['@sst.scaler.com', '@scaler.com'] as const;

export function isAllowedScalerEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ALLOWED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

/**
 * SST shape: name.YY{program}{roll}@sst.scaler.com
 * e.g. ariyan.25bcs10115@sst.scaler.com → batch 2025, pass-out 2029, roll 10115, program bcs
 */
export function parseEmailIdentity(email: string): EmailIdentity {
  const normalized = email.trim().toLowerCase();
  const base: EmailIdentity = {
    email: normalized,
    domainAllowed: isAllowedScalerEmail(normalized),
    accountType: 'unknown',
  };

  if (!base.domainAllowed) {
    return { ...base, parseError: 'Email must be @sst.scaler.com or @scaler.com' };
  }

  if (normalized.endsWith('@scaler.com') && !normalized.endsWith('@sst.scaler.com')) {
    return { ...base, accountType: 'employee' };
  }

  // @sst.scaler.com student
  const local = normalized.split('@')[0] ?? '';
  const match = local.match(/\.(\d{2})([a-z]+)(\d+)$/i);
  if (!match) {
    return {
      ...base,
      accountType: 'student',
      parseError: 'Could not parse batch/roll from SST email',
    };
  }

  const yy = Number(match[1]);
  const programCode = match[2].toLowerCase();
  const rollNumber = match[3];
  const batchYear = 2000 + yy;

  return {
    ...base,
    accountType: 'student',
    batchYear,
    passOutYear: batchYear + 4,
    rollNumber,
    programCode,
  };
}
