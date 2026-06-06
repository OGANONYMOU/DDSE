// Safety/Hazard service — fully backed by Supabase (replaces MOCK_HAZARD_ASSESSMENTS)

import { supabase } from '../lib/supabase';
import type {
  HazardAssessment,
  HazardCheckItem,
  HazardCorrectiveAction,
  HazardEvidence,
  HazardEscalation,
  HazardDetail,
  HazardFilter,
} from '../types/safety';
import { logAuditEvent } from './auditLogger';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function dbToAssessment(row: Record<string, unknown>): HazardAssessment {
  return {
    id:               String(row.id ?? ''),
    projectId:        row.project_id ? String(row.project_id) : null,
    projectName:      row.project_name ? String(row.project_name) : null,
    projectCode:      row.project_code ? String(row.project_code) : null,
    directorateCode:  String(row.directorate_code ?? ''),
    category:         row.category as HazardAssessment['category'],
    hazardTitle:      String(row.hazard_title ?? ''),
    riskLevel:        row.risk_level as HazardAssessment['riskLevel'],
    complianceStatus: row.compliance_status as HazardAssessment['complianceStatus'],
    workflowStatus:   row.workflow_status as HazardAssessment['workflowStatus'],
    observations:     row.observations ? String(row.observations) : null,
    inspectorId:      row.inspector_id ? String(row.inspector_id) : null,
    inspectorName:    row.inspector_name ? String(row.inspector_name) : null,
    classification:   String(row.classification ?? 'INTERNAL'),
    createdBy:        String(row.created_by ?? ''),
    updatedBy:        row.updated_by ? String(row.updated_by) : null,
    createdAt:        String(row.created_at ?? ''),
    updatedAt:        String(row.updated_at ?? ''),
  };
}

function dbToCheckItem(row: Record<string, unknown>): HazardCheckItem {
  return {
    id:           String(row.id ?? ''),
    assessmentId: String(row.assessment_id ?? ''),
    prompt:       String(row.prompt ?? ''),
    compliant:    row.compliant == null ? null : Boolean(row.compliant),
    notes:        row.notes ? String(row.notes) : null,
    displayOrder: Number(row.display_order ?? 0),
    checkedBy:    row.checked_by ? String(row.checked_by) : null,
    checkedAt:    row.checked_at ? String(row.checked_at) : null,
    createdAt:    String(row.created_at ?? ''),
  };
}

function dbToCA(row: Record<string, unknown>): HazardCorrectiveAction {
  return {
    id:                   String(row.id ?? ''),
    assessmentId:         String(row.assessment_id ?? ''),
    recommendation:       String(row.recommendation ?? ''),
    department:           row.department ? String(row.department) : null,
    urgency:              row.urgency as HazardCorrectiveAction['urgency'],
    dueDate:              row.due_date ? String(row.due_date) : null,
    status:               row.status as HazardCorrectiveAction['status'],
    assignedTo:           row.assigned_to ? String(row.assigned_to) : null,
    completedBy:          row.completed_by ? String(row.completed_by) : null,
    completedAt:          row.completed_at ? String(row.completed_at) : null,
    verificationEvidence: row.verification_evidence ? String(row.verification_evidence) : null,
    verifiedBy:           row.verified_by ? String(row.verified_by) : null,
    verifiedAt:           row.verified_at ? String(row.verified_at) : null,
    verificationNotes:    row.verification_notes ? String(row.verification_notes) : null,
    createdBy:            String(row.created_by ?? ''),
    createdAt:            String(row.created_at ?? ''),
    updatedAt:            String(row.updated_at ?? ''),
  };
}

function dbToEvidence(row: Record<string, unknown>): HazardEvidence {
  return {
    id:             String(row.id ?? ''),
    assessmentId:   String(row.assessment_id ?? ''),
    fileName:       String(row.file_name ?? ''),
    filePath:       String(row.file_path ?? ''),
    contentType:    row.content_type ? String(row.content_type) : null,
    sizeBytes:      row.size_bytes != null ? Number(row.size_bytes) : null,
    sha256Hash:     String(row.sha256_hash ?? ''),
    classification: String(row.classification ?? 'INTERNAL'),
    uploadedBy:     String(row.uploaded_by ?? ''),
    createdAt:      String(row.created_at ?? ''),
  };
}

function dbToEscalation(row: Record<string, unknown>): HazardEscalation {
  return {
    id:               String(row.id ?? ''),
    assessmentId:     String(row.assessment_id ?? ''),
    escalatedBy:      String(row.escalated_by ?? ''),
    escalatedToRole:  String(row.escalated_to_role ?? ''),
    reason:           String(row.reason ?? ''),
    resolvedBy:       row.resolved_by ? String(row.resolved_by) : null,
    resolvedAt:       row.resolved_at ? String(row.resolved_at) : null,
    resolutionNotes:  row.resolution_notes ? String(row.resolution_notes) : null,
    createdAt:        String(row.created_at ?? ''),
  };
}

// ─── List / Detail ────────────────────────────────────────────────────────────

export async function listHazards(filter: HazardFilter = {}): Promise<HazardAssessment[]> {
  let query = supabase
    .from('hazard_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.riskLevel   && filter.riskLevel !== 'all')   query = query.eq('risk_level', filter.riskLevel);
  if (filter.workflow    && filter.workflow !== 'all')     query = query.eq('workflow_status', filter.workflow);
  if (filter.compliance  && filter.compliance !== 'all')  query = query.eq('compliance_status', filter.compliance);
  if (filter.category    && filter.category !== 'all')    query = query.eq('category', filter.category);
  if (filter.projectId)  query = query.eq('project_id', filter.projectId);
  if (filter.directorateCode && filter.directorateCode !== 'all')
    query = query.eq('directorate_code', filter.directorateCode);
  if (filter.search) {
    const q = `%${filter.search}%`;
    query = query.or(`hazard_title.ilike.${q},category.ilike.${q},inspector_name.ilike.${q},project_name.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(dbToAssessment);
}

export async function getHazard(id: string): Promise<HazardAssessment | null> {
  const { data, error } = await supabase
    .from('hazard_assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? dbToAssessment(data as Record<string, unknown>) : null;
}

export async function getHazardDetail(id: string): Promise<HazardDetail | null> {
  const [assessmentResult, itemsResult, caResult, evidenceResult, escalationsResult] =
    await Promise.all([
      supabase.from('hazard_assessments').select('*').eq('id', id).maybeSingle(),
      supabase.from('hazard_check_items').select('*').eq('assessment_id', id).order('display_order'),
      supabase.from('hazard_corrective_actions').select('*').eq('assessment_id', id).order('created_at'),
      supabase.from('hazard_evidence').select('*').eq('assessment_id', id).order('created_at', { ascending: false }),
      supabase.from('hazard_escalations').select('*').eq('assessment_id', id).order('created_at', { ascending: false }),
    ]);

  if (assessmentResult.error) throw assessmentResult.error;
  if (!assessmentResult.data) return null;

  return {
    assessment:        dbToAssessment(assessmentResult.data as Record<string, unknown>),
    checkItems:        (itemsResult.data ?? []).map(dbToCheckItem),
    correctiveActions: (caResult.data ?? []).map(dbToCA),
    evidence:          (evidenceResult.data ?? []).map(dbToEvidence),
    escalations:       (escalationsResult.data ?? []).map(dbToEscalation),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createHazardAssessment(
  payload: Omit<HazardAssessment, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
  userId: string
): Promise<HazardAssessment> {
  const { data, error } = await supabase
    .from('hazard_assessments')
    .insert({
      project_id:       payload.projectId,
      project_name:     payload.projectName,
      project_code:     payload.projectCode,
      directorate_code: payload.directorateCode,
      category:         payload.category,
      hazard_title:     payload.hazardTitle,
      risk_level:       payload.riskLevel,
      compliance_status: payload.complianceStatus,
      workflow_status:  payload.workflowStatus,
      observations:     payload.observations,
      inspector_id:     payload.inspectorId,
      inspector_name:   payload.inspectorName,
      classification:   payload.classification,
      created_by:       userId,
    })
    .select()
    .single();
  if (error) throw error;

  await logAuditEvent('hazard.created', {
    entityType: 'hazard',
    entityId:   String(data.id),
    metadata:   { title: payload.hazardTitle, riskLevel: payload.riskLevel },
  });

  return dbToAssessment(data as Record<string, unknown>);
}

export async function updateHazardWorkflow(
  id: string,
  workflowStatus: HazardAssessment['workflowStatus'],
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('hazard_assessments')
    .update({ workflow_status: workflowStatus, updated_by: userId })
    .eq('id', id);
  if (error) throw error;

  await logAuditEvent('hazard.workflow_updated', {
    entityType: 'hazard',
    entityId:   id,
    metadata:   { workflowStatus },
  });
}

// C-9: Close a corrective action with mandatory verifier
export async function closeCorrectiveAction(
  id: string,
  payload: {
    completedBy:          string;
    verificationEvidence: string;
    verifiedBy:           string;
    verificationNotes:    string;
  }
): Promise<void> {
  if (!payload.verifiedBy) {
    throw new Error('Corrective action closure requires a verifier. Set verified_by before closing.');
  }

  const { error } = await supabase
    .from('hazard_corrective_actions')
    .update({
      status:                'resolved',
      completed_by:          payload.completedBy,
      completed_at:          new Date().toISOString(),
      verification_evidence: payload.verificationEvidence,
      verified_by:           payload.verifiedBy,
      verified_at:           new Date().toISOString(),
      verification_notes:    payload.verificationNotes,
    })
    .eq('id', id);
  if (error) throw error;

  await logAuditEvent('hazard.corrective_action_closed', {
    entityType: 'hazard_corrective_action',
    entityId:   id,
    metadata:   { verifiedBy: payload.verifiedBy },
  });
}

export async function getHazardsByProject(projectId: string): Promise<HazardAssessment[]> {
  return listHazards({ projectId });
}
