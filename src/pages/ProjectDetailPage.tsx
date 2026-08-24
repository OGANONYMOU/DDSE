import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, FolderKanban } from 'lucide-react';

import { getProjectDetail } from '../services/projects';
import type { ProjectDetail } from '../types/projects';
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
  const [detail, setDetail]   = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getProjectDetail(id)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading project…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FolderKanban className="h-12 w-12 text-slate-700" />
        <h3 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-500">
          {error ? 'Failed to load project' : 'Project Not Found'}
        </h3>
        <p className="mt-1 text-[11px] font-mono text-slate-700 uppercase">
          {error ?? `${id} does not match any registered project`}
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

  const { project } = detail;

  return (
    <div className="space-y-8">
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

      <DashboardSection title="Project Overview" subtitle="Registered details, contractor and timeline">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectOverview project={project} />
          </div>
          <div>
            <ProgressTracker project={project} milestones={detail.milestones} />
          </div>
        </div>
      </DashboardSection>

      {(project.reason || project.summary) && (
        <DashboardSection title="Reason & Summary" subtitle="Why this project was opened, and what it covers">
          <div className="grid gap-4 lg:grid-cols-2">
            {project.reason && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{project.reason}</p>
              </div>
            )}
            {project.summary && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Summary</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{project.summary}</p>
              </div>
            )}
          </div>
        </DashboardSection>
      )}

      <DashboardSection
        title="Recent Inspections"
        subtitle={`${detail.milestones.length} milestone${detail.milestones.length !== 1 ? 's' : ''} on record`}
      >
        <InspectionPreview inspections={[]} />
      </DashboardSection>

      <DashboardSection title="Safety Status" subtitle="Hazard reports and risk monitoring">
        <SafetyStatus issues={detail.riskFlags.map((rf) => ({
          id:         rf.id,
          title:      rf.title,
          severity:   rf.severity,
          status:     rf.status,
          reportedAt: rf.reportedAt,
        }))} />
      </DashboardSection>

      <DashboardSection
        title="Uploaded Documents"
        subtitle={`${detail.documents.length} document${detail.documents.length !== 1 ? 's' : ''} on file`}
      >
        {detail.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 py-12 text-center">
            <p className="text-[11px] font-mono uppercase text-slate-600">No documents uploaded</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Recommendations" subtitle="Inspector-issued corrective guidance">
        <RecommendationPanel recommendations={detail.reviews.map((r) => ({
          id:       r.id,
          title:    r.title,
          body:     r.body ?? '',
          priority: r.priority,
          status:   r.status,
          issuedBy: r.issuedBy,
          issuedAt: r.issuedAt,
        }))} />
      </DashboardSection>
    </div>
  );
}
