import TrendIndicator from './TrendIndicator';

export interface AnalyticsMetric {
  label:  string;
  value:  number | string;
  unit?:  string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  color?: string;
  note?:  string;
}

interface Props {
  metrics: AnalyticsMetric[];
  cols?:   2 | 3 | 4;
}

const COL_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export default function MetricGrid({ metrics, cols = 4 }: Props) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${COL_CLASS[cols]}`}>
      {metrics.map((m) => (
        <div key={m.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{m.label}</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <p className={`text-2xl font-black tabular-nums leading-none ${m.color ?? 'text-white'}`}>
              {m.value}
            </p>
            {m.unit && (
              <span className="text-[10px] font-mono text-slate-500">{m.unit}</span>
            )}
          </div>
          {(m.trend || m.note) && (
            <div className="mt-1.5 flex items-center gap-2">
              {m.trend && <TrendIndicator trend={m.trend} />}
              {m.note  && <span className="text-[9px] font-mono text-slate-600">{m.note}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
