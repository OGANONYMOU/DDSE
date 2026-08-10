// Centralized audit event service.
// Writes structured audit events to Supabase `audit_logs` table when available,
// and queues them in localStorage as a fallback when offline.

import { supabase, supabaseMisconfigured } from '../lib/supabase';

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.mfa_enroll'
  | 'auth.password_change'
  | 'auth.session_extended'
  | 'inspection.created'
  | 'inspection.submitted'
  | 'inspection.approved'
  | 'inspection.rejected'
  | 'report.created'
  | 'report.submitted'
  | 'report.approved'
  | 'report.modified'
  | 'hazard.created'
  | 'hazard.workflow_updated'
  | 'hazard.corrective_action_closed'
  | 'hazard.escalated'
  | 'hazard.resolved'
  | 'personnel.role_changed'
  | 'personnel.registered'
  | 'personnel.approved'
  | 'personnel.suspended'
  | 'project.updated'
  | 'project.created'
  | 'document.uploaded'
  | 'document.deleted'
  | 'system.emergency_lockdown'
  | 'system.config_changed'
  | 'automation.inspection_flagged_overdue';

export interface AuditEvent {
  id:          string;
  action:      AuditAction;
  actorId?:    string;
  actorRole?:  string;
  entityType?: string;
  entityId?:   string;
  metadata?:   Record<string, unknown>;
  createdAt:   number;
  status:      'success' | 'failure';
  ipHint?:     string;
}

function generateId(): string {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Log an audit event. Fire-and-forget — never throws.
export async function logAuditEvent(
  action: AuditAction,
  opts: {
    actorId?:    string;
    actorRole?:  string;
    entityType?: string;
    entityId?:   string;
    metadata?:   Record<string, unknown>;
    status?:     'success' | 'failure';
  } = {}
): Promise<void> {
  const event: AuditEvent = {
    id:         generateId(),
    action,
    actorId:    opts.actorId,
    actorRole:  opts.actorRole,
    entityType: opts.entityType,
    entityId:   opts.entityId,
    metadata:   opts.metadata,
    createdAt:  Date.now(),
    status:     opts.status ?? 'success',
  };

  // RLS requires an authenticated writer — skip the network round-trip (and the
  // console noise from a guaranteed-401) when there's no active Supabase session,
  // e.g. on the pre-login boot sequence or a Dev Access Panel mock session.
  const hasSession = !supabaseMisconfigured && !!(await supabase.auth.getSession()).data.session;

  if (hasSession) {
    try {
      await supabase.from('audit_logs').insert({
        action:      event.action,
        actor_id:    event.actorId,
        actor_role:  event.actorRole,
        entity_type: event.entityType,
        entity_id:   event.entityId,
        metadata:    event.metadata ?? {},
        status:      event.status,
        created_at:  new Date(event.createdAt).toISOString(),
      });
      return;
    } catch {
      // Fall through to localStorage queue
    }
  }

  // Offline queue — flushed when connectivity resumes
  try {
    const queue = JSON.parse(localStorage.getItem('ddse_audit_queue') ?? '[]') as AuditEvent[];
    queue.push(event);
    // Keep the queue bounded
    if (queue.length > 200) queue.splice(0, queue.length - 200);
    localStorage.setItem('ddse_audit_queue', JSON.stringify(queue));
  } catch {
    // localStorage unavailable — silently discard
  }
}

// Flush the offline queue to Supabase.
export async function flushAuditQueue(): Promise<void> {
  if (supabaseMisconfigured) return;
  const hasSession = !!(await supabase.auth.getSession()).data.session;
  if (!hasSession) return;
  try {
    const raw   = localStorage.getItem('ddse_audit_queue');
    if (!raw) return;
    const queue = JSON.parse(raw) as AuditEvent[];
    if (queue.length === 0) return;

    await supabase.from('audit_logs').insert(
      queue.map((e) => ({
        action:      e.action,
        actor_id:    e.actorId,
        actor_role:  e.actorRole,
        entity_type: e.entityType,
        entity_id:   e.entityId,
        metadata:    e.metadata ?? {},
        status:      e.status,
        created_at:  new Date(e.createdAt).toISOString(),
      }))
    );
    localStorage.removeItem('ddse_audit_queue');
  } catch {
    // Will retry next time
  }
}

// Retrieve recent audit events (UI use only — falls back to mock data).
export async function getAuditLogs(opts: {
  limit?: number;
  action?: AuditAction;
  actorRole?: string;
} = {}): Promise<AuditEvent[]> {
  const limit = opts.limit ?? 50;

  if (!supabaseMisconfigured) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (opts.action)    query = query.eq('action', opts.action);
      if (opts.actorRole) query = query.eq('actor_role', opts.actorRole);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((r) => ({
          id:         r.id,
          action:     r.action as AuditAction,
          actorId:    r.actor_id,
          actorRole:  r.actor_role,
          entityType: r.entity_type,
          entityId:   r.entity_id,
          metadata:   r.metadata,
          createdAt:  new Date(r.created_at).getTime(),
          status:     r.status,
        }));
      }
    } catch {
      // Fall through to mock data
    }
  }

  return MOCK_AUDIT_LOGS.slice(0, limit);
}

// ─── Mock data (used when Supabase is unavailable) ────────────────────────────

const MOCK_AUDIT_LOGS: AuditEvent[] = [
  { id: 'aud_1', action: 'auth.login',             actorRole: 'commander',           status: 'success', createdAt: Date.now() - 1000 * 60 * 2  },
  { id: 'aud_2', action: 'inspection.submitted',   actorRole: 'inspection_officer',  status: 'success', createdAt: Date.now() - 1000 * 60 * 8, entityType: 'inspection', entityId: 'insp-001' },
  { id: 'aud_3', action: 'hazard.escalated',       actorRole: 'safety_officer',      status: 'success', createdAt: Date.now() - 1000 * 60 * 15, entityType: 'hazard' },
  { id: 'aud_4', action: 'report.submitted',       actorRole: 'engineering_officer', status: 'success', createdAt: Date.now() - 1000 * 60 * 22, entityType: 'report' },
  { id: 'aud_5', action: 'personnel.role_changed', actorRole: 'admin',               status: 'success', createdAt: Date.now() - 1000 * 60 * 45, entityType: 'user' },
  { id: 'aud_6', action: 'inspection.approved',    actorRole: 'director',            status: 'success', createdAt: Date.now() - 1000 * 60 * 60, entityType: 'inspection', entityId: 'insp-002' },
  { id: 'aud_7', action: 'auth.login',             actorRole: 'auditor',             status: 'failure', createdAt: Date.now() - 1000 * 60 * 90 },
  { id: 'aud_8', action: 'document.uploaded',      actorRole: 'engineering_officer', status: 'success', createdAt: Date.now() - 1000 * 60 * 120, entityType: 'document' },
  { id: 'aud_9', action: 'project.updated',        actorRole: 'admin',               status: 'success', createdAt: Date.now() - 1000 * 60 * 180, entityType: 'project' },
  { id: 'aud_10', action: 'auth.password_change',  actorRole: 'staff',               status: 'success', createdAt: Date.now() - 1000 * 60 * 240 },
];
