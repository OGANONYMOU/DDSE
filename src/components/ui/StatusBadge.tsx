const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  // Project
  planning:    { label: 'Pending Review', classes: 'border-slate-600/40 bg-slate-700/20 text-slate-400' },
  in_progress: { label: 'Ongoing',        classes: 'border-sky-500/30 bg-sky-500/10 text-sky-400' },
  completed:   { label: 'Completed',      classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  on_hold:     { label: 'Delayed',        classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  cancelled:   { label: 'Suspended',      classes: 'border-rose-500/30 bg-rose-500/10 text-rose-400' },
  // Inspections
  submitted:   { label: 'Submitted',      classes: 'border-sky-500/30 bg-sky-500/10 text-sky-400' },
  approved:    { label: 'Approved',       classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  pending:     { label: 'Pending',        classes: 'border-slate-600/40 bg-slate-700/20 text-slate-400' },
  in_review:   { label: 'In Review',      classes: 'border-violet-500/30 bg-violet-500/10 text-violet-400' },
  rejected:    { label: 'Rejected',       classes: 'border-rose-500/30 bg-rose-500/10 text-rose-400' },
  under_review: { label: 'Under Review',  classes: 'border-violet-500/30 bg-violet-500/10 text-violet-400' },
  correction_required: { label: 'Correction Required', classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  // Safety
  open:        { label: 'Open',           classes: 'border-rose-500/30 bg-rose-500/10 text-rose-400' },
  resolved:    { label: 'Resolved',       classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  monitoring:  { label: 'Monitoring',     classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  // Milestones
  upcoming:    { label: 'Upcoming',       classes: 'border-slate-600/40 bg-slate-700/20 text-slate-400' },
  delayed:     { label: 'Delayed',        classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
};

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[9px]',
  md: 'px-2.5 py-1   text-[10px]',
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label:   status.replace(/_/g, ' ').toUpperCase(),
    classes: 'border-slate-600/40 bg-slate-700/20 text-slate-400',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border font-black uppercase tracking-wider ${cfg.classes} ${SIZE_CLASSES[size]}`}
    >
      {cfg.label}
    </span>
  );
}
