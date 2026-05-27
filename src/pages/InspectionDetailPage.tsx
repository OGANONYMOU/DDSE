import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, CheckCircle2 } from 'lucide-react';

import { MOCK_INSPECTIONS, MOCK_INSPECTION_TEMPLATES } from '../lib/mock-data';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import QuestionRenderer, { type QuestionResponse } from '../components/inspection/QuestionRenderer';

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
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#38bdf8' : score >= 40 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center">
      <svg width={96} height={96} className="-rotate-90">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
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

  const inspection = useMemo(
    () => MOCK_INSPECTIONS.find((i) => i.id === id) ?? null,
    [id]
  );

  const template = useMemo(
    () => (inspection ? (MOCK_INSPECTION_TEMPLATES[inspection.moduleCode] ?? null) : null),
    [inspection]
  );

  const [responses,      setResponses]      = useState<Responses>({});
  const [activeSectionId, setActiveSectionId] = useState<string>(
    template?.sections[0]?.id ?? ''
  );

  const activeSection = useMemo(
    () => template?.sections.find((s) => s.id === activeSectionId) ?? null,
    [template, activeSectionId]
  );

  const totalWeight = useMemo(() => {
    if (!template) return 1;
    return template.sections.reduce((acc, s) =>
      acc + s.questions.reduce((a, q) => a + (q.weight > 0 ? 1 : 0), 0), 0
    );
  }, [template]);

  const liveScore = useMemo(
    () => scoreFromResponses(responses, totalWeight),
    [responses, totalWeight]
  );

  const answeredCount = useMemo(() => Object.keys(responses).length, [responses]);
  const totalQuestions = useMemo(() => {
    if (!template) return 0;
    return template.sections.reduce((acc, s) => acc + s.questions.length, 0);
  }, [template]);

  const handleResponse = useCallback((questionId: string, response: QuestionResponse) => {
    setResponses((prev) => ({ ...prev, [questionId]: response }));
  }, []);

  const sectionProgress = useCallback((sectionId: string): number => {
    const section = template?.sections.find((s) => s.id === sectionId);
    if (!section) return 0;
    const answered = section.questions.filter((q) => responses[q.id] !== undefined).length;
    return section.questions.length === 0 ? 0 : Math.round((answered / section.questions.length) * 100);
  }, [template, responses]);

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ClipboardCheck className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          Inspection Not Found
        </h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">
          {id} does not match any inspection record
        </p>
        <button
          type="button"
          onClick={() => navigate('/inspections')}
          className="mt-6 flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Inspections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/inspections')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Inspections
        </button>
        <PageHeader
          title={inspection.title}
          subtitle={`${inspection.projectCode} · ${inspection.moduleCode}`}
          action={<StatusBadge status={inspection.status} size="md" />}
        />
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Project',    value: inspection.projectName },
          { label: 'Inspector',  value: inspection.inspector },
          { label: 'Risk Level', value: inspection.riskLevel, extraClass: RISK_COLOR[inspection.riskLevel] },
          { label: 'Updated',    value: inspection.updatedAt },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{item.label}</p>
            <p className={`mt-0.5 text-[11px] font-mono font-bold truncate ${item.extraClass ?? 'text-slate-300'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {template ? (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left — score + section nav */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
              {/* Score ring */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-800/40">
                <ScoreRing score={liveScore} />
                <div className="text-center">
                  <p className="text-[9px] font-mono uppercase text-slate-600">
                    {answeredCount} / {totalQuestions} questions answered
                  </p>
                </div>
              </div>

              {/* Section navigation */}
              <div className="pt-4 space-y-1.5">
                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                  Sections
                </p>
                {template.sections.map((section) => {
                  const pct = sectionProgress(section.id);
                  const isActive = activeSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? 'border-sky-500/30 bg-sky-950/60'
                          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-[10px] font-bold text-slate-300 leading-snug line-clamp-1">
                          {section.title}
                        </p>
                        {pct === 100 && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                        )}
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800/60">
                        <div
                          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[9px] font-mono text-slate-600">
                        {section.questions.filter((q) => responses[q.id] !== undefined).length}/{section.questions.length} answered
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — active section questions */}
          <div className="lg:col-span-8">
            {activeSection ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4">
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-white">
                    {activeSection.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">
                    {activeSection.questions.length} question{activeSection.questions.length !== 1 ? 's' : ''} · {activeSection.questions.filter((q) => q.required).length} required
                  </p>
                </div>

                <div className="space-y-3">
                  {activeSection.questions.map((question) => (
                    <QuestionRenderer
                      key={question.id}
                      question={question}
                      response={responses[question.id]}
                      onChange={(r) => handleResponse(question.id, r)}
                    />
                  ))}
                </div>

                {/* Section navigation buttons */}
                <div className="flex items-center justify-between pt-2">
                  {(() => {
                    const idx = template.sections.findIndex((s) => s.id === activeSectionId);
                    const prev = template.sections[idx - 1];
                    const next = template.sections[idx + 1];
                    return (
                      <>
                        <button
                          type="button"
                          disabled={!prev}
                          onClick={() => prev && setActiveSectionId(prev.id)}
                          className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Previous
                        </button>
                        <span className="text-[10px] font-mono text-slate-600">
                          {template.sections.findIndex((s) => s.id === activeSectionId) + 1} / {template.sections.length}
                        </span>
                        <button
                          type="button"
                          disabled={!next}
                          onClick={() => next && setActiveSectionId(next.id)}
                          className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
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
          <p className="text-[11px] font-mono uppercase text-slate-600">
            No template available for module {inspection.moduleCode}
          </p>
        </div>
      )}
    </div>
  );
}
