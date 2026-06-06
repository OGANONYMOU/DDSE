// N-5: Two-Person Integrity (TPI) service.
// Critical actions require two separate authorized officers to independently confirm.

import { supabase } from '../lib/supabase';

export type TpiActionType =
  | 'report_approval' | 'armoury_inspection' | 'emergency_lockdown'
  | 'role_change' | 'data_export' | 'budget_approval';

export type TpiStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';

export interface TpiRequest {
  id:               string;
  actionType:       TpiActionType;
  entityType:       string;
  entityId:         string | null;
  description:      string;
  classification:   string;
  initiatorId:      string;
  initiatorRole:    string;
  confirmerId:      string | null;
  confirmerRole:    string | null;
  status:           TpiStatus;
  expiresAt:        string;
  confirmedAt:      string | null;
  rejectedAt:       string | null;
  rejectionReason:  string | null;
  auditHash:        string | null;
  createdAt:        string;
}

function dbToTpi(r: Record<string, unknown>): TpiRequest {
  return {
    id:              String(r.id),
    actionType:      r.action_type as TpiActionType,
    entityType:      String(r.entity_type),
    entityId:        r.entity_id ? String(r.entity_id) : null,
    description:     String(r.description),
    classification:  String(r.classification ?? 'TOP_SECRET'),
    initiatorId:     String(r.initiator_id),
    initiatorRole:   String(r.initiator_role),
    confirmerId:     r.confirmer_id ? String(r.confirmer_id) : null,
    confirmerRole:   r.confirmer_role ? String(r.confirmer_role) : null,
    status:          r.status as TpiStatus,
    expiresAt:       String(r.expires_at),
    confirmedAt:     r.confirmed_at ? String(r.confirmed_at) : null,
    rejectedAt:      r.rejected_at ? String(r.rejected_at) : null,
    rejectionReason: r.rejection_reason ? String(r.rejection_reason) : null,
    auditHash:       r.audit_hash ? String(r.audit_hash) : null,
    createdAt:       String(r.created_at),
  };
}

export async function createTpiRequest(payload: {
  actionType:    TpiActionType;
  entityType:    string;
  entityId?:     string;
  description:   string;
  classification?: string;
}, initiatorId: string, initiatorRole: string): Promise<TpiRequest> {
  const { data, error } = await supabase
    .from('tpi_requests')
    .insert({
      action_type:    payload.actionType,
      entity_type:    payload.entityType,
      entity_id:      payload.entityId ?? null,
      description:    payload.description,
      classification: payload.classification ?? 'TOP_SECRET',
      initiator_id:   initiatorId,
      initiator_role: initiatorRole,
      status:         'pending',
    })
    .select().single();
  if (error) throw error;
  return dbToTpi(data as Record<string, unknown>);
}

export async function confirmTpiRequest(
  id: string,
  confirmerId: string,
  confirmerRole: string
): Promise<TpiRequest> {
  const { data, error } = await supabase
    .from('tpi_requests')
    .update({
      confirmer_id:   confirmerId,
      confirmer_role: confirmerRole,
      status:         'confirmed',
      confirmed_at:   new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select().single();
  if (error) throw error;
  return dbToTpi(data as Record<string, unknown>);
}

export async function rejectTpiRequest(
  id: string,
  reason: string,
  confirmerId: string
): Promise<void> {
  const { error } = await supabase
    .from('tpi_requests')
    .update({
      status:           'rejected',
      rejected_at:      new Date().toISOString(),
      rejection_reason: reason,
      confirmer_id:     confirmerId,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function getPendingTpiRequests(): Promise<TpiRequest[]> {
  const { data, error } = await supabase
    .from('tpi_requests')
    .select('*')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbToTpi);
}

export async function getMyTpiRequests(userId: string): Promise<TpiRequest[]> {
  const { data, error } = await supabase
    .from('tpi_requests')
    .select('*')
    .or(`initiator_id.eq.${userId},confirmer_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map(dbToTpi);
}
