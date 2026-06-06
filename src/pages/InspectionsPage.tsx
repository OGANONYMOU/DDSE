import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Fingerprint, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  createInspection,
  getInspectionDetail,
  getModules,
  listInspections,
} from '../lib/api';
import type { InspectionDetail, InspectionSummary, ModuleDefinition } from '../types/platform';
import TacticalAssessment from '../components/TacticalAssessment';
import PageHeader from '../components/ui/PageHeader';

export default function InspectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules]          = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections]  = useState<InspectionSummary[]>([]);
  const [activeModule, setActiveModule]= useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [detail, setDetail]            = useState<InspectionDetail | null>(null);
  const [newTitle, setNewTitle]        = useState('');
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
    if (!moduleCode && normalized.length > 0) setActiveModule(normalized[0].moduleCode);

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

    setInspections(mapped);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(activeModule)
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [activeModule, load]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    getInspectionDetail(selectedId)
      .then((d) => setDetail(d as InspectionDetail))
      .catch((err: Error) => toast.error(err.message));
  }, [selectedId]);

  const activeModuleDef = useMemo(
    () => modules.find((m) => m.moduleCode === activeModule) ?? null,
    [modules, activeModule]
  );

  async function handleCreate() {
    if (!newTitle.trim()) { toast.error('Enter a title.'); return; }
    if (!activeModule)    { toast.error('Select a module.'); return; }
    try {
      const id = await createInspection({
        moduleCode:      activeModule,
        title:           newTitle.trim(),
        directorateCode: user.directorateCode,
      });
      setNewTitle('');
      await load(activeModule);
      setSelectedId(id);
      toast.success('Inspection initialized.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create inspection.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections" subtitle="Tactical audit registry & assessment interface" />

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40">
          <ClipboardCheck className="h-8 w-8 animate-pulse text-sky-400/40" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left: list panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Module</p>
                <div className="flex flex-wrap gap-1.5">
                  {modules.map((mod) => (
                    <button
                      key={mod.moduleCode} type="button"
                      onClick={() => setActiveModule(mod.moduleCode)}
                      className={`rounded-md px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition ${
                        activeModule === mod.moduleCode
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                          : 'border border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mod.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800/40 pt-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">New Inspection</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] font-mono text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
                    placeholder={activeModuleDef ? `New ${activeModuleDef.title}...` : 'Description...'}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
                  />
                  <button
                    type="button" onClick={() => void handleCreate()}
                    className="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 text-[10px] font-black uppercase text-sky-300 transition hover:bg-sky-500/15"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/40 pt-4 space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-1.5">
                    <Layers3 className="h-3 w-3" /> Dossiers
                  </p>
                  <span className="text-[9px] font-mono text-slate-600">{inspections.length}</span>
                </div>

                {inspections.length === 0 ? (
                  <p className="py-6 text-center text-[11px] font-mono uppercase text-slate-600">No inspections</p>
                ) : (
                  inspections.map((ins) => {
                    const isActive = selectedId === ins._id;
                    return (
                      <button
                        key={ins._id} type="button"
                        onClick={() => setSelectedId(ins._id)}
                        className={`w-full rounded-lg border p-3.5 text-left transition-all ${
                          isActive ? 'border-sky-500/30 bg-sky-950/60' : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span>{ins.complianceBand}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${ins.status === 'completed' || ins.status === 'approved' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        </div>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white line-clamp-1">{ins.title}</p>
                        <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-800/40 pt-2">
                          <span>Score: {ins.scoreOverall}%</span>
                          <span className="uppercase">{ins.status}</span>
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
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 font-mono">Select an inspection</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-700 uppercase">Choose a dossier from the left to open the evaluation interface</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
