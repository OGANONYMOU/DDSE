import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  FolderKanban,
  Siren,
  Key,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getCommandCenterSummary, getPendingApprovals, approveRegistration } from '../lib/api';
import { hasPermission } from '../lib/rbac';
import type { DashboardSummary } from '../types/platform';
import { MOCK_DASHBOARD_SUMMARY } from '../lib/mock-data';

import PageHeader from '../components/ui/PageHeader';
import DashboardSection from '../components/dashboard/DashboardSection';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import ChartsSection from '../components/dashboard/ChartsSection';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, unknown>[]>([]);
  const [authQueueOpen, setAuthQueueOpen] = useState(false);
  const canApprove = hasPermission(user.roleCode, 'approval.register');

  const load = useCallback(async () => {
    const [dashSummary, approvals] = await Promise.all([
      (getCommandCenterSummary() as Promise<DashboardSummary>).catch(() => MOCK_DASHBOARD_SUMMARY),
      canApprove ? getPendingApprovals().catch(() => [] as Record<string, unknown>[]) : Promise.resolve([] as Record<string, unknown>[]),
    ]);
    setSummary(dashSummary);
    setPendingApprovals(approvals as Record<string, unknown>[]);
  }, [canApprove]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [load]);

  /* ── Stats card config ── */
  const statsConfig = [
    {
      key:   'active_inspections',
      label: 'Active Inspections',
      icon:  ClipboardCheck,
      tone:  'info' as const,
    },
    {
      key:   'critical_findings',
      label: 'Critical Findings',
      icon:  AlertTriangle,
      tone:  'danger' as const,
    },
    {
      key:   'average_compliance',
      label: 'Avg. Compliance',
      icon:  TrendingUp,
      tone:  'warning' as const,
      unit:  '%',
    },
    {
      key:   'open_corrective_actions',
      label: 'Corrective Actions',
      icon:  ShieldCheck,
      tone:  'warning' as const,
    },
  ];

  const metricMap = Object.fromEntries(
    (summary?.metrics ?? []).map((m) => [m.key, m])
  );

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <PageHeader
        title="Command Dashboard"
        subtitle={`Operational overview — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        action={
          canApprove && pendingApprovals.length > 0 ? (
            <button
              type="button"
              onClick={() => setAuthQueueOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-300 transition hover:border-amber-400/40 animate-pulse"
            >
              <Siren className="h-3.5 w-3.5" />
              {pendingApprovals.length} Pending Auth
            </button>
          ) : undefined
        }
      />

      {/* ── Section A: Overview Stats ── */}
      <DashboardSection title="Overview" subtitle="Current operational metrics">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsConfig.map((s) => (
              <div key={s.key} className="h-[120px] animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsConfig.map((s) => {
              const metric = metricMap[s.key];
              return (
                <StatsCard
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  tone={s.tone}
                  value={metric?.value ?? '—'}
                  unit={'unit' in s ? s.unit : undefined}
                  trend={metric?.trend as 'UP' | 'DOWN' | 'STABLE' | undefined}
                  subLabel={`SVC: ${user.directorateCode}`}
                />
              );
            })}
          </div>
        )}

        {/* Posture indicators */}
        {summary?.posture && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Readiness',          value: `${summary.posture.readinessAverage}%`,   tone: 'info' as const,    icon: TrendingUp },
              { label: 'Risk Level',          value: summary.posture.safetyRiskLevel,           tone: 'warning' as const, icon: AlertTriangle },
              { label: 'Evidence',            value: `${summary.posture.evidenceCompleteness}%`, tone: 'success' as const, icon: ShieldCheck },
              { label: 'Restricted Modules', value: summary.posture.restrictedModulesVisible,  tone: 'danger' as const,  icon: FolderKanban },
            ].map((p) => (
              <StatsCard key={p.label} label={p.label} value={p.value} icon={p.icon} tone={p.tone} />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* ── Section B: Activity + Quick Actions ── */}
      <DashboardSection title="Recent Activity" subtitle="Live event feed and quick operations">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivity entries={summary?.recentActivity ?? []} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </DashboardSection>

      {/* ── Section C: Analytics ── */}
      <DashboardSection title="Analytics" subtitle="Compliance trends and finding distribution">
        <ChartsSection
          severityDistribution={summary?.severityDistribution}
          moduleSummaries={summary?.moduleSummaries}
        />
      </DashboardSection>

      {/* ── Approval Queue Modal ── */}
      <AnimatePresence>
        {authQueueOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl border border-amber-500/30 bg-[#040810] p-6 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-amber-500" />

              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Key className="h-4 w-4" />
                  <h4 className="text-xs font-black uppercase tracking-widest">
                    Registration Authorizations
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthQueueOpen(false)}
                  className="rounded-lg bg-slate-900 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {pendingApprovals.map((approval) => (
                  <div
                    key={String(approval.approvalId)}
                    className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 space-y-3"
                  >
                    <div>
                      <p className="text-[9px] font-mono uppercase text-slate-600">Requested Identity</p>
                      <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-white">
                        {String(approval.fullName)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-mono text-slate-400 uppercase">
                        SVC: {String(approval.serviceNumber)} · ROLE: {String(approval.requestedRoleCode).replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await approveRegistration(String(approval.approvalId), 'approved');
                            await load();
                            toast.success('Access authorized.');
                            if (pendingApprovals.length <= 1) setAuthQueueOpen(false);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Error.');
                          }
                        }}
                        className="flex-1 rounded-lg bg-emerald-500/15 py-2 text-[10px] font-black uppercase text-emerald-300 transition hover:bg-emerald-500/25"
                      >
                        Authorize
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await approveRegistration(String(approval.approvalId), 'rejected');
                            await load();
                            toast.warning('Registration rejected.');
                            if (pendingApprovals.length <= 1) setAuthQueueOpen(false);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Error.');
                          }
                        }}
                        className="flex-1 rounded-lg bg-rose-500/10 py-2 text-[10px] font-black uppercase text-rose-300 transition hover:bg-rose-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
