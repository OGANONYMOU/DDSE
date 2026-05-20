import type { PlatformUser } from '../types/platform';

export interface MockAccount {
  user:        PlatformUser;
  password:    string;
  roleLabel:   string;
  rankLabel:   string;
  dirLabel:    string;
  badgeColor:  string;  // tailwind bg class
  badgeText:   string;  // tailwind text class
}

const DIRECTORATES: Record<string, string> = {
  standard_evaluation: 'Standard Evaluation',
  safety_manual:       'Safety & Manual',
  project_monitoring:  'Project Monitoring',
};

const RANKS: Record<string, string> = {
  gen:   'General',
  mgen:  'Major General',
  ltgen: 'Lieutenant General',
  col:   'Colonel',
  ltcol: 'Lieutenant Colonel',
  maj:   'Major',
  capt:  'Captain',
  sgt:   'Sergeant',
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  // ── Director ──────────────────────────────────────────────────────────────
  {
    user: {
      id:              'mock-director-001',
      fullName:        'Maj Gen Ibrahim Musa',
      email:           'ibrahim.musa@ddse.mil',
      serviceNumber:   '10000001',
      rankCode:        'mgen',
      roleCode:        'director',
      directorateCode: 'standard_evaluation',
      status:          'active',
      mfaRequired:     false,
      isPlatformOwner: true,
    },
    password:   'Dir@2025#',
    roleLabel:  'Director',
    rankLabel:  RANKS['mgen'],
    dirLabel:   DIRECTORATES['standard_evaluation'],
    badgeColor: 'bg-violet-500/20',
    badgeText:  'text-violet-300',
  },

  // ── Admin × 2 ─────────────────────────────────────────────────────────────
  {
    user: {
      id:              'mock-admin-001',
      fullName:        'Col Amaka Okonkwo',
      email:           'amaka.okonkwo@ddse.mil',
      serviceNumber:   '10000002',
      rankCode:        'col',
      roleCode:        'admin',
      directorateCode: 'safety_manual',
      status:          'active',
      mfaRequired:     false,
    },
    password:   'Adm@2025#',
    roleLabel:  'Admin',
    rankLabel:  RANKS['col'],
    dirLabel:   DIRECTORATES['safety_manual'],
    badgeColor: 'bg-sky-500/20',
    badgeText:  'text-sky-300',
  },
  {
    user: {
      id:              'mock-admin-002',
      fullName:        'Lt Col Emeka Nwosu',
      email:           'emeka.nwosu@ddse.mil',
      serviceNumber:   '10000003',
      rankCode:        'ltcol',
      roleCode:        'admin',
      directorateCode: 'project_monitoring',
      status:          'active',
      mfaRequired:     false,
    },
    password:   'Adm@2025#',
    roleLabel:  'Admin',
    rankLabel:  RANKS['ltcol'],
    dirLabel:   DIRECTORATES['project_monitoring'],
    badgeColor: 'bg-sky-500/20',
    badgeText:  'text-sky-300',
  },

  // ── Staff × 3 ─────────────────────────────────────────────────────────────
  {
    user: {
      id:              'mock-staff-001',
      fullName:        'Capt Fatima Aliyu',
      email:           'fatima.aliyu@ddse.mil',
      serviceNumber:   '10000004',
      rankCode:        'capt',
      roleCode:        'staff',
      directorateCode: 'standard_evaluation',
      status:          'active',
      mfaRequired:     false,
    },
    password:   'Stf@2025#',
    roleLabel:  'Staff',
    rankLabel:  RANKS['capt'],
    dirLabel:   DIRECTORATES['standard_evaluation'],
    badgeColor: 'bg-emerald-500/20',
    badgeText:  'text-emerald-300',
  },
  {
    user: {
      id:              'mock-staff-002',
      fullName:        'Sgt Kelechi Eze',
      email:           'kelechi.eze@ddse.mil',
      serviceNumber:   '10000005',
      rankCode:        'sgt',
      roleCode:        'staff',
      directorateCode: 'safety_manual',
      status:          'active',
      mfaRequired:     false,
    },
    password:   'Stf@2025#',
    roleLabel:  'Staff',
    rankLabel:  RANKS['sgt'],
    dirLabel:   DIRECTORATES['safety_manual'],
    badgeColor: 'bg-emerald-500/20',
    badgeText:  'text-emerald-300',
  },
  {
    user: {
      id:              'mock-staff-003',
      fullName:        'Maj Bola Adeyemi',
      email:           'bola.adeyemi@ddse.mil',
      serviceNumber:   '10000006',
      rankCode:        'maj',
      roleCode:        'staff',
      directorateCode: 'project_monitoring',
      status:          'active',
      mfaRequired:     false,
    },
    password:   'Stf@2025#',
    roleLabel:  'Staff',
    rankLabel:  RANKS['maj'],
    dirLabel:   DIRECTORATES['project_monitoring'],
    badgeColor: 'bg-emerald-500/20',
    badgeText:  'text-emerald-300',
  },
];
