import { FolderKanban, ClipboardCheck, ShieldAlert, FileBarChart2, Users } from 'lucide-react';
import { MOCK_DASHBOARD_SUMMARY } from '../../lib/mock-data';

type EntityType = 'inspection' | 'safety' | 'project' | 'report' | 'personnel';

const ICON_MAP: Record<EntityType, React.ElementType> = {
  inspection: ClipboardCheck,
  safety:     ShieldAlert,
  project:    FolderKanban,
  report:     FileBarChart2,
  personnel:  Users,
};

const COLOR_MAP: Record<EntityType, string> = {
  inspection: 'text-sky-400    bg-sky-500/10    border-sky-500/20',
  safety:     'text-rose-400   bg-rose-500/10   border-rose-500/20',
  project:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  report:     'text-amber-400  bg-amber-500/10  border-amber-500/20',
  personnel:  'text-slate-400  bg-slate-800/40  border-slate-700/40',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  limit?: number;
}

export default function ActivityTimeline({ limit = 8 }: Props) {
  const activities = (MOCK_DASHBOARD_SUMMARY.recentActivity ?? []).slice(0, limit);

  return (
    <div className="space-y-3">
      {activities.map((act, idx) => {
        const type = act.entityType as EntityType;
        const Icon  = ICON_MAP[type] ?? ClipboardCheck;
        const color = COLOR_MAP[type] ?? COLOR_MAP.personnel;
        const isLast = idx === activities.length - 1;

        return (
          <div key={act.id} className="flex gap-3">
            {/* Icon + connector line */}
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-slate-800/60" style={{ minHeight: '16px' }} />}
            </div>

            {/* Content */}
            <div className="pb-3 flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 leading-snug">{act.action}</p>
              <div className="mt-1 flex items-center gap-2 text-[9px] font-mono text-slate-600">
                <span className="uppercase">{(act.actorRoleCode ?? '').replace(/_/g, ' ')}</span>
                {act.moduleCode && (
                  <>
                    <span>·</span>
                    <span className="uppercase">{act.moduleCode}</span>
                  </>
                )}
                <span>·</span>
                <span>{timeAgo(act.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
