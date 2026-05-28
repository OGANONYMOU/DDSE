import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, FolderKanban } from 'lucide-react';

import { MOCK_PROJECTS, MOCK_PROJECT_DETAILS, type MockProject, type MockProjectDetail } from '../lib/mock-data';
import { getProjectById } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DashboardSection from '../components/dashboard/DashboardSection';
import ProjectOverview from '../components/projects/ProjectOverview';
import ProgressTracker from '../components/projects/ProgressTracker';
import InspectionPreview from '../components/projects/InspectionPreview';
import SafetyStatus from '../components/projects/SafetyStatus';
import DocumentCard from '../components/projects/DocumentCard';
import RecommendationPanel from '../components/projects/RecommendationPanel';

export default function ProjectDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [project, setProject] = useState<MockProject | null>(
    MOCK_PROJECTS.find((p) => p.id === id) ?? null
  );
  const detail: MockProjectDetail | null = id ? (MOCK_PROJECT_DETAILS[id] ?? null) : null;

  useEffect(() => {
    if (!id) return;
    getProjectById(id)
      .then((data) => { if (data) setProject(data as MockProject); })
      .catch(() => {});
  }, [id]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FolderKanban className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          Project Not Found
        </h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">
          {id} does not match any registered project
        </p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="mt-6 flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb + page header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Projects
        </button>

        <PageHeader
          title={project.title}
          subtitle={project.projectCode}
          action={<StatusBadge status={project.status} size="md" />}
        />
      </div>

      {/* Section A — Project Overview + Progress side by side */}
      <DashboardSection title="Project Overview" subtitle="Registered details, contractor and timeline">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectOverview project={project} />
          </div>
          <div>
            <ProgressTracker
              project={project}
              milestones={detail?.milestones ?? []}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Section B — Recent Inspections */}
      <DashboardSection
        title="Recent Inspections"
        subtitle={`${detail?.inspections.length ?? 0} inspection${(detail?.inspections.length ?? 0) !== 1 ? 's' : ''} on record`}
      >
        <InspectionPreview inspections={detail?.inspections ?? []} />
      </DashboardSection>

      {/* Section C — Safety Status */}
      <DashboardSection
        title="Safety Status"
        subtitle="Hazard reports and risk monitoring"
      >
        <SafetyStatus issues={detail?.safetyIssues ?? []} />
      </DashboardSection>

      {/* Section D — Uploaded Documents */}
      <DashboardSection
        title="Uploaded Documents"
        subtitle={`${detail?.documents.length ?? 0} document${(detail?.documents.length ?? 0) !== 1 ? 's' : ''} on file`}
      >
        {(detail?.documents ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 py-12 text-center">
            <p className="text-[11px] font-mono uppercase text-slate-600">No documents uploaded</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(detail?.documents ?? []).map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Section E — Recommendations */}
      <DashboardSection
        title="Recommendations"
        subtitle="Inspector-issued corrective guidance"
      >
        <RecommendationPanel recommendations={detail?.recommendations ?? []} />
      </DashboardSection>
    </div>
  );
}
