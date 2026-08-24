// Reports service — fully backed by Supabase (replaces MOCK_REPORTS)

import { supabase } from '../lib/supabase';
import type { Report, ReportFinding, ReportFilter } from '../types/reports';
import { logAuditEvent } from './auditLogger';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function dbToReport(row: Record<string, unknown>, findings?: ReportFinding[]): Report {
  return {
    id:               String(row.id ?? ''),
    type:             row.type as Report['type'],
    title:            String(row.title ?? ''),
    projectId:        row.project_id ? String(row.project_id) : null,
    projectName:      row.project_name ? String(row.project_name) : null,
    projectCode:      row.project_code ? String(row.project_code) : null,
    directorateCode:  String(row.directorate_code ?? ''),
    classification:   row.classification as Report['classification'],
    status:           row.status as Report['status'],
    executiveSummary: row.executive_summary ? String(row.executive_summary) : null,
    safetyFindings:   Array.isArray(row.safety_findings) ? row.safety_findings.map(String) : [],
    recommendations:  Array.isArray(row.recommendations)  ? row.recommendations.map(String)  : [],
    generatedBy:      String(row.generated_by ?? ''),
    generatedByName:  row.generated_by_name ? String(row.generated_by_name) : null,
    approvedBy:       row.approved_by ? String(row.approved_by) : null,
    approvedByName:   row.approved_by_name ? String(row.approved_by_name) : null,
    approvedAt:       row.approved_at ? String(row.approved_at) : null,
    createdAt:        String(row.created_at ?? ''),
    updatedAt:        String(row.updated_at ?? ''),
    findings,
  };
}

function dbToFinding(row: Record<string, unknown>): ReportFinding {
  return {
    id:             String(row.id ?? ''),
    reportId:       String(row.report_id ?? ''),
    category:       String(row.category ?? ''),
    description:    String(row.description ?? ''),
    severity:       row.severity as ReportFinding['severity'],
    recommendation: row.recommendation ? String(row.recommendation) : null,
    displayOrder:   Number(row.display_order ?? 0),
    createdAt:      String(row.created_at ?? ''),
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listReports(filter: ReportFilter = {}): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.type   && filter.type !== 'all')   query = query.eq('type', filter.type);
  if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status);
  if (filter.directorateCode && filter.directorateCode !== 'all')
    query = query.eq('directorate_code', filter.directorateCode);
  if (filter.search) {
    const q = `%${filter.search}%`;
    query = query.or(`title.ilike.${q},project_name.ilike.${q},generated_by_name.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => dbToReport(r as Record<string, unknown>));
}

export async function getReport(id: string): Promise<Report | null> {
  const [reportResult, findingsResult] = await Promise.all([
    supabase.from('reports').select('*').eq('id', id).maybeSingle(),
    supabase.from('report_findings').select('*').eq('report_id', id).order('display_order'),
  ]);

  if (reportResult.error) throw reportResult.error;
  if (!reportResult.data) return null;

  const findings = (findingsResult.data ?? []).map(dbToFinding);
  return dbToReport(reportResult.data as Record<string, unknown>, findings);
}

export async function createReport(
  payload: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'approvedBy' | 'approvedByName' | 'approvedAt' | 'findings'>,
  userId: string
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      type:              payload.type,
      title:             payload.title,
      project_id:        payload.projectId,
      project_name:      payload.projectName,
      project_code:      payload.projectCode,
      directorate_code:  payload.directorateCode,
      classification:    payload.classification,
      status:            payload.status ?? 'draft',
      executive_summary: payload.executiveSummary,
      safety_findings:   payload.safetyFindings,
      recommendations:   payload.recommendations,
      generated_by:      userId,
      generated_by_name: payload.generatedByName,
    })
    .select()
    .single();
  if (error) throw error;

  await logAuditEvent('report.created', {
    entityType: 'report',
    entityId:   String(data.id),
    metadata:   { title: payload.title, type: payload.type },
  });

  return dbToReport(data as Record<string, unknown>);
}

export async function submitReport(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'pending_review' })
    .eq('id', id)
    .eq('generated_by', userId); // only report creator can submit
  if (error) throw error;

  await logAuditEvent('report.submitted', { entityType: 'report', entityId: id });
}

export async function approveReport(
  id: string,
  approverName: string,
  approverId: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status:           'approved',
      approved_by:      approverId,
      approved_by_name: approverName,
      approved_at:      new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;

  await logAuditEvent('report.approved', { entityType: 'report', entityId: id, metadata: { approvedBy: approverId } });
}

export async function declineReport(
  id: string,
  reviewerName: string,
  reviewerId: string,
  note?: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status:        'rejected',
      approved_by:   reviewerId,
      approved_by_name: reviewerName,
      approved_at:   new Date().toISOString(),
      review_note:   note ?? null,
    })
    .eq('id', id);
  if (error) throw error;

  await logAuditEvent('report.rejected', { entityType: 'report', entityId: id, metadata: { rejectedBy: reviewerId, note } });
}
