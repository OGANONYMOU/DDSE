import type { MockProject } from '../../lib/mock-data';

interface Field {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}

const PRIORITY_COLOR: Record<MockProject['priority'], string> = {
  ROUTINE:   'text-slate-400',
  PRIORITY:  'text-sky-400',
  URGENT:    'text-amber-400',
  EMERGENCY: 'text-rose-400',
};

function formatBudget(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${n.toLocaleString()}`;
}

interface Props {
  project: MockProject;
}

export default function ProjectOverview({ project }: Props) {
  const fields: Field[] = [
    { label: 'Project Code',     value: project.projectCode,    mono: true },
    { label: 'Type',             value: project.type },
    { label: 'Directorate',      value: project.directorateCode, mono: true },
    { label: 'Lead Inspector',   value: project.leadInspector },
    { label: 'Contractor',       value: project.contractor,      wide: true },
    { label: 'Location',         value: project.location,        wide: true },
    { label: 'Budget',           value: formatBudget(project.budgetNGN), mono: true },
    { label: 'Timeline',         value: `${project.startDate}  →  ${project.endDate}`, mono: true },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
      {/* Priority strip */}
      <div className="border-b border-slate-800/60 px-5 py-3 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Project Overview
        </p>
        <span className={`text-[10px] font-black uppercase tracking-wider ${PRIORITY_COLOR[project.priority]}`}>
          {project.priority} PRIORITY
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-800/30">
        {fields.map((f) => (
          <div
            key={f.label}
            className={`px-5 py-4 ${f.wide ? 'col-span-2' : ''}`}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
              {f.label}
            </p>
            <p className={`mt-1 text-[12px] leading-snug text-slate-200 ${f.mono ? 'font-mono' : 'font-semibold'}`}>
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
