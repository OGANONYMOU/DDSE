import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border:          '1px solid rgba(56,182,255,0.15)',
  borderRadius:    '8px',
  fontSize:        '10px',
  fontFamily:      'monospace',
  color:           '#94a3b8',
};

interface Props {
  data: Array<{ period: string; compliance: number | null }>;
}

export default function ComplianceChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Compliance Trend</p>
        <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase">Weekly average inspection score — last 8 weeks</p>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v === null ? 'No data' : `${v}%`, 'Compliance']} />
            <Area
              type="monotone" dataKey="compliance"
              stroke="#38bdf8" strokeWidth={2}
              fill="url(#complianceGrad)"
              connectNulls
              dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#38bdf8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
