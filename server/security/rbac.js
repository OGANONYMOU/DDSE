const PERMISSIONS = {
  'dashboard.read': ['platform_owner', 'super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'],
  'inspection.create': ['platform_owner', 'super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'],
  'inspection.submit': ['platform_owner', 'super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'],
  'inspection.approve': ['platform_owner', 'super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'],
  'inspection.corrective_action.issue': ['platform_owner', 'super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'audit_reviewer'],
  'inspection.stop_work.issue': ['platform_owner', 'super_admin', 'ddse_admin', 'project_officer', 'audit_reviewer'],
  'reports.export': ['platform_owner', 'super_admin', 'ddse_admin', 'directorate_officer', 'audit_reviewer', 'senior_command_readonly'],
  'security.restricted.read': ['platform_owner', 'super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'armoury.restricted.read': ['platform_owner', 'super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'magazine.restricted.read': ['platform_owner', 'super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'users.manage': ['platform_owner', 'super_admin', 'ddse_admin'],
  'formations.manage': ['platform_owner', 'super_admin', 'ddse_admin'],
  'system.settings.manage': ['platform_owner'],
};

export function hasPermission(role, permission) {
  return (PERMISSIONS[permission] ?? []).includes(role);
}

export function assertPermission(role, permission) {
  if (!hasPermission(role, permission)) {
    const error = new Error('You do not have permission to perform this action.');
    error.statusCode = 403;
    throw error;
  }
}

export function canAccessClassification(role, classification) {
  if (classification === 'restricted_armoury') {
    return hasPermission(role, 'armoury.restricted.read');
  }

  if (classification === 'restricted_magazine') {
    return hasPermission(role, 'magazine.restricted.read');
  }

  return true;
}

export function visibleModulesForRole(role) {
  return [
    'command_dashboard',
    'training_establishments',
    'jtf_readiness',
    'general_security',
    'afsb_screening',
    'civil_projects',
    'construction_qa',
    'hazard_safety',
    ...(canAccessClassification(role, 'restricted_armoury') ? ['armoury'] : []),
    ...(canAccessClassification(role, 'restricted_magazine') ? ['magazine'] : []),
  ];
}
