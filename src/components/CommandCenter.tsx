import { useEffect, useMemo, useState } from 'react';
import { FileCheck2, Layers3, LogOut, MessageSquareCode, ShieldCheck, Siren } from 'lucide-react';
import { toast } from 'sonner';
import { addCorrectiveAction, addReviewComment, approveRegistration, createFinding, createInspection, exportCommandReport, getCommandCenterSummary, getEvidenceDownloadUrl, getInspectionDetail, getModules, getPendingApprovals, listActiveSessions, listInspections, revokeOtherSessions, revokeSession, saveInspectionResponse, transitionInspection, uploadEvidence } from '../lib/api';
import type { DashboardSummary, InspectionDetail, InspectionSummary, ModuleDefinition, PlatformUser, SessionInventoryEntry } from '../types/platform';

interface CommandCenterProps {
  user: PlatformUser;
  onLogout: () => Promise<void> | void;
}

export default function CommandCenter({ user, onLogout }: CommandCenterProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [activeModule, setActiveModule] = useState('hazard_safety');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [sessions, setSessions] = useState<SessionInventoryEntry[]>([]);
  const [newInspectionTitle, setNewInspectionTitle] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    const [dashboardSummary, moduleList, inspectionList, approvals, sessionInventory] = await Promise.all([
      getCommandCenterSummary(),
      getModules(),
      listInspections(activeModule),
      getPendingApprovals().catch(() => []),
      listActiveSessions().catch(() => []),
    ]);
    setSummary(dashboardSummary);
    setModules(moduleList);
    setInspections(inspectionList);
    setPendingApprovals(approvals as any[]);
    setSessions(sessionInventory as SessionInventoryEntry[]);
  }

  useEffect(() => {
    setLoading(true);
    loadDashboard()
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [activeModule]);

  useEffect(() => {
    if (!selectedInspectionId) {
      setDetail(null);
      return;
    }
    getInspectionDetail(selectedInspectionId)
      .then((inspectionDetail) => setDetail(inspectionDetail))
      .catch((error: Error) => toast.error(error.message));
  }, [selectedInspectionId]);

  const activeModuleDefinition = useMemo(
    () => modules.find((moduleDefinition) => moduleDefinition.moduleCode === activeModule) ?? null,
    [modules, activeModule],
  );

  async function handleCreateInspection() {
    if (!newInspectionTitle.trim()) return;
    try {
      const inspectionId = await createInspection({
        moduleCode: activeModule,
        title: newInspectionTitle,
        directorateCode: user.directorateCode,
        formationCode: user.formationCode,
        unitCode: user.unitCode,
      });
      setNewInspectionTitle('');
      await loadDashboard();
      setSelectedInspectionId(inspectionId);
      toast.success('Operational inspection created.');
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
            <p className="mt-1 text-sm text-slate-400">{user.fullName} · {user.appointmentNumber} · {user.roleCode.replaceAll('_', ' ')}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20" onClick={() => void onLogout()} type="button">
            <LogOut className="h-4 w-4" />
            Secure Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && <div className="rounded-3xl border border-sky-500/10 bg-slate-950/60 p-10 text-center text-slate-300">Loading command posture and module workflows...</div>}
        {!loading && summary && (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summary.metrics.map((metric) => (
                <article key={metric.key} className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
                  <p className="mt-4 text-4xl font-black text-white">{metric.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{metric.trend}</p>
                </article>
              ))}
            </section>

            <div className="flex justify-end">
              <button
                className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100"
                onClick={() =>
                  exportCommandReport({ moduleCode: activeModule }).then((report) => {
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `ddse-command-report-${Date.now()}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    toast.success('Scoped command export generated.');
                  }).catch((error: Error) => toast.error(error.message))
                }
                type="button"
              >
                Export Scoped Report
              </button>
            </div>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-sky-300" />
                  <h2 className="text-lg font-bold text-white">Operational Modules</h2>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {modules.map((moduleDefinition) => (
                    <button key={moduleDefinition.moduleCode} className={`rounded-2xl border px-4 py-4 text-left ${activeModule === moduleDefinition.moduleCode ? 'border-sky-400/40 bg-sky-500/10' : 'border-slate-800 bg-slate-900/80'}`} onClick={() => setActiveModule(moduleDefinition.moduleCode)} type="button">
                      <p className="text-sm font-bold text-white">{moduleDefinition.title}</p>
                      <p className="mt-2 text-xs text-slate-400">{moduleDefinition.classification.replaceAll('_', ' ')}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                  {activeModuleDefinition?.description}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <Siren className="h-5 w-5 text-rose-300" />
                  <h2 className="text-lg font-bold text-white">Alerts and Approvals</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {summary.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-rose-500/15 bg-rose-500/10 p-4">
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rose-200/70">{alert.severity} · {alert.moduleCode.replaceAll('_', ' ')}</p>
                    </div>
                  ))}
                </div>
                {pendingApprovals.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.approvalId} className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
                        <p className="text-sm font-semibold text-white">{approval.fullName}</p>
                        <p className="mt-1 text-xs text-amber-100/80">{approval.appointmentNumber} · {approval.requestedRoleCode.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-amber-100/70">{approval.justification || 'No justification submitted.'}</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100"
                            onClick={() => {
                              const notes = window.prompt('Approval rationale', approval.justification || '');
                              if (!notes) return;
                              approveRegistration(approval.approvalId, 'approved', notes).then(loadDashboard);
                            }}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100"
                            onClick={() => {
                              const notes = window.prompt('Rejection rationale', '');
                              if (!notes) return;
                              approveRegistration(approval.approvalId, 'rejected', notes).then(loadDashboard);
                            }}
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

            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <h2 className="text-lg font-bold text-white">Module Performance</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {summary.moduleSummaries.map((moduleSummary) => (
                    <div key={moduleSummary.moduleCode} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-sm font-semibold text-white">{moduleSummary.moduleCode.replaceAll('_', ' ')}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <span>Inspections: {moduleSummary.inspections}</span>
                        <span>Average score: {moduleSummary.averageScore}%</span>
                        <span>Overdue: {moduleSummary.overdue}</span>
                        <span>Corrective: {moduleSummary.openCorrectiveActions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                <div className="mt-5 space-y-3">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="mt-1 text-xs text-slate-400">{activity.entityType} · {activity.moduleCode?.replaceAll('_', ' ') ?? 'platform'} · {new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <h2 className="text-lg font-bold text-white">Comparative Command View</h2>
                <div className="mt-5 space-y-4">
                  {[
                    { label: 'Directorates', rows: summary.comparisons.directorates },
                    { label: 'Formations', rows: summary.comparisons.formations },
                    { label: 'Units', rows: summary.comparisons.units },
                  ].map((group) => (
                    <div key={group.label}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{group.label}</p>
                      <div className="mt-2 space-y-2">
                        {group.rows.slice(0, 3).map((row) => (
                          <div key={row.key} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
                            <div className="flex items-center justify-between gap-3">
                              <span>{row.key}</span>
                              <span className="text-xs text-slate-400">{row.inspections} inspections · {row.averageScore}%</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Overdue {row.overdue} · High risk {row.highRisk}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">Session Inventory</h2>
                  <button className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100" onClick={() => revokeOtherSessions().then(loadDashboard)} type="button">
                    Revoke Other Sessions
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {sessions.map((session) => (
                    <div key={session.sessionId} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{session.sessionLabel || 'Operational endpoint'}{session.isCurrent ? ' · Current' : ''}</p>
                          <p className="mt-1 text-xs text-slate-400">{session.ipAddress || 'IP not captured'} · last seen {new Date(session.lastSeenAt).toLocaleString()}</p>
                        </div>
                        {!session.isCurrent && session.status === 'active' && (
                          <button className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100" onClick={() => revokeSession(session.sessionId).then(loadDashboard)} type="button">
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border border-sky-500/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-sky-300" />
                  <h2 className="text-lg font-bold text-white">Inspections</h2>
                </div>
                <div className="mt-4 flex gap-2">
                  <input className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none" placeholder={`New ${activeModuleDefinition?.title ?? 'inspection'} title`} value={newInspectionTitle} onChange={(event) => setNewInspectionTitle(event.target.value)} />
                  <button className="rounded-2xl bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100" onClick={handleCreateInspection} type="button">Create</button>
                </div>
                <div className="mt-5 space-y-3">
                  {inspections.map((inspection) => (
                    <button key={inspection._id} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedInspectionId === inspection._id ? 'border-sky-400/40 bg-sky-500/10' : 'border-slate-800 bg-slate-900/80'}`} onClick={() => setSelectedInspectionId(inspection._id)} type="button">
                      <p className="text-sm font-semibold text-white">{inspection.title}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{inspection.status.replaceAll('_', ' ')} · {inspection.scoreOverall}% · {inspection.riskLevel}</p>
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
                      setDetail(refreshed);
                      await loadDashboard();
                    }}
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center text-center text-slate-400">
                    Select an inspection to open the live checklist, evidence, workflow, and audit timeline.
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

function InspectionDetailPanel({ detail, onChange }: { detail: InspectionDetail; onChange: () => Promise<void> }) {
  const [pendingCorrectiveAction, setPendingCorrectiveAction] = useState('');
  const [pendingFindingTitle, setPendingFindingTitle] = useState('');
  const [pendingFindingDetail, setPendingFindingDetail] = useState('');
  const [pendingReviewComment, setPendingReviewComment] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{detail.inspection.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{detail.inspection.status.replaceAll('_', ' ')} · {detail.inspection.scoreOverall}% · {detail.inspection.complianceBand}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-amber-200/70">{detail.inspection.moduleCode.replaceAll('_', ' ')} · {detail.inspection.classification.replaceAll('_', ' ')}</p>
        </div>
        <div className="flex gap-2">
          {['submitted', 'in_review', 'approved', 'requires_correction', 'closed'].map((status) => (
            <button
              key={status}
              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"
              onClick={() => {
                const comments = ['approved', 'requires_correction', 'closed'].includes(status)
                  ? window.prompt('Decision rationale', '')
                  : undefined;
                if (['approved', 'requires_correction', 'closed'].includes(status) && !comments) return;
                transitionInspection(detail.inspection._id, status, comments ?? undefined).then(onChange);
              }}
              type="button"
            >
              {status.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {detail.sections.map((section) => (
          <article key={section._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <h3 className="text-lg font-bold text-white">{section.title}</h3>
            <div className="mt-4 space-y-4">
              {section.items.map((item) => (
                <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-semibold text-white">{item.prompt}</p>
                  <p className="mt-1 text-xs text-slate-400">Weight {item.weight}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_0.5fr_1fr_auto]">
                    <select className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" value={String(item.response?.responseValue ?? '')} onChange={(event) => saveInspectionResponse({ inspectionId: detail.inspection._id, sectionId: section._id, itemId: item._id, responseValue: event.target.value, numericScore: item.responseType === 'score_5' ? Number(event.target.value || 0) / 5 : event.target.value === 'yes' || event.target.value === 'na' ? 1 : 0, immediateRisk: item.response?.immediateRisk ?? false, remarks: item.response?.remarks }).then(onChange)}>
                      <option value="">Select response</option>
                      {item.responseType === 'score_5' ? [1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}/5</option>) : ['yes', 'no', 'na'].map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}
                    </select>
                    <input className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Severity" value={item.response?.severity ?? ''} onChange={(event) => saveInspectionResponse({ inspectionId: detail.inspection._id, sectionId: section._id, itemId: item._id, responseValue: item.response?.responseValue ?? '', numericScore: item.response?.numericScore ?? 0, severity: event.target.value, immediateRisk: item.response?.immediateRisk ?? false, remarks: item.response?.remarks }).then(onChange)} />
                    <input className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Remarks" value={item.response?.remarks ?? ''} onChange={(event) => saveInspectionResponse({ inspectionId: detail.inspection._id, sectionId: section._id, itemId: item._id, responseValue: item.response?.responseValue ?? '', numericScore: item.response?.numericScore ?? 0, severity: item.response?.severity, immediateRisk: item.response?.immediateRisk ?? false, remarks: event.target.value }).then(onChange)} />
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300">
                      <input className="hidden" type="file" onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        uploadEvidence(detail.inspection._id, file, section._id, item._id).then(onChange).catch((error: Error) => toast.error(error.message));
                      }} />
                      Upload
                    </label>
                  </div>
                  {item.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.evidence.map((evidence) => (
                        <div key={evidence._id} className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200"
                            onClick={() => {
                              const reason = evidence.classification !== 'official'
                                ? window.prompt('Restricted evidence access reason', '')
                                : undefined;
                              if (evidence.classification !== 'official' && !reason) return;
                              getEvidenceDownloadUrl(evidence._id, reason ?? undefined)
                                .then((result) => window.open(result.url, '_blank', 'noopener,noreferrer'))
                                .catch((error: Error) => toast.error(error.message));
                            }}
                            type="button"
                          >
                            {evidence.fileName}
                          </button>
                          <span className="rounded-xl border border-slate-700 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            {evidence.classification.replaceAll('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Finding title" value={pendingFindingTitle} onChange={(event) => setPendingFindingTitle(event.target.value)} />
                    <input className="flex-[1.2] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" placeholder="Finding detail" value={pendingFindingDetail} onChange={(event) => setPendingFindingDetail(event.target.value)} />
                    <button
                      className="rounded-xl bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100"
                      onClick={() =>
                        createFinding({
                          inspectionId: detail.inspection._id,
                          itemId: item._id,
                          title: pendingFindingTitle || `Finding for ${item.code}`,
                          detail: pendingFindingDetail || item.prompt,
                          severity: item.response?.severity || 'moderate',
                        }).then(() => {
                          setPendingFindingTitle('');
                          setPendingFindingDetail('');
                          return onChange();
                        })
                      }
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

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-5 w-5 text-sky-300" />
          <h3 className="text-lg font-bold text-white">Corrective Actions and Audit</h3>
        </div>
        <div className="mt-4 flex gap-2">
          <input className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="New corrective action" value={pendingCorrectiveAction} onChange={(event) => setPendingCorrectiveAction(event.target.value)} />
          <button className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100" onClick={() => addCorrectiveAction(detail.inspection._id, pendingCorrectiveAction, pendingCorrectiveAction).then(() => { setPendingCorrectiveAction(''); return onChange(); })} type="button">Add</button>
        </div>
        <div className="mt-4 space-y-2">
          {detail.correctiveActions.map((item) => (
            <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
              {item.title} · {item.status}
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {detail.auditLogs.slice(0, 8).map((log) => (
            <div key={log._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              {log.action} · {new Date(log.createdAt).toLocaleString()}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center gap-3">
          <MessageSquareCode className="h-5 w-5 text-sky-300" />
          <h3 className="text-lg font-bold text-white">Findings and Reviewer Comments</h3>
        </div>
        <div className="mt-4 space-y-3">
          {detail.findings.map((finding) => (
            <div key={finding._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">{finding.title}</p>
              <p className="mt-1 text-sm text-slate-300">{finding.detail}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{finding.severity} · {finding.status}</p>
              <div className="mt-3 space-y-2">
                {detail.reviewComments.filter((comment) => comment.findingId === finding._id).map((comment) => (
                  <div key={comment._id} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                    {comment.body}
                    <div className="mt-1 text-xs text-slate-500">{comment.actorRoleCode} · {new Date(comment.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Reviewer comment or decision rationale" value={pendingReviewComment} onChange={(event) => setPendingReviewComment(event.target.value)} />
          <button
            className="rounded-xl bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100"
            onClick={() =>
              addReviewComment({
                inspectionId: detail.inspection._id,
                body: pendingReviewComment,
              }).then(() => {
                setPendingReviewComment('');
                return onChange();
              })
            }
            type="button"
          >
            Comment
          </button>
        </div>
      </section>
    </div>
  );
}
