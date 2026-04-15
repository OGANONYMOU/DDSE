import { PRIVILEGED_ROLE_CODES } from '../platform.js';

const GLOBAL_SCOPE = 'global';
const DIRECTORATE_SCOPE = 'directorate';
const FORMATION_SCOPE = 'formation';
const UNIT_SCOPE = 'unit';
const OWN_SCOPE = 'own';

const FULL_MODULE_ACCESS = new Set([
  'hazard_safety',
  'jtf_readiness',
  'civil_projects',
  'general_security',
  'armoury',
  'magazine',
]);

const ROLE_POLICIES = {
  super_admin: {
    scope: GLOBAL_SCOPE,
    modules: FULL_MODULE_ACCESS,
    canCreateInspection: true,
    canApproveRegistrations: true,
    canReview: true,
    canClose: true,
    restrictedEvidence: 'all',
  },
  ddse_admin: {
    scope: GLOBAL_SCOPE,
    modules: FULL_MODULE_ACCESS,
    canCreateInspection: true,
    canApproveRegistrations: true,
    canReview: true,
    canClose: true,
    restrictedEvidence: 'all',
  },
  evaluator: {
    scope: FORMATION_SCOPE,
    modules: new Set(['hazard_safety', 'jtf_readiness', 'civil_projects', 'general_security']),
    canCreateInspection: true,
    canApproveRegistrations: false,
    canReview: true,
    canClose: false,
    restrictedEvidence: 'security',
  },
  directorate_officer: {
    scope: DIRECTORATE_SCOPE,
    modules: new Set(['hazard_safety', 'civil_projects', 'general_security', 'jtf_readiness']),
    canCreateInspection: true,
    canApproveRegistrations: false,
    canReview: true,
    canClose: false,
    restrictedEvidence: 'security',
  },
  project_officer: {
    scope: UNIT_SCOPE,
    modules: new Set(['civil_projects', 'hazard_safety']),
    canCreateInspection: true,
    canApproveRegistrations: false,
    canReview: false,
    canClose: false,
    restrictedEvidence: 'official',
  },
  base_commander: {
    scope: UNIT_SCOPE,
    modules: new Set(['hazard_safety', 'jtf_readiness', 'general_security', 'armoury', 'magazine']),
    canCreateInspection: false,
    canApproveRegistrations: false,
    canReview: true,
    canClose: true,
    restrictedEvidence: 'restricted',
  },
  base_soldier: {
    scope: OWN_SCOPE,
    modules: new Set(['hazard_safety']),
    canCreateInspection: false,
    canApproveRegistrations: false,
    canReview: false,
    canClose: false,
    restrictedEvidence: 'official',
  },
  audit_reviewer: {
    scope: FORMATION_SCOPE,
    modules: FULL_MODULE_ACCESS,
    canCreateInspection: false,
    canApproveRegistrations: false,
    canReview: true,
    canClose: true,
    restrictedEvidence: 'restricted',
  },
  senior_command_readonly: {
    scope: GLOBAL_SCOPE,
    modules: new Set(['hazard_safety', 'jtf_readiness', 'civil_projects', 'general_security']),
    canCreateInspection: false,
    canApproveRegistrations: false,
    canReview: true,
    canClose: false,
    restrictedEvidence: 'security',
  },
};

const RESTRICTED_SECURITY_CLASSIFICATIONS = new Set([
  'restricted_operational',
  'restricted_security',
]);

const RESTRICTED_SPECIAL_CLASSIFICATIONS = new Set([
  'restricted_armoury',
  'restricted_magazine',
]);

export function requiresApproval(roleCode) {
  return PRIVILEGED_ROLE_CODES.has(roleCode);
}

export function getRolePolicy(roleCode) {
  return ROLE_POLICIES[roleCode] ?? ROLE_POLICIES.base_soldier;
}

export function roleCanApproveRegistrations(roleCode) {
  return getRolePolicy(roleCode).canApproveRegistrations;
}

export function roleCanAccessModule(roleCode, moduleCode) {
  return getRolePolicy(roleCode).modules.has(moduleCode);
}

export function roleCanCreateInspection(roleCode, moduleCode) {
  const policy = getRolePolicy(roleCode);
  return policy.canCreateInspection && policy.modules.has(moduleCode);
}

export function roleCanDownloadEvidence(roleCode, moduleCode, classification) {
  const policy = getRolePolicy(roleCode);
  if (!policy.modules.has(moduleCode)) {
    return false;
  }

  if (RESTRICTED_SPECIAL_CLASSIFICATIONS.has(classification) || moduleCode === 'armoury' || moduleCode === 'magazine') {
    return policy.restrictedEvidence === 'all' || policy.restrictedEvidence === 'restricted';
  }

  if (RESTRICTED_SECURITY_CLASSIFICATIONS.has(classification) || moduleCode === 'general_security' || moduleCode === 'jtf_readiness') {
    return policy.restrictedEvidence === 'all' || policy.restrictedEvidence === 'restricted' || policy.restrictedEvidence === 'security';
  }

  return true;
}

export function isClassificationRestricted(classification) {
  return RESTRICTED_SECURITY_CLASSIFICATIONS.has(classification) || RESTRICTED_SPECIAL_CLASSIFICATIONS.has(classification);
}

export function orgScopeAllows(user, record) {
  const scope = getRolePolicy(user.activeRoleCode).scope;
  if (scope === GLOBAL_SCOPE) {
    return true;
  }

  if (scope === DIRECTORATE_SCOPE) {
    return user.directorateCode === record.directorateCode;
  }

  if (scope === FORMATION_SCOPE) {
    return user.formationCode === record.formationCode;
  }

  if (scope === UNIT_SCOPE) {
    return user.unitCode === record.unitCode;
  }

  return record.createdByUserId === user._id || record.assignedToUserId === user._id;
}

export function canCreateInspectionForOrg(user, record) {
  const policy = getRolePolicy(user.activeRoleCode);
  if (!policy.canCreateInspection) {
    return false;
  }

  return orgScopeAllows(user, {
    ...record,
    createdByUserId: user._id,
    assignedToUserId: user._id,
  });
}

export function canAccessInspection(user, inspection) {
  return roleCanAccessModule(user.activeRoleCode, inspection.moduleCode)
    && roleCanDownloadEvidence(user.activeRoleCode, inspection.moduleCode, inspection.classification)
    && orgScopeAllows(user, inspection);
}

export function canReviewInspection(user, inspection) {
  return canAccessInspection(user, inspection) && getRolePolicy(user.activeRoleCode).canReview;
}

export function canCloseInspection(user, inspection) {
  return canAccessInspection(user, inspection) && getRolePolicy(user.activeRoleCode).canClose;
}

export function canAccessEvidence(user, inspection, evidence) {
  return canAccessInspection(user, inspection)
    && roleCanDownloadEvidence(user.activeRoleCode, inspection.moduleCode, evidence.classification);
}

export function canViewDashboardAggregate(user, aggregate) {
  return orgScopeAllows(user, aggregate);
}

export function validateRoleEligibility(roleCode, directorateCode) {
  if (roleCode === 'project_officer' && directorateCode !== 'DPM') {
    return 'Project Officer access is restricted to the Project Monitoring directorate.';
  }

  if (roleCode === 'directorate_officer' && !directorateCode) {
    return 'Directorate Officer requests must be tied to a directorate.';
  }

  return null;
}
