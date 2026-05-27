import { Activity, Clock } from 'lucide-react';

export interface ActivityEntry {
  id:           string;
  action:       string;
  entityType:   string;
  moduleCode?:  string;
  createdAt:    number;
  actorRoleCode?: string;
}

interface RecentActivityProps {
  entries: ActivityEntry[];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ENTITY_COLORS: Record<string, string> = {
  inspection:  'text-sky-400',
  report:      'text-violet-400',
  personnel:   'text-emerald-400',
  safety:      'text-amber-400',
  project:     'text-teal-400',
};

export default function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
            Recent Activity
          </h3>
        </div>
        <span className="text-[9px] font-mono uppercase text-slate-600">
          {entries.length} events
        </span>
      </div>

      {/* Feed */}
      <div className="space-y-0 divide-y divide-slate-800/30">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-[11px] font-mono uppercase text-slate-600">
            No activity recorded
          </p>
        ) : (
          entries.slice(0, 8).map((entry) => {
            const color = ENTITY_COLORS[entry.entityType] ?? 'text-slate-400';
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 py-2.5"
              >
                {/* Dot */}
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color} opacity-80`} />

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-1">
                    {entry.action}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono uppercase ${color}`}>
                      {entry.entityType}
                    </span>
                    {entry.moduleCode && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="text-[9px] font-mono uppercase text-slate-600">
                          {entry.moduleCode}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-[9px] font-mono text-slate-600">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo(entry.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
