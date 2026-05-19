import { useEffect, useMemo, useState, useCallback } from 'react';
import { FileCheck2, Layers3, LogOut, MessageSquareCode, ShieldCheck, Siren } from 'lucide-react';
import { toast } from 'sonner';
import {
  addCorrectiveAction,
  addReviewComment,
  approveRegistration,
  createFinding,
  createInspection,
  getCommandCenterSummary,
  getEvidenceDownloadUrl,
  getInspectionDetail,
  getModules,
  getPendingApprovals,
  listInspections,
  saveInspectionResponse,
  transitionInspection,
  uploadEvidence,
} from '../lib/api';
import type { DashboardSummary, InspectionDetail, InspectionSummary, ModuleDefinition, PlatformUser } from '../types/platform';

interface CommandCenterProps {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

const VALID_STATUSES = ['in_progress', 'submitted', 'under_review', 'approved', 'completed', 'rejected'];

export default function CommandCenter({ user, onLogout }: CommandCenterProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [activeModule, setActiveModule] = useState<string>('');
  const [pendingApprovals, setPendingApprovals] = useState<Record<string, unknown>[]>([]);
  const [newInspectionTitle, setNewInspectionTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (moduleCode: string) => {
    const [dashboardSummary, moduleList, inspectionList, approvals] = await Promise.all([
      getCommandCenterSummary() as Promise<DashboardSummary>,
      getModules(),
      listInspections(moduleCode || undefined),
      getPendingApprovals().catch(() => [] as Record<string, unknown>[]),
    ]);

    setSummary(dashboardSummary);

    const normalizedModules = (moduleList as unknown as Array<Record<string, unknown>>).map((m) => ({
      id: String(m.id ?? m.code ?? ''),
      moduleCode: String(m.moduleCode ?? m.code ?? ''),
      title: String(m.title ?? m.label ?? ''),
      classification: String(m.classification ?? 'general'),
      description: String(m.description ?? ''),
    })) as ModuleDefinition[];
    setModules(normalizedModules);

    if (!moduleCode && normalizedModules.length > 0) {
      setActiveModule(normalizedModules[0].moduleCode);
    }

    setInspections(
      (inspectionList as unknown as Array<Record<string, unknown>>).map((i) => ({
        _id: String(i._id ?? i.id ?? ''),
        title: String(i.title ?? ''),
        moduleCode: String(i.moduleCode ?? ''),
        status: String(i.status ?? 'draft'),
        scoreOverall: Number(i.scoreOverall ?? 0),
        complianceBand: String(i.complianceBand ?? 'N/A'),
        riskLevel: String(i.riskLevel ?? 'LOW'),
        completionPercent: Number(i.completionPercent ?? 0),
        directorateCode: String(i.directorateCode ?? ''),
        unitCode: String(i.unitCode ?? ''),
        updatedAt: Number(i.updatedAt ?? 0),
      }))
    );

    setPendingApprovals(approvals as Record<string, unknown>[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard(activeModule)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [activeModule, loadDashboard]);

  useEffect(() => {
    if (!selectedInspectionId) {
      setDetail(null);
      return;
    }
    getInspectionDetail(selectedInspectionId)
      .then((d) => setDetail(d as InspectionDetail))
      .catch((error: Error) => toast.error(error.message));
  }, [selectedInspectionId]);

  const activeModuleDefinition = useMemo(
    () => modules.find((m) => m.moduleCode === activeModule) ?? null,
    [modules, activeModule],
  );

  async function handleCreateInspection() {
    if (!newInspectionTitle.trim()) {
      toast.error('Enter a title for the inspection.');
      return;
    }
    if (!activeModule) {
      toast.error('Select a module first.');
      return;
    }
    try {
      const id = await createInspection({
        moduleCode: activeModule,
        title: newInspectionTitle.trim(),
        directorateCode: user.directorateCode,
      });
      setNewInspectionTitle('');
      await loadDashboard(activeModule);
      setSelectedInspectionId(id);
      toast.success('Inspection created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create inspection.');
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,182,255,0.12),transparent_35%),linear-gradient(180deg,#03040f_0%,#060818_65%,#02040c_100%)]">
      <header className="sticky top-0 z-20 border-b border-sky-500/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">DDSE Secure Command Platform</p>
            <h1 className="mt-1 text-2xl font-black text-white">Operational Command Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              {user.fullName} · {user.serviceNumber} · {user.roleCode.replaceAll('_', ' ')}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
            onClick={() => void onLogout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Secure Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="rounded-3xl border border-sky-500/10 bg-slate-950/60 p-10 text-center text-slate-300">
            Loading command posture and module workflows...
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-8">
            {/* Metrics */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summary.metrics.map((metric) => (
                <article key={metric.key} className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
                  <p className="mt-4 text-4xl font-black text-white">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{metric.trend}</p>
                </article>
              ))}
            </section>

            {/* Modules + Alerts */}
            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-sky-300" />
                  <h2 className="text-lg font-bold text-white">Operational Modules</h2>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {modules.map((mod) => (
                    <button
                      key={mod.moduleCode}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${activeModule === mod.moduleCode ? 'border-sky-400/40 bg-sky-500/10' : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'}`}
                      onClick={() => setActiveModule(mod.moduleCode)}
                      type="button"
                    >
                      <p className="text-sm font-bold text-white">{mod.title}</p>
                      <p className="mt-2 text-xs text-slate-400">{mod.classification.replaceAll('_', ' ')}</p>
                    </button>
                  ))}
                </div>
                {activeModuleDefinition?.description && (
                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                    {activeModuleDefinition.description}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <Siren className="h-5 w-5 text-rose-300" />
                  <h2 className="text-lg font-bold text-white">Alerts and Approvals</h2>
                </div>

                {summary.alerts.length === 0 && pendingApprovals.length === 0 && (
                  <p className="mt-5 text-sm text-slate-400">No active alerts or pending approvals.</p>
                )}

                <div className="mt-5 space-y-3">
                  {summary.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rose-200/70">
                        {alert.severity} · {alert.moduleCode.replaceAll('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>

                {pendingApprovals.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {pendingApprovals.map((approval) => (
                      <div key={String(approval.approvalId)} className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
                        <p className="text-sm font-semibold text-white">{String(approval.fullName)}</p>
                        <p className="mt-1 text-xs text-amber-100/80">
                          {String(approval.serviceNumber)} · {String(approval.requestedRoleCode).replaceAll('_', ' ')}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                            onClick={() =>
                              approveRegistration(String(approval.approvalId), 'approved')
                                .then(() => loadDashboard(activeModule))
                                .catch((e: Error) => toast.error(e.message))
                            }
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/30"
                            onClick={() =>
                              approveRegistration(String(approval.approvalId), 'rejected')
                                .then(() => loadDashboard(activeModule))
                                .catch((e: Error) => toast.error(e.message))
                            }
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Module Performance + Recent Activity */}
            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <h2 className="text-lg font-bold text-white">Module Performance</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {summary.moduleSummaries.map((mod) => (
                    <div key={mod.moduleCode} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-sm font-semibold text-white">{mod.moduleCode.replaceAll('_', ' ')}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <span>Inspections: {mod.inspections}</span>
                        <span>Avg score: {mod.averageScore}%</span>
                        <span>Overdue: {mod.overdue}</span>
                        <span>Corrective: {mod.openCorrectiveActions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                {summary.recentActivity.length === 0 && (
                  <p className="mt-5 text-sm text-slate-400">No recent activity.</p>
                )}
                <div className="mt-5 space-y-3">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {activity.entityType} · {activity.moduleCode?.replaceAll('_', ' ') ?? 'platform'} · {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Inspections + Detail */}
            <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-sky-300" />
                  <h2 className="text-lg font-bold text-white">Inspections</h2>
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                    placeholder={activeModuleDefinition ? `New ${activeModuleDefinition.title} inspection` : 'New inspection title'}
                    value={newInspectionTitle}
                    onChange={(e) => setNewInspectionTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateInspection(); }}
                  />
                  <button
                    className="rounded-2xl bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30"
                    onClick={() => void handleCreateInspection()}
                    type="button"
                  >
                    Create
                  </button>
                </div>

                {inspections.length === 0 && (
                  <p className="mt-5 text-sm text-slate-400">No inspections for this module yet.</p>
                )}
                <div className="mt-5 space-y-3">
                  {inspections.map((inspection) => (
                    <button
                      key={inspection._id}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedInspectionId === inspection._id ? 'border-sky-400/40 bg-sky-500/10' : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'}`}
                      onClick={() => setSelectedInspectionId(inspection._id)}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-white">{inspection.title}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {inspection.status.replaceAll('_', ' ')} · {inspection.scoreOverall}% · {inspection.riskLevel}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                {detail ? (
                  <InspectionDetailPanel
                    detail={detail}
                    onChange={async () => {
                      const refreshed = await getInspectionDetail(detail.inspection._id);
                      setDetail(refreshed as InspectionDetail);
                      await loadDashboard(activeModule);
                    }}
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center text-center text-slate-400">
                    Select an inspection to open the live checklist, evidence upload, workflow controls, and audit timeline.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function InspectionDetailPanel({
  detail,
  onChange,
}: {
  detail: InspectionDetail;
  onChange: () => Promise<void>;
}) {
  const [pendingCorrectiveAction, setPendingCorrectiveAction] = useState('');
  const [pendingFindingTitle, setPendingFindingTitle] = useState('');
  const [pendingFindingDetail, setPendingFindingDetail] = useState('');
  const [pendingReviewComment, setPendingReviewComment] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{detail.inspection.title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {detail.inspection.status.replaceAll('_', ' ')} · {detail.inspection.scoreOverall}% · {detail.inspection.complianceBand}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {VALID_STATUSES.map((status) => (
            <button
              key={status}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-500/40 hover:bg-sky-500/10"
              onClick={() =>
                transitionInspection(detail.inspection._id, status)
                  .then(onChange)
                  .catch((e: Error) => toast.error(e.message))
              }
              type="button"
            >
              → {status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Sections */}
      {detail.sections.length === 0 && (
        <p className="text-sm text-slate-400">No checklist sections defined for this inspection.</p>
      )}
      <div className="space-y-4">
        {detail.sections.map((section) => (
          <article key={section._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-lg font-bold text-white">{section.title}</h3>
            <div className="mt-4 space-y-4">
              {section.items.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-semibold text-white">{item.prompt}</p>
                  <p className="mt-1 text-xs text-slate-400">Weight: {item.weight}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_0.5fr_1fr_auto]">
                    <select
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      value={String(item.response?.responseValue ?? '')}
                      onChange={(e) =>
                        saveInspectionResponse({
                          inspectionId: detail.inspection._id,
                          sectionId: section._id,
                          itemId: item._id,
                          responseValue: e.target.value,
                          numericScore: item.responseType === 'score_5'
                            ? Number(e.target.value || 0) / 5
                            : e.target.value === 'yes' || e.target.value === 'na' ? 1 : 0,
                          immediateRisk: item.response?.immediateRisk ?? false,
                          remarks: item.response?.remarks,
                        })
                          .then(onChange)
                          .catch((err: Error) => toast.error(err.message))
                      }
                    >
                      <option value="">Select response</option>
                      {item.responseType === 'score_5'
                        ? [1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}/5</option>)
                        : ['yes', 'no', 'na'].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)
                      }
                    </select>
                    <input
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      placeholder="Severity"
                      value={item.response?.severity ?? ''}
                      onChange={(e) =>
                        saveInspectionResponse({
                          inspectionId: detail.inspection._id,
                          sectionId: section._id,
                          itemId: item._id,
                          responseValue: item.response?.responseValue ?? '',
                          numericScore: item.response?.numericScore ?? 0,
                          severity: e.target.value || undefined,
                          immediateRisk: item.response?.immediateRisk ?? false,
                          remarks: item.response?.remarks,
                        })
                          .then(onChange)
                          .catch((err: Error) => toast.error(err.message))
                      }
                    />
                    <input
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      placeholder="Remarks"
                      value={item.response?.remarks ?? ''}
                      onChange={(e) =>
                        saveInspectionResponse({
                          inspectionId: detail.inspection._id,
                          sectionId: section._id,
                          itemId: item._id,
                          responseValue: item.response?.responseValue ?? '',
                          numericScore: item.response?.numericScore ?? 0,
                          severity: item.response?.severity,
                          immediateRisk: item.response?.immediateRisk ?? false,
                          remarks: e.target.value,
                        })
                          .then(onChange)
                          .catch((err: Error) => toast.error(err.message))
                      }
                    />
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-sky-500/40">
                      <input
                        className="hidden"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          uploadEvidence(detail.inspection._id, file, section._id, item._id)
                            .then(onChange)
                            .catch((err: Error) => toast.error(err.message));
                        }}
                      />
                      Upload
                    </label>
                  </div>

                  {item.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.evidence.map((ev) => (
                        <button
                          key={ev._id}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:border-sky-500/40"
                          onClick={() =>
                            getEvidenceDownloadUrl(ev._id)
                              .then((result) => window.open(result.url, '_blank', 'noopener,noreferrer'))
                              .catch((err: Error) => toast.error(err.message))
                          }
                          type="button"
                        >
                          {ev.fileName}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      placeholder="Finding title"
                      value={pendingFindingTitle}
                      onChange={(e) => setPendingFindingTitle(e.target.value)}
                    />
                    <input
                      className="flex-[1.2] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                      placeholder="Finding detail"
                      value={pendingFindingDetail}
                      onChange={(e) => setPendingFindingDetail(e.target.value)}
                    />
                    <button
                      className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/30"
                      onClick={() => {
                        if (!pendingFindingTitle.trim()) {
                          toast.error('Enter a finding title.');
                          return;
                        }
                        createFinding({
                          inspectionId: detail.inspection._id,
                          itemId: item._id,
                          title: pendingFindingTitle.trim(),
                          detail: pendingFindingDetail.trim() || item.prompt,
                          severity: item.response?.severity || 'minor',
                        })
                          .then(() => {
                            setPendingFindingTitle('');
                            setPendingFindingDetail('');
                            return onChange();
                          })
                          .catch((err: Error) => toast.error(err.message));
                      }}
                      type="button"
                    >
                      Add Finding
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Corrective Actions */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 text-sky-300" />
          <h3 className="text-lg font-bold text-white">Corrective Actions</h3>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Describe the corrective action required"
            value={pendingCorrectiveAction}
            onChange={(e) => setPendingCorrectiveAction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pendingCorrectiveAction.trim()) {
                addCorrectiveAction(detail.inspection._id, pendingCorrectiveAction.trim(), pendingCorrectiveAction.trim())
                  .then(() => { setPendingCorrectiveAction(''); return onChange(); })
                  .catch((err: Error) => toast.error(err.message));
              }
            }}
          />
          <button
            className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30"
            onClick={() => {
              if (!pendingCorrectiveAction.trim()) return;
              addCorrectiveAction(detail.inspection._id, pendingCorrectiveAction.trim(), pendingCorrectiveAction.trim())
                .then(() => { setPendingCorrectiveAction(''); return onChange(); })
                .catch((err: Error) => toast.error(err.message));
            }}
            type="button"
          >
            Add
          </button>
        </div>
        {detail.correctiveActions.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">No corrective actions recorded.</p>
        )}
        <div className="mt-4 space-y-2">
          {detail.correctiveActions.map((ca) => (
            <div key={ca._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
              {ca.title} · <span className="text-xs text-slate-400">{ca.status}</span>
            </div>
          ))}
        </div>

        {detail.auditLogs.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs uppercase tracking-widest text-slate-500">Audit Log</p>
            {detail.auditLogs.slice(0, 8).map((log) => (
              <div key={log._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                {log.action} · {new Date(log.createdAt).toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Findings + Review Comments */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center gap-3">
          <MessageSquareCode className="h-5 w-5 text-sky-300" />
          <h3 className="text-lg font-bold text-white">Findings and Review Comments</h3>
        </div>

        {detail.findings.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">No findings recorded.</p>
        )}
        <div className="mt-4 space-y-3">
          {detail.findings.map((finding) => (
            <div key={finding._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">{finding.title}</p>
              <p className="mt-1 text-sm text-slate-300">{finding.detail}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                {finding.severity} · {finding.status}
              </p>
              <div className="mt-3 space-y-2">
                {detail.reviewComments
                  .filter((c) => c.findingId === finding._id)
                  .map((comment) => (
                    <div key={comment._id} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                      {comment.body}
                      <div className="mt-1 text-xs text-slate-500">
                        {comment.actorRoleCode} · {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Reviewer comment or decision rationale"
            value={pendingReviewComment}
            onChange={(e) => setPendingReviewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pendingReviewComment.trim()) {
                addReviewComment({ inspectionId: detail.inspection._id, body: pendingReviewComment.trim() })
                  .then(() => { setPendingReviewComment(''); return onChange(); })
                  .catch((err: Error) => toast.error(err.message));
              }
            }}
          />
          <button
            className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30"
            onClick={() => {
              if (!pendingReviewComment.trim()) return;
              addReviewComment({ inspectionId: detail.inspection._id, body: pendingReviewComment.trim() })
                .then(() => { setPendingReviewComment(''); return onChange(); })
                .catch((err: Error) => toast.error(err.message));
            }}
            type="button"
          >
            Comment
          </button>
        </div>
      </section>
    </div>
  );
}
