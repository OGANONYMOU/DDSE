import { useState } from 'react';
import {
  ChevronDown, Trash2, Paperclip, Flag, MessageSquare, Check, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  saveInspectionResponse, uploadEvidence, getEvidenceDownloadUrl,
  createFinding, addCorrectiveAction, addReviewComment, transitionInspection,
} from '../lib/api';
import { STATUS_FLOW, statusLabel, statusColor, scoreColor } from '../lib/inspectionStatus';
import type { InspectionDetail } from '../types/platform';

interface TacticalAssessmentProps {
  detail: InspectionDetail;
  onChange: () => Promise<void> | void;
}

export default function TacticalAssessment({ detail, onChange }: TacticalAssessmentProps) {
  const [activeSection, setActiveSection] = useState<string | null>(detail.sections[0]?._id ?? null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [findingDraft, setFindingDraft] = useState<Record<string, { title: string; detail: string }>>({});
  const [correctiveDraft, setCorrectiveDraft] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const flow = STATUS_FLOW[detail.inspection.status];

  async function saveResponse(
    item: typeof detail.sections[0]['items'][0],
    patch: Partial<{ responseValue: unknown; numericScore: number; severity?: string; immediateRisk: boolean; remarks?: string }>,
  ) {
    try {
      await saveInspectionResponse({
        inspectionId: detail.inspection._id,
        sectionId: activeSection ?? '',
        itemId: item._id,
        responseValue: item.response?.responseValue ?? '',
        numericScore: item.response?.numericScore ?? 0,
        immediateRisk: item.response?.immediateRisk ?? false,
        remarks: item.response?.remarks,
        severity: item.response?.severity,
        ...patch,
      });
      await onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save response');
    }
  }

  async function handleTransition(toStatus: string) {
    setIsTransitioning(true);
    try {
      await transitionInspection(detail.inspection._id, toStatus);
      await onChange();
      toast.success(`Moved to ${statusLabel(toStatus)}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change status');
    } finally {
      setIsTransitioning(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Overview bar ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{detail.inspection.title}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(detail.inspection.status)}`}>
                {statusLabel(detail.inspection.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Dossier ID: {detail.inspection._id.split(':')[0].slice(0, 8)}</p>
          </div>

          {flow?.next && (
            <button
              onClick={() => void handleTransition(flow.next!)}
              disabled={isTransitioning}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
              type="button"
            >
              {flow.nextLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-900 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Score</p>
            <p className={`mt-0.5 text-2xl font-bold tabular-nums ${scoreColor(detail.inspection.scoreOverall)}`}>
              {detail.inspection.scoreOverall}%
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Completion</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">{detail.inspection.completionPercent}%</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Risk Level</p>
            <p className={`mt-0.5 text-2xl font-bold ${detail.inspection.riskLevel === 'HIGH' ? 'text-rose-400' : detail.inspection.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {detail.inspection.riskLevel || 'LOW'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Checklist ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-sm font-semibold text-slate-300">Evaluation Checklist</h3>
        <div className="mt-4 space-y-3">
          {detail.sections.map((section) => {
            const isOpen = activeSection === section._id;
            const answered = section.items.filter((i) => i.response !== null).length;
            const pct = section.items.length > 0 ? Math.round((answered / section.items.length) * 100) : 100;

            return (
              <div key={section._id} className="overflow-hidden rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveSection(isOpen ? null : section._id)}
                  className="flex w-full items-center justify-between gap-3 bg-slate-900/50 px-4 py-3 text-left transition hover:bg-slate-900/80"
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{section.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{answered} of {section.items.length} answered</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-slate-900 bg-slate-950/50 p-4">
                    {section.items.map((item) => {
                      const isExpanded = expandedItem === item._id;
                      const draft = findingDraft[item._id] ?? { title: '', detail: '' };

                      return (
                        <div key={item._id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="flex-1 min-w-[220px] text-sm text-slate-200 leading-relaxed">
                              <span className="mr-2 text-xs font-mono text-slate-600">{item.code}.</span>
                              {item.prompt}
                            </p>

                            {/* Answer control — matched to response type */}
                            <div className="shrink-0">
                              {item.responseType === 'narrative' || item.responseType === 'checklist' ? (
                                <input
                                  className="w-56 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/50"
                                  placeholder="Type answer…"
                                  defaultValue={typeof item.response?.responseValue === 'string' ? item.response.responseValue : ''}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    void saveResponse(item, { responseValue: value, numericScore: value.trim() ? 1 : 0 });
                                  }}
                                />
                              ) : item.responseType === 'score_5' ? (
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((n) => {
                                    const active = Number(item.response?.responseValue) === n;
                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => void saveResponse(item, { responseValue: n, numericScore: n })}
                                        className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                                          active ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1">
                                  {(['yes', 'no', 'na'] as const).map((val) => {
                                    const active = item.response?.responseValue === val;
                                    return (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() => void saveResponse(item, {
                                          responseValue: val,
                                          numericScore: val === 'no' ? 0 : 1,
                                          immediateRisk: val === 'no' ? (item.response?.immediateRisk ?? false) : false,
                                        })}
                                        className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition ${
                                          active
                                            ? val === 'yes' ? 'bg-emerald-500 text-slate-950'
                                              : val === 'no' ? 'bg-rose-500 text-slate-950'
                                              : 'bg-slate-700 text-white'
                                            : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                      >
                                        {val}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Notes — always available, low emphasis */}
                          <input
                            className="mt-3 w-full rounded-lg border border-slate-900 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-slate-700"
                            placeholder="Add a note (optional)…"
                            defaultValue={item.response?.remarks ?? ''}
                            onBlur={(e) => void saveResponse(item, { remarks: e.target.value })}
                          />

                          {/* Secondary actions — collapsed by default */}
                          <div className="mt-2 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setExpandedItem(isExpanded ? null : item._id)}
                              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-300"
                            >
                              <Flag className="h-3 w-3" /> Flag an issue
                            </button>
                            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-300">
                              <Paperclip className="h-3 w-3" /> Attach evidence
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    await uploadEvidence(detail.inspection._id, file, section._id, item._id);
                                    await onChange();
                                    toast.success('Evidence attached.');
                                  } catch {
                                    toast.error('Upload failed.');
                                  }
                                }}
                              />
                            </label>
                            {item.evidence.map((ev) => (
                              <button
                                key={ev._id}
                                type="button"
                                onClick={async () => {
                                  const urlObj = await getEvidenceDownloadUrl(ev._id);
                                  window.open(urlObj.url, '_blank');
                                }}
                                className="text-[11px] text-sky-400 hover:underline"
                              >
                                {ev.fileName}
                              </button>
                            ))}
                          </div>

                          {isExpanded && (
                            <div className="mt-3 space-y-2 rounded-lg border border-rose-900/40 bg-rose-950/10 p-3">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  className="rounded-lg border border-rose-900/30 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                  placeholder="What's wrong?"
                                  value={draft.title}
                                  onChange={(e) => setFindingDraft((prev) => ({ ...prev, [item._id]: { ...draft, title: e.target.value } }))}
                                />
                                <input
                                  className="rounded-lg border border-rose-900/30 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none"
                                  placeholder="Details (optional)"
                                  value={draft.detail}
                                  onChange={(e) => setFindingDraft((prev) => ({ ...prev, [item._id]: { ...draft, detail: e.target.value } }))}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!draft.title.trim()) { toast.error('Describe the issue first.'); return; }
                                  try {
                                    await createFinding({
                                      inspectionId: detail.inspection._id,
                                      itemId: item._id,
                                      title: draft.title.trim(),
                                      detail: draft.detail.trim() || item.prompt,
                                      severity: 'minor',
                                    });
                                    setFindingDraft((prev) => ({ ...prev, [item._id]: { title: '', detail: '' } }));
                                    setExpandedItem(null);
                                    await onChange();
                                    toast.success('Finding logged.');
                                  } catch {
                                    toast.error('Could not log finding.');
                                  }
                                }}
                                className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                              >
                                Log Finding
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Corrective actions + Review notes ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-sm font-semibold text-slate-300">Corrective Actions</h3>
          <div className="mt-3 space-y-2">
            <textarea
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              placeholder="Describe a corrective task…"
              rows={2}
              value={correctiveDraft}
              onChange={(e) => setCorrectiveDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                if (!correctiveDraft.trim()) return;
                try {
                  await addCorrectiveAction(detail.inspection._id, correctiveDraft.trim(), correctiveDraft.trim());
                  setCorrectiveDraft('');
                  await onChange();
                  toast.success('Corrective action logged.');
                } catch {
                  toast.error('Failed to add action.');
                }
              }}
              className="w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Log Action
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {detail.correctiveActions.length === 0 ? (
              <p className="text-center text-xs text-slate-600">No corrective actions logged.</p>
            ) : (
              detail.correctiveActions.map((ca) => (
                <div key={ca._id} className="flex items-center justify-between rounded-lg border border-slate-900 bg-slate-900/40 p-3">
                  <p className="text-sm text-slate-300">{ca.title}</p>
                  <span className="shrink-0 text-[11px] uppercase text-slate-500">{ca.status.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <MessageSquare className="h-4 w-4" /> Review Notes
          </h3>
          <div className="mt-3 space-y-2">
            <textarea
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              placeholder="Add a review comment…"
              rows={2}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                if (!commentDraft.trim()) return;
                try {
                  await addReviewComment({ inspectionId: detail.inspection._id, body: commentDraft.trim() });
                  setCommentDraft('');
                  await onChange();
                  toast.success('Comment added.');
                } catch {
                  toast.error('Failed to add comment.');
                }
              }}
              className="w-full rounded-lg bg-sky-500/15 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/25"
            >
              Post Comment
            </button>
          </div>

          <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto">
            {detail.reviewComments.length === 0 ? (
              <p className="text-center text-xs text-slate-600">No comments yet.</p>
            ) : (
              detail.reviewComments.map((comment) => (
                <div key={comment._id} className="rounded-lg border border-slate-900 bg-slate-900/40 p-3">
                  <p className="text-sm text-slate-300">{comment.body}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
                    {comment.resolvedAt && <Check className="h-3 w-3 text-emerald-500" />}
                    {comment.actorRoleCode.replace(/_/g, ' ')} · {new Date(comment.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Findings ── */}
      {detail.findings.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Trash2 className="h-4 w-4 text-rose-400" /> Findings ({detail.findings.length})
          </h3>
          <div className="mt-3 space-y-2">
            {detail.findings.map((f) => (
              <div key={f._id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-900 bg-slate-900/40 p-3">
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  {f.detail && <p className="mt-0.5 text-xs text-slate-500">{f.detail}</p>}
                </div>
                <span className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
