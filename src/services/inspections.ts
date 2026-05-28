import { MOCK_INSPECTIONS, MOCK_INSPECTION_TEMPLATES } from '../lib/mock-data';
import type { MockInspection, MockInspectionTemplate } from '../lib/mock-data';

export interface InspectionFilter {
  search?:     string;
  status?:     MockInspection['status'] | 'all';
  riskLevel?:  MockInspection['riskLevel'] | 'all';
  projectId?:  string;
  moduleCode?: string | 'all';
}

export function filterInspections(filter: InspectionFilter = {}): MockInspection[] {
  const q = (filter.search ?? '').toLowerCase();
  return MOCK_INSPECTIONS.filter((i) => {
    const matchSearch =
      !q ||
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.projectName.toLowerCase().includes(q) ||
      i.inspector.toLowerCase().includes(q);

    return (
      matchSearch &&
      (!filter.status     || filter.status === 'all'     || i.status === filter.status) &&
      (!filter.riskLevel  || filter.riskLevel === 'all'  || i.riskLevel === filter.riskLevel) &&
      (!filter.projectId  || i.projectId === filter.projectId) &&
      (!filter.moduleCode || filter.moduleCode === 'all' || i.moduleCode === filter.moduleCode)
    );
  });
}

export function getInspectionById(id: string): MockInspection | null {
  return MOCK_INSPECTIONS.find((i) => i.id === id) ?? null;
}

export function getTemplate(moduleCode: string): MockInspectionTemplate | null {
  return MOCK_INSPECTION_TEMPLATES[moduleCode] ?? null;
}
