import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ArrowLeft, Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Icon cluster */}
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/40 bg-slate-900/40">
          <MapPin className="h-10 w-10 text-slate-600" aria-hidden="true" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        </div>
      </div>

      {/* Status code */}
      <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-600">
        404 — Route Not Found
      </p>

      <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white">
        Unknown Position
      </h1>

      <p className="mt-3 max-w-sm text-[12px] font-mono leading-relaxed text-slate-500 uppercase">
        The requested location{' '}
        <span className="text-slate-400">{pathname}</span>{' '}
        does not exist in the command directory.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Go Back
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Command Dashboard
        </button>
      </div>
    </div>
  );
}
