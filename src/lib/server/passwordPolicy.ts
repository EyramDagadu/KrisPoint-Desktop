export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
  preventReuse: number;
}

export const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90,
  preventReuse: 5
};

export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_POLICY): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    strengthScore += 1;
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>[\]\\\/`~_+=;'-]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else if (/[!@#$%^&*(),.?":{}|<>[\]\\\/`~_+=;'-]/.test(password)) {
    strengthScore += 1;
  }

  if (password.length >= 12) strengthScore += 1;
  if (password.length >= 16) strengthScore += 1;

  let strength: 'weak' | 'medium' | 'strong';
  if (strengthScore <= 2) {
    strength = 'weak';
  } else if (strengthScore <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

export function isPasswordExpired(lastChangeDate: Date | null, maxAgeDays: number = DEFAULT_POLICY.maxAge): boolean {
  if (!lastChangeDate) return true;
  
  const now = new Date();
  const expiryDate = new Date(lastChangeDate);
  expiryDate.setDate(expiryDate.getDate() + maxAgeDays);
  
  return now > expiryDate;
}

export function daysUntilPasswordExpiry(lastChangeDate: Date | null, maxAgeDays: number = DEFAULT_POLICY.maxAge): number {
  if (!lastChangeDate) return 0;
  
  const now = new Date();
  const expiryDate = new Date(lastChangeDate);
  expiryDate.setDate(expiryDate.getDate() + maxAgeDays);
  
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function getPasswordRequirementsText(policy: PasswordPolicy = DEFAULT_POLICY): string[] {
  const requirements: string[] = [];
  
  requirements.push(`At least ${policy.minLength} characters`);
  if (policy.requireUppercase) requirements.push('One uppercase letter (A-Z)');
  if (policy.requireLowercase) requirements.push('One lowercase letter (a-z)');
  if (policy.requireNumbers) requirements.push('One number (0-9)');
  if (policy.requireSpecialChars) requirements.push('One special character (!@#$%^&*...)');
  
  return requirements;
}
