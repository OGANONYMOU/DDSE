// DDSE Project domain types — backed by the projects/* DB tables

export type ProjectType     = 'New Construction' | 'Rehabilitation' | 'Extension' | 'Maintenance';
export type ProjectStatus   = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type ProjectPriority = 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';
export type ProjectRisk     = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming' | 'delayed';
export type DocType         = 'BOQ' | 'Drawing' | 'Report' | 'Certificate' | 'Photo' | 'Permit' | 'Other';
export type ReviewPriority  = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewStatus    = 'pending' | 'in_progress' | 'resolved';
export type RiskFlagStatus  = 'open' | 'resolved' | 'monitoring';
export type BudgetCategory  = 'Labour' | 'Materials' | 'Equipment' | 'Preliminaries' | 'Contingency' | 'Other';

export interface Project {
  id:                   string;
  projectCode:          string;
  title:                string;
  type:                 ProjectType;
  status:               ProjectStatus;
  priority:             ProjectPriority;
  riskLevel:            ProjectRisk;
  location:             string;
  directorateCode:      string;
  contractor:           string | null;
  leadInspectorId:      string | null;
  leadInspectorName:    string | null;
  budgetNgn:            number | null;
  completionPercent:    number;
  startDate:            string | null;
  endDate:              string | null;
  classification:       string;
  finalScore:           number | null;
  notes:                string | null;
  createdBy:            string;
  updatedBy:            string | null;
  createdAt:            string;
  updatedAt:            string;
}

export interface ProjectMilestone {
  id:            string;
  projectId:     string;
  title:         string;
  targetDate:    string | null;
  completedDate: string | null;
  status:        MilestoneStatus;
  displayOrder:  number;
  notes:         string | null;
  createdBy:     string;
  createdAt:     string;
  updatedAt:     string;
}

export interface ProjectBudgetItem {
  id:           string;
  projectId:    string;
  description:  string;
  category:     BudgetCategory;
  quantity:     number | null;
  unit:         string | null;
  unitRateNgn:  number | null;
  amountNgn:    number;
  boqRevision:  number;
  approved:     boolean;
  approvedBy:   string | null;
  approvedAt:   string | null;
  createdBy:    string;
  createdAt:    string;
  updatedAt:    string;
}

export interface ProjectDocument {
  id:             string;
  projectId:      string;
  title:          string;
  docType:        DocType;
  fileName:       string;
  filePath:       string;
  contentType:    string | null;
  sizeBytes:      number | null;
  sha256Hash:     string | null;
  classification: string;
  revision:       number;
  supersedesId:   string | null;
  uploadedBy:     string;
  createdAt:      string;
}

export interface ProjectRiskFlag {
  id:          string;
  projectId:   string;
  title:       string;
  severity:    ProjectRisk;
  status:      RiskFlagStatus;
  description: string | null;
  reportedBy:  string;
  reportedAt:  string;
  resolvedBy:  string | null;
  resolvedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface ProjectReview {
  id:          string;
  projectId:   string;
  title:       string;
  body:        string | null;
  priority:    ReviewPriority;
  status:      ReviewStatus;
  issuedBy:    string;
  issuedAt:    string;
  resolvedBy:  string | null;
  resolvedAt:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface ProjectDetail {
  project:     Project;
  milestones:  ProjectMilestone[];
  budgetItems: ProjectBudgetItem[];
  documents:   ProjectDocument[];
  riskFlags:   ProjectRiskFlag[];
  reviews:     ProjectReview[];
}

export interface ProjectFilter {
  search?:         string;
  status?:         ProjectStatus | 'all';
  priority?:       ProjectPriority | 'all';
  directorateCode?: string | 'all';
  riskLevel?:      ProjectRisk | 'all';
}
