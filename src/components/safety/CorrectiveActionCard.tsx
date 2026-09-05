import { useState } from 'react';
import { PlayCircle, ShieldCheck } from 'lucide-react';
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
  actions:    HazardCorrectiveAction[];
  canManage?: boolean;
  onStart?:   (id: string) => void;
  onResolve?: (id: string, notes: string, evidence: string) => void;
}

function ResolveForm({ actionId, onResolve }: { actionId: string; onResolve: NonNullable<Props['onResolve']> }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/15"
      >
        <ShieldCheck className="h-3 w-3" />
        Resolve &amp; Verify
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
      <textarea
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        rows={2}
        placeholder="Verification evidence / reference…"
        className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Verification notes…"
        className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!evidence.trim() || !notes.trim()}
          onClick={() => onResolve(actionId, notes.trim(), evidence.trim())}
          className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm Resolution
        </button>
      </div>
    </div>
  );
}

export default function CorrectiveActionCard({ actions, canManage = false, onStart, onResolve }: Props) {
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

          {canManage && action.status !== 'resolved' && (
            <div className="mt-3 border-t border-slate-800/40 pt-3">
              <div className="flex flex-wrap gap-2">
                {action.status === 'pending' && onStart && (
                  <button
                    type="button"
                    onClick={() => onStart(action.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
                  >
                    <PlayCircle className="h-3 w-3" />
                    Start
                  </button>
                )}
                {onResolve && <ResolveForm actionId={action.id} onResolve={onResolve} />}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
