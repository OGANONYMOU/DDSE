import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MOCK_COMPLIANCE_TREND } from '../../lib/mock-data';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border:          '1px solid rgba(56,182,255,0.15)',
  borderRadius:    '8px',
  fontSize:        '10px',
  fontFamily:      'monospace',
  color:           '#94a3b8',
};

export default function ComplianceChart() {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Compliance Trend</p>
        <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase">Monthly average compliance score — Jan 2025 to Oct 2025</p>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_COMPLIANCE_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[50, 100]}
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Compliance']} />
            <Area
              type="monotone" dataKey="compliance"
              stroke="#38bdf8" strokeWidth={2}
              fill="url(#complianceGrad)"
              dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#38bdf8' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
