// I-1: Organizational hierarchy service — directorates → formations → units

import { supabase } from '../lib/supabase';

export interface Directorate {
  code:          string;
  name:          string;
  shortName:     string | null;
  commanderId:   string | null;
  status:        'active' | 'inactive';
}

export interface Formation {
  id:              string;
  directorateCode: string;
  code:            string;
  name:            string;
  commanderId:     string | null;
  location:        string | null;
  status:          'active' | 'inactive';
}

export interface Unit {
  id:           string;
  formationId:  string;
  code:         string;
  name:         string;
  commanderId:  string | null;
  location:     string | null;
  status:       'active' | 'inactive' | 'deployed';
}

export async function listDirectorates(): Promise<Directorate[]> {
  const { data, error } = await supabase
    .from('directorates')
    .select('code, name, short_name, commander_id, status')
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    code:        String(r.code),
    name:        String(r.name),
    shortName:   r.short_name ? String(r.short_name) : null,
    commanderId: r.commander_id ? String(r.commander_id) : null,
    status:      r.status as Directorate['status'],
  }));
}

export async function listFormations(directorateCode: string): Promise<Formation[]> {
  const { data, error } = await supabase
    .from('formations')
    .select('id, directorate_code, code, name, commander_id, location, status')
    .eq('directorate_code', directorateCode)
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:              String(r.id),
    directorateCode: String(r.directorate_code),
    code:            String(r.code),
    name:            String(r.name),
    commanderId:     r.commander_id ? String(r.commander_id) : null,
    location:        r.location ? String(r.location) : null,
    status:          r.status as Formation['status'],
  }));
}

export async function listUnits(formationId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, formation_id, code, name, commander_id, location, status')
    .eq('formation_id', formationId)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:          String(r.id),
    formationId: String(r.formation_id),
    code:        String(r.code),
    name:        String(r.name),
    commanderId: r.commander_id ? String(r.commander_id) : null,
    location:    r.location ? String(r.location) : null,
    status:      r.status as Unit['status'],
  }));
}

export async function getUnitsForUser(userId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, formation_id, code, name, commander_id, location, status')
    .eq('commander_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:          String(r.id),
    formationId: String(r.formation_id),
    code:        String(r.code),
    name:        String(r.name),
    commanderId: r.commander_id ? String(r.commander_id) : null,
    location:    r.location ? String(r.location) : null,
    status:      r.status as Unit['status'],
  }));
}
