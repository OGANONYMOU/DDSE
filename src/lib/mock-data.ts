import type { DashboardSummary } from '../types/platform';

// ─── Project model ────────────────────────────────────────────────────────────

export interface MockProject {
  id: string;
  projectCode: string;
  title: string;
  type: 'New Construction' | 'Rehabilitation' | 'Extension' | 'Maintenance';
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';
  location: string;
  directorateCode: string;
  contractor: string;
  budgetNGN: number;
  completionPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate: string;
  endDate: string;
  leadInspector: string;
}

// ─── Project detail sub-types ─────────────────────────────────────────────────

export interface MockMilestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'delayed';
}

export interface MockInspectionRecord {
  id: string;
  title: string;
  date: string;
  status: 'approved' | 'submitted' | 'in_review' | 'pending';
  score: number;
  inspector: string;
}

export interface MockDocument {
  id: string;
  title: string;
  type: 'BOQ' | 'Drawing' | 'Report' | 'Certificate' | 'Photo' | 'Permit';
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface MockSafetyIssue {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'open' | 'resolved' | 'monitoring';
  reportedAt: string;
}

export interface MockRecommendation {
  id: string;
  title: string;
  body: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'in_progress' | 'resolved';
  issuedBy: string;
  issuedAt: string;
}

export interface MockProjectDetail {
  milestones: MockMilestone[];
  inspections: MockInspectionRecord[];
  documents: MockDocument[];
  safetyIssues: MockSafetyIssue[];
  recommendations: MockRecommendation[];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'PRJ-2025-001',
    projectCode: 'DESE/RHB/2025/001',
    title: 'Barracks Renovation — Block C',
    type: 'Rehabilitation',
    status: 'in_progress',
    priority: 'PRIORITY',
    location: '3 Engineer Brigade, Abuja',
    directorateCode: 'DESE',
    contractor: 'Afcon Construction Ltd',
    budgetNGN: 485_000_000,
    completionPercent: 67,
    riskLevel: 'MEDIUM',
    startDate: '2025-03-01',
    endDate: '2025-12-31',
    leadInspector: 'Maj. O.B. Adeyemi',
  },
  {
    id: 'PRJ-2024-008',
    projectCode: 'DEME/NWC/2024/008',
    title: 'Engineering Workshop Construction',
    type: 'New Construction',
    status: 'in_progress',
    priority: 'URGENT',
    location: 'NASE, Makurdi',
    directorateCode: 'DEME',
    contractor: 'Julius Berger Nigeria PLC',
    budgetNGN: 1_200_000_000,
    completionPercent: 34,
    riskLevel: 'HIGH',
    startDate: '2024-11-01',
    endDate: '2026-06-30',
    leadInspector: 'Lt Col C.N. Okafor',
  },
  {
    id: 'PRJ-2024-003',
    projectCode: 'DESE/RHB/2024/003',
    title: 'Command Office Complex Rehabilitation',
    type: 'Rehabilitation',
    status: 'completed',
    priority: 'ROUTINE',
    location: 'Army Headquarters, Abuja',
    directorateCode: 'DESE',
    contractor: 'Dantata & Sawoe Const. Co.',
    budgetNGN: 320_000_000,
    completionPercent: 100,
    riskLevel: 'LOW',
    startDate: '2024-06-01',
    endDate: '2025-02-28',
    leadInspector: 'Maj. K.I. Aliyu',
  },
  {
    id: 'PRJ-2026-001',
    projectCode: 'DESE/RHB/2026/001',
    title: "Officers' Mess Renovation",
    type: 'Rehabilitation',
    status: 'planning',
    priority: 'ROUTINE',
    location: '82 Division, Enugu',
    directorateCode: 'DESE',
    contractor: 'TBD',
    budgetNGN: 175_000_000,
    completionPercent: 0,
    riskLevel: 'LOW',
    startDate: '2026-01-01',
    endDate: '2026-09-30',
    leadInspector: 'TBD',
  },
  {
    id: 'PRJ-2025-002',
    projectCode: 'DEME/EXT/2025/002',
    title: 'Medical Centre Extension — Phase 2',
    type: 'Extension',
    status: 'in_progress',
    priority: 'PRIORITY',
    location: '1 Division, Kaduna',
    directorateCode: 'DEME',
    contractor: 'CGC Engineering Nigeria Ltd',
    budgetNGN: 560_000_000,
    completionPercent: 51,
    riskLevel: 'MEDIUM',
    startDate: '2025-01-15',
    endDate: '2025-11-30',
    leadInspector: 'Capt. A.M. Suleiman',
  },
  {
    id: 'PRJ-2025-004',
    projectCode: 'DEME/MNT/2025/004',
    title: 'Ammunition Storage Facility Upgrade',
    type: 'Maintenance',
    status: 'on_hold',
    priority: 'EMERGENCY',
    location: 'Ordnance Depot, Lagos',
    directorateCode: 'DEME',
    contractor: 'Craneburg Construction Co.',
    budgetNGN: 890_000_000,
    completionPercent: 18,
    riskLevel: 'CRITICAL',
    startDate: '2025-05-01',
    endDate: '2026-04-30',
    leadInspector: 'Lt Col P.A. Bala',
  },
  {
    id: 'PRJ-2025-005',
    projectCode: 'DESE/RHB/2025/005',
    title: 'Tactical Operations Centre Upgrade',
    type: 'Rehabilitation',
    status: 'in_progress',
    priority: 'URGENT',
    location: 'Defence HQ, Abuja',
    directorateCode: 'DESE',
    contractor: 'Setraco Nigeria Ltd',
    budgetNGN: 740_000_000,
    completionPercent: 42,
    riskLevel: 'HIGH',
    startDate: '2025-02-01',
    endDate: '2026-01-31',
    leadInspector: 'Maj. F.O. Eze',
  },
  {
    id: 'PRJ-2024-011',
    projectCode: 'DESE/MNT/2024/011',
    title: 'Perimeter Fence Reconstruction — Phase 1',
    type: 'Maintenance',
    status: 'completed',
    priority: 'ROUTINE',
    location: 'Bonny Camp, Lagos',
    directorateCode: 'DESE',
    contractor: 'RCC Nigeria Ltd',
    budgetNGN: 98_000_000,
    completionPercent: 100,
    riskLevel: 'LOW',
    startDate: '2024-04-01',
    endDate: '2024-10-15',
    leadInspector: 'Capt. B.D. Nwosu',
  },
];

// ─── Per-project detail data ──────────────────────────────────────────────────

export const MOCK_PROJECT_DETAILS: Record<string, MockProjectDetail> = {
  'PRJ-2025-001': {
    milestones: [
      { id: 'M001', title: 'Site Preparation & Mobilisation',      targetDate: '2025-03-31', completedDate: '2025-03-28', status: 'completed' },
      { id: 'M002', title: 'Demolition & Clearing Works',          targetDate: '2025-04-30', completedDate: '2025-04-25', status: 'completed' },
      { id: 'M003', title: 'Structural Repairs & Reinforcement',   targetDate: '2025-07-31', completedDate: '2025-07-29', status: 'completed' },
      { id: 'M004', title: 'Roofing & Waterproofing',              targetDate: '2025-09-30', completedDate: '2025-09-15', status: 'completed' },
      { id: 'M005', title: 'Internal Finishing Works',             targetDate: '2025-11-15',                              status: 'in_progress' },
      { id: 'M006', title: 'Final Inspection & Handover',          targetDate: '2025-12-31',                              status: 'upcoming' },
    ],
    inspections: [
      { id: 'INS-001-A', title: 'Q1 2025 Foundation Inspection',  date: '2025-04-02', status: 'approved',  score: 84, inspector: 'Maj. O.B. Adeyemi' },
      { id: 'INS-001-B', title: 'Q2 2025 Structural Inspection',  date: '2025-07-05', status: 'approved',  score: 79, inspector: 'Maj. O.B. Adeyemi' },
      { id: 'INS-001-C', title: 'Q3 2025 Progress Inspection',    date: '2025-10-08', status: 'submitted', score: 76, inspector: 'Maj. O.B. Adeyemi' },
    ],
    documents: [
      { id: 'DOC-001-A', title: 'Bill of Quantities (Revised)',    type: 'BOQ',         uploadedBy: 'Maj. O.B. Adeyemi', uploadedAt: '2025-02-20', size: '1.4 MB' },
      { id: 'DOC-001-B', title: 'Architectural Drawings — Rev 2', type: 'Drawing',     uploadedBy: 'Afcon Const. Ltd',  uploadedAt: '2025-03-05', size: '8.2 MB' },
      { id: 'DOC-001-C', title: 'Q3 2025 Site Progress Photos',   type: 'Photo',       uploadedBy: 'Maj. O.B. Adeyemi', uploadedAt: '2025-10-08', size: '22.1 MB' },
      { id: 'DOC-001-D', title: 'Q2 2025 Inspection Report',      type: 'Report',      uploadedBy: 'Maj. O.B. Adeyemi', uploadedAt: '2025-07-10', size: '340 KB' },
      { id: 'DOC-001-E', title: 'Building Permit — Abuja FCT',    type: 'Permit',      uploadedBy: 'Afcon Const. Ltd',  uploadedAt: '2025-03-01', size: '120 KB' },
    ],
    safetyIssues: [
      { id: 'SAF-001-A', title: 'Inadequate scaffold bracing on eastern elevation', severity: 'HIGH',   status: 'resolved',   reportedAt: '2025-06-14' },
      { id: 'SAF-001-B', title: 'Worker PPE non-compliance — 2 recorded incidents', severity: 'MEDIUM', status: 'monitoring', reportedAt: '2025-09-03' },
    ],
    recommendations: [
      { id: 'REC-001-A', title: 'Improve site drainage before harmattan season', body: 'Standing water observed in Block C lower floor. Contractor to install temporary drainage channels before November dry season to prevent foundation saturation.', priority: 'HIGH',   status: 'in_progress', issuedBy: 'Maj. O.B. Adeyemi', issuedAt: '2025-10-08' },
      { id: 'REC-001-B', title: "Replace defective floor tiles in officers' lounge", body: "12 sq.m of floor tiles in officers' lounge show early signs of delamination. Contractor to replace before final handover inspection.", priority: 'MEDIUM', status: 'pending',     issuedBy: 'Maj. O.B. Adeyemi', issuedAt: '2025-10-08' },
    ],
  },

  'PRJ-2024-008': {
    milestones: [
      { id: 'M001', title: 'Site Survey & Soil Investigation',     targetDate: '2024-12-31', completedDate: '2024-12-20', status: 'completed' },
      { id: 'M002', title: 'Substructure (Foundation Works)',      targetDate: '2025-04-30', completedDate: '2025-05-12', status: 'completed' },
      { id: 'M003', title: 'Superstructure — Ground Floor Slab',  targetDate: '2025-08-31',                              status: 'in_progress' },
      { id: 'M004', title: 'Superstructure — First Floor',        targetDate: '2025-12-31',                              status: 'upcoming' },
      { id: 'M005', title: 'MEP Rough-In Works',                  targetDate: '2026-03-31',                              status: 'upcoming' },
      { id: 'M006', title: 'Fitting-Out & Final Inspection',      targetDate: '2026-06-30',                              status: 'upcoming' },
    ],
    inspections: [
      { id: 'INS-008-A', title: 'Foundation Quality Inspection',  date: '2025-02-10', status: 'approved',  score: 71, inspector: 'Lt Col C.N. Okafor' },
      { id: 'INS-008-B', title: 'Q2 2025 Structural Inspection',  date: '2025-08-20', status: 'in_review', score: 68, inspector: 'Lt Col C.N. Okafor' },
    ],
    documents: [
      { id: 'DOC-008-A', title: 'Soil Investigation Report',        type: 'Report',  uploadedBy: 'Julius Berger PLC',  uploadedAt: '2024-12-22', size: '2.8 MB' },
      { id: 'DOC-008-B', title: 'Structural Engineering Drawings',  type: 'Drawing', uploadedBy: 'Julius Berger PLC',  uploadedAt: '2025-01-10', size: '14.5 MB' },
      { id: 'DOC-008-C', title: 'BOQ — Full Workshop Complex',      type: 'BOQ',     uploadedBy: 'Lt Col C.N. Okafor', uploadedAt: '2024-11-05', size: '3.1 MB' },
    ],
    safetyIssues: [
      { id: 'SAF-008-A', title: 'Unsecured excavation — north perimeter',             severity: 'HIGH',     status: 'resolved',   reportedAt: '2025-03-02' },
      { id: 'SAF-008-B', title: 'Crane operated without certified operator on site',  severity: 'CRITICAL', status: 'resolved',   reportedAt: '2025-06-17' },
      { id: 'SAF-008-C', title: 'Insufficient safety signage on active work zones',  severity: 'MEDIUM',   status: 'monitoring', reportedAt: '2025-08-21' },
    ],
    recommendations: [
      { id: 'REC-008-A', title: 'Accelerate superstructure to recover programme', body: 'Substructure delay of 12 days puts Q4 2025 milestone at risk. Contractor to deploy additional formwork gangs. Weekly lookahead programme required.', priority: 'URGENT', status: 'in_progress', issuedBy: 'Lt Col C.N. Okafor', issuedAt: '2025-08-20' },
      { id: 'REC-008-B', title: 'Address high water table in basement area',      body: 'Persistent groundwater ingress in basement slab. Engineer to review drainage design and install permanent sump pumps before floor slab pour.',     priority: 'HIGH',   status: 'pending',     issuedBy: 'Lt Col C.N. Okafor', issuedAt: '2025-05-15' },
    ],
  },

  'PRJ-2024-003': {
    milestones: [
      { id: 'M001', title: 'Mobilisation & Site Hoarding',       targetDate: '2024-07-01', completedDate: '2024-06-28', status: 'completed' },
      { id: 'M002', title: 'Demolition & Strip-Out',             targetDate: '2024-08-15', completedDate: '2024-08-10', status: 'completed' },
      { id: 'M003', title: 'Civil & Structural Repairs',         targetDate: '2024-10-31', completedDate: '2024-10-25', status: 'completed' },
      { id: 'M004', title: 'MEP & Electrical Installations',     targetDate: '2024-12-31', completedDate: '2024-12-20', status: 'completed' },
      { id: 'M005', title: 'Finishing & Soft Furnishings',       targetDate: '2025-02-15', completedDate: '2025-02-12', status: 'completed' },
      { id: 'M006', title: 'Final Inspection & Handover',        targetDate: '2025-02-28', completedDate: '2025-02-26', status: 'completed' },
    ],
    inspections: [
      { id: 'INS-003-A', title: 'Interim Structural Inspection', date: '2024-10-28', status: 'approved', score: 88, inspector: 'Maj. K.I. Aliyu' },
      { id: 'INS-003-B', title: 'MEP Systems Commissioning',     date: '2024-12-22', status: 'approved', score: 91, inspector: 'Maj. K.I. Aliyu' },
      { id: 'INS-003-C', title: 'Final Completion Inspection',   date: '2025-02-25', status: 'approved', score: 94, inspector: 'Maj. K.I. Aliyu' },
    ],
    documents: [
      { id: 'DOC-003-A', title: 'Final Completion Certificate',  type: 'Certificate', uploadedBy: 'Maj. K.I. Aliyu', uploadedAt: '2025-02-28', size: '180 KB' },
      { id: 'DOC-003-B', title: 'As-Built Drawings',             type: 'Drawing',     uploadedBy: 'Dantata & Sawoe', uploadedAt: '2025-02-20', size: '11.3 MB' },
      { id: 'DOC-003-C', title: 'Final Inspection Report',       type: 'Report',      uploadedBy: 'Maj. K.I. Aliyu', uploadedAt: '2025-02-26', size: '890 KB' },
    ],
    safetyIssues: [
      { id: 'SAF-003-A', title: 'Minor electrical deviation corrected during fit-out', severity: 'LOW', status: 'resolved', reportedAt: '2024-12-18' },
    ],
    recommendations: [
      { id: 'REC-003-A', title: 'Schedule 12-month post-completion defects review', body: 'Project handed over. Schedule defects inspection for February 2026 per standard procedure. Defects liability period ends Feb 2027.', priority: 'LOW', status: 'pending', issuedBy: 'Maj. K.I. Aliyu', issuedAt: '2025-02-28' },
    ],
  },

  'PRJ-2026-001': {
    milestones: [
      { id: 'M001', title: 'Design & Tender Preparation',     targetDate: '2025-11-30', status: 'in_progress' },
      { id: 'M002', title: 'Contractor Procurement',          targetDate: '2025-12-31', status: 'upcoming' },
      { id: 'M003', title: 'Mobilisation & Site Preparation', targetDate: '2026-02-28', status: 'upcoming' },
      { id: 'M004', title: 'Main Construction Works',         targetDate: '2026-07-31', status: 'upcoming' },
      { id: 'M005', title: 'Final Inspection & Handover',     targetDate: '2026-09-30', status: 'upcoming' },
    ],
    inspections: [],
    documents: [
      { id: 'DOC-006-A', title: 'Preliminary Scope of Works', type: 'Report',  uploadedBy: 'DESE Admin', uploadedAt: '2025-09-15', size: '420 KB' },
      { id: 'DOC-006-B', title: 'Concept Sketch Drawings',    type: 'Drawing', uploadedBy: 'DESE Admin', uploadedAt: '2025-10-01', size: '3.5 MB' },
    ],
    safetyIssues: [],
    recommendations: [
      { id: 'REC-006-A', title: 'Conduct structural condition survey before tender', body: 'An independent structural survey must be completed before BOQ is finalised to capture all latent defects. This prevents excessive variation claims during construction.', priority: 'HIGH', status: 'pending', issuedBy: 'DESE Planning Cell', issuedAt: '2025-10-10' },
    ],
  },

  'PRJ-2025-002': {
    milestones: [
      { id: 'M001', title: 'Site Clearance & Earthworks',            targetDate: '2025-03-31', completedDate: '2025-03-25', status: 'completed' },
      { id: 'M002', title: 'Foundation & Substructure',              targetDate: '2025-05-31', completedDate: '2025-06-08', status: 'completed' },
      { id: 'M003', title: 'Superstructure — Block A',               targetDate: '2025-08-31', completedDate: '2025-08-28', status: 'completed' },
      { id: 'M004', title: 'MEP Installation & Plumbing',            targetDate: '2025-10-15',                              status: 'in_progress' },
      { id: 'M005', title: 'Internal Finishing & Fit-Out',           targetDate: '2025-11-15',                              status: 'upcoming' },
      { id: 'M006', title: 'Medical Equipment Mounting & Handover',  targetDate: '2025-11-30',                              status: 'upcoming' },
    ],
    inspections: [
      { id: 'INS-002-A', title: 'Foundation Compliance Inspection', date: '2025-04-10', status: 'approved',  score: 82, inspector: 'Capt. A.M. Suleiman' },
      { id: 'INS-002-B', title: 'Structural Progress Inspection',   date: '2025-08-30', status: 'submitted', score: 77, inspector: 'Capt. A.M. Suleiman' },
    ],
    documents: [
      { id: 'DOC-002-A', title: 'Medical Centre Extension BOQ',   type: 'BOQ',     uploadedBy: 'Capt. A.M. Suleiman', uploadedAt: '2025-01-10', size: '2.1 MB' },
      { id: 'DOC-002-B', title: 'Architectural & MEP Drawings',   type: 'Drawing', uploadedBy: 'CGC Engineering',     uploadedAt: '2025-01-20', size: '16.8 MB' },
      { id: 'DOC-002-C', title: 'Q2 2025 Progress Report',        type: 'Report',  uploadedBy: 'Capt. A.M. Suleiman', uploadedAt: '2025-09-01', size: '560 KB' },
    ],
    safetyIssues: [
      { id: 'SAF-002-A', title: 'Excavation without shoring — collapse risk', severity: 'HIGH',   status: 'resolved',   reportedAt: '2025-02-18' },
      { id: 'SAF-002-B', title: 'Medical waste disposal protocol breach',      severity: 'MEDIUM', status: 'monitoring', reportedAt: '2025-07-22' },
    ],
    recommendations: [
      { id: 'REC-002-A', title: 'Expedite MEP installation to protect programme', body: 'MEP subcontractor mobilisation was delayed by 3 weeks. Project manager to enforce milestone dates and submit weekly lookahead programmes.', priority: 'HIGH', status: 'in_progress', issuedBy: 'Capt. A.M. Suleiman', issuedAt: '2025-09-01' },
    ],
  },

  'PRJ-2025-004': {
    milestones: [
      { id: 'M001', title: 'Environmental Impact Assessment',       targetDate: '2025-06-30', completedDate: '2025-06-25', status: 'completed' },
      { id: 'M002', title: 'Regulatory Approvals (NESREA/FME)',    targetDate: '2025-07-31',                              status: 'delayed' },
      { id: 'M003', title: 'Site Preparation & Security Fencing',  targetDate: '2025-09-30',                              status: 'upcoming' },
      { id: 'M004', title: 'Main Construction Works',              targetDate: '2026-02-28',                              status: 'upcoming' },
      { id: 'M005', title: 'Safety Certification & Handover',      targetDate: '2026-04-30',                              status: 'upcoming' },
    ],
    inspections: [
      { id: 'INS-004-A', title: 'Pre-Construction Site Inspection', date: '2025-05-15', status: 'approved', score: 88, inspector: 'Lt Col P.A. Bala' },
    ],
    documents: [
      { id: 'DOC-004-A', title: 'Environmental Impact Assessment',     type: 'Report',      uploadedBy: 'Craneburg Const.', uploadedAt: '2025-06-26', size: '4.8 MB' },
      { id: 'DOC-004-B', title: 'Explosive Storage Safety Plan',       type: 'Certificate', uploadedBy: 'Lt Col P.A. Bala', uploadedAt: '2025-06-10', size: '890 KB' },
      { id: 'DOC-004-C', title: 'Structural Drawings — Bunker Design', type: 'Drawing',     uploadedBy: 'Craneburg Const.', uploadedAt: '2025-07-01', size: '9.2 MB' },
    ],
    safetyIssues: [
      { id: 'SAF-004-A', title: 'Proximity to active ammunition handling area', severity: 'CRITICAL', status: 'monitoring', reportedAt: '2025-05-16' },
      { id: 'SAF-004-B', title: 'Inadequate exclusion zone markings at site',   severity: 'HIGH',     status: 'resolved',   reportedAt: '2025-07-05' },
    ],
    recommendations: [
      { id: 'REC-004-A', title: 'Obtain regulatory approval before resuming works', body: 'Project on hold pending NESREA clearance for bunker expansion. Directorate to expedite liaison to prevent further programme slippage. Estimated 60-day approval window.', priority: 'URGENT', status: 'pending', issuedBy: 'Lt Col P.A. Bala', issuedAt: '2025-08-01' },
    ],
  },

  'PRJ-2025-005': {
    milestones: [
      { id: 'M001', title: 'Structural Assessment & Design Review', targetDate: '2025-03-31', completedDate: '2025-03-28', status: 'completed' },
      { id: 'M002', title: 'Demolition & Preparatory Works',       targetDate: '2025-04-30', completedDate: '2025-05-05', status: 'completed' },
      { id: 'M003', title: 'Structural & Civil Upgrade Works',     targetDate: '2025-08-31',                              status: 'in_progress' },
      { id: 'M004', title: 'Comms & Electronics Integration',      targetDate: '2025-11-30',                              status: 'upcoming' },
      { id: 'M005', title: 'Security Fit-Out & Commissioning',     targetDate: '2026-01-31',                              status: 'upcoming' },
    ],
    inspections: [
      { id: 'INS-005-A', title: 'Structural Condition Survey',  date: '2025-03-29', status: 'approved',  score: 74, inspector: 'Maj. F.O. Eze' },
      { id: 'INS-005-B', title: 'Civil Progress Inspection',    date: '2025-08-15', status: 'in_review', score: 70, inspector: 'Maj. F.O. Eze' },
    ],
    documents: [
      { id: 'DOC-005-A', title: 'Tactical Ops Centre BOQ',       type: 'BOQ',     uploadedBy: 'Maj. F.O. Eze',   uploadedAt: '2025-01-25', size: '1.9 MB' },
      { id: 'DOC-005-B', title: 'Upgraded Structural Drawings',  type: 'Drawing', uploadedBy: 'Setraco Nigeria', uploadedAt: '2025-02-15', size: '7.4 MB' },
      { id: 'DOC-005-C', title: 'Q2 2025 Progress Photos',       type: 'Photo',   uploadedBy: 'Maj. F.O. Eze',   uploadedAt: '2025-08-15', size: '31.2 MB' },
    ],
    safetyIssues: [
      { id: 'SAF-005-A', title: 'Classified area access control breach (temporary)',  severity: 'HIGH',   status: 'resolved',   reportedAt: '2025-04-12' },
      { id: 'SAF-005-B', title: 'Insufficient dust suppression on open excavation',  severity: 'MEDIUM', status: 'monitoring', reportedAt: '2025-08-16' },
    ],
    recommendations: [
      { id: 'REC-005-A', title: 'Increase security personnel during night shift', body: 'CCTV installation not yet complete. Contractor to maintain physical security presence during night works to protect classified drawings stored on site.', priority: 'HIGH', status: 'pending', issuedBy: 'Maj. F.O. Eze', issuedAt: '2025-08-15' },
    ],
  },

  'PRJ-2024-011': {
    milestones: [
      { id: 'M001', title: 'Site Survey & Fence Demarcation',    targetDate: '2024-04-30', completedDate: '2024-04-28', status: 'completed' },
      { id: 'M002', title: 'Demolition of Old Fence Structure',  targetDate: '2024-05-31', completedDate: '2024-05-25', status: 'completed' },
      { id: 'M003', title: 'New Perimeter Fence Construction',   targetDate: '2024-08-31', completedDate: '2024-08-20', status: 'completed' },
      { id: 'M004', title: 'Gate & Guardhouse Works',            targetDate: '2024-10-01', completedDate: '2024-09-28', status: 'completed' },
      { id: 'M005', title: 'Final Inspection & Handover',        targetDate: '2024-10-15', completedDate: '2024-10-12', status: 'completed' },
    ],
    inspections: [
      { id: 'INS-011-A', title: 'Construction Progress Inspection', date: '2024-07-15', status: 'approved', score: 90, inspector: 'Capt. B.D. Nwosu' },
      { id: 'INS-011-B', title: 'Final Completion Inspection',      date: '2024-10-12', status: 'approved', score: 93, inspector: 'Capt. B.D. Nwosu' },
    ],
    documents: [
      { id: 'DOC-011-A', title: 'Completion Certificate',    type: 'Certificate', uploadedBy: 'Capt. B.D. Nwosu', uploadedAt: '2024-10-15', size: '160 KB' },
      { id: 'DOC-011-B', title: 'As-Built Fence Layout',     type: 'Drawing',     uploadedBy: 'RCC Nigeria Ltd',  uploadedAt: '2024-10-10', size: '2.8 MB' },
    ],
    safetyIssues: [],
    recommendations: [
      { id: 'REC-011-A', title: 'Schedule perimeter lighting as Phase 2', body: 'Perimeter fence complete but lighting was descoped due to budget constraints. Recommend scheduling Phase 2 to include perimeter security lighting.', priority: 'MEDIUM', status: 'pending', issuedBy: 'Capt. B.D. Nwosu', issuedAt: '2024-10-15' },
    ],
  },
};

// ─── Dashboard summary ────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  metrics: [
    { key: 'active_inspections',      label: 'Active Inspections', value: 14, trend: 'UP',     tone: 'info' },
    { key: 'critical_findings',       label: 'Critical Findings',  value: 3,  trend: 'DOWN',   tone: 'danger' },
    { key: 'average_compliance',      label: 'Avg. Compliance',    value: 78, trend: 'UP',     tone: 'warning' },
    { key: 'open_corrective_actions', label: 'Corrective Actions', value: 22, trend: 'STABLE', tone: 'warning' },
  ],
  posture: {
    readinessAverage:         74,
    safetyRiskLevel:          'MEDIUM',
    evidenceCompleteness:     82,
    restrictedModulesVisible: 2,
  },
  moduleSummaries: [
    { moduleCode: 'BARRACKS', inspections: 18, overdue: 2, averageScore: 76, openCorrectiveActions: 8,  evidenceComplete: 85 },
    { moduleCode: 'WORKSHOP', inspections: 12, overdue: 1, averageScore: 71, openCorrectiveActions: 11, evidenceComplete: 78 },
    { moduleCode: 'OFFICES',  inspections: 9,  overdue: 0, averageScore: 88, openCorrectiveActions: 3,  evidenceComplete: 94 },
    { moduleCode: 'MEDICAL',  inspections: 7,  overdue: 3, averageScore: 65, openCorrectiveActions: 14, evidenceComplete: 61 },
  ],
  severityDistribution: { CRITICAL: 3, HIGH: 9, MEDIUM: 18, LOW: 31 },
  approvalQueue: 2,
  recentActivity: [
    { id: 'ACT-001', action: 'Inspection report submitted — Barracks Block C',             entityType: 'inspection', moduleCode: 'BARRACKS', createdAt: Date.now() - 15 * 60 * 1000,   actorRoleCode: 'INSPECTOR' },
    { id: 'ACT-002', action: 'Critical hazard flagged — Engineering Workshop scaffolding', entityType: 'safety',     moduleCode: 'WORKSHOP', createdAt: Date.now() - 45 * 60 * 1000,   actorRoleCode: 'SAFETY_OFFICER' },
    { id: 'ACT-003', action: 'Corrective action closed — Officers Mess roof leak',         entityType: 'inspection', moduleCode: 'OFFICES',  createdAt: Date.now() - 2 * 3600 * 1000,  actorRoleCode: 'INSPECTOR' },
    { id: 'ACT-004', action: 'New project registered — Medical Centre Extension Phase 2',  entityType: 'project',                            createdAt: Date.now() - 5 * 3600 * 1000,  actorRoleCode: 'PROJECT_MANAGER' },
    { id: 'ACT-005', action: 'Personnel access authorized — Lt Col A.K. Bello',            entityType: 'personnel',                          createdAt: Date.now() - 24 * 3600 * 1000, actorRoleCode: 'ADMIN' },
    { id: 'ACT-006', action: 'Inspection scheduled — Medical Centre Quarterly Audit',      entityType: 'inspection', moduleCode: 'MEDICAL',  createdAt: Date.now() - 26 * 3600 * 1000, actorRoleCode: 'COMMANDING_OFFICER' },
    { id: 'ACT-007', action: 'Report generated — Q1 2026 Compliance Summary',              entityType: 'report',                             createdAt: Date.now() - 48 * 3600 * 1000, actorRoleCode: 'STAFF_OFFICER' },
    { id: 'ACT-008', action: 'Safety alert raised — Inadequate scaffold bracing, Block A', entityType: 'safety',     moduleCode: 'BARRACKS', createdAt: Date.now() - 72 * 3600 * 1000, actorRoleCode: 'SAFETY_OFFICER' },
  ],
  alerts: [
    { id: 'ALT-001', title: 'Critical scaffolding failure risk — Barracks Block A',        severity: 'CRITICAL', moduleCode: 'BARRACKS' },
    { id: 'ALT-002', title: 'Overdue inspection — Medical Centre Q4 Audit (14 days late)', severity: 'HIGH',     moduleCode: 'MEDICAL' },
    { id: 'ALT-003', title: '3 corrective actions past deadline — WORKSHOP module',         severity: 'HIGH',     moduleCode: 'WORKSHOP' },
  ],
};

// ─── Notifications ────────────────────────────────────────────────────────────

export interface MockNotification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: 'NTF-001', type: 'alert',   title: 'Critical Safety Finding',  body: 'Scaffolding failure risk flagged at Barracks Block A',         read: false, createdAt: Date.now() - 30 * 60 * 1000 },
  { id: 'NTF-002', type: 'info',    title: 'Inspection Submitted',      body: 'Barracks Block C inspection report is ready for review',       read: false, createdAt: Date.now() - 90 * 60 * 1000 },
  { id: 'NTF-003', type: 'warning', title: 'Overdue Audit',             body: 'Medical Centre Q4 audit is 14 days overdue',                   read: true,  createdAt: Date.now() - 24 * 3600 * 1000 },
  { id: 'NTF-004', type: 'success', title: 'Project Milestone Reached', body: 'Command Office Complex Rehabilitation marked 100% complete',    read: true,  createdAt: Date.now() - 48 * 3600 * 1000 },
];

// ─── Inspection types ─────────────────────────────────────────────────────────

export type QuestionType = 'boolean' | 'rating' | 'text' | 'risk' | 'select';

export interface MockQuestion {
  id: string;
  code: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  weight: number;
  required: boolean;
}

export interface MockTemplateSection {
  id: string;
  title: string;
  questions: MockQuestion[];
}

export interface MockInspectionTemplate {
  moduleCode: string;
  title: string;
  sections: MockTemplateSection[];
}

export interface MockInspection {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  moduleCode: string;
  inspector: string;
  directorateCode: string;
  status: 'draft' | 'in_progress' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  completionPercent: number;
  score: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Inspection listing (IDs aligned with MOCK_PROJECT_DETAILS) ───────────────

export const MOCK_INSPECTIONS: MockInspection[] = [
  { id: 'INS-001-C', title: 'Q3 2025 Progress Inspection',       projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C',         projectCode: 'DESE/RHB/2025/001', moduleCode: 'BARRACKS', inspector: 'Maj. O.B. Adeyemi',   directorateCode: 'DESE', status: 'submitted', riskLevel: 'MEDIUM',   completionPercent: 75,  score: 76, createdAt: '2025-10-06', updatedAt: '2025-10-08' },
  { id: 'INS-001-B', title: 'Q2 2025 Structural Inspection',     projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C',         projectCode: 'DESE/RHB/2025/001', moduleCode: 'BARRACKS', inspector: 'Maj. O.B. Adeyemi',   directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 79, createdAt: '2025-07-03', updatedAt: '2025-07-10' },
  { id: 'INS-001-A', title: 'Q1 2025 Foundation Inspection',     projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C',         projectCode: 'DESE/RHB/2025/001', moduleCode: 'BARRACKS', inspector: 'Maj. O.B. Adeyemi',   directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 84, createdAt: '2025-04-01', updatedAt: '2025-04-02' },
  { id: 'INS-008-B', title: 'Q2 2025 Structural Inspection',     projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction',     projectCode: 'DEME/NWC/2024/008', moduleCode: 'WORKSHOP', inspector: 'Lt Col C.N. Okafor',  directorateCode: 'DEME', status: 'in_review', riskLevel: 'HIGH',     completionPercent: 90,  score: 68, createdAt: '2025-08-18', updatedAt: '2025-08-20' },
  { id: 'INS-008-A', title: 'Foundation Quality Inspection',     projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction',     projectCode: 'DEME/NWC/2024/008', moduleCode: 'WORKSHOP', inspector: 'Lt Col C.N. Okafor',  directorateCode: 'DEME', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 71, createdAt: '2025-02-08', updatedAt: '2025-02-10' },
  { id: 'INS-003-C', title: 'Final Completion Inspection',       projectId: 'PRJ-2024-003', projectName: 'Command Office Complex Rehabilitation', projectCode: 'DESE/RHB/2024/003', moduleCode: 'OFFICES',  inspector: 'Maj. K.I. Aliyu',     directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 94, createdAt: '2025-02-23', updatedAt: '2025-02-25' },
  { id: 'INS-003-B', title: 'MEP Systems Commissioning',         projectId: 'PRJ-2024-003', projectName: 'Command Office Complex Rehabilitation', projectCode: 'DESE/RHB/2024/003', moduleCode: 'OFFICES',  inspector: 'Maj. K.I. Aliyu',     directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 91, createdAt: '2024-12-20', updatedAt: '2024-12-22' },
  { id: 'INS-002-B', title: 'Structural Progress Inspection',    projectId: 'PRJ-2025-002', projectName: 'Medical Centre Extension — Phase 2',    projectCode: 'DEME/EXT/2025/002', moduleCode: 'MEDICAL',  inspector: 'Capt. A.M. Suleiman', directorateCode: 'DEME', status: 'submitted', riskLevel: 'MEDIUM',   completionPercent: 88,  score: 77, createdAt: '2025-08-28', updatedAt: '2025-08-30' },
  { id: 'INS-002-A', title: 'Foundation Compliance Inspection',  projectId: 'PRJ-2025-002', projectName: 'Medical Centre Extension — Phase 2',    projectCode: 'DEME/EXT/2025/002', moduleCode: 'MEDICAL',  inspector: 'Capt. A.M. Suleiman', directorateCode: 'DEME', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 82, createdAt: '2025-04-08', updatedAt: '2025-04-10' },
  { id: 'INS-004-A', title: 'Pre-Construction Site Inspection',  projectId: 'PRJ-2025-004', projectName: 'Ammunition Storage Facility Upgrade',   projectCode: 'DEME/MNT/2025/004', moduleCode: 'ORDNANCE', inspector: 'Lt Col P.A. Bala',    directorateCode: 'DEME', status: 'approved',  riskLevel: 'CRITICAL', completionPercent: 100, score: 88, createdAt: '2025-05-13', updatedAt: '2025-05-15' },
  { id: 'INS-005-B', title: 'Civil Progress Inspection',         projectId: 'PRJ-2025-005', projectName: 'Tactical Operations Centre Upgrade',    projectCode: 'DESE/RHB/2025/005', moduleCode: 'COMMAND',  inspector: 'Maj. F.O. Eze',       directorateCode: 'DESE', status: 'in_review', riskLevel: 'HIGH',     completionPercent: 85,  score: 70, createdAt: '2025-08-13', updatedAt: '2025-08-15' },
  { id: 'INS-005-A', title: 'Structural Condition Survey',       projectId: 'PRJ-2025-005', projectName: 'Tactical Operations Centre Upgrade',    projectCode: 'DESE/RHB/2025/005', moduleCode: 'COMMAND',  inspector: 'Maj. F.O. Eze',       directorateCode: 'DESE', status: 'approved',  riskLevel: 'MEDIUM',   completionPercent: 100, score: 74, createdAt: '2025-03-27', updatedAt: '2025-03-29' },
  { id: 'INS-011-B', title: 'Final Completion Inspection',       projectId: 'PRJ-2024-011', projectName: 'Perimeter Fence Reconstruction',         projectCode: 'DESE/MNT/2024/011', moduleCode: 'FENCING',  inspector: 'Capt. B.D. Nwosu',    directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 93, createdAt: '2024-10-10', updatedAt: '2024-10-12' },
  { id: 'INS-011-A', title: 'Construction Progress Inspection',  projectId: 'PRJ-2024-011', projectName: 'Perimeter Fence Reconstruction',         projectCode: 'DESE/MNT/2024/011', moduleCode: 'FENCING',  inspector: 'Capt. B.D. Nwosu',    directorateCode: 'DESE', status: 'approved',  riskLevel: 'LOW',      completionPercent: 100, score: 90, createdAt: '2024-07-13', updatedAt: '2024-07-15' },
];

// ─── Dynamic inspection templates ─────────────────────────────────────────────
// Questions are data, not markup — QuestionRenderer maps type → UI component.

export const MOCK_INSPECTION_TEMPLATES: Record<string, MockInspectionTemplate> = {
  BARRACKS: {
    moduleCode: 'BARRACKS',
    title: 'Barracks Facility Inspection Checklist',
    sections: [
      {
        id: 'sec-01',
        title: 'Section 1 — Site & Project Planning',
        questions: [
          { id: 'q-01-01', code: 'S1.01', prompt: 'Has the approved project scope of works been reviewed before commencement?', type: 'boolean', weight: 2, required: true },
          { id: 'q-01-02', code: 'S1.02', prompt: 'Has a pre-construction site survey been completed and documented?',           type: 'boolean', weight: 2, required: true },
          { id: 'q-01-03', code: 'S1.03', prompt: 'Are contractor mobilisation approvals and insurance certificates in place?', type: 'boolean', weight: 2, required: true },
          { id: 'q-01-04', code: 'S1.04', prompt: 'Rate the adequacy of the project programme and work schedule',               type: 'rating',  weight: 3, required: true },
          { id: 'q-01-05', code: 'S1.05', prompt: 'Planning stage observations',                                                type: 'text',    weight: 0, required: false },
        ],
      },
      {
        id: 'sec-02',
        title: 'Section 2 — Structural Works',
        questions: [
          { id: 'q-02-01', code: 'S2.01', prompt: 'Has the concrete mix design been verified by a structural engineer?',        type: 'boolean', weight: 3, required: true },
          { id: 'q-02-02', code: 'S2.02', prompt: 'Are structural drawings approved by the relevant directorate?',              type: 'boolean', weight: 3, required: true },
          { id: 'q-02-03', code: 'S2.03', prompt: 'Is foundation depth consistent with the specification?',                     type: 'boolean', weight: 4, required: true },
          { id: 'q-02-04', code: 'S2.04', prompt: 'Rate the quality of masonry and block-work workmanship',                     type: 'rating',  weight: 4, required: true },
          { id: 'q-02-05', code: 'S2.05', prompt: 'Rate the overall structural integrity observed during this inspection',       type: 'rating',  weight: 5, required: true },
          { id: 'q-02-06', code: 'S2.06', prompt: 'Additional structural observations',                                         type: 'text',    weight: 0, required: false },
        ],
      },
      {
        id: 'sec-03',
        title: 'Section 3 — Electrical Installations',
        questions: [
          { id: 'q-03-01', code: 'S3.01', prompt: 'Are electrical installation drawings approved by a certified engineer?', type: 'boolean', weight: 3, required: true },
          { id: 'q-03-02', code: 'S3.02', prompt: 'Is the earthing and bonding system properly installed and tested?',      type: 'boolean', weight: 4, required: true },
          { id: 'q-03-03', code: 'S3.03', prompt: 'Are all switchboards and distribution boards correctly labelled?',       type: 'boolean', weight: 2, required: true },
          { id: 'q-03-04', code: 'S3.04', prompt: 'Rate the overall quality of electrical installation workmanship',        type: 'rating',  weight: 4, required: true },
        ],
      },
      {
        id: 'sec-04',
        title: 'Section 4 — Plumbing & Sanitation',
        questions: [
          { id: 'q-04-01', code: 'S4.01', prompt: 'Has the water supply system been pressure-tested?',           type: 'boolean', weight: 3, required: true },
          { id: 'q-04-02', code: 'S4.02', prompt: 'Is the drainage gradient within specification tolerance?',     type: 'boolean', weight: 3, required: true },
          { id: 'q-04-03', code: 'S4.03', prompt: 'Rate the quality and condition of sanitary fittings',         type: 'rating',  weight: 3, required: true },
          { id: 'q-04-04', code: 'S4.04', prompt: 'Plumbing and sanitation inspector remarks',                   type: 'text',    weight: 0, required: false },
        ],
      },
      {
        id: 'sec-05',
        title: 'Section 5 — Safety & Hazard Assessment',
        questions: [
          { id: 'q-05-01', code: 'S5.01', prompt: 'Are all workers using appropriate Personal Protective Equipment (PPE)?',      type: 'boolean', weight: 4, required: true },
          { id: 'q-05-02', code: 'S5.02', prompt: 'Is site safety signage adequately displayed at all hazard points?',           type: 'boolean', weight: 3, required: true },
          { id: 'q-05-03', code: 'S5.03', prompt: 'Are first aid facilities available and accessible on site?',                  type: 'boolean', weight: 3, required: true },
          { id: 'q-05-04', code: 'S5.04', prompt: 'What is the overall site safety risk level observed during this inspection?', type: 'risk',    weight: 5, required: true },
          { id: 'q-05-05', code: 'S5.05', prompt: 'Safety observations and hazard notes',                                        type: 'text',    weight: 0, required: false },
        ],
      },
      {
        id: 'sec-06',
        title: 'Section 6 — Compliance & Final Assessment',
        questions: [
          { id: 'q-06-01', code: 'S6.01', prompt: 'Have all defects from the previous inspection been rectified?',              type: 'boolean', weight: 4, required: true },
          { id: 'q-06-02', code: 'S6.02', prompt: 'Is the project on schedule to meet the contracted completion date?',          type: 'boolean', weight: 3, required: true },
          { id: 'q-06-03', code: 'S6.03', prompt: 'Rate the contractor\'s overall performance and cooperation',                  type: 'rating',  weight: 3, required: true },
          { id: 'q-06-04', code: 'S6.04', prompt: 'Rate overall project compliance with approved specifications and standards',  type: 'rating',  weight: 5, required: true },
          { id: 'q-06-05', code: 'S6.05', prompt: 'Final inspector assessment notes',                                            type: 'text',    weight: 0, required: false },
        ],
      },
    ],
  },

  WORKSHOP: {
    moduleCode: 'WORKSHOP',
    title: 'Engineering Workshop Construction Inspection',
    sections: [
      {
        id: 'sec-01',
        title: 'Section 1 — Site & Preliminary Works',
        questions: [
          { id: 'q-01-01', code: 'S1.01', prompt: 'Has the soil investigation report been reviewed and approved by the engineer?', type: 'boolean', weight: 3, required: true },
          { id: 'q-01-02', code: 'S1.02', prompt: 'Are all relevant construction permits and approvals in place?',                  type: 'boolean', weight: 3, required: true },
          { id: 'q-01-03', code: 'S1.03', prompt: 'Rate site access control, security, and demarcation arrangements',              type: 'rating',  weight: 3, required: true },
        ],
      },
      {
        id: 'sec-02',
        title: 'Section 2 — Structural & Civil Works',
        questions: [
          { id: 'q-02-01', code: 'S2.01', prompt: 'Is the concrete mix design compliant with engineer specifications?',            type: 'boolean', weight: 4, required: true },
          { id: 'q-02-02', code: 'S2.02', prompt: 'Are reinforcement bar sizes and spacings as per approved structural drawings?', type: 'boolean', weight: 5, required: true },
          { id: 'q-02-03', code: 'S2.03', prompt: 'Rate the quality of formwork and shuttering',                                   type: 'rating',  weight: 3, required: true },
          { id: 'q-02-04', code: 'S2.04', prompt: 'Rate the overall quality of structural concrete works',                         type: 'rating',  weight: 5, required: true },
          { id: 'q-02-05', code: 'S2.05', prompt: 'Additional structural observations',                                            type: 'text',    weight: 0, required: false },
        ],
      },
      {
        id: 'sec-03',
        title: 'Section 3 — Safety Assessment',
        questions: [
          { id: 'q-03-01', code: 'S3.01', prompt: 'Are crane and heavy equipment operations supervised by certified personnel?', type: 'boolean', weight: 5, required: true },
          { id: 'q-03-02', code: 'S3.02', prompt: 'Are all excavations adequately shored and barricaded?',                       type: 'boolean', weight: 5, required: true },
          { id: 'q-03-03', code: 'S3.03', prompt: 'What is the current risk level for the heavy construction operations?',        type: 'risk',    weight: 5, required: true },
          { id: 'q-03-04', code: 'S3.04', prompt: 'Safety and hazard observations',                                              type: 'text',    weight: 0, required: false },
        ],
      },
    ],
  },
};
