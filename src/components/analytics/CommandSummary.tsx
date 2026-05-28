import { ShieldAlert, FolderKanban, ClipboardCheck, AlertCircle, Clock } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_HAZARD_ASSESSMENTS, MOCK_INSPECTIONS } from '../../lib/mock-data';

interface KPI {
  label:     string;
  value:     number;
  color:     string;
  icon:      React.ElementType;
  subtext:   string;
}

export default function CommandSummary() {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === 'in_progress').length;
  const criticalHazards = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'CRITICAL').length;
  const pendingInspections = MOCK_INSPECTIONS.filter((i) => i.status === 'in_review' || i.status === 'submitted').length;
  const overdueActions = MOCK_HAZARD_ASSESSMENTS.flatMap((h) => h.correctiveActions).filter((a) => a.status === 'pending').length;
  const onHold = MOCK_PROJECTS.filter((p) => p.status === 'on_hold').length;

  const kpis: KPI[] = [
    { label: 'Active Projects',     value: activeProjects,     color: 'text-sky-400',     icon: FolderKanban,  subtext: `${onHold} on hold` },
    { label: 'Critical Hazards',    value: criticalHazards,    color: 'text-rose-400',    icon: ShieldAlert,   subtext: 'Require escalation' },
    { label: 'Pending Reviews',     value: pendingInspections, color: 'text-amber-400',   icon: ClipboardCheck,subtext: 'Awaiting sign-off' },
    { label: 'Open Actions',        value: overdueActions,     color: 'text-amber-300',   icon: AlertCircle,   subtext: 'Corrective actions' },
    { label: 'On Hold Projects',    value: onHold,             color: 'text-slate-400',   icon: Clock,         subtext: 'Suspended works' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 leading-snug">{kpi.label}</p>
              <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${kpi.color}`} />
            </div>
            <p className={`mt-2 text-3xl font-black tabular-nums leading-none ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-1.5 text-[9px] font-mono text-slate-600 uppercase">{kpi.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
