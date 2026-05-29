import { useCallback, useEffect, useState } from 'react';
import {
  Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Clock, Cpu, Wifi, WifiOff, Layers, Puzzle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import { observability, type PlatformHealthReport, type HealthStatus } from '../lib/observability';
import { pluginRegistry } from '../lib/pluginRegistry';
import { getAllIntegrationHealth, type IntegrationHealth } from '../lib/integrationBridge';
import { PLATFORM_MODULES } from '../lib/platformModules';
import { WORKFLOW_REGISTRY } from '../lib/workflowEngine';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: HealthStatus | string }) {
  const styles: Record<string, string> = {
    healthy:     'bg-emerald-500',
    active:      'bg-emerald-500',
    degraded:    'bg-amber-500 animate-pulse',
    critical:    'bg-rose-500 animate-pulse',
    unknown:     'bg-slate-600',
    unavailable: 'bg-slate-700',
  };
  return <span className={`h-2 w-2 rounded-full shrink-0 ${styles[status] ?? 'bg-slate-600'}`} aria-hidden="true" />;
}

function StatusBadge({ status }: { status: HealthStatus | string }) {
  const styles: Record<string, string> = {
    healthy:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    active:      'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    degraded:    'text-amber-400   border-amber-500/30   bg-amber-500/10',
    critical:    'text-rose-400    border-rose-500/30    bg-rose-500/10',
    unknown:     'text-slate-500   border-slate-700/50   bg-slate-800/20',
    unavailable: 'text-slate-600   border-slate-800/60   bg-slate-900/20',
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${styles[status] ?? styles.unknown}`}>
      {status}
    </span>
  );
}

function formatUptime(ms: number): string {
  const hrs = Math.floor(ms / 3_600_000);
  const min = Math.floor((ms % 3_600_000) / 60_000);
  return `${hrs}h ${min}m`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const { user }   = useAuth();
  const { online } = useNetworkStatus();
  const canView    = hasPermission(user.roleCode, 'system.config') ||
                     hasPermission(user.roleCode, 'system.audit_logs');

  const [report,      setReport]      = useState<PlatformHealthReport | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [loading,     setLoading]     = useState(true);
  const pluginStats = pluginRegistry.getStats();
  const activeWorkflows = Object.keys(WORKFLOW_REGISTRY).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel: health report + integration check + Supabase ping
      const [rpt, integs] = await Promise.all([
        Promise.resolve(observability.getReport()),
        getAllIntegrationHealth(),
        observability.checkSupabaseHealth(),
      ]);
      setReport(rpt);
      setIntegrations(integs);
    } catch {
      toast.error('Could not load system health report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  // Refresh every 60s
  useEffect(() => {
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (!canView) {
    return <div className="pt-20"><ErrorState variant="unauthorized" /></div>;
  }

  const overallIcon = report?.overallStatus === 'healthy' ? CheckCircle
    : report?.overallStatus === 'critical'   ? XCircle
    : AlertTriangle;
  const overallColor = report?.overallStatus === 'healthy' ? 'text-emerald-400'
    : report?.overallStatus === 'critical'   ? 'text-rose-400'
    : 'text-amber-400';

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Platform observability, component status, and operational diagnostics"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            aria-label="Refresh health report"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* ── Overall status banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70 p-5"
          >
            <div className="flex items-center gap-4">
              <div className={overallColor}>
                {(() => { const Icon = overallIcon; return <Icon className="h-8 w-8" aria-hidden="true" />; })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-black uppercase tracking-wider ${overallColor}`}>
                    Platform {report.overallStatus.toUpperCase()}
                  </p>
                  <StatusBadge status={report.overallStatus} />
                  {!online && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-black uppercase">Offline</span>
                    </div>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">
                  Reported at {new Date(report.reportedAt).toLocaleTimeString()} ·
                  Uptime: {formatUptime(Date.now() - report.initTime)} ·
                  {report.recentEvents.length} events recorded
                </p>
              </div>
              {online && (
                <div className="flex items-center gap-1.5 text-emerald-400 shrink-0">
                  <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase">Online</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Modules',        value: PLATFORM_MODULES.filter((m) => m.status === 'active').length, icon: Layers,  sub: 'active' },
              { label: 'Workflows',      value: activeWorkflows, icon: Activity,  sub: 'registered' },
              { label: 'Plugins',        value: pluginStats.total,    icon: Puzzle,   sub: `${pluginStats.active} active` },
              { label: 'Operations',     value: report.operations.reduce((s, o) => s + o.count, 0), icon: Cpu, sub: 'total tracked' },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
                </div>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[9px] font-mono text-slate-600 uppercase mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Component health grid ── */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
            <div className="border-b border-slate-800/60 px-5 py-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">Component Health</p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-800/40 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
              {report.components.map((comp, i) => (
                <motion.div
                  key={comp.name}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-5 py-4 ${i > 1 ? 'border-t border-slate-800/40' : ''}`}
                >
                  <StatusDot status={comp.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white">{comp.name}</p>
                    {comp.details && (
                      <p className="text-[10px] font-mono text-slate-600 uppercase truncate">{comp.details}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {comp.latencyMs !== null && (
                      <span className="text-[9px] font-mono text-slate-600">{comp.latencyMs}ms</span>
                    )}
                    <StatusBadge status={comp.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Integration status ── */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
            <div className="border-b border-slate-800/60 px-5 py-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">External Integrations</p>
            </div>
            <div className="divide-y divide-slate-800/40">
              {integrations.map((integ, i) => (
                <motion.div
                  key={integ.system}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <StatusDot status={integ.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white">{integ.system}</p>
                    {integ.error && (
                      <p className="text-[10px] font-mono text-slate-500 leading-relaxed truncate">{integ.error}</p>
                    )}
                    {integ.lastSync && (
                      <p className="text-[9px] font-mono text-slate-600 uppercase">
                        Last sync: {new Date(integ.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={integ.status} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Operation metrics ── */}
          {report.operations.length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
              <div className="border-b border-slate-800/60 px-5 py-3 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">Operation Metrics</p>
                <span className="text-[9px] font-mono text-slate-600 uppercase">tracked this session</span>
              </div>
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-3 border-b border-slate-800/40 px-5 py-2">
                {['Operation', 'Total', 'Success', 'Failed'].map((h) => (
                  <p key={h} className="text-[9px] font-black uppercase tracking-wider text-slate-600">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-slate-800/40">
                {report.operations.slice(0, 10).map((op) => (
                  <div key={op.name} className="grid grid-cols-[1fr_80px_80px_80px] gap-3 items-center px-5 py-3">
                    <p className="text-[10px] font-mono text-slate-300 truncate">{op.name}</p>
                    <p className="text-[11px] font-black text-white">{op.count}</p>
                    <p className="text-[11px] font-black text-emerald-400">{op.successCount}</p>
                    <p className={`text-[11px] font-black ${op.failureCount > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                      {op.failureCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recent events ── */}
          {report.recentEvents.length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
              <div className="border-b border-slate-800/60 px-5 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">Recent Platform Events</p>
              </div>
              <div className="divide-y divide-slate-800/40">
                {report.recentEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
                      <p className="text-[10px] font-mono text-slate-300">{ev.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(ev.at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <ErrorState variant="unavailable" onRetry={() => void load()} />
      )}
    </div>
  );
}
