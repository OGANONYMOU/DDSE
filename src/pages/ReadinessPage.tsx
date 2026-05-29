import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, Shield, FolderKanban,
  Users, RefreshCw, ChevronRight, Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import {
  getReadinessReport, bandColor, bandLabel, scoreToBand,
  invalidateReadinessCache,
  type ReadinessReport, type ReadinessBand, type AlertSeverity,
} from '../lib/readinessEngine';
import { useRealtime } from '../hooks/useRealtime';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, band, size = 120 }: { score: number; band: ReadinessBand; size?: number }) {
  const radius      = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash        = (score / 100) * circumference;

  const ringColor: Record<ReadinessBand, string> = {
    A: '#10b981', B: '#38b6ff', C: '#f59e0b', D: '#f97316', F: '#ef4444',
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={ringColor[band]}
          strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black tabular-nums text-white">{score}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  const colors: Record<AlertSeverity, string> = {
    CRITICAL: 'text-rose-400   border-rose-500/30   bg-rose-500/10',
    HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
    MEDIUM:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
    LOW:      'text-slate-400  border-slate-700/50  bg-slate-800/20',
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colors[severity]}`}>
      {severity}
    </span>
  );
}

function DimensionBar({
  label, score, band, trend, detail,
}: { label: string; score: number; band: ReadinessBand; trend: string; detail: string }) {
  const colorMap: Record<ReadinessBand, string> = {
    A: 'bg-emerald-500', B: 'bg-sky-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-rose-500',
  };
  const trendColor = trend === 'UP' ? 'text-emerald-400' : trend === 'DOWN' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">{label}</p>
          <span className={`text-[9px] font-black uppercase tracking-wider ${bandColor(band).split(' ')[0]}`}>
            {band}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${trendColor}`}>{trend}</span>
          <span className="text-[11px] font-black text-white">{score}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
        <motion.div
          className={`h-full rounded-full ${colorMap[band]}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] font-mono text-slate-600 leading-relaxed">{detail}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReadinessPage() {
  const { user }   = useAuth();
  const { online } = useNetworkStatus();
  const canView    = hasPermission(user.roleCode, 'data.view_nationwide') ||
                     hasPermission(user.roleCode, 'inspections.view_all');

  const [report,  setReport]  = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);

  const { status: rtStatus, latest: rtEvent } = useRealtime({
    table:   'inspections',
    enabled: !!(canView && online),
  });

  const load = useCallback(() => {
    setLoading(true);
    try {
      invalidateReadinessCache();
      setReport(getReadinessReport());
    } catch {
      toast.error('Could not compute readiness report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh on real-time inspection changes
  useEffect(() => {
    if (rtEvent) load();
  }, [rtEvent, load]);

  if (!canView) {
    return <div className="pt-20"><ErrorState variant="unauthorized" /></div>;
  }

  const dimensionIcons = {
    safety:     Shield,
    compliance: Activity,
    projects:   FolderKanban,
    personnel:  Users,
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Readiness"
        subtitle="Real-time command-level readiness assessment across all domains"
        action={
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${rtStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[9px] font-mono text-slate-600 uppercase">
                {rtStatus === 'connected' ? 'Live' : 'Static'}
              </span>
            </div>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
              aria-label="Refresh readiness report"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Refresh
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* ── Overall readiness ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70 p-6"
          >
            {/* Top accent */}
            <div className={`absolute inset-x-0 top-0 h-[3px] ${bandColor(report.overall.band).split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-sky-500'}`} />

            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ScoreRing score={report.overall.score} band={report.overall.band} size={140} />

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Overall Readiness Band</p>
                  <p className={`mt-1 text-3xl font-black uppercase tracking-wider ${bandColor(report.overall.band).split(' ')[0]}`}>
                    {bandLabel(report.overall.band)}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-slate-500 uppercase">
                    {report.overall.detail}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {(['safety', 'compliance', 'projects', 'personnel'] as const).map((dim) => {
                    const d    = report.dimensions[dim];
                    const Icon = dimensionIcons[dim];
                    return (
                      <div
                        key={dim}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase ${bandColor(d.band)}`}
                      >
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {d.label}: {d.score}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Generated {new Date(report.generatedAt).toLocaleTimeString()} ·
                  Next review {new Date(report.nextReviewAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Active alerts ── */}
          {report.alerts.length > 0 && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
              <div className="border-b border-slate-800/60 px-5 py-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Active Readiness Alerts
                </p>
                <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-black text-rose-400">
                  {report.alerts.length}
                </span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {report.alerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <AlertSeverityBadge severity={alert.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase text-white">{alert.message}</p>
                      {alert.action && (
                        <p className="mt-0.5 text-[10px] font-mono text-slate-500 leading-relaxed">
                          → {alert.action}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[9px] font-mono uppercase text-slate-600">{alert.module}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Dimension breakdown ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {(['safety', 'compliance', 'projects', 'personnel'] as const).map((dim, i) => {
              const d = report.dimensions[dim];
              return (
                <motion.div
                  key={dim}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5"
                >
                  <DimensionBar
                    label={d.label}
                    score={d.score}
                    band={d.band}
                    trend={d.trend}
                    detail={d.detail}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* ── Per-directorate table ── */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
            <div className="border-b border-slate-800/60 px-5 py-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Directorate Readiness Status
              </p>
            </div>
            <div className="divide-y divide-slate-800/40">
              {report.directorates.map((dir, i) => {
                const band = scoreToBand(dir.score);
                return (
                  <motion.div
                    key={dir.code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Directorate code */}
                    <div className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${bandColor(band)}`}>
                      {dir.code}
                    </div>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold uppercase text-white">{dir.name}</p>
                      <p className="text-[9px] font-mono text-slate-600 uppercase">
                        {dir.activeProjects} projects · {dir.openHazards} open hazards · {dir.pendingInspections} pending inspections
                      </p>
                    </div>

                    {/* Score gauge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 h-1.5 overflow-hidden rounded-full bg-slate-800/60">
                        <div
                          className={`h-full rounded-full ${
                            band === 'A' ? 'bg-emerald-500' :
                            band === 'B' ? 'bg-sky-500' :
                            band === 'C' ? 'bg-amber-500' :
                            band === 'D' ? 'bg-orange-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${dir.score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black tabular-nums text-white">{dir.score}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <ErrorState variant="unavailable" onRetry={load} />
      )}
    </div>
  );
}
