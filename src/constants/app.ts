export const APP_NAME    = 'DDSE';
export const APP_VERSION = '1.0.0';
export const ORG_NAME    = 'Defence Engineering';

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
