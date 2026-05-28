import type { ComplianceStatus } from '../../lib/mock-data';

interface Props {
  status: ComplianceStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<ComplianceStatus, { label: string; classes: string }> = {
  compliant:     { label: 'Compliant',         classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  partial:       { label: 'Partial',           classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400'     },
  non_compliant: { label: 'Non-Compliant',     classes: 'border-rose-500/30 bg-rose-500/10 text-rose-400'        },
  under_review:  { label: 'Under Review',      classes: 'border-sky-500/30 bg-sky-500/10 text-sky-400'           },
};

export default function ComplianceIndicator({ status, size = 'sm' }: Props) {
  const { label, classes } = CONFIG[status];
  const text = size === 'md' ? 'text-[11px]' : 'text-[9px]';
  const pad  = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-md border font-black uppercase tracking-wider ${text} ${pad} ${classes}`}>
      {label}
    </span>
  );
}
