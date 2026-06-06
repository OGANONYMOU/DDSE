// Inspections service — Supabase-backed (replaces MOCK_INSPECTIONS / MOCK_INSPECTION_TEMPLATES)
// The primary page-level API goes through lib/api.ts edge functions.
// This service provides direct Supabase queries for lightweight, non-edge-function consumers.

import { supabase } from '../lib/supabase';

export interface InspectionRow {
  id:                 string;
  moduleCode:         string;
  title:              string;
  directorateCode:    string;
  status:             string;
  createdBy:          string;
  createdAt:          string;
  updatedAt:          string;
}

export interface InspectionFilter {
  search?:     string;
  status?:     string | 'all';
  moduleCode?: string | 'all';
}

export async function listInspectionRows(filter: InspectionFilter = {}): Promise<InspectionRow[]> {
  let query = supabase
    .from('inspections')
    .select('id, module_code, title, directorate_code, status, created_by, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filter.status     && filter.status !== 'all')     query = query.eq('status', filter.status);
  if (filter.moduleCode && filter.moduleCode !== 'all') query = query.eq('module_code', filter.moduleCode);
  if (filter.search) {
    query = query.ilike('title', `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id:              String(row.id),
    moduleCode:      String(row.module_code),
    title:           String(row.title),
    directorateCode: String(row.directorate_code),
    status:          String(row.status),
    createdBy:       String(row.created_by),
    createdAt:       String(row.created_at),
    updatedAt:       String(row.updated_at),
  }));
}

export async function getInspectionRow(id: string): Promise<InspectionRow | null> {
  const { data, error } = await supabase
    .from('inspections')
    .select('id, module_code, title, directorate_code, status, created_by, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id:              String(data.id),
    moduleCode:      String(data.module_code),
    title:           String(data.title),
    directorateCode: String(data.directorate_code),
    status:          String(data.status),
    createdBy:       String(data.created_by),
    createdAt:       String(data.created_at),
    updatedAt:       String(data.updated_at),
  };
}
