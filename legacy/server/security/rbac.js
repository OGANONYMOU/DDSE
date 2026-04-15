const PERMISSIONS = {
  'dashboard.read': ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer', 'base_commander', 'audit_reviewer', 'senior_command_readonly'],
  'inspection.create': ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'],
  'inspection.submit': ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'],
  'inspection.approve': ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer'],
  'inspection.corrective_action.issue': ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'audit_reviewer'],
  'inspection.stop_work.issue': ['super_admin', 'ddse_admin', 'project_officer', 'audit_reviewer'],
  'reports.export': ['super_admin', 'ddse_admin', 'directorate_officer', 'audit_reviewer', 'senior_command_readonly'],
  'security.restricted.read': ['super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'armoury.restricted.read': ['super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'magazine.restricted.read': ['super_admin', 'ddse_admin', 'audit_reviewer', 'base_commander'],
  'users.manage': ['super_admin', 'ddse_admin'],
  'formations.manage': ['super_admin', 'ddse_admin'],
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
