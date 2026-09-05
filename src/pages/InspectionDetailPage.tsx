// C-1: No mock dependencies. C-8: responded_by attributed server-side.
// I-5: Offline draft support. I-7: Score persisted server-side. I-15: Template version shown.

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, CheckCircle2, Tag, MessageSquare, ArrowRight, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { getInspectionDetail, saveInspectionResponse, transitionInspection } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { saveDraft } from '../lib/offlineSync';
import { STATUS_FLOW, statusLabel } from '../lib/inspectionStatus';
import type { InspectionDetail } from '../types/platform';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import OfflineDraftBanner from '../components/ui/OfflineDraftBanner';
import QuestionRenderer, { type QuestionResponse, type QuestionType } from '../components/inspection/QuestionRenderer';

// Statuses an officer (not a reviewer) is allowed to self-advance from —
// review-stage transitions (submitted → under_review/approved/rejected/…)
// are reviewer-only and enforced server-side in transition-inspection.
const OFFICER_ADVANCEABLE_STATUSES = new Set(['draft', 'in_progress', 'correction_required', 'rejected']);

function mapResponseType(raw: string): QuestionType {
  switch (raw) {
    case 'yes_no':    return 'boolean';
    case 'score_5':   return 'rating';
    case 'narrative': return 'text';
    case 'checklist': return 'select';
    default:          return (raw as QuestionType) in ['boolean','rating','text','risk','select'] ? raw as QuestionType : 'text';
  }
}

function seedResponse(responseType: string, value: unknown): QuestionResponse | undefined {
  if (value == null || value === '') return undefined;
  const type = mapResponseType(responseType);
  switch (type) {
    case 'boolean': {
      const v = String(value).toLowerCase();
      const mapped = v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'na';
      return { type: 'boolean', value: mapped };
    }
    case 'rating':
      return { type: 'rating', value: Number(value) };
    case 'text':
      return { type: 'text', value: String(value) };
    case 'risk': {
      const v = String(value).toUpperCase();
      return { type: 'risk', value: v as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' };
    }
    default:
      return { type: 'select', value: String(value) };
  }
}

type Responses = Record<string, QuestionResponse>;

const RISK_COLOR: Record<string, string> = {
  LOW:      'text-emerald-400',
  MEDIUM:   'text-amber-400',
  HIGH:     'text-rose-400',
  CRITICAL: 'text-rose-300',
};

function scoreFromResponses(responses: Responses, totalWeight: number): number {
  if (totalWeight === 0) return 0;
  let earned = 0;
  Object.values(responses).forEach((r) => {
    if (!r) return;
    if (r.type === 'boolean' && r.value === 'yes') earned += 1;
    else if (r.type === 'rating' && r.value !== null)  earned += r.value / 5;
    else if (r.type === 'risk'   && r.value === 'LOW') earned += 1;
    else if (r.type === 'select' && r.value !== null)  earned += 1;
  });
  return Math.round((earned / totalWeight) * 100);
}

function ScoreRing({ score }: { score: number }) {
  const r      = 36;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color  = score >= 80 ? '#10b981' : score >= 60 ? '#38bdf8' : score >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
        <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-black tabular-nums text-white">{score}</span>
        <span className="text-[8px] font-mono uppercase text-slate-500">score</span>
      </div>
    </div>
  );
}

export default function InspectionDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { online } = useNetworkStatus();

  const [detail,          setDetail]          = useState<InspectionDetail | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [responses,       setResponses]       = useState<Responses>({});
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loadDetail = useCallback(async (inspectionId: string, { showSpinner = false } = {}) => {
    if (showSpinner) setLoading(true);
    try {
      const d = await getInspectionDetail(inspectionId);
      const inspDetail = d as InspectionDetail;
      setDetail(inspDetail);
      setActiveSectionId((current) => current || inspDetail.sections[0]?._id || '');
      // Seed responses from existing DB data with correct type mapping (C-8)
      const existing: Responses = {};
      for (const section of inspDetail.sections) {
        for (const item of section.items) {
          if (item.response?.responseValue != null) {
            const seeded = seedResponse(item.responseType, item.response.responseValue);
            if (seeded) existing[item._id] = seeded;
          }
        }
      }
      setResponses(existing);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load inspection.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void loadDetail(id, { showSpinner: true });
  }, [id, loadDetail]);

  async function handleTransition(toStatus: string) {
    if (!id) return;
    setIsTransitioning(true);
    try {
      await transitionInspection(id, toStatus);
      await loadDetail(id);
      toast.success(`Moved to ${statusLabel(toStatus)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change status.');
    } finally {
      setIsTransitioning(false);
    }
  }

  const activeSection = useMemo(
    () => detail?.sections.find((s) => s._id === activeSectionId) ?? null,
    [detail, activeSectionId]
  );

  const allSections = detail?.sections ?? [];

  const totalWeight = useMemo(() => {
    return allSections.reduce((acc, s) =>
      acc + s.items.reduce((a, q) => a + (q.weight > 0 ? 1 : 0), 0), 0
    );
  }, [allSections]);

  const liveScore    = useMemo(() => scoreFromResponses(responses, totalWeight), [responses, totalWeight]);
  const answeredCount = useMemo(() => Object.keys(responses).length, [responses]);
  const totalQuestions = useMemo(() => allSections.reduce((acc, s) => acc + s.items.length, 0), [allSections]);

  // C-8: save response with respondent attribution. I-5: save draft offline when not connected.
  const handleResponse = useCallback(async (questionId: string, response: QuestionResponse) => {
    const next = { ...responses, [questionId]: response };
    setResponses(next);

    if (!id) return;

    if (!online) {
      // I-5: Save to IndexedDB when offline
      await saveDraft({
        type:    'inspection',
        entityId: id,
        title:   `Inspection ${id} — offline response`,
        data:    { inspectionId: id, sectionId: activeSectionId, questionId, response },
      }).catch(() => {});
      return;
    }

    try {
      await saveInspectionResponse({
        inspectionId:  id,
        sectionId:     activeSectionId,
        itemId:        questionId,
        responseValue: response.value,
        // I-7: numeric_score fed to server-side scoring engine
        numericScore:  response.type === 'rating' ? Number(response.value ?? 0) : response.value === 'yes' ? 1 : 0,
        immediateRisk: false,
      });
    } catch {
      // Non-fatal — local state is current
    }
  }, [id, activeSectionId, online, responses]);

  const sectionProgress = useCallback((sectionId: string): number => {
    const section = allSections.find((s) => s._id === sectionId);
    if (!section) return 0;
    const answered = section.items.filter((q) => responses[q._id] !== undefined).length;
    return section.items.length === 0 ? 0 : Math.round((answered / section.items.length) * 100);
  }, [allSections, responses]);

  // Super admins review submitted work on the Reviewing page — they never fill in evaluation questions.
  const isSuperAdmin = user.isPlatformOwner || user.roleCode === 'platform_owner' || user.roleCode === 'super_admin';
  if (isSuperAdmin) {
    return <Navigate to={`/inspections/reviews?inspection=${id ?? ''}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading inspection…</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ClipboardCheck className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">Inspection Not Found</h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">{id} does not match any inspection record</p>
        <button type="button" onClick={() => navigate('/inspections')}
          className="mt-6 flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Inspections
        </button>
      </div>
    );
  }

  const { inspection } = detail;
  const flow = STATUS_FLOW[inspection.status];
  const canAdvanceStatus = OFFICER_ADVANCEABLE_STATUSES.has(inspection.status);

  return (
    <div className="space-y-6">
      {/* I-5: Offline draft banner */}
      <OfflineDraftBanner
        onSync={async (draft) => {
          const d = draft.data as { inspectionId: string; sectionId: string; questionId: string; response: QuestionResponse };
          await saveInspectionResponse({
            inspectionId:  d.inspectionId,
            sectionId:     d.sectionId,
            itemId:        d.questionId,
            responseValue: d.response.value,
            numericScore:  d.response.type === 'rating' ? Number(d.response.value ?? 0) : d.response.value === 'yes' ? 1 : 0,
            immediateRisk: false,
          });
          return { entityId: d.inspectionId };
        }}
      />

      <div className="space-y-3">
        <button type="button" onClick={() => navigate('/inspections')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300">
          <ArrowLeft className="h-3 w-3" />Inspections
        </button>
        <PageHeader
          title={inspection.title}
          subtitle={`${inspection.moduleCode}`}
          action={
            <div className="flex items-center gap-2">
              {/* I-15: Template version badge */}
              {(() => {
                const tv = (inspection as Record<string, unknown>).templateVersion;
                if (!tv) return null;
                return (
                  <span className="inline-flex items-center gap-1 rounded border border-slate-700/60 bg-slate-800/30 px-2 py-0.5 text-[9px] font-mono text-slate-500">
                    <Tag className="h-2.5 w-2.5" />
                    v{String(tv)}
                  </span>
                );
              })()}
              <StatusBadge status={inspection.status} size="md" />
              {canAdvanceStatus && flow?.next && (
                <button
                  type="button"
                  disabled={isTransitioning}
                  onClick={() => void handleTransition(flow.next!)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
                >
                  {flow.nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          }
        />
      </div>

      {detail.reviewComments.length > 0 && (
        <div className={`rounded-xl border p-5 ${
          inspection.status === 'rejected' || inspection.status === 'correction_required'
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-slate-800/60 bg-slate-950/70'
        }`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            {inspection.status === 'rejected' || inspection.status === 'correction_required' ? (
              <TriangleAlert className="h-4 w-4 text-amber-400" />
            ) : (
              <MessageSquare className="h-4 w-4 text-slate-400" />
            )}
            Reviewer Feedback
          </h3>
          {(inspection.status === 'rejected' || inspection.status === 'correction_required') && (
            <p className="mt-1 text-xs text-amber-300/80">
              Address the notes below before resubmitting this evaluation.
            </p>
          )}
          <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {[...detail.reviewComments]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((comment) => (
                <div key={comment._id} className="rounded-lg border border-slate-800/60 bg-slate-950/60 p-3">
                  <p className="text-sm leading-6 text-slate-200">{comment.body}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {comment.actorRoleCode.replace(/_/g, ' ')} · {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Module',     value: inspection.moduleCode },
          { label: 'Risk Level', value: inspection.riskLevel, extraClass: RISK_COLOR[inspection.riskLevel] ?? '' },
          { label: 'Score',      value: `${inspection.scoreOverall}%` },
          { label: 'Status',     value: inspection.status },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{item.label}</p>
            <p className={`mt-0.5 text-[11px] font-mono font-bold truncate ${item.extraClass ?? 'text-slate-300'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {allSections.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-800/40">
                <ScoreRing score={liveScore} />
                <p className="text-[9px] font-mono uppercase text-slate-600">
                  {answeredCount} / {totalQuestions} questions answered
                </p>
              </div>

              <div className="pt-4 space-y-1.5">
                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Sections</p>
                {allSections.map((section) => {
                  const pct = sectionProgress(section._id);
                  const isActive = activeSectionId === section._id;
                  return (
                    <button key={section._id} type="button" onClick={() => setActiveSectionId(section._id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                        isActive ? 'border-sky-500/30 bg-sky-950/60' : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/60'
                      }`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[10px] font-bold text-slate-300 leading-snug line-clamp-1">{section.title}</p>
                        {pct === 100 && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />}
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800/60">
                        <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-[9px] font-mono text-slate-600">
                        {section.items.filter((q) => responses[q._id] !== undefined).length}/{section.items.length} answered
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeSection ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4">
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-white">{activeSection.title}</h3>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">
                    {activeSection.items.length} question{activeSection.items.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  {activeSection.items.map((question) => (
                    <QuestionRenderer
                      key={question._id}
                      question={{
                        id:       question._id,
                        code:     question.code,
                        prompt:   question.prompt,
                        type:     mapResponseType(question.responseType),
                        weight:   question.weight,
                        required: true,
                      }}
                      response={responses[question._id]}
                      onChange={(r) => void handleResponse(question._id, r)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {(() => {
                    const idx  = allSections.findIndex((s) => s._id === activeSectionId);
                    const prev = allSections[idx - 1];
                    const next = allSections[idx + 1];
                    return (
                      <>
                        <button type="button" disabled={!prev} onClick={() => prev && setActiveSectionId(prev._id)}
                          className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed">
                          ← Previous
                        </button>
                        <span className="text-[10px] font-mono text-slate-600">{idx + 1} / {allSections.length}</span>
                        <button type="button" disabled={!next} onClick={() => next && setActiveSectionId(next._id)}
                          className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 disabled:opacity-30 disabled:cursor-not-allowed">
                          Next →
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40">
                <p className="text-[11px] font-mono uppercase text-slate-600">Select a section</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 text-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-slate-700" />
          <p className="text-[11px] font-mono uppercase text-slate-600">No sections available for this inspection</p>
        </div>
      )}
    </div>
  );
}
