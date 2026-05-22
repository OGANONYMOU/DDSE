import type { PlatformUser } from '../types/platform';
import { getClearanceLevel, getRoleConfig } from './rbac';

export interface MockAccount {
  user:       PlatformUser;
  password:   string;
  roleLabel:  string;
  rankLabel:  string;
  dirLabel:   string;
  badgeColor: string;
  badgeText:  string;
}

const DIRECTORATES: Record<string, string> = {
  standard_evaluation: 'Standard Evaluation',
  safety_manual:       'Safety & Manual',
  project_monitoring:  'Project Monitoring',
};

const RANKS: Record<string, string> = {
  gen:   'General',
  ltgen: 'Lieutenant General',
  mgen:  'Major General',
  brig:  'Brigadier',
  col:   'Colonel',
  ltcol: 'Lieutenant Colonel',
  maj:   'Major',
  capt:  'Captain',
  lt:    'Lieutenant',
  sgt:   'Sergeant',
  cpl:   'Corporal',
  pte:   'Private',
};

function makeMock(
  id: string,
  fullName: string,
  email: string,
  serviceNumber: string,
  rankCode: string,
  roleCode: string,
  directorateCode: string,
  password: string,
  commandJurisdiction?: string,
): MockAccount {
  const cfg = getRoleConfig(roleCode);
  return {
    user: {
      id,
      fullName,
      email,
      serviceNumber,
      rankCode,
      roleCode,
      clearanceLevel: getClearanceLevel(roleCode),
      directorateCode,
      commandJurisdiction,
      status:          'active',
      mfaRequired:     false,
      isPlatformOwner: roleCode === 'super_admin',
    },
    password,
    roleLabel:  cfg.label,
    rankLabel:  RANKS[rankCode] ?? rankCode.toUpperCase(),
    dirLabel:   DIRECTORATES[directorateCode] ?? directorateCode,
    badgeColor: cfg.uiTheme.badgeColor,
    badgeText:  cfg.uiTheme.badgeText,
  };
}

export const MOCK_ACCOUNTS: MockAccount[] = [

  // ── 1. SUPER ADMIN ─────────────────────────────────────────────────────────
  makeMock(
    'mock-superadmin-001',
    'Gen Olusegun Adebayo',
    'olusegun.adebayo@ddse.mil',
    '10000000',
    'gen',
    'super_admin',
    'standard_evaluation',
    'SAdm@2025#',
  ),

  // ── 2. DIRECTOR ────────────────────────────────────────────────────────────
  makeMock(
    'mock-director-001',
    'Maj Gen Ibrahim Musa',
    'ibrahim.musa@ddse.mil',
    '10000001',
    'mgen',
    'director',
    'standard_evaluation',
    'Dir@2025#',
  ),

  // ── 3. COMMANDER ───────────────────────────────────────────────────────────
  makeMock(
    'mock-commander-001',
    'Brig Chukwuemeka Obiora',
    'emeka.obiora@ddse.mil',
    '10000002',
    'brig',
    'commander',
    'standard_evaluation',
    'Cmd@2025#',
    'UNIT-7-ABUJA',
  ),

  // ── 4. ADMIN ───────────────────────────────────────────────────────────────
  makeMock(
    'mock-admin-001',
    'Col Amaka Okonkwo',
    'amaka.okonkwo@ddse.mil',
    '10000003',
    'col',
    'admin',
    'safety_manual',
    'Adm@2025#',
  ),
  makeMock(
    'mock-admin-002',
    'Lt Col Emeka Nwosu',
    'emeka.nwosu@ddse.mil',
    '10000004',
    'ltcol',
    'admin',
    'project_monitoring',
    'Adm@2025#',
  ),

  // ── 5. ENGINEERING OFFICER ─────────────────────────────────────────────────
  makeMock(
    'mock-eng-001',
    'Maj Damilola Adeyinka',
    'damilola.adeyinka@ddse.mil',
    '10000005',
    'maj',
    'engineering_officer',
    'project_monitoring',
    'Eng@2025#',
  ),

  // ── 6. SAFETY / HAZARD OFFICER ─────────────────────────────────────────────
  makeMock(
    'mock-safety-001',
    'Capt Ngozi Eze-Williams',
    'ngozi.ezewilliams@ddse.mil',
    '10000006',
    'capt',
    'safety_officer',
    'safety_manual',
    'Saf@2025#',
  ),

  // ── 7. ARMOURY OFFICER ─────────────────────────────────────────────────────
  makeMock(
    'mock-armoury-001',
    'Lt Bello Abdullahi',
    'bello.abdullahi@ddse.mil',
    '10000007',
    'lt',
    'armoury_officer',
    'standard_evaluation',
    'Arm@2025#',
  ),

  // ── 8. LOGISTICS OFFICER ───────────────────────────────────────────────────
  makeMock(
    'mock-logistics-001',
    'Maj Tunde Fashola',
    'tunde.fashola@ddse.mil',
    '10000008',
    'maj',
    'logistics_officer',
    'project_monitoring',
    'Log@2025#',
  ),

  // ── 9. INSPECTION OFFICER ──────────────────────────────────────────────────
  makeMock(
    'mock-insp-001',
    'Capt Fatima Aliyu',
    'fatima.aliyu@ddse.mil',
    '10000009',
    'capt',
    'inspection_officer',
    'standard_evaluation',
    'Ins@2025#',
  ),

  // ── 10. STAFF ─────────────────────────────────────────────────────────────
  makeMock(
    'mock-staff-001',
    'Sgt Kelechi Eze',
    'kelechi.eze@ddse.mil',
    '10000010',
    'sgt',
    'staff',
    'safety_manual',
    'Stf@2025#',
  ),
  makeMock(
    'mock-staff-002',
    'Maj Bola Adeyemi',
    'bola.adeyemi@ddse.mil',
    '10000011',
    'maj',
    'staff',
    'project_monitoring',
    'Stf@2025#',
  ),

  // ── 11. AUDITOR ───────────────────────────────────────────────────────────
  makeMock(
    'mock-auditor-001',
    'Col Yetunde Bankole',
    'yetunde.bankole@ddse.mil',
    '10000012',
    'col',
    'auditor',
    'standard_evaluation',
    'Aud@2025#',
  ),
];
