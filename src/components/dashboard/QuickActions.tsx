import { useNavigate } from 'react-router-dom';
import {
  ClipboardPlus,
  ShieldAlert,
  FolderPlus,
  FileBarChart2,
  type LucideIcon,
} from 'lucide-react';

interface Action {
  label:       string;
  description: string;
  icon:        LucideIcon;
  to:          string;
  tone:        'sky' | 'amber' | 'teal' | 'violet';
}

const TONE_CLASSES: Record<Action['tone'], { border: string; icon: string; hover: string }> = {
  sky:    { border: 'border-sky-500/20',    icon: 'text-sky-400',    hover: 'hover:border-sky-500/40 hover:bg-sky-500/5' },
  amber:  { border: 'border-amber-500/20',  icon: 'text-amber-400',  hover: 'hover:border-amber-500/40 hover:bg-amber-500/5' },
  teal:   { border: 'border-teal-500/20',   icon: 'text-teal-400',   hover: 'hover:border-teal-500/40 hover:bg-teal-500/5' },
  violet: { border: 'border-violet-500/20', icon: 'text-violet-400', hover: 'hover:border-violet-500/40 hover:bg-violet-500/5' },
};

const ACTIONS: Action[] = [
  {
    label:       'New Inspection',
    description: 'Initialize an audit dossier',
    icon:        ClipboardPlus,
    to:          '/inspections',
    tone:        'sky',
  },
  {
    label:       'Safety Assessment',
    description: 'Log a hazard or incident',
    icon:        ShieldAlert,
    to:          '/safety',
    tone:        'amber',
  },
  {
    label:       'New Project',
    description: 'Register a construction project',
    icon:        FolderPlus,
    to:          '/projects',
    tone:        'teal',
  },
  {
    label:       'Generate Report',
    description: 'Compile compliance report',
    icon:        FileBarChart2,
    to:          '/reports',
    tone:        'violet',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 p-5">
      {/* Header */}
      <div className="border-b border-slate-800/40 pb-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
          Quick Actions
        </h3>
        <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
          Common operations
        </p>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((action) => {
          const tone = TONE_CLASSES[action.tone];
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className={`flex flex-col items-start gap-2 rounded-lg border ${tone.border} bg-slate-900/30 p-3 text-left transition-all duration-150 ${tone.hover}`}
            >
              <Icon className={`h-4 w-4 ${tone.icon}`} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-200">
                  {action.label}
                </p>
                <p className="mt-0.5 text-[9px] font-mono text-slate-600 uppercase leading-relaxed">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
