import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Lock } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import { getClearanceLabel } from '../lib/rbac';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { clearance, roleCode } = usePermission();
  const clearanceLabel = getClearanceLabel(clearance as 1 | 2 | 3 | 4 | 5 | 6);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Icon cluster */}
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <ShieldOff className="h-10 w-10 text-rose-500/70" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10">
          <Lock className="h-3.5 w-3.5 text-rose-400" />
        </div>
      </div>

      {/* Status line */}
      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-rose-500">
        403 — Access Denied
      </p>

      <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white">
        Insufficient Clearance
      </h1>

      <p className="mt-3 max-w-sm text-[12px] font-mono leading-relaxed text-slate-500 uppercase">
        Your current clearance level does not authorise access to this module.
        Contact your directorate administrator if access is required.
      </p>

      {/* Current clearance display */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/70 px-6 py-4">
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Your Clearance</p>
          <p className="mt-0.5 text-[11px] font-black uppercase text-slate-300">
            L{clearance} — {clearanceLabel}
          </p>
        </div>
        <div className="mx-3 h-8 w-px bg-slate-800/60" />
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Role</p>
          <p className="mt-0.5 text-[11px] font-mono uppercase text-slate-300">{roleCode}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go Back
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
        >
          Command Dashboard
        </button>
      </div>
    </div>
  );
}
