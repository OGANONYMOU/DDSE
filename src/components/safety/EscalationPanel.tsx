import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { HazardEscalation } from '../../types/safety';

const ESCALATION_ROLES = ['commander', 'director', 'super_admin'];

interface Props {
  escalations: HazardEscalation[];
  canEscalate?: boolean;
  onEscalate?: (toRole: string, reason: string) => void;
}

export default function EscalationPanel({ escalations, canEscalate = false, onEscalate }: Props) {
  const [open, setOpen]   = useState(false);
  const [toRole, setToRole] = useState(ESCALATION_ROLES[0]);
  const [reason, setReason] = useState('');

  function submit() {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onEscalate?.(toRole, trimmed);
    setReason('');
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      {escalations.length === 0 ? (
        <p className="text-[11px] font-mono uppercase text-slate-600">No escalations raised</p>
      ) : (
        <div className="space-y-2">
          {escalations.map((esc) => (
            <div key={esc.id} className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-300">
                  Escalated to {esc.escalatedToRole.replace(/_/g, ' ')}
                </span>
                <span className="text-[9px] font-mono text-slate-600">{esc.createdAt.split('T')[0]}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{esc.reason}</p>
              {esc.resolvedAt ? (
                <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="text-[9px] font-black uppercase text-emerald-400">Resolved</p>
                  {esc.resolutionNotes && (
                    <p className="mt-1 text-[10px] font-mono text-slate-400">{esc.resolutionNotes}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[9px] font-mono uppercase text-amber-400">Awaiting resolution</p>
              )}
            </div>
          ))}
        </div>
      )}

      {canEscalate && onEscalate && (
        open ? (
          <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
            <select
              value={toRole}
              onChange={(e) => setToRole(e.target.value)}
              className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white outline-none focus:border-rose-500/40"
              style={{ colorScheme: 'dark' }}
            >
              {ESCALATION_ROLES.map((role) => (
                <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why does this need to be escalated?"
              className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-rose-500/40"
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
                disabled={!reason.trim()}
                onClick={submit}
                className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Escalate
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/15"
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            Escalate Hazard
          </button>
        )
      )}
    </div>
  );
}
