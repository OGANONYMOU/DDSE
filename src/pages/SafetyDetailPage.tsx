import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  getHazardDetail,
  updateHazardFields,
  updateHazardWorkflow,
  addCheckItem,
  updateCheckItem,
  addCorrectiveAction,
  startCorrectiveAction,
  closeCorrectiveAction,
  escalateHazard,
} from '../services/safety';
import type { HazardDetail, SafetyRiskLevel, ComplianceStatus, SafetyWorkflow, HazardCorrectiveAction } from '../types/safety';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import DashboardSection from '../components/dashboard/DashboardSection';
import RiskBadge from '../components/safety/RiskBadge';
import ComplianceIndicator from '../components/safety/ComplianceIndicator';
import WorkflowBadge from '../components/safety/WorkflowBadge';
import HazardChecklist from '../components/safety/HazardChecklist';
import CorrectiveActionCard from '../components/safety/CorrectiveActionCard';
import EvidenceGallery from '../components/safety/EvidenceGallery';
import EscalationPanel from '../components/safety/EscalationPanel';
import { isAdminOrAbove } from '../lib/rbac';

const RISK_LEVELS: SafetyRiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
const COMPLIANCE_STATUSES: ComplianceStatus[] = ['compliant', 'partial', 'non_compliant', 'under_review'];
const WORKFLOW_STATUSES: SafetyWorkflow[] = ['open', 'investigating', 'action_required', 'escalated', 'resolved', 'closed'];
const URGENCY_LEVELS: HazardCorrectiveAction['urgency'][] = ['LOW', 'MEDIUM', 'HIGH', 'IMMEDIATE'];

const selectClass = 'w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white outline-none focus:border-sky-500/40';

export default function SafetyDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail,  setDetail]  = useState<HazardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [showNewAction, setShowNewAction] = useState(false);
  const [newAction, setNewAction] = useState({ recommendation: '', department: '', urgency: 'MEDIUM' as HazardCorrectiveAction['urgency'], dueDate: '' });

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getHazardDetail(id)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading assessment…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldAlert className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          {error ? 'Failed to load assessment' : 'Assessment Not Found'}
        </h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">
          {error ?? `${id} does not match any registered hazard assessment`}
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

  const { assessment, checkItems, correctiveActions, escalations } = detail;
  const passCount     = checkItems.filter((i) => i.compliant === true).length;
  const total         = checkItems.length;
  const compliancePct = total > 0 ? Math.round((passCount / total) * 100) : 0;

  // Mirrors `hazards_update` RLS: admin-or-above, same-directorate safety/inspection officer, or the creator.
  const canEvaluate = isAdminOrAbove(user.roleCode, user.isPlatformOwner)
    || (assessment.directorateCode === user.directorateCode && ['safety_officer', 'inspection_officer'].includes(user.roleCode))
    || assessment.createdBy === user.id;

  // Mirrors `hazard_ca_write` RLS: admin-or-above, or anyone in the same directorate.
  const canManageActions = isAdminOrAbove(user.roleCode, user.isPlatformOwner)
    || assessment.directorateCode === user.directorateCode;

  // Mirrors `hazard_escalations_write` RLS: admin-or-above, or same-directorate safety officer/commander/director.
  const canEscalate = isAdminOrAbove(user.roleCode, user.isPlatformOwner)
    || (assessment.directorateCode === user.directorateCode && ['safety_officer', 'commander', 'director'].includes(user.roleCode));

  async function handleRiskChange(riskLevel: SafetyRiskLevel) {
    try {
      await updateHazardFields(assessment.id, { riskLevel }, user.id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update risk level.');
    }
  }

  async function handleComplianceChange(complianceStatus: ComplianceStatus) {
    try {
      await updateHazardFields(assessment.id, { complianceStatus }, user.id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update compliance status.');
    }
  }

  async function handleWorkflowChange(workflowStatus: SafetyWorkflow) {
    try {
      await updateHazardWorkflow(assessment.id, workflowStatus, user.id);
      toast.success('Workflow status updated.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update workflow status.');
    }
  }

  async function handleCheckChange(itemId: string, value: boolean | null) {
    try {
      await updateCheckItem(itemId, { compliant: value }, user.id);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update checklist item.');
    }
  }

  async function handleAddCheckItem(prompt: string) {
    try {
      await addCheckItem(assessment.id, prompt, checkItems.length);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add checklist item.');
    }
  }

  async function handleCreateAction() {
    if (!newAction.recommendation.trim()) { toast.error('Enter a recommendation.'); return; }
    try {
      await addCorrectiveAction(assessment.id, {
        recommendation: newAction.recommendation.trim(),
        department:     newAction.department.trim() || null,
        urgency:        newAction.urgency,
        dueDate:        newAction.dueDate || null,
      }, user.id);
      toast.success('Corrective action added.');
      setShowNewAction(false);
      setNewAction({ recommendation: '', department: '', urgency: 'MEDIUM', dueDate: '' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add corrective action.');
    }
  }

  async function handleStartAction(actionId: string) {
    try {
      await startCorrectiveAction(actionId);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update action.');
    }
  }

  async function handleResolveAction(actionId: string, notes: string, evidence: string) {
    try {
      await closeCorrectiveAction(actionId, {
        completedBy:          user.id,
        verificationEvidence: evidence,
        verifiedBy:           user.id,
        verificationNotes:    notes,
      });
      toast.success('Corrective action resolved and verified.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resolve action.');
    }
  }

  async function handleEscalate(toRole: string, reason: string) {
    try {
      await escalateHazard(assessment.id, { escalatedToRole: toRole, reason }, user.id);
      toast.success('Hazard escalated.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not escalate hazard.');
    }
  }

  return (
    <div className="space-y-8">
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
          subtitle={`${assessment.category}`}
          action={
            canEvaluate ? (
              <select
                value={assessment.workflowStatus}
                onChange={(e) => void handleWorkflowChange(e.target.value as SafetyWorkflow)}
                className={`${selectClass} w-auto`}
                style={{ colorScheme: 'dark' }}
              >
                {WORKFLOW_STATUSES.map((w) => <option key={w} value={w}>{w.replace(/_/g, ' ')}</option>)}
              </select>
            ) : (
              <WorkflowBadge status={assessment.workflowStatus} size="md" />
            )
          }
        />
      </div>

      <DashboardSection title="Hazard Overview" subtitle="Category, risk level, project linkage and inspector assignment">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
            {[
              { label: 'Category',     value: assessment.category },
              { label: 'Directorate',  value: assessment.directorateCode },
              { label: 'Inspector',    value: assessment.inspectorName ?? '—' },
              { label: 'Date Raised',  value: assessment.createdAt.split('T')[0] },
              { label: 'Last Updated', value: assessment.updatedAt.split('T')[0] },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-800/30 pb-3 last:border-0 last:pb-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 shrink-0">{row.label}</p>
                <p className="text-[11px] font-mono text-slate-300 text-right">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {assessment.projectId && (
              <div
                onClick={() => navigate(`/projects/${assessment.projectId}`)}
                className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 cursor-pointer transition hover:bg-slate-900/40"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Linked Project</p>
                <p className="text-[13px] font-bold text-white leading-snug">{assessment.projectName}</p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-500">{assessment.projectCode}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 shrink-0">Risk Level</p>
                {canEvaluate ? (
                  <select
                    value={assessment.riskLevel}
                    onChange={(e) => void handleRiskChange(e.target.value as SafetyRiskLevel)}
                    className={`${selectClass} w-auto`}
                    style={{ colorScheme: 'dark' }}
                  >
                    {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <RiskBadge level={assessment.riskLevel} size="md" />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 shrink-0">Compliance</p>
                {canEvaluate ? (
                  <select
                    value={assessment.complianceStatus}
                    onChange={(e) => void handleComplianceChange(e.target.value as ComplianceStatus)}
                    className={`${selectClass} w-auto`}
                    style={{ colorScheme: 'dark' }}
                  >
                    {COMPLIANCE_STATUSES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                ) : (
                  <ComplianceIndicator status={assessment.complianceStatus} size="md" />
                )}
              </div>
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

      <DashboardSection
        title="Compliance Checklist"
        subtitle={`${total} checklist item${total !== 1 ? 's' : ''} · ${passCount} compliant — evaluate this hazard against each item`}
      >
        <HazardChecklist
          items={checkItems}
          editable={canEvaluate}
          onChange={(itemId, value) => void handleCheckChange(itemId, value)}
          onAdd={(prompt) => void handleAddCheckItem(prompt)}
        />
      </DashboardSection>

      <DashboardSection title="Inspector Observations" subtitle="Field findings recorded during site assessment">
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
          {assessment.observations ? (
            <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-line">{assessment.observations}</p>
          ) : (
            <p className="text-[11px] font-mono uppercase text-slate-600">No observations recorded</p>
          )}
        </div>
      </DashboardSection>

      <DashboardSection title="Evidence & Documentation" subtitle="Site photographs, incident records and supporting documents">
        <EvidenceGallery />
      </DashboardSection>

      <DashboardSection
        title="Corrective Actions"
        subtitle={`${correctiveActions.length} action${correctiveActions.length !== 1 ? 's' : ''} assigned — manage the hazard to closure`}
      >
        <div className="space-y-4">
          {canManageActions && !showNewAction && (
            <button
              type="button"
              onClick={() => setShowNewAction(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
            >
              <Plus className="h-3.5 w-3.5" />
              New Action
            </button>
          )}
          {showNewAction && canManageActions && (
            <div className="rounded-xl border border-sky-500/20 bg-slate-950/70 p-4 space-y-3">
              <textarea
                value={newAction.recommendation}
                onChange={(e) => setNewAction((v) => ({ ...v, recommendation: e.target.value }))}
                rows={2}
                placeholder="Recommended corrective action…"
                className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={newAction.department}
                  onChange={(e) => setNewAction((v) => ({ ...v, department: e.target.value }))}
                  placeholder="Department"
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
                />
                <select
                  value={newAction.urgency}
                  onChange={(e) => setNewAction((v) => ({ ...v, urgency: e.target.value as HazardCorrectiveAction['urgency'] }))}
                  className={selectClass}
                  style={{ colorScheme: 'dark' }}
                >
                  {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  type="date"
                  value={newAction.dueDate}
                  onChange={(e) => setNewAction((v) => ({ ...v, dueDate: e.target.value }))}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] text-white outline-none focus:border-sky-500/40"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAction(false)}
                  className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateAction()}
                  className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
                >
                  Add Action
                </button>
              </div>
            </div>
          )}
          <CorrectiveActionCard
            actions={correctiveActions}
            canManage={canManageActions}
            onStart={(actionId) => void handleStartAction(actionId)}
            onResolve={(actionId, notes, evidence) => void handleResolveAction(actionId, notes, evidence)}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Escalations"
        subtitle={`${escalations.length} escalation${escalations.length !== 1 ? 's' : ''} — raise unresolved critical hazards to command`}
      >
        <EscalationPanel
          escalations={escalations}
          canEscalate={canEscalate}
          onEscalate={(toRole, reason) => void handleEscalate(toRole, reason)}
        />
      </DashboardSection>

      <DashboardSection title="Risk Summary" subtitle="Overall assessment outcome and recommendation">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Risk Classification', content: <RiskBadge level={assessment.riskLevel} size="md" /> },
            { label: 'Compliance Outcome',  content: <ComplianceIndicator status={assessment.complianceStatus} size="md" /> },
            { label: 'Workflow State',       content: <WorkflowBadge status={assessment.workflowStatus} size="md" /> },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">{card.label}</p>
              {card.content}
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
