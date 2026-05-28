import {
  MOCK_PROJECTS,
  MOCK_HAZARD_ASSESSMENTS,
  MOCK_INSPECTIONS,
  MOCK_REPORTS,
  MOCK_COMPLIANCE_TREND,
  MOCK_RISK_DISTRIBUTION,
  MOCK_MODULE_PERFORMANCE,
} from '../lib/mock-data';

export function getCommandMetrics() {
  const activeProjects    = MOCK_PROJECTS.filter((p) => p.status === 'in_progress').length;
  const criticalHazards   = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'CRITICAL').length;
  const complianceAvg     = Math.round(MOCK_MODULE_PERFORMANCE.reduce((s, m) => s + m.avgScore, 0) / MOCK_MODULE_PERFORMANCE.length);
  const pendingReviews    = MOCK_INSPECTIONS.filter((i) => i.status === 'in_review' || i.status === 'submitted').length;
  const openReports       = MOCK_REPORTS.filter((r) => r.status === 'pending_review' || r.status === 'draft').length;

  return { activeProjects, criticalHazards, complianceAvg, pendingReviews, openReports };
}

export { MOCK_COMPLIANCE_TREND, MOCK_RISK_DISTRIBUTION, MOCK_MODULE_PERFORMANCE };
