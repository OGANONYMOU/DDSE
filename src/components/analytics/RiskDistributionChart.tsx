import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border:          '1px solid rgba(56,182,255,0.15)',
  borderRadius:    '8px',
  fontSize:        '10px',
  fontFamily:      'monospace',
  color:           '#94a3b8',
};

const LEGEND_STYLE = { fontSize: 9, fontFamily: 'monospace' };

interface Props {
  riskDistribution: Array<{ directorate: string; critical: number; high: number; moderate: number; low: number }>;
  modulePerformance: Array<{ module: string; avgScore: number; inspections: number; openActions: number }>;
}

export default function RiskDistributionChart({ riskDistribution, modulePerformance }: Props) {
  return (
    <div className="space-y-4">
      {/* Risk by directorate */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Hazard Risk Distribution by Directorate</p>
          <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase">Count of assessments per risk level</p>
        </div>
        {riskDistribution.length === 0 ? (
          <p className="py-8 text-center text-[10px] font-mono uppercase text-slate-600">No hazard assessments recorded yet</p>
        ) : (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} margin={{ top: 0, right: 5, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                <XAxis dataKey="directorate" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="critical"  fill="#f43f5e" name="Critical" radius={[2,2,0,0]} />
                <Bar dataKey="high"      fill="#fb923c" name="High"     radius={[2,2,0,0]} />
                <Bar dataKey="moderate"  fill="#f59e0b" name="Moderate" radius={[2,2,0,0]} />
                <Bar dataKey="low"       fill="#10b981" name="Low"      radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Module performance horizontal bars */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Module Compliance Performance</p>
          <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase">Average inspection score by module</p>
        </div>
        <div className="space-y-3">
          {modulePerformance.map((m) => {
            const color = m.avgScore >= 85 ? 'bg-emerald-500' : m.avgScore >= 70 ? 'bg-sky-500' : m.avgScore >= 55 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div key={m.module}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{m.module}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-600">{m.inspections} inspections · {m.openActions} open actions</span>
                    <span className="text-[11px] font-black tabular-nums text-white">{m.avgScore}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                  <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${m.avgScore}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
