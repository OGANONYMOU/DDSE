import { useCallback, useEffect, useState } from 'react';
import {
  Zap, Play, Pause, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import {
  automationEngine, type AutomationRule, type AutomationResult,
} from '../lib/automationEngine';
import { WORKFLOW_REGISTRY } from '../lib/workflowEngine';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'text-rose-400   border-rose-500/30   bg-rose-500/10',
  HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  MEDIUM:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
  LOW:      'text-slate-400  border-slate-700/40  bg-slate-800/20',
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  compliance: CheckCircle2,
  safety:     AlertTriangle,
  reporting:  RefreshCw,
  personnel:  ChevronRight,
  system:     Zap,
};

const TRIGGER_LABELS: Record<string, string> = {
  schedule_hourly: 'Hourly',
  schedule_daily:  'Daily',
  platform_event:  'On Event',
  threshold_check: 'Threshold',
  on_startup:      'On Startup',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RuleCard({
  rule, onToggle, onRun, running,
}: {
  rule:    AutomationRule;
  onToggle: (ruleId: string, enabled: boolean) => void;
  onRun:   (ruleId: string) => void;
  running: boolean;
}) {
  const Icon   = CATEGORY_ICON[rule.category] ?? Zap;
  const result = rule.lastResult as AutomationResult | undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border bg-slate-950/70 p-5 transition-opacity ${
        rule.enabled ? 'border-slate-800/60' : 'border-slate-800/30 opacity-60'
      }`}
    >
      {/* Category left stripe */}
      <div className={`absolute left-0 inset-y-0 w-[3px] rounded-l-xl ${
        rule.category === 'safety'     ? 'bg-rose-500' :
        rule.category === 'compliance' ? 'bg-sky-500'  :
        rule.category === 'reporting'  ? 'bg-violet-500' :
        rule.category === 'system'     ? 'bg-amber-500'  : 'bg-slate-600'
      }`} />

      <div className="flex items-start gap-3 pl-2">
        <div className="mt-0.5 shrink-0 text-slate-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-bold uppercase text-white">{rule.name}</p>
            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${PRIORITY_STYLES[rule.priority]}`}>
              {rule.priority}
            </span>
            <span className="rounded border border-slate-700/40 bg-slate-800/20 px-1.5 py-0.5 text-[9px] font-mono uppercase text-slate-500">
              {TRIGGER_LABELS[rule.trigger]}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-mono leading-relaxed text-slate-500">
            {rule.description}
          </p>

          {/* Last run info */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-600">
            {rule.lastRun ? (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Last run: {timeAgo(rule.lastRun)}
                </span>
                <span>Runs: {rule.runCount}</span>
                {result && (
                  <span className={`flex items-center gap-1 ${result.matched ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {result.matched
                      ? <><CheckCircle2 className="h-3 w-3" /> Matched</>
                      : 'No match'}
                  </span>
                )}
              </>
            ) : (
              <span>Not yet executed</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onRun(rule.id)}
            disabled={running || !rule.enabled}
            title="Run now"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Run ${rule.name} now`}
          >
            <Play className="h-3 w-3" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onToggle(rule.id, !rule.enabled)}
            title={rule.enabled ? 'Disable' : 'Enable'}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
              rule.enabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-slate-700/60 bg-slate-900/40 text-slate-600 hover:text-slate-400'
            }`}
            aria-label={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
            aria-pressed={rule.enabled}
          >
            {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { user }   = useAuth();
  const canManage  = hasPermission(user.roleCode, 'system.audit_logs');
  const canView    = hasPermission(user.roleCode, 'system.audit_logs') || hasPermission(user.roleCode, 'audit.view');

  const [rules,       setRules]     = useState<AutomationRule[]>([]);
  const [runningId,   setRunningId] = useState<string | null>(null);
  const [activeFilter, setFilter]  = useState<string>('all');

  const load = useCallback(() => {
    setRules([...automationEngine.getRules()]);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!canView) {
    return <div className="pt-20"><ErrorState variant="unauthorized" /></div>;
  }

  async function handleRun(ruleId: string) {
    setRunningId(ruleId);
    try {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;
      const result = await automationEngine.runRule(rule, 'schedule_daily');
      if (result.matched) {
        toast.success(`Rule "${rule.name}" triggered — action executed.`);
      } else {
        toast.info(`Rule "${rule.name}" ran — condition not met.`);
      }
      load();
    } catch {
      toast.error('Rule execution failed.');
    } finally {
      setRunningId(null);
    }
  }

  function handleToggle(ruleId: string, enabled: boolean) {
    if (!canManage) { toast.error('You do not have permission to modify automation rules.'); return; }
    if (enabled) automationEngine.enableRule(ruleId);
    else         automationEngine.disableRule(ruleId);
    load();
    toast.success(`Rule ${enabled ? 'enabled' : 'disabled'}.`);
  }

  const categories = ['all', 'compliance', 'safety', 'reporting', 'system'];
  const filtered   = activeFilter === 'all' ? rules : rules.filter((r) => r.category === activeFilter);
  const enabled    = rules.filter((r) => r.enabled).length;
  const workflows  = Object.values(WORKFLOW_REGISTRY);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        subtitle="Operational automation rules, workflow definitions, and scheduled triggers"
        action={
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Automation Rules', value: rules.length,  sub: `${enabled} enabled` },
          { label: 'Workflow Chains',  value: workflows.length, sub: 'registered' },
          { label: 'Total Runs',       value: rules.reduce((s, r) => s + r.runCount, 0), sub: 'this session' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
            <p className="text-[9px] font-mono text-slate-600 uppercase">{sub}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            aria-pressed={activeFilter === cat}
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
              activeFilter === cat
                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                : 'border-slate-700/50 bg-slate-900/30 text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Automation rules */}
      <div className="space-y-3">
        {filtered.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
            onRun={(id) => void handleRun(id)}
            running={runningId === rule.id}
          />
        ))}
      </div>

      {/* Workflow definitions */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
        <div className="border-b border-slate-800/60 px-5 py-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">Workflow Definitions</p>
        </div>
        <div className="divide-y divide-slate-800/40">
          {workflows.map((wf, i) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400">
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase text-white">{wf.name}</p>
                <p className="text-[10px] font-mono text-slate-500 leading-relaxed">{wf.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] font-mono uppercase text-slate-600">Entity</p>
                <p className="text-[10px] font-bold uppercase text-slate-300">{wf.entityType}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] font-mono uppercase text-slate-600">Steps</p>
                <p className="text-[10px] font-bold uppercase text-slate-300">{Object.keys(wf.steps).length}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="text-[9px] font-black uppercase text-emerald-400">Active</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
