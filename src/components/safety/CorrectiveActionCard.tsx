import type { HazardCorrectiveAction } from '../../types/safety';

const URGENCY_COLOR: Record<HazardCorrectiveAction['urgency'], string> = {
  IMMEDIATE: 'text-rose-300 border-rose-400/50 bg-rose-400/10',
  HIGH:      'text-rose-400 border-rose-500/30 bg-rose-500/10',
  MEDIUM:    'text-amber-400 border-amber-500/30 bg-amber-500/10',
  LOW:       'text-slate-400 border-slate-600/60 bg-slate-800/30',
};

const STATUS_COLOR: Record<HazardCorrectiveAction['status'], string> = {
  pending:     'text-amber-400',
  in_progress: 'text-sky-400',
  resolved:    'text-emerald-400',
};

interface Props {
  actions: HazardCorrectiveAction[];
}

export default function CorrectiveActionCard({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 py-10 text-center">
        <p className="text-[11px] font-mono uppercase text-slate-600">No corrective actions assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div key={action.id} className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className={`text-[9px] font-black uppercase tracking-wider rounded-md border px-2 py-0.5 ${URGENCY_COLOR[action.urgency]}`}>
              {action.urgency}
            </span>
            <span className={`text-[9px] font-black uppercase font-mono ${STATUS_COLOR[action.status]}`}>
              {action.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-[12px] text-slate-200 leading-relaxed">{action.recommendation}</p>

          <div className="mt-3 flex items-center justify-between border-t border-slate-800/40 pt-3">
            <p className="text-[9px] font-mono text-slate-500 uppercase">{action.department ?? '—'}</p>
            <p className="text-[9px] font-mono text-slate-600">
              Due: {action.dueDate ?? '—'}
            </p>
          </div>

          {/* C-9: Show verification status if resolved */}
          {action.status === 'resolved' && action.verifiedBy && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="text-[9px] font-black uppercase text-emerald-400">Verified</span>
              {action.verifiedAt && (
                <span className="text-[9px] font-mono text-slate-600">{action.verifiedAt.split('T')[0]}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
