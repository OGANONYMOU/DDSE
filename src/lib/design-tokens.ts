/**
 * Centralized design tokens — canonical source for all repeated color/style maps.
 * New components should import from here. Existing components are left as-is.
 */

export const RISK_COLOR = {
  CRITICAL: 'text-rose-300',
  HIGH:     'text-rose-400',
  MODERATE: 'text-amber-400',
  MEDIUM:   'text-amber-400',
  LOW:      'text-emerald-400',
} as const;

export const RISK_BADGE = {
  CRITICAL: 'border-rose-400/50 bg-rose-400/15 text-rose-300',
  HIGH:     'border-rose-500/30 bg-rose-500/10 text-rose-400',
  MODERATE: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  MEDIUM:   'border-amber-500/30 bg-amber-500/10 text-amber-400',
  LOW:      'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
} as const;

export const COMPLIANCE_BADGE = {
  compliant:     'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  partial:       'border-amber-500/30 bg-amber-500/10 text-amber-400',
  non_compliant: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  under_review:  'border-sky-500/30 bg-sky-500/10 text-sky-400',
} as const;

export const WORKFLOW_BADGE = {
  open:            'border-slate-600/60 bg-slate-800/40 text-slate-400',
  investigating:   'border-sky-500/30 bg-sky-500/10 text-sky-400',
  action_required: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  escalated:       'border-rose-500/40 bg-rose-500/10 text-rose-400',
  resolved:        'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  closed:          'border-slate-700/60 bg-slate-900/40 text-slate-500',
} as const;

export const REPORT_STATUS_BADGE = {
  draft:          'border-slate-700/60 bg-slate-800/30 text-slate-400',
  pending_review: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  approved:       'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  rejected:       'border-rose-500/30 bg-rose-500/10 text-rose-400',
  archived:       'border-slate-700/40 bg-slate-900/30 text-slate-500',
} as const;

export const SEVERITY_COLOR = {
  CRITICAL: 'text-rose-300',
  HIGH:     'text-rose-400',
  MEDIUM:   'text-amber-400',
  LOW:      'text-emerald-400',
} as const;

export const PRIORITY_COLOR = {
  ROUTINE:   'text-slate-500',
  PRIORITY:  'text-sky-400',
  URGENT:    'text-amber-400',
  EMERGENCY: 'text-rose-400',
} as const;

export const RECHARTS_TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border:          '1px solid rgba(56,182,255,0.15)',
  borderRadius:    '8px',
  fontSize:        '10px',
  fontFamily:      'monospace',
  color:           '#94a3b8',
} as const;
