/**
 * Domain type re-exports — canonical aliases used throughout the application.
 * The source-of-truth definitions live in lib/mock-data.ts during the mock phase
 * and will migrate to real API types during Phase 9.
 */
export type {
  MockProject        as Project,
  MockMilestone      as Milestone,
  MockInspectionRecord as InspectionRecord,
  MockDocument       as Document,
  MockSafetyIssue    as SafetyIssue,
  MockRecommendation as Recommendation,
  MockProjectDetail  as ProjectDetail,
  MockNotification   as Notification,
  MockQuestion       as Question,
  MockTemplateSection as TemplateSection,
  MockInspectionTemplate as InspectionTemplate,
  MockInspection     as Inspection,
  MockHazardAssessment as HazardAssessment,
  MockHazardCheckItem  as HazardCheckItem,
  MockCorrectiveAction as CorrectiveAction,
  MockReport         as Report,
  MockReportFinding  as ReportFinding,
  HazardCategory,
  SafetyRiskLevel,
  ComplianceStatus,
  SafetyWorkflow,
  ReportType,
  ReportStatus,
  ReportClassification,
  QuestionType,
} from '../lib/mock-data';
