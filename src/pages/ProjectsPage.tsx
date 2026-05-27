import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { MOCK_PROJECTS, type MockProject } from '../lib/mock-data';

const RISK_COLOR: Record<MockProject['riskLevel'], string> = {
  LOW:      'text-emerald-400',
  MEDIUM:   'text-amber-400',
  HIGH:     'text-rose-400',
  CRITICAL: 'text-rose-300',
};

const PRIORITY_COLOR: Record<MockProject['priority'], string> = {
  ROUTINE:   'text-slate-500',
  PRIORITY:  'text-sky-400',
  URGENT:    'text-amber-400',
  EMERGENCY: 'text-rose-400',
};

const progressColor = (pct: number) =>
  pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-sky-500' : 'bg-amber-500';

function formatBudget(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n.toLocaleString()}`;
}

type StatusFilter = MockProject['status'] | 'all';
const STATUS_FILTERS: StatusFilter[] = ['all', 'in_progress', 'planning', 'completed', 'on_hold'];

export default function ProjectsPage() {
  const navigate                        = useNavigate();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = MOCK_PROJECTS.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      q === '' ||
      p.title.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      p.contractor.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || p.status === statusFilter);
  });

  const counts = {
    total:       MOCK_PROJECTS.length,
    in_progress: MOCK_PROJECTS.filter((p) => p.status === 'in_progress').length,
    completed:   MOCK_PROJECTS.filter((p) => p.status === 'completed').length,
    on_hold:     MOCK_PROJECTS.filter((p) => p.status === 'on_hold').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Construction & infrastructure project registry"
        action={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Projects', value: counts.total,       color: 'text-white' },
          { label: 'In Progress',    value: counts.in_progress, color: 'text-sky-400' },
          { label: 'Completed',      value: counts.completed,   color: 'text-emerald-400' },
          { label: 'On Hold',        value: counts.on_hold,     color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + status filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, code or contractor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                statusFilter === s
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Project table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
        <div className="hidden lg:grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_130px_110px_60px_60px] gap-4 border-b border-slate-800/60 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
          <span>Project</span>
          <span>Location / Contractor</span>
          <span>Progress</span>
          <span>Budget</span>
          <span>Risk</span>
          <span>Priority</span>
        </div>

        <div className="divide-y divide-slate-800/30">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderKanban className="h-10 w-10 text-slate-700" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">
                No projects match your filter
              </p>
            </div>
          ) : (
            filtered.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_130px_110px_60px_60px] gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-900/40 cursor-pointer"
              >
                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={project.status} />
                    <span className="text-[9px] font-mono text-slate-600">{project.projectCode}</span>
                  </div>
                  <p className="text-[12px] font-bold text-white leading-snug">{project.title}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">{project.type}</p>
                </div>

                {/* Location + contractor */}
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-300 leading-snug">{project.location}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500 truncate">{project.contractor}</p>
                </div>

                {/* Completion */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      {project.completionPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className={`h-full rounded-full ${progressColor(project.completionPercent)}`}
                      style={{ width: `${project.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-mono text-slate-600">
                    {project.startDate} → {project.endDate}
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <p className="text-[11px] font-mono font-bold text-slate-300">
                    {formatBudget(project.budgetNGN)}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase">
                    {project.directorateCode}
                  </p>
                </div>

                {/* Risk */}
                <p className={`text-[10px] font-mono font-black uppercase ${RISK_COLOR[project.riskLevel]}`}>
                  {project.riskLevel}
                </p>

                {/* Priority */}
                <p className={`text-[10px] font-mono font-black uppercase ${PRIORITY_COLOR[project.priority]}`}>
                  {project.priority}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-right text-[10px] font-mono text-slate-600 uppercase">
        Showing {filtered.length} of {MOCK_PROJECTS.length} registered projects
      </p>
    </div>
  );
}
