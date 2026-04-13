export const RANK_OPTIONS = [
  'Private',
  'Lance Corporal',
  'Corporal',
  'Sergeant',
  'Staff Sergeant',
  'Warrant Officer',
  'Second Lieutenant',
  'Lieutenant',
  'Captain',
  'Major',
  'Lieutenant Colonel',
  'Colonel',
  'Brigadier General',
  'Major General',
  'Lieutenant General',
  'General',
];

export const ROLE_OPTIONS = [
  { code: 'super_admin', label: 'Super Admin', privileged: true },
  { code: 'ddse_admin', label: 'DDSE Admin', privileged: true },
  { code: 'evaluator', label: 'Evaluator / Inspector', privileged: true },
  { code: 'directorate_officer', label: 'Directorate Officer', privileged: true },
  { code: 'project_officer', label: 'Project Officer', privileged: true },
  { code: 'base_commander', label: 'Base Commander / Unit Commander', privileged: true },
  { code: 'base_soldier', label: 'Base Soldier / Field Personnel', privileged: false },
  { code: 'audit_reviewer', label: 'Audit / Compliance Reviewer', privileged: true },
  { code: 'senior_command_readonly', label: 'Senior Command Read-only', privileged: true },
];

export const FORMATIONS = [
  { code: 'HQ-NA', name: 'Army Headquarters' },
  { code: 'JTF-NE', name: 'Joint Task Force North East' },
  { code: 'TRADOC', name: 'Training and Doctrine Command' },
];

export const UNITS = [
  { code: 'DDSE-HQ', name: 'DDSE Headquarters', formationCode: 'HQ-NA' },
  { code: 'NA-TRG-01', name: 'Training Establishment Alpha', formationCode: 'TRADOC' },
  { code: 'JTF-SECTOR-1', name: 'JTF Sector One', formationCode: 'JTF-NE' },
  { code: 'ENG-PROJ-01', name: 'Engineer Projects Group', formationCode: 'HQ-NA' },
];

export const DIRECTORATES = [
  { code: 'DSE', name: 'Standards and Evaluation' },
  { code: 'DSM', name: 'Safety and Manual' },
  { code: 'DPM', name: 'Project Monitoring' },
];

export const MODULE_DEFINITIONS = [
  {
    moduleCode: 'hazard_safety',
    title: 'Hazard / Safety Assessment',
    classification: 'official',
    description: 'Environmental health and safety compliance inspections with corrective actions, evidence, and reinspection support.',
    sections: [
      {
        title: 'General Work Environment',
        items: [
          { code: 'HSA-GWE-01', prompt: 'Walkways are clear and unobstructed', responseType: 'yes_no_na', weight: 8 },
          { code: 'HSA-GWE-02', prompt: 'Floors, walls, and stairways are maintained in safe condition', responseType: 'yes_no_na', weight: 8 },
          { code: 'HSA-GWE-03', prompt: 'Exit doors and egress routes are clearly marked and serviceable', responseType: 'yes_no_na', weight: 10 },
        ],
      },
      {
        title: 'Fire and Hazard Controls',
        items: [
          { code: 'HSA-FIR-01', prompt: 'Fire protection equipment is present, serviceable, and inspected', responseType: 'yes_no_na', weight: 12 },
          { code: 'HSA-FIR-02', prompt: 'Flammable or combustible materials are stored correctly', responseType: 'yes_no_na', weight: 12 },
          { code: 'HSA-FIR-03', prompt: 'Hazard communication and chemical labels are complete', responseType: 'yes_no_na', weight: 10 },
        ],
      },
      {
        title: 'Emergency Preparedness',
        items: [
          { code: 'HSA-EMP-01', prompt: 'Emergency action plans are posted and briefed to personnel', responseType: 'yes_no_na', weight: 15 },
          { code: 'HSA-EMP-02', prompt: 'Confined space and ventilation controls are adequate', responseType: 'yes_no_na', weight: 12 },
        ],
      },
    ],
  },
  {
    moduleCode: 'jtf_readiness',
    title: 'JTF Operational Readiness',
    classification: 'restricted_operational',
    description: 'Weighted operational readiness assessment for JTF manpower, logistics, discipline, communications, and public relations.',
    sections: [
      {
        title: 'Administration and Personnel',
        items: [
          { code: 'JTF-ADM-01', prompt: 'Manpower holding is within acceptable establishment variance', responseType: 'score_5', weight: 12 },
          { code: 'JTF-ADM-02', prompt: 'Discipline records and sanctions are current and controlled', responseType: 'score_5', weight: 10 },
          { code: 'JTF-ADM-03', prompt: 'Leave, passes, and rotation plans are current', responseType: 'score_5', weight: 10 },
        ],
      },
      {
        title: 'Logistics and Sustainment',
        items: [
          { code: 'JTF-LOG-01', prompt: 'Feeding adequacy meets operational requirements', responseType: 'score_5', weight: 10 },
          { code: 'JTF-LOG-02', prompt: 'Casualty and equipment recovery arrangements are effective', responseType: 'score_5', weight: 12 },
          { code: 'JTF-LOG-03', prompt: 'Pay, allowances, and medical procurement are up to date', responseType: 'score_5', weight: 10 },
        ],
      },
      {
        title: 'Operations and Support',
        items: [
          { code: 'JTF-OPS-01', prompt: 'Intelligence and security posture is effective', responseType: 'score_5', weight: 14 },
          { code: 'JTF-OPS-02', prompt: 'Communications assets are available and functional', responseType: 'score_5', weight: 12 },
          { code: 'JTF-OPS-03', prompt: 'Training and public relations engagements are current', responseType: 'score_5', weight: 10 },
        ],
      },
    ],
  },
  {
    moduleCode: 'general_security',
    title: 'General Security Inspection',
    classification: 'restricted_security',
    description: 'Restricted security inspection covering personnel, barracks, access control, patrols, documentation, and equipment security.',
    sections: [
      {
        title: 'Personnel and Access Control',
        items: [
          { code: 'GSI-ACC-01', prompt: 'Gate access control and ID vetting are properly enforced', responseType: 'yes_no_na', weight: 12 },
          { code: 'GSI-ACC-02', prompt: 'Visitor books and security records are complete and current', responseType: 'yes_no_na', weight: 10 },
        ],
      },
      {
        title: 'Barracks and Equipment Security',
        items: [
          { code: 'GSI-BAR-01', prompt: 'Perimeter fencing, lighting, and watch towers are serviceable', responseType: 'yes_no_na', weight: 12 },
          { code: 'GSI-BAR-02', prompt: 'Fire fighting equipment and communications are serviceable', responseType: 'yes_no_na', weight: 12 },
        ],
      },
    ],
  },
  {
    moduleCode: 'armoury',
    title: 'Armoury Evaluation',
    classification: 'restricted_armoury',
    description: 'High-control armoury inspection workflow with standing orders, guard adequacy, serviceability, and chain-of-custody evidence.',
    sections: [
      {
        title: 'Standing Orders and Records',
        items: [
          { code: 'ARM-ORD-01', prompt: 'Standing orders, inspection books, and issue books are current', responseType: 'yes_no_na', weight: 14 },
          { code: 'ARM-ORD-02', prompt: 'Key custody and record access controls are enforced', responseType: 'yes_no_na', weight: 12 },
        ],
      },
      {
        title: 'Weapons and Security',
        items: [
          { code: 'ARM-SEC-01', prompt: 'Weapons inventory and serviceability status are current', responseType: 'yes_no_na', weight: 14 },
          { code: 'ARM-SEC-02', prompt: 'Lighting, guard deployment, and fire points are adequate', responseType: 'yes_no_na', weight: 12 },
        ],
      },
    ],
  },
  {
    moduleCode: 'magazine',
    title: 'Magazine Evaluation',
    classification: 'restricted_magazine',
    description: 'Restricted magazine inspection workflow for siting, fencing, ventilation, records, key custody, and safety controls.',
    sections: [
      {
        title: 'Structure and Siting',
        items: [
          { code: 'MAG-SIT-01', prompt: 'Magazine siting, fencing, and building condition comply with requirements', responseType: 'yes_no_na', weight: 14 },
          { code: 'MAG-SIT-02', prompt: 'Double doors, ventilation, and communications are serviceable', responseType: 'yes_no_na', weight: 12 },
        ],
      },
      {
        title: 'Records and Custody',
        items: [
          { code: 'MAG-REC-01', prompt: 'Magazine records and issue documentation are complete', responseType: 'yes_no_na', weight: 14 },
          { code: 'MAG-REC-02', prompt: 'Key custody and access restrictions are enforced', responseType: 'yes_no_na', weight: 12 },
        ],
      },
    ],
  },
  {
    moduleCode: 'civil_projects',
    title: 'Civil Project Monitoring',
    classification: 'official',
    description: 'Project monitoring workflow for contract intake, execution, milestone tracking, compliance notices, and final inspection.',
    sections: [
      {
        title: 'Contract Intake and Documentation',
        items: [
          { code: 'CPM-CON-01', prompt: 'Contract documents and BOQ are complete and validated', responseType: 'yes_no_na', weight: 10 },
          { code: 'CPM-CON-02', prompt: 'Programme of works and drawings are submitted and reviewed', responseType: 'yes_no_na', weight: 10 },
          { code: 'CPM-CON-03', prompt: 'Soil tests and COREN-certified undertakings are available where required', responseType: 'yes_no_na', weight: 10 },
        ],
      },
      {
        title: 'Execution Monitoring',
        items: [
          { code: 'CPM-EXE-01', prompt: 'Weekly progress reports and photographic evidence are up to date', responseType: 'yes_no_na', weight: 12 },
          { code: 'CPM-EXE-02', prompt: 'Material quality verification is satisfactory', responseType: 'yes_no_na', weight: 12 },
          { code: 'CPM-EXE-03', prompt: 'Milestones and stage payments are aligned to actual work done', responseType: 'yes_no_na', weight: 12 },
        ],
      },
      {
        title: 'Compliance and Closeout',
        items: [
          { code: 'CPM-COM-01', prompt: 'Non-compliance notices and advisory letters are tracked to closure', responseType: 'yes_no_na', weight: 12 },
          { code: 'CPM-COM-02', prompt: 'Final inspection readiness is supported by evidence and signoff', responseType: 'yes_no_na', weight: 12 },
        ],
      },
    ],
  },
];

export const PRIVILEGED_ROLE_CODES = new Set(
  ROLE_OPTIONS.filter((role) => role.privileged).map((role) => role.code),
);
