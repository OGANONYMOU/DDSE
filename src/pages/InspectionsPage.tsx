import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardCheck, Plus, Fingerprint, Layers3, FileQuestion, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  createInspection,
  getInspectionDetail,
  getModules,
  listInspections,
} from '../lib/api';
import type { InspectionDetail, InspectionSummary, ModuleDefinition } from '../types/platform';
import { statusLabel, statusColor, scoreColor } from '../lib/inspectionStatus';
import TacticalAssessment from '../components/TacticalAssessment';
import PageHeader from '../components/ui/PageHeader';

function timeAgo(ts: number): string {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InspectionsPage() {
  const { user } = useAuth();
  const [modules, setModules]          = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections]  = useState<InspectionSummary[]>([]);
  const [activeModule, setActiveModule]= useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [detail, setDetail]            = useState<InspectionDetail | null>(null);
  const [newTitle, setNewTitle]        = useState('');
  const [createModule, setCreateModule] = useState('');
  const [loading, setLoading]          = useState(true);

  const load = useCallback(async (moduleCode: string) => {
    const [moduleList, inspList] = await Promise.all([
      getModules(),
      listInspections(moduleCode || undefined),
    ]);

    const normalized = (moduleList as unknown as Array<Record<string, unknown>>).map((m) => ({
      id:             String(m.id ?? m.code ?? ''),
      moduleCode:     String(m.moduleCode ?? m.code ?? ''),
      title:          String(m.title ?? m.label ?? ''),
      classification: String(m.classification ?? 'general'),
      description:    String(m.description ?? ''),
    })) as ModuleDefinition[];

    setModules(normalized);

    const mapped = (inspList as unknown as Array<Record<string, unknown>>).map((i) => ({
      _id:               String(i._id ?? i.id ?? ''),
      title:             String(i.title ?? ''),
      moduleCode:        String(i.moduleCode ?? ''),
      status:            String(i.status ?? 'draft'),
      scoreOverall:      Number(i.scoreOverall ?? 0),
      complianceBand:    String(i.complianceBand ?? 'N/A'),
      riskLevel:         String(i.riskLevel ?? 'LOW'),
      completionPercent: Number(i.completionPercent ?? 0),
      directorateCode:   String(i.directorateCode ?? ''),
      unitCode:          String(i.unitCode ?? ''),
      updatedAt:         Number(i.updatedAt ?? 0),
    }));

    setInspections(mapped.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useEffect(() => {
    let cancelled = false;
    load(activeModule)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeModule, load]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    getInspectionDetail(selectedId)
      .then((d) => { if (!cancelled) setDetail(d as InspectionDetail); })
      .catch((err: Error) => toast.error(err.message));
    return () => { cancelled = true; };
  }, [selectedId]);

  const moduleTitleByCode = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.moduleCode, m.title])),
    [modules],
  );

  const effectiveCreateModule = createModule || (activeModule || modules[0]?.moduleCode || '');
  const createModuleDef = modules.find((m) => m.moduleCode === effectiveCreateModule) ?? null;
  const isSuperAdmin = user.isPlatformOwner || user.roleCode === 'platform_owner' || user.roleCode === 'super_admin';

  async function handleCreate() {
    if (!newTitle.trim())        { toast.error('Enter a title for the evaluation.'); return; }
    if (!effectiveCreateModule)  { toast.error('Choose a department first.'); return; }
    try {
      const id = await createInspection({
        moduleCode:      effectiveCreateModule,
        title:           newTitle.trim(),
        directorateCode: user.directorateCode,
      });
      setNewTitle('');
      await load(activeModule);
      setSelectedId(id);
      toast.success('Evaluation started.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start evaluation.');
    }
  }

  if (isSuperAdmin) {
    const submittedCount = inspections.filter((inspection) =>
      ['submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'completed'].includes(inspection.status)
    ).length;
    const pendingCount = inspections.filter((inspection) =>
      ['submitted', 'under_review'].includes(inspection.status)
    ).length;
    const departmentCount = modules.length;

    return (
      <div className="space-y-6">
        <PageHeader title="Inspections" subtitle="Question setup and submitted evaluation review" />

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40">
            <ClipboardCheck className="h-8 w-8 animate-pulse text-sky-400/40" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <NavLink
              to="/inspections/questions"
              className="group rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 transition hover:border-sky-500/35 hover:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10">
                    <FileQuestion className="h-5 w-5 text-sky-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">Questions</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Set and update evaluation templates. Grant yourself editing access per department before making changes.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-sky-300" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800/50 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Departments</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{departmentCount}</p>
                </div>
              </div>
            </NavLink>

            <NavLink
              to="/inspections/reviews"
              className="group rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 transition hover:border-emerald-500/35 hover:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">Reviewing</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Review submitted evaluations, approve clean work, decline invalid submissions, or request guided corrections.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-emerald-300" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800/50 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Submitted</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-white">{submittedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Pending</p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-amber-300">{pendingCount}</p>
                </div>
              </div>
            </NavLink>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" subtitle="Start, track and complete departmental evaluations" />

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40">
          <ClipboardCheck className="h-8 w-8 animate-pulse text-sky-400/40" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left: filters + list */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Department</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveModule('')}
                    className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                      activeModule === ''
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        : 'border border-transparent bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Departments
                  </button>
                  {modules.map((mod) => (
                    <button
                      key={mod.moduleCode} type="button"
                      onClick={() => setActiveModule(mod.moduleCode)}
                      title={mod.title}
                      className={`truncate rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                        activeModule === mod.moduleCode
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'border border-transparent bg-slate-900/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mod.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800/40 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Start New Evaluation</p>
                <div className="space-y-2">
                  {!activeModule && (
                    <select
                      value={effectiveCreateModule}
                      onChange={(e) => setCreateModule(e.target.value)}
                      className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="" disabled>Choose a department…</option>
                      {modules.map((m) => (
                        <option key={m.moduleCode} value={m.moduleCode}>{m.title}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 min-w-0 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
                      placeholder={createModuleDef ? `e.g. ${createModuleDef.title} — Q3 review` : 'Evaluation title…'}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                    />
                    <button
                      type="button" onClick={() => void handleCreate()}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/15"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/40 pt-4 space-y-2 max-h-[440px] overflow-y-auto pr-0.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5" /> Evaluations
                  </p>
                  <span className="text-xs text-slate-600">{inspections.length}</span>
                </div>

                {inspections.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-600">No evaluations yet — start one above.</p>
                ) : (
                  inspections.map((ins) => {
                    const isActive = selectedId === ins._id;
                    return (
                      <button
                        key={ins._id} type="button"
                        onClick={() => setSelectedId(ins._id)}
                        className={`w-full rounded-lg border p-3.5 text-left transition-all ${
                          isActive ? 'border-sky-500/40 bg-sky-950/60' : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {!activeModule && (
                            <span className="truncate text-[11px] font-medium text-slate-500">
                              {moduleTitleByCode[ins.moduleCode] ?? ins.moduleCode}
                            </span>
                          )}
                          <span className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(ins.status)}`}>
                            {statusLabel(ins.status)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-white line-clamp-1">{ins.title}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/40 pt-2">
                          <span className={`font-semibold ${scoreColor(ins.scoreOverall)}`}>{ins.scoreOverall}% score</span>
                          <span>{timeAgo(ins.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: assessment panel */}
          <div className="lg:col-span-8">
            {detail ? (
              <TacticalAssessment
                detail={detail}
                onChange={async () => {
                  const refreshed = await getInspectionDetail(detail.inspection._id);
                  setDetail(refreshed as InspectionDetail);
                  await load(activeModule);
                }}
              />
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 text-center gap-3">
                <Fingerprint className="h-12 w-12 text-sky-500/20" />
                <div>
                  <p className="text-sm font-semibold text-slate-400">Select an evaluation</p>
                  <p className="mt-1 text-sm text-slate-600">Choose one from the list, or start a new one for a department.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
