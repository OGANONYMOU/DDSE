// N-2: Inspection scheduling service

import { supabase } from '../lib/supabase';

export type ScheduleFrequency = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'one_off';
export type ScheduleStatus    = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

export interface InspectionSchedule {
  id:               string;
  title:            string;
  moduleCode:       string;
  directorateCode:  string;
  unitId:           string | null;
  frequency:        ScheduleFrequency;
  scheduledDate:    string;
  scheduledTime:    string | null;
  leadInspectorId:  string | null;
  status:           ScheduleStatus;
  inspectionId:     string | null;
  notes:            string | null;
  nextOccurrence:   string | null;
  createdBy:        string;
  createdAt:        string;
  updatedAt:        string;
}

function dbToSchedule(r: Record<string, unknown>): InspectionSchedule {
  return {
    id:               String(r.id),
    title:            String(r.title),
    moduleCode:       String(r.module_code),
    directorateCode:  String(r.directorate_code),
    unitId:           r.unit_id ? String(r.unit_id) : null,
    frequency:        r.frequency as ScheduleFrequency,
    scheduledDate:    String(r.scheduled_date),
    scheduledTime:    r.scheduled_time ? String(r.scheduled_time) : null,
    leadInspectorId:  r.lead_inspector_id ? String(r.lead_inspector_id) : null,
    status:           r.status as ScheduleStatus,
    inspectionId:     r.inspection_id ? String(r.inspection_id) : null,
    notes:            r.notes ? String(r.notes) : null,
    nextOccurrence:   r.next_occurrence ? String(r.next_occurrence) : null,
    createdBy:        String(r.created_by),
    createdAt:        String(r.created_at),
    updatedAt:        String(r.updated_at),
  };
}

export async function listSchedules(opts: {
  from?: string;
  to?:   string;
  directorateCode?: string;
  status?: ScheduleStatus | 'all';
} = {}): Promise<InspectionSchedule[]> {
  let q = supabase.from('inspection_schedules').select('*').order('scheduled_date');
  if (opts.from) q = q.gte('scheduled_date', opts.from);
  if (opts.to)   q = q.lte('scheduled_date', opts.to);
  if (opts.directorateCode) q = q.eq('directorate_code', opts.directorateCode);
  if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(dbToSchedule);
}

export async function getSchedule(id: string): Promise<InspectionSchedule | null> {
  const { data, error } = await supabase
    .from('inspection_schedules').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? dbToSchedule(data as Record<string, unknown>) : null;
}

export async function createSchedule(
  payload: Omit<InspectionSchedule, 'id' | 'createdAt' | 'updatedAt' | 'inspectionId'>,
  userId: string
): Promise<InspectionSchedule> {
  const { data, error } = await supabase
    .from('inspection_schedules')
    .insert({
      title:             payload.title,
      module_code:       payload.moduleCode,
      directorate_code:  payload.directorateCode,
      unit_id:           payload.unitId,
      frequency:         payload.frequency,
      scheduled_date:    payload.scheduledDate,
      scheduled_time:    payload.scheduledTime,
      lead_inspector_id: payload.leadInspectorId,
      status:            payload.status ?? 'scheduled',
      notes:             payload.notes,
      created_by:        userId,
    })
    .select().single();
  if (error) throw error;
  return dbToSchedule(data as Record<string, unknown>);
}

export async function updateScheduleStatus(
  id: string,
  status: ScheduleStatus
): Promise<void> {
  const { error } = await supabase
    .from('inspection_schedules').update({ status }).eq('id', id);
  if (error) throw error;
}

// Returns schedules grouped by date string (YYYY-MM-DD) for calendar display
export function groupByDate(schedules: InspectionSchedule[]): Record<string, InspectionSchedule[]> {
  const map: Record<string, InspectionSchedule[]> = {};
  for (const s of schedules) {
    (map[s.scheduledDate] ??= []).push(s);
  }
  return map;
}
