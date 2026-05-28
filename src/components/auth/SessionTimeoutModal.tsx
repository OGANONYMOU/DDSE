import { Clock, RefreshCw, LogOut } from 'lucide-react';

interface SessionTimeoutModalProps {
  secondsLeft: number;
  onExtend: () => Promise<void>;
  onLogout: () => void;
}

export default function SessionTimeoutModal({ secondsLeft, onExtend, onLogout }: SessionTimeoutModalProps) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`;

  const urgent = secondsLeft <= 60;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl ${urgent ? 'border-rose-500/30 bg-rose-950/60' : 'border-slate-800/60 bg-slate-950/95'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${urgent ? 'border-rose-500/30 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
            <Clock className={`h-5 w-5 ${urgent ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <p id="timeout-title" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Session Expiry Warning
            </p>
            <p className="mt-0.5 text-sm font-black text-white">Your session is about to expire</p>
          </div>
        </div>

        {/* Countdown */}
        <div className={`flex items-center justify-center rounded-xl border py-5 mb-6 ${urgent ? 'border-rose-500/20 bg-rose-500/5' : 'border-slate-800/60 bg-slate-900/40'}`}>
          <p id="timeout-desc" className={`text-4xl font-black tabular-nums tracking-wider ${urgent ? 'text-rose-300' : 'text-amber-300'}`}>
            {timeStr}
          </p>
        </div>

        <p className="mb-6 text-[11px] font-mono text-slate-500 uppercase text-center">
          All unsaved work will be lost. Extend your session to continue.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void onExtend()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 py-3 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Extend Session
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 transition hover:text-rose-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
