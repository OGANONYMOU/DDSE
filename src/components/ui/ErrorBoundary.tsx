import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children:  ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/15 bg-rose-950/10 py-16 px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400 mb-4" />
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-300">
          Render Error
        </h3>
        <p className="mt-2 max-w-sm text-[10px] font-mono text-slate-600 uppercase leading-relaxed">
          {this.state.error?.message ?? 'An unexpected rendering error occurred.'}
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="mt-6 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
        >
          <RefreshCw className="h-3 w-3" />
          Reload Section
        </button>
      </div>
    );
  }
}
