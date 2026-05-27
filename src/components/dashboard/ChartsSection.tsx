import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SeverityDistribution {
  [severity: string]: number;
}

interface ModuleSummary {
  moduleCode:           string;
  inspections:          number;
  averageScore:         number;
  openCorrectiveActions: number;
}

interface ChartsSectionProps {
  severityDistribution?: SeverityDistribution;
  moduleSummaries?:      ModuleSummary[];
}

const COMPLIANCE_TREND = [
  { month: 'Jan', score: 71 },
  { month: 'Feb', score: 74 },
  { month: 'Mar', score: 69 },
  { month: 'Apr', score: 78 },
  { month: 'May', score: 82 },
  { month: 'Jun', score: 80 },
];

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border:          '1px solid rgba(56,182,255,0.15)',
  borderRadius:    '8px',
  fontSize:        '10px',
  fontFamily:      'monospace',
  color:           '#94a3b8',
};

export default function ChartsSection({ severityDistribution, moduleSummaries }: ChartsSectionProps) {
  const severityData = severityDistribution
    ? Object.entries(severityDistribution).map(([name, value]) => ({ name: name.toUpperCase(), value }))
    : [
        { name: 'CRITICAL', value: 4 },
        { name: 'HIGH',     value: 11 },
        { name: 'MEDIUM',   value: 22 },
        { name: 'LOW',      value: 35 },
      ];

  const moduleData = (moduleSummaries ?? []).slice(0, 6).map((m) => ({
    name:        m.moduleCode.toUpperCase(),
    inspections: m.inspections,
    score:       m.averageScore,
    open:        m.openCorrectiveActions,
  }));

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#f43f5e',
    HIGH:     '#f59e0b',
    MEDIUM:   '#38bdf8',
    LOW:      '#34d399',
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Compliance Trend */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
        <div className="mb-4 border-b border-slate-800/40 pb-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
            Compliance Trend
          </h3>
          <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
            6-month rolling average
          </p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={COMPLIANCE_TREND} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={1.5} fill="url(#complianceGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Severity Distribution */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
        <div className="mb-4 border-b border-slate-800/40 pb-3">
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
            Finding Severity
          </h3>
          <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
            Open findings distribution
          </p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={severityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="#38bdf8"
              maxBarSize={32}
              label={false}
            >
              {severityData.map((entry) => (
                <rect key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? '#38bdf8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Module Performance — spans full width if module data is available */}
      {moduleData.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 lg:col-span-2">
          <div className="mb-4 border-b border-slate-800/40 pb-3">
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
              Module Performance
            </h3>
            <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
              Inspections vs. average score per module
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={moduleData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', color: '#475569' }} />
              <Bar dataKey="inspections" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="score"       fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="open"        fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
