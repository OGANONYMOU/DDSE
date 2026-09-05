export interface PlatformUser {
  id:                 string;
  fullName:           string;
  email?:             string;  // real contact email (not the internal auth alias)
  serviceNumber:      string;
  rankCode?:          string;
  roleCode:           string;  // see RoleCode in src/lib/rbac.ts
  clearanceLevel?:    number;  // 1–6, derived from role
  commandJurisdiction?: string; // unit/base code for commanders
  directorateCode:    string;
  status:             string;  // 'active' | 'pending' | 'suspended'
  mfaRequired:        boolean;
  mfaEnrolled?:       boolean;
  mustChangePassword?: boolean;
  isPlatformOwner?:   boolean;
}

export interface SessionPayload {
  sessionToken: string;
  expiresAt: number;
  user: PlatformUser;
  requiresBootstrapPasswordChange?: boolean;
}

export interface ChallengePayload {
  challengeId: string;
  destinationMasked: string;
}

export interface RegistrationFormOptions {
  ranks: Array<{ code: string; label: string; order: number }>;
  directorates: Array<{ _id: string; code: string; name: string }>;
  roles: Array<{ code: string; label: string; privileged: boolean }>;
}

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  trend: string;
  tone: 'info' | 'warning' | 'danger';
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  posture: {
    readinessAverage: number;
    safetyRiskLevel: string;
    evidenceCompleteness: number;
    restrictedModulesVisible: number;
  };
  moduleSummaries: Array<{
    moduleCode: string;
    inspections: number;
    overdue: number;
    averageScore: number;
    openCorrectiveActions: number;
    evidenceComplete: number;
  }>;
  severityDistribution: Record<string, number>;
  approvalQueue: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    moduleCode?: string;
    createdAt: number;
    actorRoleCode?: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    severity: string;
    moduleCode: string;
  }>;
}

export interface AnalyticsSummary {
  activeProjects: number;
  onHoldProjects: number;
  criticalHazards: number;
  pendingReviews: number;
  overdueActions: number;
  openReports: number;
  complianceAvg: number;
  totalAssessments: number;
  inspectionModules: number;
  registeredProjects: number;
  complianceTrend: Array<{ period: string; compliance: number | null }>;
  riskDistribution: Array<{ directorate: string; critical: number; high: number; moderate: number; low: number }>;
  modulePerformance: Array<{ module: string; avgScore: number; inspections: number; openActions: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    moduleCode?: string;
    createdAt: number;
    actorRoleCode?: string;
  }>;
}

export interface ModuleDefinition {
  id: string;
  moduleCode: string;
  title: string;
  classification: string;
  description: string;
}

export interface PersonnelRecord {
  id:                  string;
  fullName:            string;
  serviceNumber:       string;
  email:               string | null;
  phoneNumber:         string | null;
  rankCode:            string | null;
  directorateCode:     string;
  roleCode:            string;
  status:              string; // 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted'
  clearanceLevel:      number | null;
  commandJurisdiction: string | null;
  mfaEnrolled:         boolean;
  isPlatformOwner:     boolean;
  flagged:             boolean;
  flaggedReason:       string | null;
  flaggedAt:           string | null;
  createdAt:           string;
  updatedAt:           string;
}

export type InspectionQuestionResponseType = 'yes_no' | 'score_5' | 'narrative' | 'checklist';

export interface InspectionTemplateItem {
  code: string;
  prompt: string;
  responseType: InspectionQuestionResponseType;
  weight: number;
}

export interface InspectionTemplateSection {
  title: string;
  items: InspectionTemplateItem[];
}

export interface InspectionTemplate {
  sections: InspectionTemplateSection[];
}

export interface ModuleTemplateDefinition extends ModuleDefinition {
  version: number;
  updatedAt?: number;
  template: InspectionTemplate;
  templateEditGranted?: boolean;
}

export interface InspectionSummary {
  _id: string;
  title: string;
  moduleCode: string;
  status: string;
  scoreOverall: number;
  complianceBand: string;
  riskLevel: string;
  completionPercent: number;
  directorateCode: string;
  unitCode: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt: number;
}

export interface InspectionDetail {
  inspection: {
    _id: string;
    title: string;
    moduleCode: string;
    status: string;
    scoreOverall: number;
    complianceBand: string;
    riskLevel: string;
    completionPercent: number;
  };
  sections: Array<{
    _id: string;
    title: string;
    items: Array<{
      _id: string;
      code: string;
      prompt: string;
      responseType: string;
      weight: number;
      response: {
        responseValue: unknown;
        numericScore: number;
        severity?: string;
        immediateRisk: boolean;
        remarks?: string;
      } | null;
      evidence: Array<{
        _id: string;
        fileName: string;
        contentType: string;
      }>;
    }>;
  }>;
  findings: Array<{ _id: string; title: string; detail: string; severity: string; status: string }>;
  correctiveActions: Array<{ _id: string; title: string; detail: string; status: string; stopWorkIssued: boolean }>;
  approvals: Array<{ _id: string; decision: string; comments?: string; createdAt: number }>;
  reviewComments: Array<{ _id: string; findingId?: string; parentCommentId?: string; actorRoleCode: string; body: string; createdAt: number; resolvedAt?: number }>;
  auditLogs: Array<{ _id: string; action: string; createdAt: number; actorRoleCode?: string }>;
}
