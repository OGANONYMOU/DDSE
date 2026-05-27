import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import type { MockInspectionRecord } from '../../lib/mock-data';

const SCORE_COLOR = (score: number) =>
  score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400';

interface Props {
  inspections: MockInspectionRecord[];
}

export default function InspectionPreview({ inspections }: Props) {
  const navigate = useNavigate();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_100px_60px_110px] gap-4 border-b border-slate-800/60 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
        <span>Inspection</span>
        <span>Inspector</span>
        <span>Score</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-slate-800/30">
        {inspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-8 w-8 text-slate-700" />
            <p className="mt-2 text-[11px] font-mono uppercase text-slate-600">
              No inspections recorded
            </p>
          </div>
        ) : (
          inspections.map((insp) => (
            <div
              key={insp.id}
              onClick={() => navigate(`/inspections/${insp.id}`)}
              className="grid grid-cols-[1fr_100px_60px_110px] gap-4 items-center px-5 py-4 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-200 leading-snug">{insp.title}</p>
                <p className="mt-0.5 text-[9px] font-mono text-slate-600">{insp.date}</p>
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate">{insp.inspector}</p>
              <p className={`text-[12px] font-black tabular-nums ${SCORE_COLOR(insp.score)}`}>
                {insp.score}%
              </p>
              <StatusBadge status={insp.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
