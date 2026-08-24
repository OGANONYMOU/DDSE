import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquare,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { getInspectionDetail, getModules, listInspections, transitionInspection } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import { scoreColor, statusColor, statusLabel } from '../lib/inspectionStatus';
import PageHeader from '../components/ui/PageHeader';
import type { InspectionDetail, InspectionSummary, ModuleDefinition } from '../types/platform';

const SUBMITTED_STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'completed'];
const PENDING_STATUSES = ['submitted', 'under_review'];

type StatusFilter = 'all' | 'pending' | 'approved' | 'correction_required' | 'rejected';

function timeAgo(ts: number): string {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatResponseValue(item: InspectionDetail['sections'][number]['items'][number]): string {
  const value = item.response?.responseValue;
  if (value == null || value === '') return 'No response';
  if (item.responseType === 'score_5') return `${value} / 5`;
  return String(value).replace(/_/g, ' ');
}

function responseTone(item: InspectionDetail['sections'][number]['items'][number]): string {
  const value = String(item.response?.responseValue ?? '').toLowerCase();
  if (!item.response) return 'border-slate-800/80 bg-slate-900/40 text-slate-500';
  if (value === 'yes') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
  if (value === 'no') return 'border-rose-500/25 bg-rose-500/10 text-rose-300';
  return 'border-sky-500/25 bg-sky-500/10 text-sky-300';
}

export default function InspectionReviewsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialInspectionId = searchParams.get('inspection');

  const canView = hasPermission(user.roleCode, 'inspections.view_all') ||
    user.isPlatformOwner ||
    user.roleCode === 'platform_owner' ||
    user.roleCode === 'super_admin';
  const canReview = hasPermission(user.roleCode, 'inspections.approve_major') ||
    hasPermission(user.roleCode, 'inspections.approve_local') ||
    user.isPlatformOwner ||
    user.roleCode === 'platform_owner' ||
    user.roleCode === 'super_admin';

  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialInspectionId);
  const [detail, setDetail] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [moduleRows, inspectionRows] = await Promise.all([
        getModules(),
        listInspections(moduleFilter || undefined),
      ]);

      const normalizedModules = (moduleRows as unknown as Array<Record<string, unknown>>).map((m) => ({
        id: String(m.id ?? m.code ?? ''),
        moduleCode: String(m.moduleCode ?? m.code ?? ''),
        title: String(m.title ?? m.label ?? ''),
        classification: String(m.classification ?? 'general'),
        description: String(m.description ?? ''),
      }));

      const normalizedInspections = (inspectionRows as unknown as Array<Record<string, unknown>>)
        .map((i) => ({
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
          createdBy: i.createdBy ? String(i.createdBy) : undefined,
          createdAt: Number(i.createdAt ?? 0),
          updatedAt: Number(i.updatedAt ?? 0),
        }))
        .filter((inspection) => SUBMITTED_STATUSES.includes(inspection.status))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      setModules(normalizedModules);
      setInspections(normalizedInspections);

      setSelectedId((current) => current || normalizedInspections[0]?._id || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load submitted evaluations.');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => {
    if (!canView) return;
    void load();
  }, [canView, load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    getInspectionDetail(selectedId)
      .then((next) => {
        if (!cancelled) {
          setDetail(next as InspectionDetail);
          setReviewNote('');
        }
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedId]);

  const moduleTitleByCode = useMemo(
    () => Object.fromEntries(modules.map((module) => [module.moduleCode, module.title])),
    [modules],
  );

  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      if (statusFilter === 'pending') return PENDING_STATUSES.includes(inspection.status);
      if (statusFilter === 'all') return true;
      return inspection.status === statusFilter;
    });
  }, [inspections, statusFilter]);

  const counts = useMemo(() => ({
    all: inspections.length,
    pending: inspections.filter((inspection) => PENDING_STATUSES.includes(inspection.status)).length,
    approved: inspections.filter((inspection) => inspection.status === 'approved' || inspection.status === 'completed').length,
    correction: inspections.filter((inspection) => inspection.status === 'correction_required').length,
    rejected: inspections.filter((inspection) => inspection.status === 'rejected').length,
  }), [inspections]);

  async function refreshSelected() {
    if (!selectedId) return;
    const nextDetail = await getInspectionDetail(selectedId);
    setDetail(nextDetail as InspectionDetail);
    await load();
  }

  async function handleDecision(toStatus: 'approved' | 'rejected' | 'correction_required' | 'under_review') {
    if (!detail || !canReview) return;
    const note = reviewNote.trim();
    if ((toStatus === 'rejected' || toStatus === 'correction_required') && !note) {
      toast.error('Add a review note before declining or requesting correction.');
      return;
    }

    setActing(toStatus);
    try {
      await transitionInspection(detail.inspection._id, toStatus, note || undefined);
      await refreshSelected();
      toast.success(
        toStatus === 'approved'
          ? 'Evaluation approved.'
          : toStatus === 'correction_required'
          ? 'Correction request sent.'
          : toStatus === 'under_review'
          ? 'Review started.'
          : 'Evaluation declined.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update evaluation.');
    } finally {
      setActing(null);
    }
  }

  if (!canView) return <Navigate to="/access-denied" replace />;

  const canTakeDecision = canReview && detail && PENDING_STATUSES.includes(detail.inspection.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspection Reviewing"
        subtitle="Submitted evaluations and reviewer decisions"
        action={
          <NavLink
            to="/inspections/questions"
            className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
          >
            Questions
          </NavLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Submitted', value: counts.all, tone: 'text-slate-200' },
          { label: 'Pending', value: counts.pending, tone: 'text-amber-300' },
          { label: 'Approved', value: counts.approved, tone: 'text-emerald-300' },
          { label: 'Corrections', value: counts.correction, tone: 'text-sky-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{item.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Department</p>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setSelectedId(null);
              }}
              className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All Departments</option>
              {modules.map((module) => (
                <option key={module.moduleCode} value={module.moduleCode}>{module.title}</option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'correction_required', label: 'Correction' },
                { value: 'rejected', label: 'Declined' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value as StatusFilter)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    statusFilter === filter.value
                      ? 'border-sky-500/35 bg-sky-500/15 text-sky-300'
                      : 'border-slate-800/60 bg-slate-900/30 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ClipboardCheck className="h-3.5 w-3.5" /> Evaluations
              </p>
              <span className="text-xs text-slate-600">{filteredInspections.length}</span>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <ClipboardCheck className="h-7 w-7 animate-pulse text-sky-400/40" />
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800/70 py-8 text-center">
                <p className="text-sm text-slate-600">No submitted evaluations found.</p>
              </div>
            ) : (
              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {filteredInspections.map((inspection) => {
                  const isActive = selectedId === inspection._id;
                  return (
                    <button
                      key={inspection._id}
                      type="button"
                      onClick={() => setSelectedId(inspection._id)}
                      className={`w-full rounded-lg border p-3.5 text-left transition ${
                        isActive
                          ? 'border-sky-500/40 bg-sky-950/50'
                          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium text-slate-500">
                          {moduleTitleByCode[inspection.moduleCode] ?? inspection.moduleCode}
                        </span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(inspection.status)}`}>
                          {statusLabel(inspection.status)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-white">{inspection.title}</p>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/40 pt-2 text-xs text-slate-500">
                        <span className={`font-semibold ${scoreColor(inspection.scoreOverall)}`}>{inspection.scoreOverall}% score</span>
                        <span>{timeAgo(inspection.updatedAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {detailLoading ? (
            <div className="flex h-[620px] items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/70">
              <ShieldCheck className="h-8 w-8 animate-pulse text-emerald-400/40" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{detail.inspection.title}</h2>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(detail.inspection.status)}`}>
                        {statusLabel(detail.inspection.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{detail.inspection.moduleCode}</p>
                  </div>
                  {detail.inspection.status === 'submitted' && canReview && (
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => void handleDecision('under_review')}
                      className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 disabled:opacity-40"
                    >
                      Begin Review
                    </button>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800/50 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Score</p>
                    <p className={`mt-1 text-2xl font-black tabular-nums ${scoreColor(detail.inspection.scoreOverall)}`}>
                      {detail.inspection.scoreOverall}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Completion</p>
                    <p className="mt-1 text-2xl font-black tabular-nums text-white">{detail.inspection.completionPercent}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Risk</p>
                    <p className="mt-1 text-2xl font-black text-amber-300">{detail.inspection.riskLevel}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <ShieldCheck className="h-4 w-4" /> Reviewer Decision
                </h3>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Required for decline or correction. Keep it specific so the officer knows what to fix."
                  className="mt-3 w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
                />
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={!canTakeDecision || acting !== null}
                    onClick={() => void handleDecision('approved')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold uppercase text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={!canTakeDecision || acting !== null}
                    onClick={() => void handleDecision('correction_required')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TriangleAlert className="h-4 w-4" />
                    Correction
                  </button>
                  <button
                    type="button"
                    disabled={!canTakeDecision || acting !== null}
                    onClick={() => void handleDecision('rejected')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <FileText className="h-4 w-4" /> Submitted Responses
                </h3>
                <div className="mt-4 space-y-4">
                  {detail.sections.map((section) => (
                    <div key={section._id} className="rounded-xl border border-slate-800/60 bg-slate-950/80">
                      <div className="border-b border-slate-800/60 px-4 py-3">
                        <p className="text-sm font-semibold text-white">{section.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{section.items.length} questions</p>
                      </div>
                      <div className="space-y-3 p-4">
                        {section.items.map((item) => (
                          <div key={item._id} className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="min-w-[220px] flex-1 text-sm leading-6 text-slate-200">
                                <span className="mr-2 text-xs font-mono text-slate-600">{item.code}.</span>
                                {item.prompt}
                              </p>
                              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${responseTone(item)}`}>
                                {formatResponseValue(item)}
                              </span>
                            </div>
                            {item.response?.remarks && (
                              <p className="mt-2 rounded-lg border border-slate-800/60 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-slate-400">
                                {item.response.remarks}
                              </p>
                            )}
                            {item.evidence.length > 0 && (
                              <p className="mt-2 text-[11px] text-slate-500">{item.evidence.length} evidence file(s) attached</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                  <h3 className="text-sm font-semibold text-slate-300">Findings</h3>
                  <div className="mt-3 space-y-2">
                    {detail.findings.length === 0 ? (
                      <p className="text-sm text-slate-600">No findings logged.</p>
                    ) : detail.findings.map((finding) => (
                      <div key={finding._id} className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-3">
                        <p className="text-sm font-semibold text-white">{finding.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{finding.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                  <h3 className="text-sm font-semibold text-slate-300">Corrective Actions</h3>
                  <div className="mt-3 space-y-2">
                    {detail.correctiveActions.length === 0 ? (
                      <p className="text-sm text-slate-600">No corrective actions logged.</p>
                    ) : detail.correctiveActions.map((action) => (
                      <div key={action._id} className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{action.title}</p>
                          <span className="text-[10px] font-bold uppercase text-slate-500">{action.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{action.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <MessageSquare className="h-4 w-4" /> Review Notes
                </h3>
                <div className="mt-3 space-y-2">
                  {detail.reviewComments.length === 0 ? (
                    <p className="text-sm text-slate-600">No review notes yet.</p>
                  ) : (
                    [...detail.reviewComments]
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((comment) => (
                        <div key={comment._id} className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-3">
                          <p className="text-sm leading-6 text-slate-300">{comment.body}</p>
                          <p className="mt-1 text-[11px] text-slate-600">
                            {comment.actorRoleCode.replace(/_/g, ' ')} · {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[620px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 text-center">
              <ShieldCheck className="h-12 w-12 text-emerald-500/20" />
              <div>
                <p className="text-sm font-semibold text-slate-400">Select an evaluation</p>
                <p className="mt-1 text-sm text-slate-600">Submitted inspections appear in the review queue.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
