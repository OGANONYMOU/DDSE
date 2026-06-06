// Projects service — fully backed by Supabase (replaces MOCK_PROJECTS)

import { supabase } from '../lib/supabase';
import type { Project, ProjectDetail, ProjectFilter, ProjectMilestone, ProjectDocument, ProjectRiskFlag, ProjectReview, BudgetCategory } from '../types/projects';
import { logAuditEvent } from './auditLogger';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbToProject(row: Record<string, unknown>): Project {
  return {
    id:                String(row.id ?? ''),
    projectCode:       String(row.project_code ?? ''),
    title:             String(row.title ?? ''),
    type:              row.type as Project['type'],
    status:            row.status as Project['status'],
    priority:          row.priority as Project['priority'],
    riskLevel:         row.risk_level as Project['riskLevel'],
    location:          String(row.location ?? ''),
    directorateCode:   String(row.directorate_code ?? ''),
    contractor:        row.contractor ? String(row.contractor) : null,
    leadInspectorId:   row.lead_inspector_id ? String(row.lead_inspector_id) : null,
    leadInspectorName: row.lead_inspector_name ? String(row.lead_inspector_name) : null,
    budgetNgn:         row.budget_ngn != null ? Number(row.budget_ngn) : null,
    completionPercent: Number(row.completion_percent ?? 0),
    startDate:         row.start_date ? String(row.start_date) : null,
    endDate:           row.end_date ? String(row.end_date) : null,
    classification:    String(row.classification ?? 'INTERNAL'),
    finalScore:        row.final_score != null ? Number(row.final_score) : null,
    notes:             row.notes ? String(row.notes) : null,
    createdBy:         String(row.created_by ?? ''),
    updatedBy:         row.updated_by ? String(row.updated_by) : null,
    createdAt:         String(row.created_at ?? ''),
    updatedAt:         String(row.updated_at ?? ''),
  };
}

function dbToMilestone(row: Record<string, unknown>): ProjectMilestone {
  return {
    id:            String(row.id ?? ''),
    projectId:     String(row.project_id ?? ''),
    title:         String(row.title ?? ''),
    targetDate:    row.target_date ? String(row.target_date) : null,
    completedDate: row.completed_date ? String(row.completed_date) : null,
    status:        row.status as ProjectMilestone['status'],
    displayOrder:  Number(row.display_order ?? 0),
    notes:         row.notes ? String(row.notes) : null,
    createdBy:     String(row.created_by ?? ''),
    createdAt:     String(row.created_at ?? ''),
    updatedAt:     String(row.updated_at ?? ''),
  };
}

function dbToDocument(row: Record<string, unknown>): ProjectDocument {
  return {
    id:             String(row.id ?? ''),
    projectId:      String(row.project_id ?? ''),
    title:          String(row.title ?? ''),
    docType:        row.doc_type as ProjectDocument['docType'],
    fileName:       String(row.file_name ?? ''),
    filePath:       String(row.file_path ?? ''),
    contentType:    row.content_type ? String(row.content_type) : null,
    sizeBytes:      row.size_bytes != null ? Number(row.size_bytes) : null,
    sha256Hash:     row.sha256_hash ? String(row.sha256_hash) : null,
    classification: String(row.classification ?? 'INTERNAL'),
    revision:       Number(row.revision ?? 1),
    supersedesId:   row.supersedes_id ? String(row.supersedes_id) : null,
    uploadedBy:     String(row.uploaded_by ?? ''),
    createdAt:      String(row.created_at ?? ''),
  };
}

function dbToRiskFlag(row: Record<string, unknown>): ProjectRiskFlag {
  return {
    id:          String(row.id ?? ''),
    projectId:   String(row.project_id ?? ''),
    title:       String(row.title ?? ''),
    severity:    row.severity as ProjectRiskFlag['severity'],
    status:      row.status as ProjectRiskFlag['status'],
    description: row.description ? String(row.description) : null,
    reportedBy:  String(row.reported_by ?? ''),
    reportedAt:  String(row.reported_at ?? ''),
    resolvedBy:  row.resolved_by ? String(row.resolved_by) : null,
    resolvedAt:  row.resolved_at ? String(row.resolved_at) : null,
    createdAt:   String(row.created_at ?? ''),
    updatedAt:   String(row.updated_at ?? ''),
  };
}

function dbToReview(row: Record<string, unknown>): ProjectReview {
  return {
    id:          String(row.id ?? ''),
    projectId:   String(row.project_id ?? ''),
    title:       String(row.title ?? ''),
    body:        row.body ? String(row.body) : null,
    priority:    row.priority as ProjectReview['priority'],
    status:      row.status as ProjectReview['status'],
    issuedBy:    String(row.issued_by ?? ''),
    issuedAt:    String(row.issued_at ?? ''),
    resolvedBy:  row.resolved_by ? String(row.resolved_by) : null,
    resolvedAt:  row.resolved_at ? String(row.resolved_at) : null,
    createdAt:   String(row.created_at ?? ''),
    updatedAt:   String(row.updated_at ?? ''),
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listProjects(filter: ProjectFilter = {}): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.status && filter.status !== 'all')         query = query.eq('status', filter.status);
  if (filter.priority && filter.priority !== 'all')     query = query.eq('priority', filter.priority);
  if (filter.riskLevel && filter.riskLevel !== 'all')   query = query.eq('risk_level', filter.riskLevel);
  if (filter.directorateCode && filter.directorateCode !== 'all')
    query = query.eq('directorate_code', filter.directorateCode);
  if (filter.search) {
    const q = `%${filter.search}%`;
    query = query.or(`title.ilike.${q},project_code.ilike.${q},contractor.ilike.${q},location.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(dbToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? dbToProject(data as Record<string, unknown>) : null;
}

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const [projectResult, milestonesResult, budgetResult, docsResult, risksResult, reviewsResult] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', id).maybeSingle(),
      supabase.from('project_milestones').select('*').eq('project_id', id).order('display_order'),
      supabase.from('project_budget_items').select('*').eq('project_id', id).order('created_at'),
      supabase.from('project_documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_risk_flags').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_reviews').select('*').eq('project_id', id).order('issued_at', { ascending: false }),
    ]);

  if (projectResult.error) throw projectResult.error;
  if (!projectResult.data) return null;

  return {
    project:     dbToProject(projectResult.data as Record<string, unknown>),
    milestones:  (milestonesResult.data ?? []).map(dbToMilestone),
    budgetItems: (budgetResult.data ?? []).map((r) => ({
      id:          String(r.id),
      projectId:   String(r.project_id),
      description: String(r.description),
      category:    r.category as BudgetCategory,
      quantity:    r.quantity != null ? Number(r.quantity) : null,
      unit:        r.unit ? String(r.unit) : null,
      unitRateNgn: r.unit_rate_ngn != null ? Number(r.unit_rate_ngn) : null,
      amountNgn:   Number(r.amount_ngn),
      boqRevision: Number(r.boq_revision ?? 1),
      approved:    Boolean(r.approved),
      approvedBy:  r.approved_by ? String(r.approved_by) : null,
      approvedAt:  r.approved_at ? String(r.approved_at) : null,
      createdBy:   String(r.created_by),
      createdAt:   String(r.created_at),
      updatedAt:   String(r.updated_at),
    })),
    documents:   (docsResult.data ?? []).map(dbToDocument),
    riskFlags:   (risksResult.data ?? []).map(dbToRiskFlag),
    reviews:     (reviewsResult.data ?? []).map(dbToReview),
  };
}

export async function createProject(
  payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'finalScore'>,
  userId: string
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      project_code:       payload.projectCode,
      title:              payload.title,
      type:               payload.type,
      status:             payload.status,
      priority:           payload.priority,
      risk_level:         payload.riskLevel,
      location:           payload.location,
      directorate_code:   payload.directorateCode,
      contractor:         payload.contractor,
      lead_inspector_name: payload.leadInspectorName,
      budget_ngn:         payload.budgetNgn,
      completion_percent: payload.completionPercent,
      start_date:         payload.startDate,
      end_date:           payload.endDate,
      classification:     payload.classification,
      notes:              payload.notes,
      created_by:         userId,
    })
    .select()
    .single();
  if (error) throw error;

  await logAuditEvent('project.created', {
    entityType: 'project',
    entityId:   String(data.id),
    metadata:   { title: payload.title, projectCode: payload.projectCode },
  });

  return dbToProject(data as Record<string, unknown>);
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'createdBy'>>,
  userId: string
): Promise<Project> {
  const row: Record<string, unknown> = { updated_by: userId };
  if (updates.status            !== undefined) row.status             = updates.status;
  if (updates.priority          !== undefined) row.priority           = updates.priority;
  if (updates.riskLevel         !== undefined) row.risk_level         = updates.riskLevel;
  if (updates.completionPercent !== undefined) row.completion_percent = updates.completionPercent;
  if (updates.contractor        !== undefined) row.contractor         = updates.contractor;
  if (updates.notes             !== undefined) row.notes              = updates.notes;

  const { data, error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await logAuditEvent('project.updated', {
    entityType: 'project',
    entityId:   id,
    metadata:   updates as Record<string, unknown>,
  });

  return dbToProject(data as Record<string, unknown>);
}
