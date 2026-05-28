import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { MOCK_HAZARD_ASSESSMENTS, type MockHazardAssessment } from '../lib/mock-data';
import { getHazardById } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import DashboardSection from '../components/dashboard/DashboardSection';
import RiskBadge from '../components/safety/RiskBadge';
import ComplianceIndicator from '../components/safety/ComplianceIndicator';
import WorkflowBadge from '../components/safety/WorkflowBadge';
import HazardChecklist from '../components/safety/HazardChecklist';
import CorrectiveActionCard from '../components/safety/CorrectiveActionCard';
import EvidenceGallery from '../components/safety/EvidenceGallery';

export default function SafetyDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<MockHazardAssessment | null>(
    MOCK_HAZARD_ASSESSMENTS.find((a) => a.id === id) ?? null
  );

  useEffect(() => {
    if (!id) return;
    getHazardById(id)
      .then((data) => { if (data) setAssessment(data as MockHazardAssessment); })
      .catch(() => {});
  }, [id]);

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldAlert className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          Assessment Not Found
        </h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">
          {id} does not match any registered hazard assessment
        </p>
        <button
          type="button"
          onClick={() => navigate('/safety')}
          className="mt-6 flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Safety
        </button>
      </div>
    );
  }

  const passCount = assessment.checkItems.filter((i) => i.compliant === true).length;
  const total     = assessment.checkItems.length;
  const compliancePct = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/safety')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Safety Assessments
        </button>
        <PageHeader
          title={assessment.hazardTitle}
          subtitle={`${assessment.id} · ${assessment.category}`}
          action={<WorkflowBadge status={assessment.workflowStatus} size="md" />}
        />
      </div>

      {/* Section A — Hazard Overview */}
      <DashboardSection title="Hazard Overview" subtitle="Category, risk level, project linkage and inspector assignment">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left — meta grid */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
            {[
              { label: 'Assessment ID',   value: assessment.id },
              { label: 'Category',        value: assessment.category },
              { label: 'Directorate',     value: assessment.directorateCode },
              { label: 'Inspector',       value: assessment.inspector },
              { label: 'Date Raised',     value: assessment.createdAt },
              { label: 'Last Updated',    value: assessment.updatedAt },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-800/30 pb-3 last:border-0 last:pb-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 shrink-0">{row.label}</p>
                <p className="text-[11px] font-mono text-slate-300 text-right">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Right — status cards */}
          <div className="space-y-3">
            {/* Linked project */}
            <div
              onClick={() => navigate(`/projects/${assessment.projectId}`)}
              className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 cursor-pointer transition hover:bg-slate-900/40"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Linked Project</p>
              <p className="text-[13px] font-bold text-white leading-snug">{assessment.projectName}</p>
              <p className="mt-0.5 text-[10px] font-mono text-slate-500">{assessment.projectCode}</p>
            </div>

            {/* Risk + compliance + compliance meter */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Risk Level</p>
                <RiskBadge level={assessment.riskLevel} size="md" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Compliance</p>
                <ComplianceIndicator status={assessment.complianceStatus} size="md" />
              </div>

              {/* Compliance meter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Checklist Pass Rate</p>
                  <p className="text-[11px] font-mono font-bold text-slate-300">{compliancePct}%</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                  <div
                    className={`h-full rounded-full transition-all ${compliancePct >= 80 ? 'bg-emerald-500' : compliancePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${compliancePct}%` }}
                  />
                </div>
                <p className="mt-1 text-[9px] font-mono text-slate-600">{passCount} of {total} items compliant</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* Section B — Compliance Checklist */}
      <DashboardSection
        title="Compliance Checklist"
        subtitle={`${total} checklist item${total !== 1 ? 's' : ''} · ${passCount} compliant`}
      >
        <HazardChecklist items={assessment.checkItems} />
      </DashboardSection>

      {/* Section C — Observations */}
      <DashboardSection title="Inspector Observations" subtitle="Field findings recorded during site assessment">
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
          {assessment.observations ? (
            <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-line">{assessment.observations}</p>
          ) : (
            <p className="text-[11px] font-mono uppercase text-slate-600">No observations recorded</p>
          )}
        </div>
      </DashboardSection>

      {/* Section D — Evidence Panel */}
      <DashboardSection title="Evidence & Documentation" subtitle="Site photographs, incident records and supporting documents">
        <EvidenceGallery />
      </DashboardSection>

      {/* Section E — Corrective Actions */}
      <DashboardSection
        title="Corrective Actions"
        subtitle={`${assessment.correctiveActions.length} action${assessment.correctiveActions.length !== 1 ? 's' : ''} assigned`}
      >
        <CorrectiveActionCard actions={assessment.correctiveActions} />
      </DashboardSection>

      {/* Section F — Final Risk Summary */}
      <DashboardSection title="Risk Summary" subtitle="Overall assessment outcome and recommendation">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Risk Classification',
              content: <RiskBadge level={assessment.riskLevel} size="md" />,
            },
            {
              label: 'Compliance Outcome',
              content: <ComplianceIndicator status={assessment.complianceStatus} size="md" />,
            },
            {
              label: 'Workflow State',
              content: <WorkflowBadge status={assessment.workflowStatus} size="md" />,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">{card.label}</p>
              {card.content}
            </div>
          ))}
        </div>

        {/* Corrective action urgency summary */}
        {assessment.correctiveActions.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">Outstanding Actions</p>
            <div className="flex flex-wrap gap-3">
              {(['IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW'] as const).map((urgency) => {
                const pending = assessment.correctiveActions.filter(
                  (a) => a.urgency === urgency && a.status !== 'resolved'
                ).length;
                if (pending === 0) return null;
                const colors: Record<string, string> = {
                  IMMEDIATE: 'text-rose-300', HIGH: 'text-rose-400', MEDIUM: 'text-amber-400', LOW: 'text-slate-400',
                };
                return (
                  <div key={urgency} className="text-center">
                    <p className={`text-xl font-black tabular-nums ${colors[urgency]}`}>{pending}</p>
                    <p className="text-[9px] font-mono uppercase text-slate-600">{urgency.toLowerCase()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
