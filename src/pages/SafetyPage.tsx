import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import RiskBadge from '../components/safety/RiskBadge';
import ComplianceIndicator from '../components/safety/ComplianceIndicator';
import WorkflowBadge from '../components/safety/WorkflowBadge';
import HazardEmergency from '../components/HazardEmergency';
import { listHazards, createHazardAssessment } from '../services/safety';
import type { HazardAssessment, HazardCategory, SafetyRiskLevel, SafetyWorkflow } from '../types/safety';

type RiskFilter     = SafetyRiskLevel | 'all';
type WorkflowFilter = SafetyWorkflow  | 'all';

const RISK_FILTERS: RiskFilter[]         = ['all', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
const WORKFLOW_FILTERS: WorkflowFilter[] = ['all', 'open', 'investigating', 'action_required', 'escalated', 'resolved', 'closed'];
const RISK_LEVELS: SafetyRiskLevel[]     = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

const HAZARD_CATEGORIES: HazardCategory[] = [
  'Electrical Safety', 'Ventilation', 'Hazardous Substances', 'Fueling Operations',
  'Noise Control', 'Material Handling', 'Fire Protection', 'PPE Compliance',
  'Walkways & Access', 'Equipment Safety',
];

// Mirrors the `hazards_insert` RLS policy on public.hazard_assessments.
const CAN_IDENTIFY_HAZARD_ROLES = ['platform_owner', 'super_admin', 'director', 'commander', 'admin', 'safety_officer', 'inspection_officer'];

export default function SafetyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search,          setSearch]          = useState('');
  const [riskF,           setRiskF]           = useState<RiskFilter>('all');
  const [workF,           setWorkF]           = useState<WorkflowFilter>('all');
  const [allAssessments,  setAllAssessments]  = useState<HazardAssessment[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const debouncedSearch                       = useDebounce(search, 250);

  const [showCreate,   setShowCreate]   = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [newCategory,  setNewCategory]  = useState<HazardCategory>(HAZARD_CATEGORIES[0]);
  const [newRisk,      setNewRisk]      = useState<SafetyRiskLevel>('MODERATE');
  const [newObs,       setNewObs]       = useState('');
  const [creating,     setCreating]     = useState(false);

  const canIdentifyHazard = CAN_IDENTIFY_HAZARD_ROLES.includes(user.roleCode);

  const load = () => {
    setLoading(true);
    setError(null);
    listHazards({
      search:    debouncedSearch || undefined,
      riskLevel: riskF === 'all' ? undefined : riskF,
      workflow:  workF === 'all' ? undefined : workF,
    })
      .then(setAllAssessments)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [debouncedSearch, riskF, workF]);

  async function handleCreate() {
    if (!newTitle.trim()) { toast.error('Enter a hazard title.'); return; }
    setCreating(true);
    try {
      const created = await createHazardAssessment({
        projectId:        null,
        projectName:      null,
        projectCode:      null,
        directorateCode:  user.directorateCode,
        category:         newCategory,
        hazardTitle:      newTitle.trim(),
        riskLevel:        newRisk,
        complianceStatus: 'under_review',
        workflowStatus:   'open',
        observations:     newObs.trim() || null,
        inspectorId:      user.id,
        inspectorName:    user.fullName,
        classification:   'INTERNAL',
        createdBy:        user.id,
      }, user.id);
      toast.success('Hazard identified — assessment created.');
      setShowCreate(false);
      setNewTitle('');
      setNewObs('');
      navigate(`/safety/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create assessment.');
    } finally {
      setCreating(false);
    }
  }

  const counts = {
    total:        allAssessments.length,
    critical:     allAssessments.filter((a) => a.riskLevel === 'CRITICAL').length,
    nonCompliant: allAssessments.filter((a) => a.complianceStatus === 'non_compliant').length,
    resolved:     allAssessments.filter((a) => a.workflowStatus === 'resolved' || a.workflowStatus === 'closed').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Assessments"
        subtitle="Hazard identification, risk monitoring & compliance enforcement"
        action={
          canIdentifyHazard ? (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
            >
              <Plus className="h-3.5 w-3.5" />
              New Assessment
            </button>
          ) : undefined
        }
      />

      {showCreate && canIdentifyHazard && (
        <div className="rounded-xl border border-sky-500/20 bg-slate-950/70 p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Identify a hazard</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-600">Hazard title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Exposed wiring near fuel storage"
                className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-600">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as HazardCategory)}
                className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/40"
                style={{ colorScheme: 'dark' }}
              >
                {HAZARD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-600">Initial risk level</label>
              <select
                value={newRisk}
                onChange={(e) => setNewRisk(e.target.value as SafetyRiskLevel)}
                className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[12px] text-white outline-none focus:border-sky-500/40"
                style={{ colorScheme: 'dark' }}
              >
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-600">Observations</label>
              <textarea
                value={newObs}
                onChange={(e) => setNewObs(e.target.value)}
                rows={3}
                placeholder="What did you observe on site?"
                className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
              className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? 'Creating…' : 'Create Assessment'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Assessments', value: counts.total,        color: 'text-white' },
          { label: 'Critical Risks',    value: counts.critical,     color: 'text-rose-400' },
          { label: 'Non-Compliant',     value: counts.nonCompliant, color: 'text-amber-400' },
          { label: 'Resolved / Closed', value: counts.resolved,     color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${stat.color}`}>
              {loading ? '…' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[11px] font-mono text-rose-400">
          Failed to load assessments: {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, category or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {RISK_FILTERS.map((r) => (
              <button key={r} type="button" onClick={() => setRiskF(r)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                  riskF === r ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                }`}>
                {r === 'all' ? 'All Risk' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {WORKFLOW_FILTERS.map((w) => (
            <button key={w} type="button" onClick={() => setWorkF(w)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                workF === w ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
              }`}>
              {w === 'all' ? 'All Status' : w.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
        <div className="hidden lg:grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_120px_110px_120px_90px] gap-4 border-b border-slate-800/60 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
          <span>Hazard</span>
          <span>Project</span>
          <span>Category</span>
          <span>Risk</span>
          <span>Compliance</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-slate-800/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading assessments…</p>
            </div>
          ) : allAssessments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldAlert className="h-10 w-10 text-slate-700" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">No assessments match your filter</p>
            </div>
          ) : (
            allAssessments.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/safety/${a.id}`)}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_120px_110px_120px_90px] gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-900/40 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-slate-600 uppercase">{a.directorateCode}</span>
                  </div>
                  <p className="text-[12px] font-bold text-white leading-snug">{a.hazardTitle}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">{a.inspectorName ?? '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-300 leading-snug truncate">{a.projectName ?? '—'}</p>
                  <p className="mt-0.5 text-[9px] font-mono text-slate-600">{a.projectCode ?? '—'}</p>
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-snug">{a.category}</p>
                <RiskBadge level={a.riskLevel} />
                <ComplianceIndicator status={a.complianceStatus} />
                <WorkflowBadge status={a.workflowStatus} />
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-right text-[10px] font-mono text-slate-600 uppercase">
        Showing {allAssessments.length} assessments
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Emergency Operations Console</p>
          <p className="mt-0.5 text-[10px] font-mono text-slate-700 uppercase">Live environmental telemetry and emergency posture controls</p>
        </div>
        <HazardEmergency />
      </div>
    </div>
  );
}
