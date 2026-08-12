// Shared status presentation for inspections — human-readable labels, the
// linear workflow order, and badge colors. Single source of truth so the
// inspections list and the assessment detail view stay consistent.

export interface StatusInfo {
  label: string;
  next?: string;
  nextLabel?: string;
}

export const STATUS_FLOW: Record<string, StatusInfo> = {
  draft:        { label: 'Draft',        next: 'in_progress',  nextLabel: 'Start Evaluation' },
  in_progress:  { label: 'In Progress',  next: 'submitted',    nextLabel: 'Submit for Review' },
  submitted:    { label: 'Submitted',    next: 'under_review', nextLabel: 'Begin Review' },
  under_review: { label: 'Under Review', next: 'approved',     nextLabel: 'Approve' },
  approved:     { label: 'Approved',     next: 'completed',    nextLabel: 'Mark Completed' },
  completed:    { label: 'Completed' },
  rejected:     { label: 'Rejected',     next: 'draft',        nextLabel: 'Reopen as Draft' },
};

export const STATUS_COLOR: Record<string, string> = {
  draft:        'text-slate-300 border-slate-700 bg-slate-800/50',
  in_progress:  'text-sky-300 border-sky-500/30 bg-sky-500/10',
  submitted:    'text-amber-300 border-amber-500/30 bg-amber-500/10',
  under_review: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
  approved:     'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  completed:    'text-emerald-300 border-emerald-500/40 bg-emerald-500/15',
  rejected:     'text-rose-300 border-rose-500/30 bg-rose-500/10',
};

export function statusLabel(status: string): string {
  return STATUS_FLOW[status]?.label ?? status.replace(/_/g, ' ');
}

export function statusColor(status: string): string {
  return STATUS_COLOR[status] ?? STATUS_COLOR.draft;
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}
