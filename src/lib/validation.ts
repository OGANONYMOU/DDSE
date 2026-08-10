// Reusable validation utilities for the DDSE authentication system.

// ─── Password ────────────────────────────────────────────────────────────────

export interface PasswordCriteria {
  minLength:    boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber:    boolean;
  hasSpecial:   boolean;
}

export interface PasswordStrength {
  score:    number;   // 0–5
  label:    string;
  color:    string;
  criteria: PasswordCriteria;
  isValid:  boolean;  // all 5 criteria met
}

const SPECIAL_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;

const PW_META: Array<{ label: string; color: string }> = [
  { label: '',           color: 'transparent' },
  { label: 'Very Weak',  color: '#ef4444'     },
  { label: 'Weak',       color: '#f97316'     },
  { label: 'Fair',       color: '#eab308'     },
  { label: 'Good',       color: '#22c55e'     },
  { label: 'Strong',     color: '#10b981'     },
];

export function assessPassword(pw: string): PasswordStrength {
  const criteria: PasswordCriteria = {
    minLength:    pw.length >= 8,
    hasUppercase: /[A-Z]/.test(pw),
    hasLowercase: /[a-z]/.test(pw),
    hasNumber:    /[0-9]/.test(pw),
    hasSpecial:   SPECIAL_RE.test(pw),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return {
    score,
    label:   pw.length > 0 ? PW_META[score].label : '',
    color:   pw.length > 0 ? PW_META[score].color : 'transparent',
    criteria,
    isValid: score === 5,
  };
}

// ─── Field validators (return null on pass, error string on fail) ─────────────

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address.';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return 'Phone number is required.';
  if (phone.length < 10) return 'Must be at least 10 digits.';
  if (phone.length > 15) return 'Must not exceed 15 digits.';
  return null;
}

export function validateServiceNumber(sn: string): string | null {
  if (!sn) return 'Service number is required.';
  if (sn.length < 4) return 'Must be at least 4 characters.';
  if (!/^[a-zA-Z0-9]+$/.test(sn)) return 'Letters and numbers only, no spaces or symbols.';
  return null;
}

// ─── Forgot-password form validator ─────────────────────────────────────────

export interface ForgotFields {
  serviceNumber:   string;
  phoneNumber:     string;
  newPassword:     string;
  confirmPassword: string;
}

export function validateForgotForm(form: ForgotFields): Record<string, string> {
  const e: Record<string, string> = {};

  const snErr = validateServiceNumber(form.serviceNumber);
  if (snErr)                                       e.serviceNumber   = snErr;

  const phErr = validatePhone(form.phoneNumber);
  if (phErr)                                       e.phoneNumber     = phErr;

  if (!assessPassword(form.newPassword).isValid)   e.newPassword     = 'Password does not meet all requirements.';

  if (form.newPassword !== form.confirmPassword)   e.confirmPassword = 'Passwords do not match.';

  return e;
}

// ─── Full registration form validator ────────────────────────────────────────

export interface RegistrationFields {
  fullName:        string;
  email:           string;
  serviceNumber:   string;
  phoneNumber:     string;
  rankCode:        string;
  directorateCode: string;
  password:        string;
  confirmPassword: string;
}

export function validateRegistrationForm(
  form: RegistrationFields
): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.fullName.trim())                       e.fullName        = 'Full name is required.';

  const emailErr = validateEmail(form.email);
  if (emailErr)                                    e.email           = emailErr;

  const snErr = validateServiceNumber(form.serviceNumber);
  if (snErr)                                       e.serviceNumber   = snErr;

  const phErr = validatePhone(form.phoneNumber);
  if (phErr)                                       e.phoneNumber     = phErr;

  if (!form.rankCode)                              e.rankCode        = 'Rank is required.';
  if (!form.directorateCode)                       e.directorateCode = 'Directorate is required.';

  if (!assessPassword(form.password).isValid)      e.password        = 'Password does not meet all requirements.';

  if (form.password !== form.confirmPassword)      e.confirmPassword = 'Passwords do not match.';

  return e;
}
