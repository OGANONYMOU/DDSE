// N-6: Incident Timeline / After-Action Report service

import { supabase } from '../lib/supabase';

export type IncidentType     = 'safety' | 'security' | 'operational' | 'environmental' | 'equipment' | 'personnel' | 'other';
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus   = 'open' | 'investigating' | 'under_review' | 'closed' | 'archived';
export type AARStatus        = 'draft' | 'under_review' | 'approved' | 'published';

export interface Incident {
  id:                   string;
  incidentNumber:       string;
  title:                string;
  incidentType:         IncidentType;
  severity:             IncidentSeverity;
  status:               IncidentStatus;
  occurredAt:           string;
  reportedAt:           string;
  location:             string | null;
  directorateCode:      string;
  unitId:               string | null;
  projectId:            string | null;
  initialDescription:   string;
  immediateActions:     string | null;
  reportedBy:           string;
  investigatingOfficer: string | null;
  classification:       string;
  closedAt:             string | null;
  createdAt:            string;
  updatedAt:            string;
}

export interface IncidentTimelineEntry {
  id:          string;
  incidentId:  string;
  occurredAt:  string;
  title:       string;
  description: string;
  actor:       string | null;
  evidenceRef: string | null;
  displayOrder:number;
  createdBy:   string;
  createdAt:   string;
}

export interface AfterActionReport {
  id:                       string;
  incidentId:               string;
  executiveSummary:         string | null;
  rootCause:                string | null;
  contributingFactors:      string[];
  immediateActionsTaken:    string | null;
  correctiveActions:        string[];
  lessonsLearned:           string[];
  recommendations:          string[];
  preparedBy:               string;
  reviewedBy:               string | null;
  approvedBy:               string | null;
  status:                   AARStatus;
  approvedAt:               string | null;
  createdAt:                string;
  updatedAt:                string;
}

function dbToIncident(r: Record<string, unknown>): Incident {
  return {
    id:                   String(r.id),
    incidentNumber:       String(r.incident_number),
    title:                String(r.title),
    incidentType:         r.incident_type as IncidentType,
    severity:             r.severity as IncidentSeverity,
    status:               r.status as IncidentStatus,
    occurredAt:           String(r.occurred_at),
    reportedAt:           String(r.reported_at),
    location:             r.location ? String(r.location) : null,
    directorateCode:      String(r.directorate_code),
    unitId:               r.unit_id ? String(r.unit_id) : null,
    projectId:            r.project_id ? String(r.project_id) : null,
    initialDescription:   String(r.initial_description),
    immediateActions:     r.immediate_actions ? String(r.immediate_actions) : null,
    reportedBy:           String(r.reported_by),
    investigatingOfficer: r.investigating_officer ? String(r.investigating_officer) : null,
    classification:       String(r.classification ?? 'RESTRICTED'),
    closedAt:             r.closed_at ? String(r.closed_at) : null,
    createdAt:            String(r.created_at),
    updatedAt:            String(r.updated_at),
  };
}

export async function listIncidents(opts: { status?: IncidentStatus | 'all'; severity?: IncidentSeverity | 'all' } = {}): Promise<Incident[]> {
  let q = supabase.from('incidents').select('*').order('occurred_at', { ascending: false });
  if (opts.status   && opts.status !== 'all')   q = q.eq('status', opts.status);
  if (opts.severity && opts.severity !== 'all') q = q.eq('severity', opts.severity);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(dbToIncident);
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { data, error } = await supabase.from('incidents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? dbToIncident(data as Record<string, unknown>) : null;
}

export async function getIncidentTimeline(incidentId: string): Promise<IncidentTimelineEntry[]> {
  const { data, error } = await supabase
    .from('incident_timeline')
    .select('*')
    .eq('incident_id', incidentId)
    .order('display_order');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:           String(r.id),
    incidentId:   String(r.incident_id),
    occurredAt:   String(r.occurred_at),
    title:        String(r.title),
    description:  String(r.description),
    actor:        r.actor ? String(r.actor) : null,
    evidenceRef:  r.evidence_ref ? String(r.evidence_ref) : null,
    displayOrder: Number(r.display_order),
    createdBy:    String(r.created_by),
    createdAt:    String(r.created_at),
  }));
}

export async function getAAR(incidentId: string): Promise<AfterActionReport | null> {
  const { data, error } = await supabase
    .from('after_action_reports')
    .select('*')
    .eq('incident_id', incidentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id:                    String(data.id),
    incidentId:            String(data.incident_id),
    executiveSummary:      data.executive_summary ? String(data.executive_summary) : null,
    rootCause:             data.root_cause ? String(data.root_cause) : null,
    contributingFactors:   Array.isArray(data.contributing_factors) ? data.contributing_factors.map(String) : [],
    immediateActionsTaken: data.immediate_actions_taken ? String(data.immediate_actions_taken) : null,
    correctiveActions:     Array.isArray(data.corrective_actions) ? data.corrective_actions.map(String) : [],
    lessonsLearned:        Array.isArray(data.lessons_learned)    ? data.lessons_learned.map(String)    : [],
    recommendations:       Array.isArray(data.recommendations)    ? data.recommendations.map(String)    : [],
    preparedBy:            String(data.prepared_by),
    reviewedBy:            data.reviewed_by ? String(data.reviewed_by) : null,
    approvedBy:            data.approved_by ? String(data.approved_by) : null,
    status:                data.status as AARStatus,
    approvedAt:            data.approved_at ? String(data.approved_at) : null,
    createdAt:             String(data.created_at),
    updatedAt:             String(data.updated_at),
  };
}

export async function createIncident(
  payload: Omit<Incident, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt' | 'closedAt'>,
  userId: string
): Promise<Incident> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      title:               payload.title,
      incident_type:       payload.incidentType,
      severity:            payload.severity,
      status:              payload.status ?? 'open',
      occurred_at:         payload.occurredAt,
      location:            payload.location,
      directorate_code:    payload.directorateCode,
      unit_id:             payload.unitId,
      project_id:          payload.projectId,
      initial_description: payload.initialDescription,
      immediate_actions:   payload.immediateActions,
      reported_by:         userId,
      classification:      payload.classification ?? 'RESTRICTED',
    })
    .select().single();
  if (error) throw error;
  return dbToIncident(data as Record<string, unknown>);
}

export async function addTimelineEntry(
  incidentId: string,
  entry: { occurredAt: string; title: string; description: string; actor?: string },
  userId: string
): Promise<IncidentTimelineEntry> {
  const { data: existing } = await supabase
    .from('incident_timeline').select('display_order').eq('incident_id', incidentId)
    .order('display_order', { ascending: false }).limit(1);
  const nextOrder = ((existing?.[0]?.display_order as number | undefined) ?? 0) + 1;

  const { data, error } = await supabase
    .from('incident_timeline')
    .insert({
      incident_id:   incidentId,
      occurred_at:   entry.occurredAt,
      title:         entry.title,
      description:   entry.description,
      actor:         entry.actor ?? null,
      display_order: nextOrder,
      created_by:    userId,
    })
    .select().single();
  if (error) throw error;
  return {
    id: String(data.id), incidentId: String(data.incident_id),
    occurredAt: String(data.occurred_at), title: String(data.title),
    description: String(data.description), actor: data.actor ? String(data.actor) : null,
    evidenceRef: null, displayOrder: Number(data.display_order),
    createdBy: String(data.created_by), createdAt: String(data.created_at),
  };
}
