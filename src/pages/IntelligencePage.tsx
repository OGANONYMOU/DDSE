import { useCallback, useEffect, useState } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  BarChart3, Users, RefreshCw, ChevronRight, Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import { getInsightReport, invalidateInsightCache, type OperationalInsight, type InsightPriority, type InsightType } from '../services/aiInsights';
import { getAnalyticsSummary, type ContractorScore, type AnalyticsSummary } from '../services/advancedAnalytics';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<InsightPriority, string> = {
  CRITICAL: 'text-rose-400   border-rose-500/30   bg-rose-500/10',
  HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  MEDIUM:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
  LOW:      'text-slate-400  border-slate-700/40  bg-slate-800/20',
};

const TYPE_ICONS: Record<InsightType, React.ElementType> = {
  risk_prediction: AlertTriangle,
  recommendation:  Star,
  anomaly:         AlertTriangle,
  trend:           TrendingUp,
  performance:     BarChart3,
  compliance_gap:  AlertTriangle,
};

const TYPE_LABELS: Record<InsightType, string> = {
  risk_prediction: 'Risk Prediction',
  recommendation:  'Recommendation',
  anomaly:         'Anomaly',
  trend:           'Trend',
  performance:     'Performance',
  compliance_gap:  'Compliance Gap',
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[9px] font-mono text-slate-600">{value}%</span>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: OperationalInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICONS[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-xl border bg-slate-950/70 transition-colors ${
        expanded ? 'border-slate-700/60' : 'border-slate-800/60 hover:border-slate-700/40'
      }`}
    >
      {/* Priority side stripe */}
      <div className={`absolute left-0 inset-y-0 w-[3px] ${
        insight.priority === 'CRITICAL' ? 'bg-rose-500' :
        insight.priority === 'HIGH'     ? 'bg-orange-500' :
        insight.priority === 'MEDIUM'   ? 'bg-amber-500'  : 'bg-slate-600'
      }`} />

      <div
        className="flex cursor-pointer items-start gap-4 px-5 py-4 pl-6"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={`mt-0.5 shrink-0 ${PRIORITY_STYLES[insight.priority].split(' ')[0]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${PRIORITY_STYLES[insight.priority]}`}>
              {insight.priority}
            </span>
            <span className="rounded border border-slate-700/40 bg-slate-800/20 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-500">
              {TYPE_LABELS[insight.type]}
            </span>
            <span className="text-[9px] font-mono text-slate-600 uppercase">{insight.module}</span>
          </div>
          <p className="mt-1.5 text-[12px] font-bold uppercase tracking-wide text-white">
            {insight.title}
          </p>
          <p className="mt-0.5 text-[11px] font-mono leading-relaxed text-slate-400">
            {insight.summary}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-600 uppercase">Confidence:</span>
            <ConfidenceBar value={insight.confidence} />
          </div>
        </div>

        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-slate-700 transition-transform ${expanded ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-slate-800/40 px-6 py-4 pl-7 space-y-3"
        >
          <p className="text-[12px] font-mono leading-7 text-slate-300">{insight.detail}</p>

          {insight.action && (
            <div className="rounded-lg border border-sky-500/15 bg-sky-500/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-600">Recommended Action</p>
              <p className="mt-1 text-[11px] font-mono text-sky-300 leading-relaxed">→ {insight.action}</p>
            </div>
          )}

          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Data Points</p>
            <div className="space-y-1">
              {insight.dataPoints.slice(0, 4).map((dp, i) => (
                <p key={i} className="text-[10px] font-mono text-slate-600">· {dp}</p>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ReliabilityBadge({ reliability }: { reliability: ContractorScore['reliability'] }) {
  const styles: Record<string, string> = {
    EXCELLENT: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    GOOD:      'text-sky-400     border-sky-500/30     bg-sky-500/10',
    AVERAGE:   'text-amber-400   border-amber-500/30   bg-amber-500/10',
    POOR:      'text-rose-400    border-rose-500/30    bg-rose-500/10',
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${styles[reliability]}`}>
      {reliability}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const { user }  = useAuth();
  const canView   = hasPermission(user.roleCode, 'data.view_nationwide') ||
                    hasPermission(user.roleCode, 'inspections.view_all') ||
                    hasPermission(user.roleCode, 'audit.view');

  const [insights,   setInsights]   = useState<ReturnType<typeof getInsightReport> | null>(null);
  const [analytics,  setAnalytics]  = useState<AnalyticsSummary | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'insights' | 'contractors' | 'hazards' | 'trends'>('insights');

  const load = useCallback(() => {
    setLoading(true);
    try {
      invalidateInsightCache();
      setInsights(getInsightReport());
      setAnalytics(getAnalyticsSummary());
    } catch {
      toast.error('Could not generate intelligence report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!canView) {
    return <div className="pt-20"><ErrorState variant="unauthorized" /></div>;
  }

  const tabs = [
    { id: 'insights',    label: 'AI Insights' },
    { id: 'contractors', label: 'Contractor Intel' },
    { id: 'hazards',     label: 'Hazard Patterns' },
    { id: 'trends',      label: 'Predicted Trends' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Intelligence"
        subtitle="AI-assisted analysis, risk prediction, and performance intelligence"
        action={
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            aria-label="Regenerate intelligence report"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Regenerate
          </button>
        }
      />

      {/* Risk index strip */}
      {insights && !loading && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Risk Index',    value: insights.riskScore,    color: insights.riskScore > 50 ? 'text-rose-400' : insights.riskScore > 25 ? 'text-amber-400' : 'text-emerald-400', unit: '/100' },
            { label: 'Insights',      value: insights.insights.length, color: 'text-white',    unit: 'total' },
            { label: 'Anomalies',     value: insights.anomalyCount,  color: 'text-orange-400', unit: 'detected' },
            { label: 'Top Priority',  value: insights.topPriority,   color: PRIORITY_STYLES[insights.topPriority].split(' ')[0], unit: '' },
          ].map(({ label, value, color, unit }) => (
            <div key={label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
              <div className="mt-1 flex items-end gap-1">
                <span className={`text-xl font-black ${color}`}>{value}</span>
                {unit && <span className="mb-0.5 text-[10px] font-mono text-slate-600">{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-slate-800/60 bg-slate-950/70 p-1" role="tablist">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
              activeTab === id
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : (
        <>
          {/* Insights tab */}
          {activeTab === 'insights' && insights && (
            <div className="space-y-3">
              {insights.insights.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Brain className="h-8 w-8 text-slate-700 mb-3" aria-hidden="true" />
                  <p className="text-[11px] font-mono uppercase text-slate-600">No significant insights detected</p>
                </div>
              ) : (
                insights.insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))
              )}
            </div>
          )}

          {/* Contractor intel tab */}
          {activeTab === 'contractors' && analytics && (
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
              <div className="border-b border-slate-800/60 px-5 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Contractor Reliability Scores
                </p>
              </div>
              <div className="divide-y divide-slate-800/40">
                {analytics.contractorScores.map((contractor, i) => (
                  <motion.div
                    key={contractor.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-[10px] font-black text-slate-500">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-white">{contractor.name}</p>
                      <p className="text-[9px] font-mono text-slate-600 uppercase">
                        {contractor.projects} project{contractor.projects !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="hidden sm:flex shrink-0 items-center gap-4 text-[10px] font-mono text-slate-500">
                      <div className="text-right">
                        <p className="text-[9px] uppercase text-slate-600">Avg Score</p>
                        <p className="text-white font-black">{contractor.avgScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase text-slate-600">On-Time</p>
                        <p className="text-white font-black">{contractor.onTimeRate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase text-slate-600">Safety</p>
                        <p className="text-white font-black">{contractor.safetyRecord}</p>
                      </div>
                    </div>
                    <ReliabilityBadge reliability={contractor.reliability} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Hazard patterns tab */}
          {activeTab === 'hazards' && analytics && (
            <div className="space-y-3">
              {analytics.recurringHazards.map((hazard, i) => (
                <motion.div
                  key={hazard.category}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-bold uppercase text-white">{hazard.category}</p>
                        <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          hazard.trend === 'INCREASING'
                            ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                            : 'text-slate-400 border-slate-700/40 bg-slate-800/20'
                        }`}>
                          {hazard.trend}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-mono text-slate-500 uppercase">
                        {hazard.count} occurrence{hazard.count !== 1 ? 's' : ''} across {hazard.projectIds.length} project{hazard.projectIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {hazard.trend === 'INCREASING'
                        ? <TrendingUp className="h-4 w-4 text-rose-400" aria-hidden="true" />
                        : <Minus       className="h-4 w-4 text-slate-500" aria-hidden="true" />}
                    </div>
                  </div>
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className={`h-full rounded-full ${hazard.riskLevel === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, hazard.count * 30)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Predicted trends tab */}
          {activeTab === 'trends' && analytics && (
            <div className="space-y-3">
              {analytics.predictedTrends.map((trend, i) => {
                const TrendIcon = trend.direction === 'UP' ? TrendingUp : trend.direction === 'DOWN' ? TrendingDown : Minus;
                const dirColor  = trend.direction === 'UP' ? 'text-emerald-400' : trend.direction === 'DOWN' ? 'text-rose-400' : 'text-slate-500';

                return (
                  <motion.div
                    key={trend.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 p-5"
                  >
                    <div className={`shrink-0 ${dirColor}`}>
                      <TrendIcon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase text-white">{trend.label}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500">Now: <strong className="text-slate-300">{trend.current}</strong></span>
                        <span className="text-slate-700">→</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Predicted: <strong className={dirColor}>{trend.predicted}</strong>
                        </span>
                        {trend.delta !== 0 && (
                          <span className={`text-[10px] font-mono ${dirColor}`}>
                            ({trend.delta > 0 ? '+' : ''}{trend.delta})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[9px] font-mono text-slate-600 uppercase">Confidence</p>
                      <ConfidenceBar value={trend.confidence} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

