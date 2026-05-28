import { ShieldAlert, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import type { SafetyRiskLevel } from '../../lib/mock-data';

interface Props {
  level: SafetyRiskLevel;
  size?: 'sm' | 'md';
}

const CONFIG: Record<SafetyRiskLevel, { label: string; icon: React.ElementType; classes: string }> = {
  LOW:      { label: 'Low',      icon: ShieldCheck, classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  MODERATE: { label: 'Moderate', icon: Shield,      classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400'     },
  HIGH:     { label: 'High',     icon: ShieldAlert, classes: 'border-rose-500/30 bg-rose-500/10 text-rose-400'        },
  CRITICAL: { label: 'Critical', icon: ShieldOff,   classes: 'border-rose-400/50 bg-rose-400/15 text-rose-300 font-black' },
};

export default function RiskBadge({ level, size = 'sm' }: Props) {
  const { label, icon: Icon, classes } = CONFIG[level];
  const text = size === 'md' ? 'text-[11px]' : 'text-[9px]';
  const pad  = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-black uppercase tracking-wider ${text} ${pad} ${classes}`}>
      <Icon className={size === 'md' ? 'h-3 w-3' : 'h-2.5 w-2.5'} />
      {label}
    </span>
  );
}
