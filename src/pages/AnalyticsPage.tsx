import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/ui/PageHeader';
import DashboardSection from '../components/dashboard/DashboardSection';
import CommandSummary from '../components/analytics/CommandSummary';
import MetricGrid from '../components/analytics/MetricGrid';
import ComplianceChart from '../components/analytics/ComplianceChart';
import RiskDistributionChart from '../components/analytics/RiskDistributionChart';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import { getAnalyticsSummary } from '../lib/api';
import type { AnalyticsSummary } from '../types/platform';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsSummary()
      .then((data) => { if (!cancelled) setMetrics(data); })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40">
        <BarChart3 className="h-8 w-8 animate-pulse text-sky-400/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Operational intelligence & compliance performance dashboard"
      />

      {/* Command-level KPI strip */}
      <DashboardSection title="Command Summary" subtitle="Live operational indicators derived from all active modules">
        <CommandSummary
          activeProjects={metrics.activeProjects}
          onHoldProjects={metrics.onHoldProjects}
          criticalHazards={metrics.criticalHazards}
          pendingReviews={metrics.pendingReviews}
          overdueActions={metrics.overdueActions}
        />
      </DashboardSection>

      {/* Performance metrics */}
      <DashboardSection title="Platform Metrics" subtitle="Aggregate performance across projects, inspections and safety">
        <MetricGrid
          cols={4}
          metrics={[
            { label: 'Active Projects',       value: metrics.activeProjects,     color: 'text-sky-400',     trend: 'UP',     note: 'In-progress' },
            { label: 'Avg. Compliance Score', value: metrics.complianceAvg,      color: 'text-white',       trend: 'UP',     unit: '%' },
            { label: 'Critical Hazards',      value: metrics.criticalHazards,    color: 'text-rose-400',    trend: 'STABLE', note: 'Require escalation' },
            { label: 'Pending Reviews',       value: metrics.pendingReviews,     color: 'text-amber-400',   trend: 'DOWN',   note: 'Awaiting sign-off' },
            { label: 'Open Reports',          value: metrics.openReports,        color: 'text-slate-300',   trend: 'STABLE', note: 'Draft / in review' },
            { label: 'Total Assessments',     value: metrics.totalAssessments,   color: 'text-slate-300',   note: 'All evaluations' },
            { label: 'Inspection Modules',    value: metrics.inspectionModules,  color: 'text-slate-300',   note: 'Active templates' },
            { label: 'Registered Projects',   value: metrics.registeredProjects, color: 'text-slate-300',   note: 'All directorates' },
          ]}
        />
      </DashboardSection>

      {/* Charts row */}
      <DashboardSection title="Compliance Intelligence" subtitle="Score trends and risk distribution across the platform">
        <div className="grid gap-4 lg:grid-cols-2">
          <ComplianceChart data={metrics.complianceTrend} />
          <RiskDistributionChart riskDistribution={metrics.riskDistribution} modulePerformance={metrics.modulePerformance} />
        </div>
      </DashboardSection>

      {/* Activity timeline */}
      <DashboardSection title="Activity Timeline" subtitle="Recent system events across all modules">
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
          <ActivityTimeline activities={metrics.recentActivity} limit={8} />
        </div>
      </DashboardSection>
    </div>
  );
}
