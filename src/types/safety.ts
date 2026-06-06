// DDSE Safety/Hazard domain types — backed by hazard_assessments/* DB tables

export type HazardCategory    = 'Electrical Safety' | 'Ventilation' | 'Hazardous Substances'
  | 'Fueling Operations' | 'Noise Control' | 'Material Handling'
  | 'Fire Protection' | 'PPE Compliance' | 'Walkways & Access' | 'Equipment Safety';

export type SafetyRiskLevel   = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ComplianceStatus  = 'compliant' | 'partial' | 'non_compliant' | 'under_review';
export type SafetyWorkflow    = 'open' | 'investigating' | 'action_required' | 'escalated' | 'resolved' | 'closed';
export type ActionUrgency     = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus      = 'pending' | 'in_progress' | 'resolved';

export interface HazardAssessment {
  id:               string;
  projectId:        string | null;
  projectName:      string | null;
  projectCode:      string | null;
  directorateCode:  string;
  category:         HazardCategory;
  hazardTitle:      string;
  riskLevel:        SafetyRiskLevel;
  complianceStatus: ComplianceStatus;
  workflowStatus:   SafetyWorkflow;
  observations:     string | null;
  inspectorId:      string | null;
  inspectorName:    string | null;
  classification:   string;
  createdBy:        string;
  updatedBy:        string | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface HazardCheckItem {
  id:           string;
  assessmentId: string;
  prompt:       string;
  compliant:    boolean | null;
  notes:        string | null;
  displayOrder: number;
  checkedBy:    string | null;
  checkedAt:    string | null;
  createdAt:    string;
}

export interface HazardCorrectiveAction {
  id:                   string;
  assessmentId:         string;
  recommendation:       string;
  department:           string | null;
  urgency:              ActionUrgency;
  dueDate:              string | null;
  status:               ActionStatus;
  assignedTo:           string | null;
  // C-9 verification fields
  completedBy:          string | null;
  completedAt:          string | null;
  verificationEvidence: string | null;
  verifiedBy:           string | null;
  verifiedAt:           string | null;
  verificationNotes:    string | null;
  createdBy:            string;
  createdAt:            string;
  updatedAt:            string;
}

export interface HazardEvidence {
  id:             string;
  assessmentId:   string;
  fileName:       string;
  filePath:       string;
  contentType:    string | null;
  sizeBytes:      number | null;
  sha256Hash:     string;
  classification: string;
  uploadedBy:     string;
  createdAt:      string;
}

export interface HazardEscalation {
  id:                string;
  assessmentId:      string;
  escalatedBy:       string;
  escalatedToRole:   string;
  reason:            string;
  resolvedBy:        string | null;
  resolvedAt:        string | null;
  resolutionNotes:   string | null;
  createdAt:         string;
}

export interface HazardDetail {
  assessment:        HazardAssessment;
  checkItems:        HazardCheckItem[];
  correctiveActions: HazardCorrectiveAction[];
  evidence:          HazardEvidence[];
  escalations:       HazardEscalation[];
}

export interface HazardFilter {
  search?:          string;
  riskLevel?:       SafetyRiskLevel | 'all';
  workflow?:        SafetyWorkflow | 'all';
  compliance?:      ComplianceStatus | 'all';
  category?:        HazardCategory | 'all';
  projectId?:       string;
  directorateCode?: string | 'all';
}
