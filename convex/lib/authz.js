import { PRIVILEGED_ROLE_CODES } from '../platform.js';

export function requiresApproval(roleCode) {
  return PRIVILEGED_ROLE_CODES.has(roleCode);
}

export function roleCanApproveRegistrations(roleCode) {
  return ['platform_owner', 'super_admin', 'ddse_admin'].includes(roleCode);
}

export function roleCanAccessModule(roleCode, moduleCode) {
  if (roleCode === 'platform_owner') return true;

  if (moduleCode === 'armoury') {
    return ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'].includes(roleCode);
  }

  if (moduleCode === 'magazine') {
    return ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'].includes(roleCode);
  }

  if (moduleCode === 'general_security') {
    return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(roleCode);
  }

  if (moduleCode === 'jtf_readiness') {
    return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(roleCode);
  }

  return [
    'super_admin',
    'ddse_admin',
    'evaluator',
    'directorate_officer',
    'project_officer',
    'base_commander',
    'base_soldier',
    'audit_reviewer',
    'senior_command_readonly',
  ].includes(roleCode);
}

export function roleCanCreateInspection(roleCode, moduleCode) {
  if (roleCode === 'platform_owner') return true;
  if (!roleCanAccessModule(roleCode, moduleCode)) {
    return false;
  }

  return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'].includes(roleCode);
}

export function roleCanDownloadEvidence(roleCode, moduleCode, classification) {
  if (roleCode === 'platform_owner') return true;
  if (classification === 'restricted_armoury' || moduleCode === 'armoury') {
    return ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'].includes(roleCode);
  }

  if (classification === 'restricted_magazine' || moduleCode === 'magazine') {
    return ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'].includes(roleCode);
  }

  if (classification === 'restricted_security' || moduleCode === 'general_security' || moduleCode === 'jtf_readiness') {
    return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(roleCode);
  }

  return roleCanAccessModule(roleCode, moduleCode);
}
