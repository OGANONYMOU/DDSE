// I-6: SLA countdown badge for workflow steps
// Shows time remaining until SLA breach, or OVERDUE if already past.

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  slaDueAt:   string | null;  // ISO timestamp
  status:     string;         // workflow step status
  compact?:   boolean;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Overdue';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SLABadge({ slaDueAt, status, compact = false }: Props) {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!slaDueAt || status === 'completed' || status === 'skipped') {
      setMsLeft(null);
      return;
    }
    const due = new Date(slaDueAt).getTime();
    const tick = () => setMsLeft(due - Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [slaDueAt, status]);

  if (msLeft === null) return null;

  const overdue  = msLeft <= 0;
  const critical = msLeft < 3_600_000 && !overdue;  // <1 hour

  if (overdue) {
    return (
      <span className={`inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-400 ${compact ? '' : 'animate-pulse'}`}>
        <AlertTriangle className="h-2.5 w-2.5" />
        {compact ? 'OVERDUE' : 'SLA OVERDUE'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
      critical
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
        : 'border-slate-700/60 bg-slate-800/30 text-slate-500'
    }`}>
      <Clock className="h-2.5 w-2.5" />
      {formatDuration(msLeft)}
    </span>
  );
}
