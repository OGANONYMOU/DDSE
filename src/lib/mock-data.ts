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

// ─── Safety & Hazard Assessment System ────────────────────────────────────────

export type HazardCategory =
  | 'Electrical Safety'
  | 'Ventilation'
  | 'Hazardous Substances'
  | 'Fueling Operations'
  | 'Noise Control'
  | 'Material Handling'
  | 'Fire Protection'
  | 'PPE Compliance'
  | 'Walkways & Access'
  | 'Equipment Safety';

export type SafetyRiskLevel  = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'under_review';
export type SafetyWorkflow   = 'open' | 'investigating' | 'action_required' | 'escalated' | 'resolved' | 'closed';

export interface MockHazardCheckItem {
  id:        string;
  prompt:    string;
  compliant: boolean | null;
  notes:     string;
}

export interface MockCorrectiveAction {
  id:             string;
  recommendation: string;
  department:     string;
  urgency:        'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate:        string;
  status:         'pending' | 'in_progress' | 'resolved';
}

export interface MockHazardAssessment {
  id:                string;
  projectId:         string;
  projectName:       string;
  projectCode:       string;
  directorateCode:   string;
  category:          HazardCategory;
  hazardTitle:       string;
  riskLevel:         SafetyRiskLevel;
  complianceStatus:  ComplianceStatus;
  workflowStatus:    SafetyWorkflow;
  inspector:         string;
  observations:      string;
  checkItems:        MockHazardCheckItem[];
  correctiveActions: MockCorrectiveAction[];
  createdAt:         string;
  updatedAt:         string;
}

export const MOCK_HAZARD_ASSESSMENTS: MockHazardAssessment[] = [
  {
    id: 'HAZ-001', projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C',
    projectCode: 'DESE/RHB/2025/001', directorateCode: 'DESE',
    category: 'Electrical Safety', hazardTitle: 'Exposed Live Wiring — Block C Ground Floor',
    riskLevel: 'HIGH', complianceStatus: 'non_compliant', workflowStatus: 'action_required',
    inspector: 'Maj. O.B. Adeyemi', createdAt: '2025-09-12', updatedAt: '2025-10-05',
    observations: 'Exposed wiring observed at three junction points on the ground floor corridor. Conduit capping missing on service riser between rooms 104 and 106. No earthing bond visible on distribution board DB-02.',
    checkItems: [
      { id: 'ci-001-1', prompt: 'All live wiring concealed within approved conduits or trunking',                 compliant: false, notes: 'Exposed runs found in corridor 1A' },
      { id: 'ci-001-2', prompt: 'Distribution boards properly labelled and circuit breakers correctly rated',    compliant: true,  notes: '' },
      { id: 'ci-001-3', prompt: 'Earthing and bonding system tested and certificate available',                  compliant: false, notes: 'Certificate not produced on site' },
      { id: 'ci-001-4', prompt: 'No unauthorized electrical modifications made by site workers',                 compliant: true,  notes: '' },
      { id: 'ci-001-5', prompt: 'Temporary power cables properly routed and protected from damage',              compliant: false, notes: 'Cable draped across walkway near stairwell' },
    ],
    correctiveActions: [
      { id: 'ca-001-1', recommendation: 'Enclose all exposed wiring in GI conduit and seal all junction boxes', department: 'Electrical Sub-Contractor', urgency: 'IMMEDIATE', dueDate: '2025-10-15', status: 'in_progress' },
      { id: 'ca-001-2', recommendation: 'Commission independent electrical test and obtain ICAN-certified earthing certificate', department: 'Project Consultant', urgency: 'HIGH', dueDate: '2025-10-30', status: 'pending' },
    ],
  },
  {
    id: 'HAZ-002', projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C',
    projectCode: 'DESE/RHB/2025/001', directorateCode: 'DESE',
    category: 'PPE Compliance', hazardTitle: 'Inadequate PPE Enforcement — Block C Site Workers',
    riskLevel: 'MODERATE', complianceStatus: 'partial', workflowStatus: 'investigating',
    inspector: 'Maj. O.B. Adeyemi', createdAt: '2025-09-12', updatedAt: '2025-09-30',
    observations: 'Safety helmets observed on approximately 60% of workers during site visit. Several operatives working at height on scaffolding without safety harnesses. Site supervisor confirmed harnesses are available but not enforced.',
    checkItems: [
      { id: 'ci-002-1', prompt: 'All workers wearing hard hats at all times within the construction zone',   compliant: false, notes: '4 of 11 workers without hard hats' },
      { id: 'ci-002-2', prompt: 'Safety harnesses worn and anchored for all work at heights above 2 metres', compliant: false, notes: 'Workers on 4m scaffold without harness' },
      { id: 'ci-002-3', prompt: 'Safety boots (steel-toe) worn by all operatives',                          compliant: true,  notes: '' },
      { id: 'ci-002-4', prompt: 'High-visibility vests worn in all vehicle movement areas',                 compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-002-1', recommendation: 'Issue formal warning to contractor; enforce daily PPE toolbox talk', department: 'Safety Officer', urgency: 'HIGH', dueDate: '2025-10-10', status: 'in_progress' },
    ],
  },
  {
    id: 'HAZ-003', projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction',
    projectCode: 'DEME/NWC/2024/008', directorateCode: 'DEME',
    category: 'Fire Protection', hazardTitle: 'Inadequate Fire Suppression — Workshop Fuel Store',
    riskLevel: 'CRITICAL', complianceStatus: 'non_compliant', workflowStatus: 'escalated',
    inspector: 'Lt Col C.N. Okafor', createdAt: '2025-07-18', updatedAt: '2025-08-20',
    observations: 'Temporary fuel store holding generator diesel adjacent to main workshop steel structure. No fire suppression system installed. Portable extinguishers absent. Smoking noted within 10 metres of the fuel store.',
    checkItems: [
      { id: 'ci-003-1', prompt: 'Approved fire suppression system installed in fuel and flammable materials store', compliant: false, notes: 'No system present' },
      { id: 'ci-003-2', prompt: 'Minimum two CO2/dry powder extinguishers at each exit from fuel area',            compliant: false, notes: 'Zero extinguishers in area' },
      { id: 'ci-003-3', prompt: 'No smoking / no naked flame signage displayed at fuel store perimeter',           compliant: false, notes: 'No signage installed' },
      { id: 'ci-003-4', prompt: 'Fuel containers stored in bunded enclosure with spill containment',              compliant: false, notes: 'Drums on bare ground' },
      { id: 'ci-003-5', prompt: 'Fire evacuation routes marked and clear of obstruction',                        compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-003-1', recommendation: 'Relocate fuel store beyond 15m from structure and install bunded enclosure', department: 'Site Engineer', urgency: 'IMMEDIATE', dueDate: '2025-08-25', status: 'in_progress' },
      { id: 'ca-003-2', recommendation: 'Install extinguishers and no-smoking signage; conduct emergency fire drill',  department: 'Safety Officer', urgency: 'IMMEDIATE', dueDate: '2025-08-25', status: 'pending' },
      { id: 'ca-003-3', recommendation: 'Submit escalation report to Director of Military Engineering',                department: 'Directorate DEME', urgency: 'HIGH', dueDate: '2025-08-22', status: 'resolved' },
    ],
  },
  {
    id: 'HAZ-004', projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction',
    projectCode: 'DEME/NWC/2024/008', directorateCode: 'DEME',
    category: 'Equipment Safety', hazardTitle: 'Uncertified Scaffolding — Workshop Block A',
    riskLevel: 'HIGH', complianceStatus: 'partial', workflowStatus: 'investigating',
    inspector: 'Lt Col C.N. Okafor', createdAt: '2025-08-01', updatedAt: '2025-08-18',
    observations: 'Scaffolding on the north face of Block A shows inadequate cross-bracing at levels 3 and 4. No scaffold tag visible confirming third-party inspection. Two base plates not sitting level on adequate sole boards.',
    checkItems: [
      { id: 'ci-004-1', prompt: 'Scaffold erected by competent contractor with current certification',       compliant: null,  notes: 'Certification not presented' },
      { id: 'ci-004-2', prompt: 'Scaffold inspection tag (weekly) visible and current',                     compliant: false, notes: 'No tag found on structure' },
      { id: 'ci-004-3', prompt: 'Cross-bracing installed at all required levels per design drawings',       compliant: false, notes: 'Levels 3 & 4 lacking bracing' },
      { id: 'ci-004-4', prompt: 'Base plates and sole boards correctly positioned on stable ground',        compliant: false, notes: '2 uprights tilted on soft ground' },
      { id: 'ci-004-5', prompt: 'Guard rails and toe boards fitted at all open edges above 2 metres',      compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-004-1', recommendation: 'Halt use of scaffold at levels 3 & 4 until re-inspection by certified scaffold inspector', department: 'Site Engineer', urgency: 'IMMEDIATE', dueDate: '2025-08-22', status: 'in_progress' },
    ],
  },
  {
    id: 'HAZ-005', projectId: 'PRJ-2024-003', projectName: 'Command Office Complex Rehabilitation',
    projectCode: 'DESE/RHB/2024/003', directorateCode: 'DESE',
    category: 'Electrical Safety', hazardTitle: 'Post-Completion Electrical Certification',
    riskLevel: 'LOW', complianceStatus: 'compliant', workflowStatus: 'closed',
    inspector: 'Maj. K.I. Aliyu', createdAt: '2025-01-15', updatedAt: '2025-02-28',
    observations: 'All electrical installations verified compliant with IEE wiring regulations. Earthing test certificates produced and filed. Distribution boards labelled and load balanced.',
    checkItems: [
      { id: 'ci-005-1', prompt: 'IEE electrical installation certificate obtained from certified contractor', compliant: true, notes: '' },
      { id: 'ci-005-2', prompt: 'All circuit breakers and RCDs tested and functioning correctly',           compliant: true, notes: '' },
      { id: 'ci-005-3', prompt: 'Earthing and bonding verified and test certificate on file',               compliant: true, notes: '' },
      { id: 'ci-005-4', prompt: 'Lightning protection system installed and commissioned',                   compliant: true, notes: '' },
    ],
    correctiveActions: [],
  },
  {
    id: 'HAZ-006', projectId: 'PRJ-2026-001', projectName: "Officers' Mess Renovation",
    projectCode: 'DESE/RHB/2026/001', directorateCode: 'DESE',
    category: 'Ventilation', hazardTitle: 'Inadequate Mechanical Ventilation — Kitchen Block',
    riskLevel: 'MODERATE', complianceStatus: 'under_review', workflowStatus: 'investigating',
    inspector: 'Maj. F.O. Eze', createdAt: '2026-01-10', updatedAt: '2026-02-05',
    observations: 'Kitchen extract ventilation design under review by consultant. Proposed extract rate appears insufficient for the planned cooking equipment load. Grease trap and filter provision not yet addressed in drawings.',
    checkItems: [
      { id: 'ci-006-1', prompt: 'Ventilation design approved by certified building services engineer',         compliant: null,  notes: 'Design still under review' },
      { id: 'ci-006-2', prompt: 'Extract rates calculated and validated for all kitchen equipment loads',     compliant: false, notes: 'Calculation not yet submitted' },
      { id: 'ci-006-3', prompt: 'Grease filters and grease trap included in kitchen extract system design',  compliant: false, notes: 'Not addressed in current drawings' },
      { id: 'ci-006-4', prompt: 'Fresh air supply rates meet minimum standards for occupancy',               compliant: null,  notes: 'Pending design finalisation' },
    ],
    correctiveActions: [
      { id: 'ca-006-1', recommendation: 'Instruct consultant to resubmit kitchen ventilation design with full load calculations within 14 days', department: 'Project Consultant', urgency: 'MEDIUM', dueDate: '2026-02-20', status: 'pending' },
    ],
  },
  {
    id: 'HAZ-007', projectId: 'PRJ-2025-002', projectName: 'Medical Centre Extension — Phase 2',
    projectCode: 'DEME/EXT/2025/002', directorateCode: 'DEME',
    category: 'Hazardous Substances', hazardTitle: 'Medical Waste Containment & COSHH Compliance',
    riskLevel: 'HIGH', complianceStatus: 'non_compliant', workflowStatus: 'action_required',
    inspector: 'Capt. A.M. Suleiman', createdAt: '2025-07-14', updatedAt: '2025-08-30',
    observations: 'Medical waste storage area does not meet COSHH requirements. Clinical waste bins not correctly segregated by hazard type. No COSHH data sheets available on site for chemical cleaning agents used in the works area.',
    checkItems: [
      { id: 'ci-007-1', prompt: 'COSHH assessment completed for all hazardous substances on site',                    compliant: false, notes: 'Assessment not produced' },
      { id: 'ci-007-2', prompt: 'Safety data sheets (SDS) available on site for all chemical products',              compliant: false, notes: 'No SDS binder on site' },
      { id: 'ci-007-3', prompt: 'Medical/clinical waste correctly segregated into colour-coded containers',           compliant: false, notes: 'Mixed waste found in single bin' },
      { id: 'ci-007-4', prompt: 'All hazardous substances stored in locked, labelled, ventilated store',             compliant: true,  notes: '' },
      { id: 'ci-007-5', prompt: 'Workers handling hazardous substances trained and records available',               compliant: null,  notes: 'Training records not presented' },
    ],
    correctiveActions: [
      { id: 'ca-007-1', recommendation: 'Prepare full COSHH assessment and provide SDS folders to all work areas within 7 days', department: 'Contractor Safety Coordinator', urgency: 'HIGH', dueDate: '2025-09-07', status: 'in_progress' },
      { id: 'ca-007-2', recommendation: 'Provide colour-coded clinical waste bins and brief all staff on segregation protocol', department: 'Site Engineer', urgency: 'HIGH', dueDate: '2025-09-10', status: 'pending' },
    ],
  },
  {
    id: 'HAZ-008', projectId: 'PRJ-2025-004', projectName: 'Ammunition Storage Facility Upgrade',
    projectCode: 'DEME/MNT/2025/004', directorateCode: 'DEME',
    category: 'Fueling Operations', hazardTitle: 'Generator Fuel Handling — Ordnance Proximity',
    riskLevel: 'CRITICAL', complianceStatus: 'non_compliant', workflowStatus: 'escalated',
    inspector: 'Lt Col P.A. Bala', createdAt: '2025-05-20', updatedAt: '2025-07-01',
    observations: 'Generator fuel top-up operations conducted within the exclusion zone of the ammunition storage area. No spill kit present. Earthing cables not connected during fuel transfer. Class A hazard under military engineering safety protocols.',
    checkItems: [
      { id: 'ci-008-1', prompt: 'All fuel handling at least 50m from any explosive or ordnance store',     compliant: false, notes: 'Generator sits 18m from store' },
      { id: 'ci-008-2', prompt: 'Static earthing cables connected during all fuel transfer operations',   compliant: false, notes: 'No earthing cables observed' },
      { id: 'ci-008-3', prompt: 'Spill kit immediately available at fuel point',                          compliant: false, notes: 'No spill kit on site' },
      { id: 'ci-008-4', prompt: 'Fire watch posted during all fueling operations',                        compliant: false, notes: 'No fire watch established' },
      { id: 'ci-008-5', prompt: 'Fueling operations logged in site register',                             compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-008-1', recommendation: 'Suspend all fueling operations until generator relocated beyond 50m exclusion zone', department: 'Site Engineer', urgency: 'IMMEDIATE', dueDate: '2025-05-25', status: 'resolved' },
      { id: 'ca-008-2', recommendation: 'Procure static earthing kit and spill response kit before resuming fuel operations', department: 'Logistics Officer', urgency: 'IMMEDIATE', dueDate: '2025-06-01', status: 'in_progress' },
    ],
  },
  {
    id: 'HAZ-009', projectId: 'PRJ-2025-004', projectName: 'Ammunition Storage Facility Upgrade',
    projectCode: 'DEME/MNT/2025/004', directorateCode: 'DEME',
    category: 'Material Handling', hazardTitle: 'Heavy Precast Element Lifting Operations',
    riskLevel: 'HIGH', complianceStatus: 'partial', workflowStatus: 'action_required',
    inspector: 'Lt Col P.A. Bala', createdAt: '2025-06-03', updatedAt: '2025-07-01',
    observations: 'Crane used for precast roof slab installation lacks current LOLER inspection certificate. Slinging arrangement on two panels did not match the approved method statement. Exclusion zone during lifts not maintained to required radius.',
    checkItems: [
      { id: 'ci-009-1', prompt: 'Crane holds valid LOLER inspection certificate (within 12 months)',               compliant: false, notes: 'Certificate expired March 2025' },
      { id: 'ci-009-2', prompt: 'Lifting operation carried out per approved method statement',                    compliant: false, notes: 'Slinging deviation on 2 panels' },
      { id: 'ci-009-3', prompt: 'Exclusion zone established and enforced during all overhead lifts',              compliant: false, notes: 'Workers within 3m of load path' },
      { id: 'ci-009-4', prompt: 'Appointed lifting supervisor present and directing all lifts',                  compliant: true,  notes: '' },
      { id: 'ci-009-5', prompt: 'All lifting accessories marked with SWL and within test date',                  compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-009-1', recommendation: 'Halt crane operations and obtain LOLER re-inspection before next lift',           department: 'Contractor Site Manager', urgency: 'IMMEDIATE', dueDate: '2025-07-10', status: 'in_progress' },
      { id: 'ca-009-2', recommendation: 'Re-brief lifting team on approved method statement and exclusion zone protocol', department: 'Appointed Person', urgency: 'HIGH', dueDate: '2025-07-08', status: 'pending' },
    ],
  },
  {
    id: 'HAZ-010', projectId: 'PRJ-2025-005', projectName: 'Tactical Operations Centre Upgrade',
    projectCode: 'DESE/RHB/2025/005', directorateCode: 'DESE',
    category: 'Walkways & Access', hazardTitle: 'Obstructed Emergency Egress — Operations Wing',
    riskLevel: 'MODERATE', complianceStatus: 'partial', workflowStatus: 'open',
    inspector: 'Maj. F.O. Eze', createdAt: '2025-07-22', updatedAt: '2025-08-10',
    observations: 'Construction materials stored in corridor C blocking emergency exit route. Fire door to stairwell 2 requires a key to open from both sides. Signage for alternative egress route is missing.',
    checkItems: [
      { id: 'ci-010-1', prompt: 'All emergency exit routes free of materials and obstructions', compliant: false, notes: 'Corridor C blocked by rebar bundles' },
      { id: 'ci-010-2', prompt: 'Fire doors operational from both sides without a key',        compliant: false, notes: 'Stairwell 2 door requires key from inside' },
      { id: 'ci-010-3', prompt: 'Emergency exit signage illuminated and visible throughout',   compliant: false, notes: 'Alternative route sign missing' },
      { id: 'ci-010-4', prompt: 'Minimum 1200mm clear width in all circulation routes',       compliant: true,  notes: '' },
    ],
    correctiveActions: [
      { id: 'ca-010-1', recommendation: 'Remove all materials from corridor C and maintain clear egress at all times', department: 'Site Foreman', urgency: 'HIGH', dueDate: '2025-08-15', status: 'pending' },
    ],
  },
  {
    id: 'HAZ-011', projectId: 'PRJ-2025-005', projectName: 'Tactical Operations Centre Upgrade',
    projectCode: 'DESE/RHB/2025/005', directorateCode: 'DESE',
    category: 'Noise Control', hazardTitle: 'Noise Assessment — Operational Zone Proximity',
    riskLevel: 'LOW', complianceStatus: 'compliant', workflowStatus: 'resolved',
    inspector: 'Maj. F.O. Eze', createdAt: '2025-04-08', updatedAt: '2025-05-02',
    observations: 'Noise levels measured and found within acceptable limits at the operational zone boundary. Noisy activities restricted to 08:00–17:00. Workers in high-noise areas using ear defenders.',
    checkItems: [
      { id: 'ci-011-1', prompt: 'Noise assessment conducted and limits confirmed at operational zone boundary', compliant: true, notes: '' },
      { id: 'ci-011-2', prompt: 'Noisy works restricted to approved working hours',                            compliant: true, notes: '' },
      { id: 'ci-011-3', prompt: 'Ear protection provided and worn in all high-noise areas',                   compliant: true, notes: '' },
      { id: 'ci-011-4', prompt: 'Noise monitoring log maintained on site',                                    compliant: true, notes: '' },
    ],
    correctiveActions: [],
  },
  {
    id: 'HAZ-012', projectId: 'PRJ-2024-011', projectName: 'Perimeter Fence Reconstruction — Phase 1',
    projectCode: 'DESE/MNT/2024/011', directorateCode: 'DESE',
    category: 'PPE Compliance', hazardTitle: 'PPE Compliance — Perimeter Fence Works',
    riskLevel: 'MODERATE', complianceStatus: 'compliant', workflowStatus: 'resolved',
    inspector: 'Capt. B.D. Nwosu', createdAt: '2024-07-05', updatedAt: '2024-10-15',
    observations: 'Initial inspection identified non-compliance with cut-resistant glove requirement for wire handling. Issue rectified within 48 hours. Subsequent visits confirmed full PPE compliance across all fence installation crews.',
    checkItems: [
      { id: 'ci-012-1', prompt: 'Cut-resistant gloves worn during all wire strand and barbed wire handling',  compliant: true, notes: 'Rectified after initial finding' },
      { id: 'ci-012-2', prompt: 'Hard hats worn at all times within the construction corridor',               compliant: true, notes: '' },
      { id: 'ci-012-3', prompt: 'Safety boots with puncture-resistant sole worn by all workers',              compliant: true, notes: '' },
      { id: 'ci-012-4', prompt: 'High-visibility vests worn in roadside sections of perimeter works',         compliant: true, notes: '' },
    ],
    correctiveActions: [],
  },
];

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType =
  | 'Inspection Report'
  | 'Hazard Assessment Report'
  | 'Project Progress Report'
  | 'Contractor Evaluation'
  | 'Compliance Summary'
  | 'Safety Violation Report'
  | 'Operational Readiness Summary';

export type ReportStatus         = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type ReportClassification = 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL';

export interface MockReportFinding {
  id:             string;
  category:       string;
  description:    string;
  severity:       'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

export interface MockReport {
  id:                string;
  type:              ReportType;
  title:             string;
  projectId?:        string;
  projectName?:      string;
  projectCode?:      string;
  directorateCode:   string;
  classification:    ReportClassification;
  generatedBy:       string;
  status:            ReportStatus;
  createdAt:         string;
  updatedAt:         string;
  executiveSummary:  string;
  findings:          MockReportFinding[];
  safetyFindings:    string[];
  recommendations:   string[];
  approvedBy?:       string;
  approvedAt?:       string;
}

export const MOCK_REPORTS: MockReport[] = [
  {
    id: 'RPT-2025-001', type: 'Inspection Report',
    title: 'Q3 2025 Progress Inspection — Barracks Block C',
    projectId: 'PRJ-2025-001', projectName: 'Barracks Renovation — Block C', projectCode: 'DESE/RHB/2025/001',
    directorateCode: 'DESE', classification: 'UNCLASSIFIED',
    generatedBy: 'Maj. O.B. Adeyemi', status: 'approved',
    createdAt: '2025-10-08', updatedAt: '2025-10-10',
    approvedBy: 'Lt Col E.K. Hassan', approvedAt: '2025-10-10',
    executiveSummary: 'The Q3 2025 progress inspection of Barracks Block C was conducted on 6 October 2025. Structural works are 75% complete. Key concerns include exposed electrical wiring on the ground floor and scaffold non-compliance. Contractor performance is satisfactory overall, though safety enforcement requires immediate attention.',
    findings: [
      { id: 'f-001-1', category: 'Structural', description: 'Masonry blockwork on first floor is progressing in accordance with approved drawings.', severity: 'LOW', recommendation: 'Continue monitoring against programme.' },
      { id: 'f-001-2', category: 'Electrical', description: 'Exposed live wiring observed at three junction points on the ground floor corridor.', severity: 'HIGH', recommendation: 'Immediately enclose in GI conduit; obtain earthing certificate.' },
      { id: 'f-001-3', category: 'Safety', description: 'Approximately 40% of workers not wearing hard hats during site visit.', severity: 'MEDIUM', recommendation: 'Issue formal warning; enforce daily PPE briefing.' },
    ],
    safetyFindings: [
      'Workers on scaffolding at 4m height observed without safety harnesses.',
      'Temporary power cable routed across pedestrian walkway adjacent to stairwell.',
    ],
    recommendations: [
      'Enclose all exposed wiring in GI conduit within 7 days.',
      'Issue formal PPE enforcement notice to contractor site manager.',
      'Commission independent electrical inspection before next phase.',
    ],
  },
  {
    id: 'RPT-2025-002', type: 'Hazard Assessment Report',
    title: 'Critical Fire Hazard — Engineering Workshop Fuel Store',
    projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction', projectCode: 'DEME/NWC/2024/008',
    directorateCode: 'DEME', classification: 'RESTRICTED',
    generatedBy: 'Lt Col C.N. Okafor', status: 'approved',
    createdAt: '2025-08-22', updatedAt: '2025-08-24',
    approvedBy: 'Col R.A. Dangana', approvedAt: '2025-08-24',
    executiveSummary: 'A critical fire hazard was identified at the Engineering Workshop Construction site on 18 July 2025. A temporary diesel fuel store has been positioned adjacent to the main workshop steel structure without any fire suppression provisions. This constitutes an immediate risk to life and property. Escalation to Directorate level has been initiated.',
    findings: [
      { id: 'f-002-1', category: 'Fire Protection', description: 'No fire suppression system, portable extinguishers, or safety signage present at the fuel store.', severity: 'CRITICAL', recommendation: 'Immediate installation of extinguishers and no-smoking signage.' },
      { id: 'f-002-2', category: 'Storage', description: 'Diesel drums stored directly on bare ground without bunded containment.', severity: 'CRITICAL', recommendation: 'Install bunded spill containment enclosure before resuming fuel operations.' },
    ],
    safetyFindings: [
      'Fuel store positioned within 20 metres of workshop steel structure — minimum clearance is 15 metres.',
      'No fire watch posted during fueling operations.',
    ],
    recommendations: [
      'Halt all fuel storage operations until relocation to a compliant area.',
      'Install bunded containment, extinguishers, and mandatory signage.',
      'Conduct site-wide fire emergency drill within 14 days.',
    ],
  },
  {
    id: 'RPT-2025-003', type: 'Project Progress Report',
    title: 'Q3 2025 Progress Summary — Medical Centre Extension Phase 2',
    projectId: 'PRJ-2025-002', projectName: 'Medical Centre Extension — Phase 2', projectCode: 'DEME/EXT/2025/002',
    directorateCode: 'DEME', classification: 'UNCLASSIFIED',
    generatedBy: 'Capt. A.M. Suleiman', status: 'pending_review',
    createdAt: '2025-09-05', updatedAt: '2025-09-05',
    executiveSummary: 'The Medical Centre Extension Phase 2 project is currently 62% complete against a programme target of 70%. A 2-week delay is attributable to late delivery of specialist medical services equipment. COSHH compliance deficiencies were noted during the inspection of 14 July 2025 and are subject to a separate Hazard Assessment Report.',
    findings: [
      { id: 'f-003-1', category: 'Programme', description: 'Project is 8% behind scheduled programme. Contractor has submitted recovery plan.', severity: 'MEDIUM', recommendation: 'Monitor recovery plan milestones closely over next 4 weeks.' },
      { id: 'f-003-2', category: 'Quality', description: 'Structural concrete in the new ward block has passed all cube test results to date.', severity: 'LOW', recommendation: 'Continue monitoring testing regime.' },
    ],
    safetyFindings: [
      'Medical waste segregation non-compliance identified — COSHH assessment outstanding.',
    ],
    recommendations: [
      'Enforce recovery programme; weekly progress meetings with contractor PM.',
      'Close out COSHH non-compliance within 7 days — separate action assigned.',
    ],
  },
  {
    id: 'RPT-2025-004', type: 'Compliance Summary',
    title: 'Q2 2025 Compliance Summary — Directorate DESE',
    directorateCode: 'DESE', classification: 'RESTRICTED',
    generatedBy: 'Maj. F.O. Eze', status: 'approved',
    createdAt: '2025-07-30', updatedAt: '2025-08-02',
    approvedBy: 'Lt Col E.K. Hassan', approvedAt: '2025-08-02',
    executiveSummary: 'This report summarises the compliance performance of all DESE-managed construction projects during Q2 2025 (April–June). Average compliance score across 4 active projects was 76%. Key non-conformances relate to PPE enforcement and documentation completeness. One project (Barracks Block C) has been issued a formal improvement notice.',
    findings: [
      { id: 'f-004-1', category: 'PPE Compliance', description: 'PPE non-compliance identified on 2 of 4 DESE projects during the quarter.', severity: 'MEDIUM', recommendation: 'Mandatory PPE audit to be conducted at the start of each calendar month.' },
      { id: 'f-004-2', category: 'Documentation', description: 'As-built drawing submissions are 3 weeks overdue on the Officers Mess project.', severity: 'HIGH', recommendation: 'Issue contractual notice requiring submission within 14 days.' },
    ],
    safetyFindings: [
      'Safety management plan not updated since project commencement on one project.',
      'First aid box contents found expired on two separate site visits.',
    ],
    recommendations: [
      'Conduct mandatory monthly PPE audit across all DESE sites.',
      'Issue contractual notice for overdue as-built drawings.',
      'Update Safety Management Plans on all active projects.',
    ],
  },
  {
    id: 'RPT-2025-005', type: 'Safety Violation Report',
    title: 'Class A Safety Violation — Ammunition Storage Facility',
    projectId: 'PRJ-2025-004', projectName: 'Ammunition Storage Facility Upgrade', projectCode: 'DEME/MNT/2025/004',
    directorateCode: 'DEME', classification: 'CONFIDENTIAL',
    generatedBy: 'Lt Col P.A. Bala', status: 'approved',
    createdAt: '2025-05-22', updatedAt: '2025-05-25',
    approvedBy: 'Col R.A. Dangana', approvedAt: '2025-05-25',
    executiveSummary: 'A Class A safety violation was identified on 20 May 2025 at the Ammunition Storage Facility Upgrade site. Generator fueling operations were being conducted within the ordnance exclusion zone without earthing, spill containment, or fire watch. Operations were immediately suspended. This report documents the violation, corrective actions taken, and preventive measures required.',
    findings: [
      { id: 'f-005-1', category: 'Exclusion Zone', description: 'Generator positioned 18m from ordnance store — minimum clearance is 50m.', severity: 'CRITICAL', recommendation: 'Immediate relocation of generator beyond 50m exclusion boundary.' },
      { id: 'f-005-2', category: 'Fuel Safety', description: 'No static earthing cables connected during fuel transfer. No spill kit on site.', severity: 'CRITICAL', recommendation: 'Procure earthing equipment and spill kit before operations resume.' },
    ],
    safetyFindings: [
      'No fire watch posted during fuel transfer operations adjacent to ordnance store.',
      'Fueling contractor not briefed on ordnance exclusion zone requirements.',
    ],
    recommendations: [
      'Suspend all fuel operations until generator relocation is completed and verified.',
      'Mandatory safety briefing for all site contractors on ordnance exclusion requirements.',
      'Formal disciplinary review of site supervision to be conducted by Directorate.',
    ],
  },
  {
    id: 'RPT-2025-006', type: 'Contractor Evaluation',
    title: 'Contractor Performance Evaluation — Kaduna Engineering Ltd',
    projectId: 'PRJ-2024-008', projectName: 'Engineering Workshop Construction', projectCode: 'DEME/NWC/2024/008',
    directorateCode: 'DEME', classification: 'RESTRICTED',
    generatedBy: 'Lt Col C.N. Okafor', status: 'draft',
    createdAt: '2025-10-01', updatedAt: '2025-10-01',
    executiveSummary: 'Mid-project performance evaluation of Kaduna Engineering Ltd on the Engineering Workshop Construction. Assessment covers programme compliance, quality of workmanship, safety management, and sub-contractor management. Overall performance is assessed as MARGINAL — improvements required in safety enforcement before final payment recommendation.',
    findings: [
      { id: 'f-006-1', category: 'Programme', description: 'Project is 3 weeks behind the contracted programme. Recovery plan submitted but not yet proven.', severity: 'MEDIUM', recommendation: 'Formal programme recovery meeting; bi-weekly progress reporting required.' },
      { id: 'f-006-2', category: 'Quality', description: 'Concrete cube test results are consistently passing to date.', severity: 'LOW', recommendation: 'Maintain current testing regime.' },
      { id: 'f-006-3', category: 'Safety', description: 'Two safety violations identified during the contract period — fuel store and scaffold.', severity: 'HIGH', recommendation: 'Issue formal improvement notice; withhold retention until resolved.' },
    ],
    safetyFindings: [
      'Two separate safety violations documented during the contract period.',
      'Scaffold inspection regime not maintained as required by contract.',
    ],
    recommendations: [
      'Issue formal performance improvement notice referencing safety violations.',
      'Withhold 5% retention until safety compliance is independently verified.',
    ],
  },
  {
    id: 'RPT-2025-007', type: 'Operational Readiness Summary',
    title: 'Q3 2025 Operational Readiness Summary — Directorate DEME',
    directorateCode: 'DEME', classification: 'RESTRICTED',
    generatedBy: 'Col R.A. Dangana', status: 'pending_review',
    createdAt: '2025-10-15', updatedAt: '2025-10-15',
    executiveSummary: 'This quarterly summary assesses the operational readiness of all DEME-managed military construction and engineering projects as at 15 October 2025. Of 5 active projects, 1 is on schedule, 2 are delayed, and 2 are on hold pending resolution of safety and compliance issues. Corrective actions are in progress on the critical issues identified in Q2.',
    findings: [
      { id: 'f-007-1', category: 'Programme Performance', description: '3 of 5 DEME projects are behind programme by more than 2 weeks.', severity: 'HIGH', recommendation: 'Directorate-level programme review meeting required within 2 weeks.' },
      { id: 'f-007-2', category: 'Safety Compliance', description: 'Two projects have outstanding Class A or B safety violations requiring escalated resolution.', severity: 'CRITICAL', recommendation: 'Close out outstanding violations before Q4 programme review.' },
    ],
    safetyFindings: [
      'Ammunition Storage Facility: Class A violation — fuel exclusion zone breach (partially resolved).',
      'Engineering Workshop: Scaffold non-compliance and fire hazard remain open.',
    ],
    recommendations: [
      'Convene emergency programme recovery meeting for all delayed DEME projects.',
      'Directorate Safety Officer to conduct unannounced inspections on the two projects with open violations.',
      'Escalate to Command level if violations are not closed by Q4 deadline.',
    ],
  },
  {
    id: 'RPT-2026-001', type: 'Project Progress Report',
    title: 'Inception Report — Officers Mess Renovation',
    projectId: 'PRJ-2026-001', projectName: "Officers' Mess Renovation", projectCode: 'DESE/RHB/2026/001',
    directorateCode: 'DESE', classification: 'UNCLASSIFIED',
    generatedBy: 'Maj. F.O. Eze', status: 'draft',
    createdAt: '2026-01-20', updatedAt: '2026-01-20',
    executiveSummary: 'This inception report covers the mobilisation phase of the Officers Mess Renovation project. The contractor has mobilised to site, temporary works have been erected, and the project programme has been agreed. A ventilation design review is currently outstanding and must be resolved before mechanical works proceed.',
    findings: [
      { id: 'f-008-1', category: 'Mobilisation', description: 'Contractor has fully mobilised to site with adequate plant and personnel.', severity: 'LOW', recommendation: 'Continue monitoring.' },
      { id: 'f-008-2', category: 'Design', description: 'Kitchen ventilation design requires consultant revision before mechanical works can proceed.', severity: 'MEDIUM', recommendation: 'Chase consultant for revised design submission within 14 days.' },
    ],
    safetyFindings: [],
    recommendations: [
      'Resolve kitchen ventilation design before mechanical works commence.',
      'Confirm Health and Safety file handover requirements with project manager.',
    ],
  },
];

// ─── Analytics data ────────────────────────────────────────────────────────────

export const MOCK_COMPLIANCE_TREND = [
  { month: 'Jan 25', compliance: 68, inspections: 8  },
  { month: 'Feb 25', compliance: 71, inspections: 10 },
  { month: 'Mar 25', compliance: 74, inspections: 12 },
  { month: 'Apr 25', compliance: 70, inspections: 9  },
  { month: 'May 25', compliance: 77, inspections: 14 },
  { month: 'Jun 25', compliance: 79, inspections: 11 },
  { month: 'Jul 25', compliance: 76, inspections: 13 },
  { month: 'Aug 25', compliance: 82, inspections: 15 },
  { month: 'Sep 25', compliance: 80, inspections: 12 },
  { month: 'Oct 25', compliance: 84, inspections: 16 },
];

export const MOCK_RISK_DISTRIBUTION = [
  { directorate: 'DESE', critical: 1, high: 4, moderate: 6, low: 8 },
  { directorate: 'DEME', critical: 3, high: 5, moderate: 4, low: 5 },
];

export const MOCK_MODULE_PERFORMANCE = [
  { module: 'OFFICES',  avgScore: 91, inspections: 9,  openActions: 3  },
  { module: 'BARRACKS', avgScore: 78, inspections: 18, openActions: 8  },
  { module: 'WORKSHOP', avgScore: 70, inspections: 12, openActions: 14 },
  { module: 'MEDICAL',  avgScore: 65, inspections: 7,  openActions: 12 },
  { module: 'ORDNANCE', avgScore: 88, inspections: 4,  openActions: 6  },
];
