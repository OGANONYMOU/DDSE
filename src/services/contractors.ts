// I-3: Contractor/vendor registry service

import { supabase } from '../lib/supabase';

export type ContractorType   = 'Construction' | 'Electrical' | 'Mechanical' | 'IT' | 'Logistics' | 'Consulting' | 'Other';
export type ContractorStatus = 'active' | 'inactive' | 'blacklisted' | 'under_review';

export interface Contractor {
  id:                 string;
  name:               string;
  registrationNumber: string | null;
  type:               ContractorType;
  contactPerson:      string | null;
  phone:              string | null;
  email:              string | null;
  address:            string | null;
  status:             ContractorStatus;
  performanceScore:   number | null;
  totalContracts:     number;
  totalValueNgn:      number;
  createdBy:          string;
  createdAt:          string;
  updatedAt:          string;
}

export interface ContractorEvaluation {
  id:               string;
  contractorId:     string;
  projectId:        string | null;
  evaluationPeriod: string;
  overallScore:     number;
  programmeScore:   number | null;
  qualityScore:     number | null;
  safetyScore:      number | null;
  financialScore:   number | null;
  notes:            string | null;
  evaluatedBy:      string;
  createdAt:        string;
}

function dbToContractor(r: Record<string, unknown>): Contractor {
  return {
    id:                 String(r.id),
    name:               String(r.name),
    registrationNumber: r.registration_number ? String(r.registration_number) : null,
    type:               r.type as ContractorType,
    contactPerson:      r.contact_person ? String(r.contact_person) : null,
    phone:              r.phone ? String(r.phone) : null,
    email:              r.email ? String(r.email) : null,
    address:            r.address ? String(r.address) : null,
    status:             r.status as ContractorStatus,
    performanceScore:   r.performance_score != null ? Number(r.performance_score) : null,
    totalContracts:     Number(r.total_contracts ?? 0),
    totalValueNgn:      Number(r.total_value_ngn ?? 0),
    createdBy:          String(r.created_by),
    createdAt:          String(r.created_at),
    updatedAt:          String(r.updated_at),
  };
}

export async function listContractors(status?: ContractorStatus): Promise<Contractor[]> {
  let q = supabase.from('contractors').select('*').order('name');
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(dbToContractor);
}

export async function getContractor(id: string): Promise<Contractor | null> {
  const { data, error } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? dbToContractor(data as Record<string, unknown>) : null;
}

export async function createContractor(
  payload: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt' | 'totalContracts' | 'totalValueNgn'>,
  userId: string
): Promise<Contractor> {
  const { data, error } = await supabase
    .from('contractors')
    .insert({
      name:                payload.name,
      registration_number: payload.registrationNumber,
      type:                payload.type,
      contact_person:      payload.contactPerson,
      phone:               payload.phone,
      email:               payload.email,
      address:             payload.address,
      status:              payload.status ?? 'active',
      performance_score:   payload.performanceScore,
      created_by:          userId,
    })
    .select()
    .single();
  if (error) throw error;
  return dbToContractor(data as Record<string, unknown>);
}

export async function listContractorEvaluations(contractorId: string): Promise<ContractorEvaluation[]> {
  const { data, error } = await supabase
    .from('contractor_evaluations')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:               String(r.id),
    contractorId:     String(r.contractor_id),
    projectId:        r.project_id ? String(r.project_id) : null,
    evaluationPeriod: String(r.evaluation_period),
    overallScore:     Number(r.overall_score),
    programmeScore:   r.programme_score != null ? Number(r.programme_score) : null,
    qualityScore:     r.quality_score   != null ? Number(r.quality_score)   : null,
    safetyScore:      r.safety_score    != null ? Number(r.safety_score)    : null,
    financialScore:   r.financial_score != null ? Number(r.financial_score) : null,
    notes:            r.notes ? String(r.notes) : null,
    evaluatedBy:      String(r.evaluated_by),
    createdAt:        String(r.created_at),
  }));
}
