import { MOCK_REPORTS } from '../lib/mock-data';
import type { MockReport, ReportType, ReportStatus } from '../lib/mock-data';

export interface ReportFilter {
  search?:    string;
  type?:      ReportType | 'all';
  status?:    ReportStatus | 'all';
  directorate?: string | 'all';
}

export function filterReports(filter: ReportFilter = {}): MockReport[] {
  return MOCK_REPORTS.filter((r) => {
    const q = (filter.search ?? '').toLowerCase();
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.projectName ?? '').toLowerCase().includes(q) ||
      r.generatedBy.toLowerCase().includes(q);

    return (
      matchSearch &&
      (!filter.type        || filter.type === 'all'        || r.type === filter.type) &&
      (!filter.status      || filter.status === 'all'      || r.status === filter.status) &&
      (!filter.directorate || filter.directorate === 'all' || r.directorateCode === filter.directorate)
    );
  });
}

export function getReport(id: string): MockReport | null {
  return MOCK_REPORTS.find((r) => r.id === id) ?? null;
}
