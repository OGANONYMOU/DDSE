import { ShieldAlert, FolderKanban, ClipboardCheck, AlertCircle, Clock } from 'lucide-react';

interface KPI {
  label:     string;
  value:     number;
  color:     string;
  icon:      React.ElementType;
  subtext:   string;
}

interface Props {
  activeProjects:  number;
  onHoldProjects:  number;
  criticalHazards: number;
  pendingReviews:  number;
  overdueActions:  number;
}

export default function CommandSummary({ activeProjects, onHoldProjects, criticalHazards, pendingReviews, overdueActions }: Props) {
  const kpis: KPI[] = [
    { label: 'Active Projects',     value: activeProjects,  color: 'text-sky-400',     icon: FolderKanban,  subtext: `${onHoldProjects} on hold` },
    { label: 'Critical Hazards',    value: criticalHazards, color: 'text-rose-400',    icon: ShieldAlert,   subtext: 'Require escalation' },
    { label: 'Pending Reviews',     value: pendingReviews,  color: 'text-amber-400',   icon: ClipboardCheck,subtext: 'Awaiting sign-off' },
    { label: 'Open Actions',        value: overdueActions,  color: 'text-amber-300',   icon: AlertCircle,   subtext: 'Corrective actions' },
    { label: 'On Hold Projects',    value: onHoldProjects,  color: 'text-slate-400',   icon: Clock,         subtext: 'Suspended works' },
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
