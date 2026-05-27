import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import type { MockProject, MockMilestone } from '../../lib/mock-data';

const MILESTONE_ICON: Record<MockMilestone['status'], React.ElementType> = {
  completed:   CheckCircle2,
  in_progress: Clock,
  upcoming:    Circle,
  delayed:     AlertCircle,
};

const MILESTONE_COLOR: Record<MockMilestone['status'], string> = {
  completed:   'text-emerald-500',
  in_progress: 'text-sky-400',
  upcoming:    'text-slate-600',
  delayed:     'text-amber-400',
};

const MILESTONE_LABEL: Record<MockMilestone['status'], string> = {
  completed:   'Done',
  in_progress: 'Active',
  upcoming:    'Upcoming',
  delayed:     'Delayed',
};

const progressColor = (pct: number) =>
  pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-sky-500' : 'bg-amber-500';

interface Props {
  project: MockProject;
  milestones: MockMilestone[];
}

export default function ProgressTracker({ project, milestones }: Props) {
  const pct = project.completionPercent;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
      {/* Header */}
      <div className="border-b border-slate-800/40 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Progress & Milestones
        </p>
      </div>

      {/* Completion bar */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Completion</span>
          <span className="text-2xl font-black tabular-nums text-white">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className={`h-full rounded-full transition-all ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-0 divide-y divide-slate-800/30">
          {milestones.map((m) => {
            const Icon  = MILESTONE_ICON[m.status];
            const color = MILESTONE_COLOR[m.status];
            return (
              <div key={m.id} className="flex items-start gap-3 py-3">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-semibold leading-snug ${m.status === 'upcoming' ? 'text-slate-500' : 'text-slate-200'}`}>
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono text-slate-600">
                    {m.completedDate ?? m.targetDate}
                  </p>
                </div>
                <span className={`shrink-0 text-[9px] font-black uppercase ${color}`}>
                  {MILESTONE_LABEL[m.status]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
