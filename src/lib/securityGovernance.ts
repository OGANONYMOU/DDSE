// DDSE Security Governance Engine — v3.0
// Enforces data classification, clearance-based data filtering, access reviews,
// and operational security policies across the platform.
// This is the central policy engine — not just authentication, but authorization governance.

import type { ClearanceLevel, RoleCode, Permission } from './rbac';
import { getClearanceLevel, hasPermission, CLEARANCE_LABELS } from './rbac';
import { eventBus } from './eventBus';

// ─── Data Classification ──────────────────────────────────────────────────────

export type DataClassification =
  | 'PUBLIC'        // anyone
  | 'INTERNAL'      // all authenticated users
  | 'RESTRICTED'    // clearance level 3+
  | 'CONFIDENTIAL'  // clearance level 4+
  | 'SECRET'        // clearance level 5+
  | 'TOP_SECRET';   // clearance level 6 only

export const CLASSIFICATION_CLEARANCE: Record<DataClassification, ClearanceLevel> = {
  PUBLIC:       1,
  INTERNAL:     2,
  RESTRICTED:   3,
  CONFIDENTIAL: 4,
  SECRET:       5,
  TOP_SECRET:   6,
};

export const CLASSIFICATION_STYLES: Record<DataClassification, string> = {
  PUBLIC:       'text-slate-400  border-slate-700/40  bg-slate-800/20',
  INTERNAL:     'text-slate-300  border-slate-700/50  bg-slate-800/30',
  RESTRICTED:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
  CONFIDENTIAL: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  SECRET:       'text-rose-400   border-rose-500/30   bg-rose-500/10',
  TOP_SECRET:   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
};

// ─── Security Policy ──────────────────────────────────────────────────────────

export interface SecurityPolicy {
  id:          string;
  name:        string;
  description: string;
  enabled:     boolean;
  category:    'access' | 'data' | 'session' | 'audit' | 'network';
  enforcement: 'strict' | 'advisory';
  config:      Record<string, unknown>;
}

export const DEFAULT_POLICIES: SecurityPolicy[] = [
  {
    id: 'pol-001', name: 'Minimum Clearance Enforcement',
    description: 'Users cannot view data classified above their clearance level. Violations are logged.',
    enabled: true, category: 'data', enforcement: 'strict',
    config: { logViolations: true, alertThreshold: 3 },
  },
  {
    id: 'pol-002', name: 'Session Timeout Policy',
    description: 'Sessions expire after 60 minutes of inactivity. MFA required for re-authentication.',
    enabled: true, category: 'session', enforcement: 'strict',
    config: { timeoutMinutes: 60, warnAtMinutes: 55, requireMfaOnReentry: false },
  },
  {
    id: 'pol-003', name: 'Privileged Role Audit',
    description: 'All actions by super_admin and director roles are automatically audited in full.',
    enabled: true, category: 'audit', enforcement: 'strict',
    config: { privilegedRoles: ['super_admin', 'director'] },
  },
  {
    id: 'pol-004', name: 'Failed Authentication Lockout',
    description: 'Accounts are temporarily locked after 5 consecutive failed authentication attempts.',
    enabled: true, category: 'access', enforcement: 'strict',
    config: { maxAttempts: 5, lockoutMinutes: 15, progressiveLockout: true },
  },
  {
    id: 'pol-005', name: 'Data Export Restriction',
    description: 'Mass data exports require director approval and are logged with justification.',
    enabled: true, category: 'data', enforcement: 'advisory',
    config: { requiresApproval: true, approverRole: 'director', justificationRequired: true },
  },
  {
    id: 'pol-006', name: 'Classified Report Watermarking',
    description: 'RESTRICTED and above reports display user identity watermarks when accessed.',
    enabled: true, category: 'data', enforcement: 'advisory',
    config: { classifications: ['RESTRICTED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'] },
  },
  {
    id: 'pol-007', name: 'Access Review Schedule',
    description: 'Privileged role assignments are reviewed quarterly by the system administrator.',
    enabled: true, category: 'access', enforcement: 'advisory',
    config: { reviewIntervalDays: 90, reviewerRole: 'super_admin', lastReviewDate: null },
  },
  {
    id: 'pol-008', name: 'Content Security Policy',
    description: 'Frontend CSP headers prevent XSS and restrict resource loading to approved origins.',
    enabled: true, category: 'network', enforcement: 'strict',
    config: { reportOnly: false, allowedOrigins: ['*.supabase.co'] },
  },
];

// ─── Access review records ─────────────────────────────────────────────────────

export interface AccessReview {
  id:           string;
  reviewedUser: string;
  reviewedRole: RoleCode;
  reviewedBy:   string;
  decision:     'retain' | 'downgrade' | 'revoke';
  notes?:       string;
  reviewedAt:   number;
  nextReviewAt: number;
}

// ─── Governance engine ────────────────────────────────────────────────────────

export function canAccessClassification(
  roleCode:       RoleCode,
  classification: DataClassification
): boolean {
  const userClearance = getClearanceLevel(roleCode);
  const required      = CLASSIFICATION_CLEARANCE[classification];
  return userClearance >= required;
}

export function filterByClassification<T extends { classification?: DataClassification }>(
  items:    T[],
  roleCode: RoleCode
): T[] {
  return items.filter((item) => {
    if (!item.classification) return true;
    return canAccessClassification(roleCode, item.classification);
  });
}

export function assertClearance(
  roleCode:       RoleCode,
  classification: DataClassification,
  context?:       string
): void {
  if (!canAccessClassification(roleCode, classification)) {
    const userClearance = getClearanceLevel(roleCode);
    const required      = CLASSIFICATION_CLEARANCE[classification];

    eventBus.emit('system.health_degraded', {
      component: 'security',
      severity:  'warning',
      reason:    `Clearance violation: ${roleCode} (L${userClearance}) attempted to access ${classification} (requires L${required})${context ? ' — ' + context : ''}`,
    });

    throw new Error(
      `Insufficient clearance: ${CLEARANCE_LABELS[userClearance]} cannot access ${classification} data`
    );
  }
}

export function getClassificationForRole(roleCode: RoleCode): DataClassification {
  const level = getClearanceLevel(roleCode);
  const entry = Object.entries(CLASSIFICATION_CLEARANCE)
    .filter(([, req]) => req <= level)
    .sort(([, a], [, b]) => b - a)[0];
  return (entry?.[0] as DataClassification) ?? 'PUBLIC';
}

export function checkPermissionSet(
  roleCode:    RoleCode,
  permissions: Permission[]
): { allowed: Permission[]; denied: Permission[] } {
  const allowed: Permission[] = [];
  const denied:  Permission[] = [];

  for (const perm of permissions) {
    if (hasPermission(roleCode, perm)) {
      allowed.push(perm);
    } else {
      denied.push(perm);
    }
  }

  return { allowed, denied };
}

export function getSecurityPosture(roleCode: RoleCode): {
  clearanceLevel:    ClearanceLevel;
  clearanceLabel:    string;
  maxClassification: DataClassification;
  policyCompliance:  number;
  riskScore:         number;
} {
  const clearanceLevel    = getClearanceLevel(roleCode);
  const clearanceLabel    = CLEARANCE_LABELS[clearanceLevel];
  const maxClassification = getClassificationForRole(roleCode);

  const enabledPolicies = DEFAULT_POLICIES.filter((p) => p.enabled).length;
  const policyCompliance = Math.round((enabledPolicies / DEFAULT_POLICIES.length) * 100);

  // Higher clearance = higher risk surface — compensated by audit coverage
  const baseRisk   = clearanceLevel * 10;
  const auditBonus = DEFAULT_POLICIES.find((p) => p.id === 'pol-003')?.enabled ? 20 : 0;
  const riskScore  = Math.max(0, Math.min(100, baseRisk - auditBonus));

  return { clearanceLevel, clearanceLabel, maxClassification, policyCompliance, riskScore };
}
