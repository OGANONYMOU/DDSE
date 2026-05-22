import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts';
import { 
  TrendingUp, Activity, Shield, AlertTriangle, ShieldCheck, Zap, Radio 
} from 'lucide-react';

interface IntelligenceAnalyticsProps {
  severityDistribution?: Record<string, number>;
  moduleSummaries?: Array<{ moduleCode: string; inspections: number; overdue: number; averageScore: number; openCorrectiveActions: number }>;
}

export default function IntelligenceAnalytics({ severityDistribution, moduleSummaries }: IntelligenceAnalyticsProps) {
  // Safe mock data values
  const severityData = [
    { name: 'Low Risk', value: severityDistribution?.low ?? 3, fill: '#10b981' },
    { name: 'Medium Risk', value: severityDistribution?.medium ?? 4, fill: '#f59e0b' },
    { name: 'High Risk', value: severityDistribution?.high ?? 2, fill: '#ef4444' },
  ];

  const trendsData = [
    { month: 'Jan', compliance: 72, risk: 34, logistics: 80 },
    { month: 'Feb', compliance: 78, risk: 28, logistics: 85 },
    { month: 'Mar', compliance: 70, risk: 42, logistics: 88 },
    { month: 'Apr', compliance: 84, risk: 20, logistics: 91 },
    { month: 'May', compliance: 89, risk: 15, logistics: 95 },
  ];

  const radarData = [
    { subject: 'Weapon Serviceability', A: 94, B: 88, fullMark: 100 },
    { subject: 'Personnel Readiness', A: 87, B: 90, fullMark: 100 },
    { subject: 'Civil Infrastructures', A: 78, B: 80, fullMark: 100 },
    { subject: 'Safety Posture', A: 91, B: 85, fullMark: 100 },
    { subject: 'Comms Uplink Integrity', A: 99, B: 95, fullMark: 100 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-sky-500/20 bg-slate-950/90 p-4 font-mono text-[10px] text-slate-400 space-y-1 shadow-2xl">
          <p className="text-white font-bold">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color || '#38b6ff' }}>
              {p.name.toUpperCase()}: <span className="font-bold">{p.value}%</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 xl:grid-cols-12 font-sans text-white relative">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,182,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(56,182,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

      {/* ── TOP BANNER: FORECASTING RADAR (XL: 12 COLS) ── */}
      <div className="col-span-12 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500 mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          TACTICAL COMPLIANCE FORECAST MAIN DECK
        </h3>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38b6ff" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38b6ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#475569" fontSize={10} fontFamily="monospace" />
              <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="compliance" name="Readiness Ratio" stroke="#38b6ff" strokeWidth={2} fillOpacity={1} fill="url(#colorCompliance)" />
              <Area type="monotone" dataKey="risk" name="Active Risks" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRisk)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SEC-2: SEVERITY DISTRIBUTION & RADAR POSTURE (XL: 6 COLS / 6 COLS) ── */}
      <div className="xl:col-span-6 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-400" />
            RADAR PERFORMANCE COMPARATIVE
          </h3>

          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={9} fontFamily="monospace" />
                <Radar name="Active Defense" dataKey="A" stroke="#38b6ff" fill="#38b6ff" fillOpacity={0.2} />
                <Radar name="Operational Targets" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="xl:col-span-6 space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            FIELD RISK INCIDENT SEVERITY SUMMARY
          </h3>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={10} fontFamily="monospace" />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SEC-3: AI MAIN DECK ADVISORY SUMMARY (XL: 12 COLS) ── */}
      <div className="col-span-12 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-sky-400 mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-sky-400 animate-pulse" />
          CLASSIFIED TACTICAL FORECASTER MAIN PANEL
        </h3>

        <div className="grid gap-4 md:grid-cols-3 font-mono text-xs">
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
            <span className="text-[9px] text-emerald-400 font-bold">✓ ALL OVERALL Posture</span>
            <p className="text-slate-300 leading-relaxed uppercase">
              Main systems report 88% average score. Weapons vaults are locked down. Communications are synchronized.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
            <span className="text-[9px] text-amber-400 font-bold">! PENDING ACTIONS</span>
            <p className="text-slate-300 leading-relaxed uppercase">
              1 corrective action active in civil installations. Airfield drainage arrays report under-construction delay.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
            <span className="text-[9px] text-rose-500 font-bold">▲ IMMEDIATE THREATS</span>
            <p className="text-slate-300 leading-relaxed uppercase">
              Biohazard chemical containment reported warning state. Sector Delta requires manual evaluation sweeps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
