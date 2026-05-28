import { AlertTriangle, RefreshCw, Lock, WifiOff, ServerOff } from 'lucide-react';

type ErrorVariant = 'generic' | 'unauthorized' | 'not_found' | 'unavailable' | 'network';

interface Props {
  variant?:    ErrorVariant;
  title?:      string;
  message?:    string;
  onRetry?:    () => void;
  retryLabel?: string;
}

const VARIANT_CONFIG: Record<ErrorVariant, {
  icon:    React.ElementType;
  color:   string;
  title:   string;
  message: string;
}> = {
  generic:      { icon: AlertTriangle, color: 'text-amber-400',  title: 'Something Went Wrong',    message: 'An unexpected error occurred. Try again or contact support.' },
  unauthorized: { icon: Lock,          color: 'text-rose-400',   title: 'Access Restricted',        message: 'You do not have permission to view this content.' },
  not_found:    { icon: AlertTriangle, color: 'text-slate-500',  title: 'Not Found',               message: 'The requested resource could not be located.' },
  unavailable:  { icon: ServerOff,     color: 'text-amber-400',  title: 'Data Unavailable',        message: 'Unable to load data at this time. The server may be unreachable.' },
  network:      { icon: WifiOff,       color: 'text-slate-400',  title: 'Connection Error',        message: 'Network connection failed. Check your connection and try again.' },
};

export default function ErrorState({ variant = 'generic', title, message, onRetry, retryLabel }: Props) {
  const cfg  = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/70 py-16 px-6 text-center">
      <div className={`mb-4 ${cfg.color}`}>
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-300">
        {title ?? cfg.title}
      </h3>
      <p className="mt-2 max-w-sm text-[11px] font-mono text-slate-600 leading-relaxed uppercase">
        {message ?? cfg.message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
        >
          <RefreshCw className="h-3 w-3" />
          {retryLabel ?? 'Try Again'}
        </button>
      )}
    </div>
  );
}
