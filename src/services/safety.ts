import { MOCK_HAZARD_ASSESSMENTS } from '../lib/mock-data';
import type { MockHazardAssessment, HazardCategory, SafetyRiskLevel, SafetyWorkflow, ComplianceStatus } from '../lib/mock-data';

export interface HazardFilter {
  search?:    string;
  riskLevel?: SafetyRiskLevel | 'all';
  workflow?:  SafetyWorkflow  | 'all';
  compliance?: ComplianceStatus | 'all';
  category?:  HazardCategory | 'all';
  projectId?: string;
}

export function filterHazards(filter: HazardFilter = {}): MockHazardAssessment[] {
  const q = (filter.search ?? '').toLowerCase();
  return MOCK_HAZARD_ASSESSMENTS.filter((a) => {
    const matchSearch =
      !q ||
      a.id.toLowerCase().includes(q) ||
      a.hazardTitle.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.projectName.toLowerCase().includes(q) ||
      a.inspector.toLowerCase().includes(q);

    return (
      matchSearch &&
      (!filter.riskLevel  || filter.riskLevel === 'all'  || a.riskLevel === filter.riskLevel) &&
      (!filter.workflow   || filter.workflow === 'all'   || a.workflowStatus === filter.workflow) &&
      (!filter.compliance || filter.compliance === 'all' || a.complianceStatus === filter.compliance) &&
      (!filter.category   || filter.category === 'all'  || a.category === filter.category) &&
      (!filter.projectId  || a.projectId === filter.projectId)
    );
  });
}

export function getHazard(id: string): MockHazardAssessment | null {
  return MOCK_HAZARD_ASSESSMENTS.find((a) => a.id === id) ?? null;
}

export function getHazardsByProject(projectId: string): MockHazardAssessment[] {
  return MOCK_HAZARD_ASSESSMENTS.filter((a) => a.projectId === projectId);
}
