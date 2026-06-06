// I-10: Acting Authority Delegation service

import { supabase } from '../lib/supabase';

export type DelegationScope  = 'all' | 'directorate' | 'formation' | 'unit';
export type DelegationStatus = 'pending' | 'active' | 'expired' | 'revoked';

export interface Delegation {
  id:             string;
  delegatorId:    string;
  delegateId:     string;
  delegatorRole:  string;
  effectiveFrom:  string;
  effectiveUntil: string;
  scope:          DelegationScope;
  scopeCode:      string | null;
  reason:         string;
  approvedBy:     string | null;
  status:         DelegationStatus;
  revokedAt:      string | null;
  revokedReason:  string | null;
  createdAt:      string;
}

function dbToDelegation(r: Record<string, unknown>): Delegation {
  return {
    id:             String(r.id),
    delegatorId:    String(r.delegator_id),
    delegateId:     String(r.delegate_id),
    delegatorRole:  String(r.delegator_role),
    effectiveFrom:  String(r.effective_from),
    effectiveUntil: String(r.effective_until),
    scope:          r.scope as DelegationScope,
    scopeCode:      r.scope_code ? String(r.scope_code) : null,
    reason:         String(r.reason),
    approvedBy:     r.approved_by ? String(r.approved_by) : null,
    status:         r.status as DelegationStatus,
    revokedAt:      r.revoked_at ? String(r.revoked_at) : null,
    revokedReason:  r.revoked_reason ? String(r.revoked_reason) : null,
    createdAt:      String(r.created_at),
  };
}

export async function createDelegation(payload: {
  delegateId:     string;
  delegatorRole:  string;
  effectiveFrom:  string;
  effectiveUntil: string;
  scope:          DelegationScope;
  scopeCode?:     string;
  reason:         string;
}, delegatorId: string): Promise<Delegation> {
  const { data, error } = await supabase
    .from('acting_authority_delegations')
    .insert({
      delegator_id:    delegatorId,
      delegate_id:     payload.delegateId,
      delegator_role:  payload.delegatorRole,
      effective_from:  payload.effectiveFrom,
      effective_until: payload.effectiveUntil,
      scope:           payload.scope,
      scope_code:      payload.scopeCode ?? null,
      reason:          payload.reason,
      status:          'active',
    })
    .select()
    .single();
  if (error) throw error;
  return dbToDelegation(data as Record<string, unknown>);
}

export async function getActiveDelegationsForUser(userId: string): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('acting_authority_delegations')
    .select('*')
    .eq('delegate_id', userId)
    .eq('status', 'active')
    .lte('effective_from', new Date().toISOString())
    .gte('effective_until', new Date().toISOString());
  if (error) throw error;
  return (data ?? []).map(dbToDelegation);
}

export async function getDelegationsCreatedBy(delegatorId: string): Promise<Delegation[]> {
  const { data, error } = await supabase
    .from('acting_authority_delegations')
    .select('*')
    .eq('delegator_id', delegatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbToDelegation);
}

export async function revokeDelegation(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('acting_authority_delegations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_reason: reason })
    .eq('id', id);
  if (error) throw error;
}

export async function checkHasDelegatedAuthority(userId: string, role: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('acting_authority_delegations')
    .select('id')
    .eq('delegate_id', userId)
    .eq('delegator_role', role)
    .eq('status', 'active')
    .lte('effective_from', new Date().toISOString())
    .gte('effective_until', new Date().toISOString())
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}
