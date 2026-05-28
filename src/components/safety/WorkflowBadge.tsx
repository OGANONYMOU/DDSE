import type { SafetyWorkflow } from '../../lib/mock-data';

interface Props {
  status: SafetyWorkflow;
  size?: 'sm' | 'md';
}

const CONFIG: Record<SafetyWorkflow, { label: string; classes: string }> = {
  open:            { label: 'Open',            classes: 'border-slate-600/60 bg-slate-800/40 text-slate-400'       },
  investigating:   { label: 'Investigating',   classes: 'border-sky-500/30 bg-sky-500/10 text-sky-400'            },
  action_required: { label: 'Action Required', classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400'      },
  escalated:       { label: 'Escalated',       classes: 'border-rose-500/40 bg-rose-500/10 text-rose-400 font-black' },
  resolved:        { label: 'Resolved',        classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  closed:          { label: 'Closed',          classes: 'border-slate-700/60 bg-slate-900/40 text-slate-500'       },
};

export default function WorkflowBadge({ status, size = 'sm' }: Props) {
  const { label, classes } = CONFIG[status];
  const text = size === 'md' ? 'text-[11px]' : 'text-[9px]';
  const pad  = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-md border font-black uppercase tracking-wider ${text} ${pad} ${classes}`}>
      {label}
    </span>
  );
}
