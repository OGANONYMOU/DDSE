import { describe, it, expect } from 'vitest';
import {
  assessPassword,
  validateEmail,
  validatePhone,
  validateServiceNumber,
  validateRegistrationForm,
  type RegistrationFields,
} from '../../lib/validation';

describe('assessPassword', () => {
  it('scores 0 for empty string', () => {
    const r = assessPassword('');
    expect(r.score).toBe(0);
    expect(r.isValid).toBe(false);
  });

  it('detects all criteria for strong password', () => {
    const r = assessPassword('Secure@123');
    expect(r.criteria.minLength).toBe(true);
    expect(r.criteria.hasUppercase).toBe(true);
    expect(r.criteria.hasLowercase).toBe(true);
    expect(r.criteria.hasNumber).toBe(true);
    expect(r.criteria.hasSpecial).toBe(true);
    expect(r.isValid).toBe(true);
    expect(r.score).toBe(5);
  });

  it('marks password without special char as invalid', () => {
    const r = assessPassword('Secure123');
    expect(r.criteria.hasSpecial).toBe(false);
    expect(r.isValid).toBe(false);
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@domain.com')).toBeNull();
    expect(validateEmail('first.last@gov.ng')).toBeNull();
  });

  it('rejects empty', () => {
    expect(validateEmail('')).not.toBeNull();
  });

  it('rejects malformed emails', () => {
    expect(validateEmail('notanemail')).not.toBeNull();
    expect(validateEmail('missing@')).not.toBeNull();
  });
});

describe('validatePhone', () => {
  it('accepts 10-digit number', () => {
    expect(validatePhone('0801234567')).toBeNull();
  });

  it('rejects too short', () => {
    expect(validatePhone('0801')).not.toBeNull();
  });

  it('rejects too long', () => {
    expect(validatePhone('0'.repeat(16))).not.toBeNull();
  });

  it('rejects empty', () => {
    expect(validatePhone('')).not.toBeNull();
  });
});

describe('validateServiceNumber', () => {
  it('accepts valid service number', () => {
    expect(validateServiceNumber('12345')).toBeNull();
  });

  it('rejects too short', () => {
    expect(validateServiceNumber('123')).not.toBeNull();
  });

  it('rejects empty', () => {
    expect(validateServiceNumber('')).not.toBeNull();
  });

  it('accepts alphanumeric service numbers', () => {
    expect(validateServiceNumber('SA000001')).toBeNull();
    expect(validateServiceNumber('ng2026abc')).toBeNull();
  });

  it('rejects symbols and spaces', () => {
    expect(validateServiceNumber('SA-0001')).not.toBeNull();
    expect(validateServiceNumber('SA 0001')).not.toBeNull();
  });
});

describe('validateRegistrationForm', () => {
  const valid: RegistrationFields = {
    fullName:        'John Doe',
    email:           'john@mil.ng',
    serviceNumber:   '12345',
    phoneNumber:     '0801234567',
    rankCode:        'LT',
    directorateCode: 'DESE',
    password:        'Secure@123',
    confirmPassword: 'Secure@123',
  };

  it('returns no errors for a complete valid form', () => {
    expect(Object.keys(validateRegistrationForm(valid))).toHaveLength(0);
  });

  it('flags mismatched passwords', () => {
    const errors = validateRegistrationForm({ ...valid, confirmPassword: 'different' });
    expect(errors).toHaveProperty('confirmPassword');
  });

  it('flags missing fullName', () => {
    const errors = validateRegistrationForm({ ...valid, fullName: '' });
    expect(errors).toHaveProperty('fullName');
  });

  it('flags invalid password strength', () => {
    const errors = validateRegistrationForm({ ...valid, password: 'weak', confirmPassword: 'weak' });
    expect(errors).toHaveProperty('password');
  });
});
