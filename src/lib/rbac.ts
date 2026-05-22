// DDSE Role-Based Access Control Engine
// 11 roles · 6 clearance levels · per-deck module gating

export type RoleCode =
  | 'super_admin'
  | 'director'
  | 'commander'
  | 'admin'
  | 'engineering_officer'
  | 'safety_officer'
  | 'armoury_officer'
  | 'logistics_officer'
  | 'inspection_officer'
  | 'staff'
  | 'auditor';

export type ClearanceLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const CLEARANCE_LABELS: Record<ClearanceLevel, string> = {
  1: 'PUBLIC',
  2: 'INTERNAL',
  3: 'RESTRICTED',
  4: 'CONFIDENTIAL',
  5: 'SECRET',
  6: 'TOP SECRET',
};

export type Permission =
  // System / platform
  | 'platform.admin'
  | 'users.manage_all'
  | 'roles.assign'
  | 'system.config'
  | 'system.audit_logs'
  | 'system.emergency_lockdown'
  | 'system.backup'
  | 'system.api_manage'
  // Data access
  | 'data.view_nationwide'
  | 'data.export_all'
  | 'data.classified'
  | 'data.top_secret'
  // Inspections
  | 'inspections.approve_major'
  | 'inspections.approve_local'
  | 'inspections.create'
  | 'inspections.conduct'
  | 'inspections.view_all'
  // Reports
  | 'reports.strategic'
  | 'reports.departmental'
  | 'reports.submit'
  | 'reports.view_finalized'
  // Command / personnel
  | 'commanders.manage'
  | 'unit.manage'
  | 'unit.assign_staff'
  | 'personnel.view_all'
  | 'personnel.manage'
  | 'personnel.view_own'
  // Engineering
  | 'engineering.review_boq'
  | 'engineering.upload'
  | 'engineering.assess'
  // Safety / hazard
  | 'safety.conduct'
  | 'safety.submit_report'
  | 'safety.incident_log'
  // Armoury
  | 'armoury.monitor'
  | 'armoury.inspect'
  | 'armoury.access_logs'
  // Logistics
  | 'logistics.monitor'
  | 'logistics.track'
  // Audit
  | 'audit.view'
  | 'audit.verify'
  // Workflow
  | 'approval.register'
  | 'approval.submit'
  | 'tasks.view_assigned'
  | 'tasks.submit'
  | 'notifications.access';

export type DeckId =
  | 'hq'
  | 'checklists'
  | 'armoury'
  | 'engineering'
  | 'hazard'
  | 'personnel'
  | 'analytics';

export interface RoleConfig {
  code: RoleCode;
  label: string;
  fullTitle: string;
  clearanceLevel: ClearanceLevel;
  permissions: Permission[];
  accessibleDecks: DeckId[];
  uiTheme: {
    badgeColor: string;
    badgeText: string;
    themeLabel: string;
  };
  privileged: boolean; // cannot be self-assigned during registration
}

// ─── All permissions shorthand ────────────────────────────────────────────────

const ALL_PERMISSIONS: Permission[] = [
  'platform.admin', 'users.manage_all', 'roles.assign', 'system.config',
  'system.audit_logs', 'system.emergency_lockdown', 'system.backup', 'system.api_manage',
  'data.view_nationwide', 'data.export_all', 'data.classified', 'data.top_secret',
  'inspections.approve_major', 'inspections.approve_local', 'inspections.create',
  'inspections.conduct', 'inspections.view_all',
  'reports.strategic', 'reports.departmental', 'reports.submit', 'reports.view_finalized',
  'commanders.manage', 'unit.manage', 'unit.assign_staff',
  'personnel.view_all', 'personnel.manage', 'personnel.view_own',
  'engineering.review_boq', 'engineering.upload', 'engineering.assess',
  'safety.conduct', 'safety.submit_report', 'safety.incident_log',
  'armoury.monitor', 'armoury.inspect', 'armoury.access_logs',
  'logistics.monitor', 'logistics.track',
  'audit.view', 'audit.verify',
  'approval.register', 'approval.submit',
  'tasks.view_assigned', 'tasks.submit', 'notifications.access',
];

const ALL_DECKS: DeckId[] = ['hq', 'checklists', 'armoury', 'engineering', 'hazard', 'personnel', 'analytics'];

// ─── Role definitions ─────────────────────────────────────────────────────────

export const ROLE_CONFIGS: Record<RoleCode, RoleConfig> = {

  // ── 1. SUPER ADMIN ─────────────────────────────────────────────────────────
  super_admin: {
    code: 'super_admin',
    label: 'Super Admin',
    fullTitle: 'Defense Headquarters System Authority',
    clearanceLevel: 6,
    permissions: ALL_PERMISSIONS,
    accessibleDecks: ALL_DECKS,
    uiTheme: { badgeColor: 'bg-yellow-500/20', badgeText: 'text-yellow-300', themeLabel: 'SUPREME COMMAND' },
    privileged: true,
  },

  // ── 2. DIRECTOR ────────────────────────────────────────────────────────────
  director: {
    code: 'director',
    label: 'Director',
    fullTitle: 'Director of Defense Safety & Engineering',
    clearanceLevel: 6,
    permissions: [
      'data.view_nationwide', 'data.export_all', 'data.classified', 'data.top_secret',
      'inspections.approve_major', 'inspections.view_all', 'inspections.create',
      'reports.strategic', 'reports.departmental', 'reports.view_finalized',
      'commanders.manage', 'personnel.view_all',
      'audit.view', 'audit.verify',
      'approval.register',
      'system.audit_logs',
      'tasks.view_assigned', 'notifications.access',
    ],
    accessibleDecks: ALL_DECKS,
    uiTheme: { badgeColor: 'bg-violet-500/20', badgeText: 'text-violet-300', themeLabel: 'EXECUTIVE COMMAND' },
    privileged: true,
  },

  // ── 3. COMMANDER ───────────────────────────────────────────────────────────
  commander: {
    code: 'commander',
    label: 'Commander',
    fullTitle: 'Command/Unit Operational Authority',
    clearanceLevel: 5,
    permissions: [
      'unit.manage', 'unit.assign_staff',
      'data.classified', 'data.view_nationwide',
      'inspections.approve_local', 'inspections.create', 'inspections.view_all',
      'reports.departmental', 'reports.submit',
      'personnel.view_all',
      'armoury.monitor',
      'logistics.monitor', 'logistics.track',
      'safety.conduct',
      'engineering.assess',
      'approval.register', 'approval.submit',
      'tasks.view_assigned', 'notifications.access',
    ],
    accessibleDecks: ALL_DECKS,
    uiTheme: { badgeColor: 'bg-orange-500/20', badgeText: 'text-orange-300', themeLabel: 'TACTICAL COMMAND' },
    privileged: true,
  },

  // ── 4. ADMIN ───────────────────────────────────────────────────────────────
  admin: {
    code: 'admin',
    label: 'Admin',
    fullTitle: 'Administrative Operations Officer',
    clearanceLevel: 4,
    permissions: [
      'personnel.manage', 'personnel.view_all',
      'inspections.create', 'inspections.view_all',
      'reports.departmental', 'reports.submit',
      'approval.register', 'approval.submit',
      'notifications.access', 'tasks.view_assigned', 'tasks.submit',
    ],
    accessibleDecks: ['checklists', 'personnel', 'analytics'],
    uiTheme: { badgeColor: 'bg-sky-500/20', badgeText: 'text-sky-300', themeLabel: 'TACTICAL ADMIN' },
    privileged: false,
  },

  // ── 5. ENGINEERING OFFICER ─────────────────────────────────────────────────
  engineering_officer: {
    code: 'engineering_officer',
    label: 'Engineering Officer',
    fullTitle: 'Military Engineering & Infrastructure Supervisor',
    clearanceLevel: 3,
    permissions: [
      'engineering.review_boq', 'engineering.upload', 'engineering.assess',
      'inspections.conduct', 'inspections.create',
      'reports.submit',
      'tasks.view_assigned', 'tasks.submit', 'notifications.access', 'approval.submit',
    ],
    accessibleDecks: ['engineering', 'checklists'],
    uiTheme: { badgeColor: 'bg-amber-500/20', badgeText: 'text-amber-300', themeLabel: 'ENGINEERING CMD' },
    privileged: false,
  },

  // ── 6. SAFETY / HAZARD OFFICER ─────────────────────────────────────────────
  safety_officer: {
    code: 'safety_officer',
    label: 'Safety Officer',
    fullTitle: 'HSE & Operational Safety Authority',
    clearanceLevel: 3,
    permissions: [
      'safety.conduct', 'safety.submit_report', 'safety.incident_log',
      'inspections.conduct', 'inspections.create',
      'reports.submit',
      'tasks.view_assigned', 'tasks.submit', 'notifications.access', 'approval.submit',
    ],
    accessibleDecks: ['hazard', 'checklists'],
    uiTheme: { badgeColor: 'bg-red-500/20', badgeText: 'text-red-300', themeLabel: 'EMERGENCY OPS' },
    privileged: false,
  },

  // ── 7. ARMOURY OFFICER ─────────────────────────────────────────────────────
  armoury_officer: {
    code: 'armoury_officer',
    label: 'Armoury Officer',
    fullTitle: 'Weapons & Security Infrastructure Officer',
    clearanceLevel: 4,
    permissions: [
      'armoury.monitor', 'armoury.inspect', 'armoury.access_logs',
      'inspections.conduct',
      'reports.submit',
      'tasks.view_assigned', 'tasks.submit', 'notifications.access', 'approval.submit',
    ],
    accessibleDecks: ['armoury', 'checklists'],
    uiTheme: { badgeColor: 'bg-slate-400/20', badgeText: 'text-slate-300', themeLabel: 'SECURE VAULT' },
    privileged: false,
  },

  // ── 8. LOGISTICS OFFICER ───────────────────────────────────────────────────
  logistics_officer: {
    code: 'logistics_officer',
    label: 'Logistics Officer',
    fullTitle: 'Supply Chain & Operational Logistics',
    clearanceLevel: 3,
    permissions: [
      'logistics.monitor', 'logistics.track',
      'inspections.conduct',
      'reports.submit',
      'tasks.view_assigned', 'tasks.submit', 'notifications.access', 'approval.submit',
    ],
    accessibleDecks: ['checklists'],
    uiTheme: { badgeColor: 'bg-teal-500/20', badgeText: 'text-teal-300', themeLabel: 'LOGISTICS OPS' },
    privileged: false,
  },

  // ── 9. INSPECTION OFFICER ──────────────────────────────────────────────────
  inspection_officer: {
    code: 'inspection_officer',
    label: 'Inspection Officer',
    fullTitle: 'Field Inspection Personnel',
    clearanceLevel: 2,
    permissions: [
      'inspections.conduct', 'inspections.create',
      'reports.submit',
      'approval.submit',
      'tasks.view_assigned', 'tasks.submit', 'notifications.access',
    ],
    accessibleDecks: ['checklists'],
    uiTheme: { badgeColor: 'bg-lime-500/20', badgeText: 'text-lime-300', themeLabel: 'FIELD INSPECTION' },
    privileged: false,
  },

  // ── 10. STAFF ──────────────────────────────────────────────────────────────
  staff: {
    code: 'staff',
    label: 'Staff',
    fullTitle: 'General Operational Staff',
    clearanceLevel: 2,
    permissions: [
      'personnel.view_own',
      'tasks.view_assigned', 'tasks.submit',
      'notifications.access', 'approval.submit',
    ],
    accessibleDecks: ['checklists'],
    uiTheme: { badgeColor: 'bg-emerald-500/20', badgeText: 'text-emerald-300', themeLabel: 'TACTICAL WORKSPACE' },
    privileged: false,
  },

  // ── 11. AUDITOR / REVIEW BOARD ─────────────────────────────────────────────
  auditor: {
    code: 'auditor',
    label: 'Auditor',
    fullTitle: 'Independent Oversight Authority',
    clearanceLevel: 4,
    permissions: [
      'audit.view', 'audit.verify',
      'reports.view_finalized',
      'inspections.view_all',
      'data.classified',
      'system.audit_logs',
      'tasks.view_assigned', 'notifications.access',
    ],
    accessibleDecks: ['checklists', 'analytics', 'personnel'],
    uiTheme: { badgeColor: 'bg-indigo-500/20', badgeText: 'text-indigo-300', themeLabel: 'INTEL REVIEW' },
    privileged: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getRoleConfig(roleCode: string): RoleConfig {
  return ROLE_CONFIGS[roleCode as RoleCode] ?? ROLE_CONFIGS.staff;
}

export function hasPermission(roleCode: string, permission: Permission): boolean {
  return getRoleConfig(roleCode).permissions.includes(permission);
}

export function canAccessDeck(roleCode: string, deckId: DeckId): boolean {
  return getRoleConfig(roleCode).accessibleDecks.includes(deckId);
}

export function getClearanceLevel(roleCode: string): ClearanceLevel {
  return getRoleConfig(roleCode).clearanceLevel;
}

export function getClearanceLabel(level: ClearanceLevel): string {
  return CLEARANCE_LABELS[level];
}

// ─── Approval flow ────────────────────────────────────────────────────────────
// Maps each submitter role to the next reviewer in the chain.
export const APPROVAL_FLOW: Partial<Record<RoleCode, RoleCode>> = {
  inspection_officer: 'admin',
  engineering_officer: 'admin',
  safety_officer:      'commander',
  admin:               'commander',
  commander:           'director',
  director:            'super_admin',
};

// ─── Registration helpers ─────────────────────────────────────────────────────

export const REGISTRATION_APPROVERS: RoleCode[] = ['super_admin', 'director', 'commander', 'admin'];

export const SELF_ASSIGNABLE_ROLES = Object.values(ROLE_CONFIGS).filter((r) => !r.privileged);

// ─── Role hierarchy numeric weight (higher = more authority) ──────────────────
const ROLE_WEIGHT: Record<RoleCode, number> = {
  super_admin:         110,
  director:            100,
  commander:            80,
  admin:                60,
  auditor:              50,
  armoury_officer:      40,
  engineering_officer:  30,
  safety_officer:       30,
  logistics_officer:    20,
  inspection_officer:   15,
  staff:                10,
};

export function roleWeight(roleCode: string): number {
  return ROLE_WEIGHT[roleCode as RoleCode] ?? 0;
}

export function outranks(roleA: string, roleB: string): boolean {
  return roleWeight(roleA) > roleWeight(roleB);
}
