// DDSE Report domain types

export type ReportType =
  | 'Inspection Report'
  | 'Hazard Assessment Report'
  | 'Project Progress Report'
  | 'Contractor Evaluation'
  | 'Compliance Summary'
  | 'Safety Violation Report'
  | 'Operational Readiness Summary';

export type ReportStatus         = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type ReportClassification = 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

export interface ReportFinding {
  id:             string;
  reportId:       string;
  category:       string;
  description:    string;
  severity:       'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string | null;
  displayOrder:   number;
  createdAt:      string;
}

export interface Report {
  id:               string;
  type:             ReportType;
  title:            string;
  projectId:        string | null;
  projectName:      string | null;
  projectCode:      string | null;
  directorateCode:  string;
  classification:   ReportClassification;
  status:           ReportStatus;
  executiveSummary: string | null;
  safetyFindings:   string[];
  recommendations:  string[];
  generatedBy:      string;
  generatedByName:  string | null;
  approvedBy:       string | null;
  approvedByName:   string | null;
  approvedAt:       string | null;
  createdAt:        string;
  updatedAt:        string;
  findings?:        ReportFinding[];
}

export interface ReportFilter {
  search?:          string;
  type?:            ReportType | 'all';
  status?:          ReportStatus | 'all';
  directorateCode?: string | 'all';
}
