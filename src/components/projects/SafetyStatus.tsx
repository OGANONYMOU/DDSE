import { ShieldAlert } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { MockSafetyIssue } from '../../lib/mock-data';

const SEVERITY_COLOR: Record<MockSafetyIssue['severity'], string> = {
  CRITICAL: 'text-rose-300',
  HIGH:     'text-rose-400',
  MEDIUM:   'text-amber-400',
  LOW:      'text-slate-400',
};

interface Props {
  issues: MockSafetyIssue[];
}

export default function SafetyStatus({ issues }: Props) {
  const open       = issues.filter((i) => i.status === 'open').length;
  const monitoring = issues.filter((i) => i.status === 'monitoring').length;
  const resolved   = issues.filter((i) => i.status === 'resolved').length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
      {/* Summary counts */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-b border-slate-800/60">
        {[
          { label: 'Open',       value: open,       color: 'text-rose-400' },
          { label: 'Monitoring', value: monitoring, color: 'text-amber-400' },
          { label: 'Resolved',   value: resolved,   color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="px-5 py-4 text-center">
            <p className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-slate-600">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Issue list */}
      <div className="divide-y divide-slate-800/30">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-8 w-8 text-slate-700" />
            <p className="mt-2 text-[11px] font-mono uppercase text-slate-600">
              No safety issues recorded
            </p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="flex items-start gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase ${SEVERITY_COLOR[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <span className="text-slate-700">·</span>
                  <span className="text-[9px] font-mono text-slate-600">{issue.reportedAt}</span>
                </div>
                <p className="text-[12px] font-semibold text-slate-200 leading-snug">{issue.title}</p>
              </div>
              <StatusBadge status={issue.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
