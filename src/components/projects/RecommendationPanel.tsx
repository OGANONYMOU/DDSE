import { Lightbulb } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

interface Recommendation {
  id:       string;
  title:    string;
  body:     string | null;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status:   'pending' | 'in_progress' | 'resolved';
  issuedBy: string;
  issuedAt: string;
}

const PRIORITY_COLOR: Record<Recommendation['priority'], string> = {
  URGENT: 'text-rose-400',
  HIGH:   'text-amber-400',
  MEDIUM: 'text-sky-400',
  LOW:    'text-slate-400',
};

interface Props {
  recommendations: Recommendation[];
}

export default function RecommendationPanel({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/70 py-12 text-center">
        <Lightbulb className="h-8 w-8 text-slate-700" />
        <p className="mt-2 text-[11px] font-mono uppercase text-slate-600">No recommendations issued</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div key={rec.id} className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase ${PRIORITY_COLOR[rec.priority]}`}>
                {rec.priority}
              </span>
              <StatusBadge status={rec.status} />
            </div>
          </div>
          <p className="text-[13px] font-bold text-slate-200 leading-snug">{rec.title}</p>
          {rec.body && (
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{rec.body}</p>
          )}
          <p className="mt-3 text-[9px] font-mono text-slate-600 uppercase">
            {rec.issuedBy} · {rec.issuedAt.split('T')[0]}
          </p>
        </div>
      ))}
    </div>
  );
}
