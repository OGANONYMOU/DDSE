import { MOCK_PROJECTS, MOCK_PROJECT_DETAILS } from '../lib/mock-data';
import type { MockProject, MockProjectDetail } from '../lib/mock-data';

export interface ProjectFilter {
  search?:     string;
  status?:     MockProject['status'] | 'all';
  priority?:   MockProject['priority'] | 'all';
  directorate?: string | 'all';
}

export function filterProjects(filter: ProjectFilter = {}): MockProject[] {
  const q = (filter.search ?? '').toLowerCase();
  return MOCK_PROJECTS.filter((p) => {
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      p.contractor.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);

    return (
      matchSearch &&
      (!filter.status      || filter.status === 'all'      || p.status === filter.status) &&
      (!filter.priority    || filter.priority === 'all'    || p.priority === filter.priority) &&
      (!filter.directorate || filter.directorate === 'all' || p.directorateCode === filter.directorate)
    );
  });
}

export function getProject(id: string): MockProject | null {
  return MOCK_PROJECTS.find((p) => p.id === id) ?? null;
}

export function getProjectDetail(id: string): MockProjectDetail | null {
  return MOCK_PROJECT_DETAILS[id] ?? null;
}
