import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canAccessDeck,
  getClearanceLevel,
  outranks,
  getRoleConfig,
} from '../../lib/rbac';

describe('RBAC — hasPermission', () => {
  it('super_admin has all permissions', () => {
    expect(hasPermission('super_admin', 'platform.admin')).toBe(true);
    expect(hasPermission('super_admin', 'system.emergency_lockdown')).toBe(true);
    expect(hasPermission('super_admin', 'data.top_secret')).toBe(true);
  });

  it('staff cannot access system permissions', () => {
    expect(hasPermission('staff', 'platform.admin')).toBe(false);
    expect(hasPermission('staff', 'system.audit_logs')).toBe(false);
    expect(hasPermission('staff', 'data.classified')).toBe(false);
  });

  it('safety_officer can conduct safety checks', () => {
    expect(hasPermission('safety_officer', 'safety.conduct')).toBe(true);
    expect(hasPermission('safety_officer', 'safety.submit_report')).toBe(true);
  });

  it('inspection_officer cannot approve inspections', () => {
    expect(hasPermission('inspection_officer', 'inspections.approve_major')).toBe(false);
    expect(hasPermission('inspection_officer', 'inspections.approve_local')).toBe(false);
  });
});

describe('RBAC — canAccessDeck', () => {
  it('super_admin can access all decks', () => {
    expect(canAccessDeck('super_admin', 'analytics')).toBe(true);
    expect(canAccessDeck('super_admin', 'armoury')).toBe(true);
    expect(canAccessDeck('super_admin', 'personnel')).toBe(true);
  });

  it('engineering_officer can only access engineering and checklists', () => {
    expect(canAccessDeck('engineering_officer', 'engineering')).toBe(true);
    expect(canAccessDeck('engineering_officer', 'checklists')).toBe(true);
    expect(canAccessDeck('engineering_officer', 'analytics')).toBe(false);
    expect(canAccessDeck('engineering_officer', 'armoury')).toBe(false);
  });

  it('staff only has checklists access', () => {
    expect(canAccessDeck('staff', 'checklists')).toBe(true);
    expect(canAccessDeck('staff', 'hq')).toBe(false);
  });
});

describe('RBAC — clearance levels', () => {
  it('super_admin and director have level 6', () => {
    expect(getClearanceLevel('super_admin')).toBe(6);
    expect(getClearanceLevel('director')).toBe(6);
  });

  it('staff has clearance 2', () => {
    expect(getClearanceLevel('staff')).toBe(2);
  });

  it('unknown roles fall back to staff config', () => {
    expect(getClearanceLevel('unknown_role')).toBe(2);
  });
});

describe('RBAC — outranks', () => {
  it('director outranks commander', () => {
    expect(outranks('director', 'commander')).toBe(true);
  });

  it('commander outranks admin', () => {
    expect(outranks('commander', 'admin')).toBe(true);
  });

  it('staff does not outrank super_admin', () => {
    expect(outranks('staff', 'super_admin')).toBe(false);
  });

  it('equal roles do not outrank each other', () => {
    expect(outranks('admin', 'admin')).toBe(false);
  });
});

describe('RBAC — getRoleConfig', () => {
  it('returns correct label for known role', () => {
    expect(getRoleConfig('commander').label).toBe('Commander');
    expect(getRoleConfig('auditor').label).toBe('Auditor');
  });

  it('falls back gracefully for unknown roleCode', () => {
    const fallback = getRoleConfig('ghost_role');
    expect(fallback.code).toBe('staff');
  });
});
