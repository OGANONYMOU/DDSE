export interface PlatformUser {
  id: string;
  fullName: string;
  appointmentNumber: string;
  roleCode: string;
  directorateCode: string;
  formationCode: string;
  unitCode: string;
  status: string;
  mfaRequired: boolean;
}

export interface SessionPayload {
  sessionToken: string;
  expiresAt: number;
  user: PlatformUser;
}

export interface ChallengePayload {
  challengeId: string;
  destinationMasked: string;
}

export interface RegistrationFormOptions {
  ranks: Array<{ code: string; label: string; order: number }>;
  directorates: Array<{ _id: string; code: string; name: string }>;
  formations: Array<{ _id: string; code: string; name: string }>;
  units: Array<{ _id: string; code: string; name: string; formationCode: string }>;
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
  correctiveActionAging: {
    overdue: number;
    dueSoon: number;
  };
  approvalSummary: {
    pending: number;
  };
  comparisons: {
    directorates: Array<{ key: string; inspections: number; overdue: number; highRisk: number; averageScore: number }>;
    formations: Array<{ key: string; inspections: number; overdue: number; highRisk: number; averageScore: number }>;
    units: Array<{ key: string; inspections: number; overdue: number; highRisk: number; averageScore: number }>;
  };
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

export interface ModuleDefinition {
  id: string;
  moduleCode: string;
  title: string;
  classification: string;
  description: string;
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
  updatedAt: number;
}

export interface InspectionDetail {
  inspection: {
    _id: string;
    title: string;
    moduleCode: string;
    classification: string;
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
        classification: string;
        contentHash?: string;
        watermarkLabel?: string;
      }>;
    }>;
  }>;
  findings: Array<{ _id: string; title: string; detail: string; severity: string; status: string }>;
  correctiveActions: Array<{ _id: string; title: string; detail: string; status: string; stopWorkIssued: boolean }>;
  approvals: Array<{ _id: string; decision: string; comments?: string; createdAt: number }>;
  reviewComments: Array<{ _id: string; findingId?: string; parentCommentId?: string; actorRoleCode: string; body: string; createdAt: number; resolvedAt?: number }>;
  auditLogs: Array<{ _id: string; action: string; createdAt: number; actorRoleCode?: string }>;
}

export interface SessionInventoryEntry {
  sessionId: string;
  isCurrent: boolean;
  status: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  revokedAt?: number;
  revokedReason?: string;
  sessionLabel?: string;
  userAgent?: string;
  ipAddress?: string;
}
