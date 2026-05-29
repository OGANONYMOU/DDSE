export const APP_NAME       = 'DDSE';
export const APP_VERSION    = '3.0.0';
export const APP_CODENAME   = 'Apex';        // v3.0 codename
export const ORG_NAME       = 'Defence Engineering';
export const PLATFORM_EPOCH = '2025';        // year the platform launched

export const DIRECTORATES = ['DESE', 'DEME', 'DQMS', 'DWE'] as const;
export type DirectorateCode = typeof DIRECTORATES[number];

export const DIRECTORATE_LABELS: Record<string, string> = {
  DESE: 'Director of Engineer Services',
  DEME: 'Director of Mechanical & Electrical',
  DQMS: 'Director of Quartering & Military Survey',
  DWE:  'Director of Works & Engineering',
};

export const REPORT_TYPE_LABELS = [
  'Inspection Report',
  'Hazard Assessment Report',
  'Project Progress Report',
  'Contractor Evaluation',
  'Compliance Summary',
  'Safety Violation Report',
  'Operational Readiness Summary',
] as const;

export const CLASSIFICATION_LABELS: Record<string, string> = {
  UNCLASSIFIED: 'Unclassified',
  RESTRICTED:   'Restricted',
  CONFIDENTIAL: 'Confidential',
};

export const CLASSIFICATION_COLORS: Record<string, string> = {
  UNCLASSIFIED: 'text-slate-400  border-slate-700/60 bg-slate-800/30',
  RESTRICTED:   'text-amber-400  border-amber-500/30 bg-amber-500/10',
  CONFIDENTIAL: 'text-rose-400   border-rose-500/30  bg-rose-500/10',
};

// Platform SLA targets (ms) — used by observability layer
export const PLATFORM_SLA = {
  apiResponseMs:   800,
  pageLoadMs:      1200,
  availabilityPct: 99.5,
} as const;

// Phase milestones for platform history
export const PLATFORM_HISTORY = [
  { phase: 1,  title: 'Foundation',              version: '1.0.0' },
  { phase: 2,  title: 'Authentication & RBAC',   version: '1.1.0' },
  { phase: 3,  title: 'Core Modules',            version: '1.5.0' },
  { phase: 4,  title: 'Inspections Engine',      version: '1.8.0' },
  { phase: 5,  title: 'Safety & Hazard',         version: '2.0.0' },
  { phase: 6,  title: 'Reporting System',        version: '2.1.0' },
  { phase: 7,  title: 'Analytics Intelligence',  version: '2.2.0' },
  { phase: 8,  title: 'Personnel & Audit',       version: '2.3.0' },
  { phase: 9,  title: 'Supabase Integration',    version: '2.4.0' },
  { phase: 10, title: 'Production Hardening',    version: '2.5.0' },
  { phase: 11, title: 'Enterprise Expansion',    version: '2.9.0' },
  { phase: 12, title: 'Platform Ecosystem',      version: '3.0.0' },
] as const;
