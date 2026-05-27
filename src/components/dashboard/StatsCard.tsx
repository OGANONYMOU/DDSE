import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type StatTone = 'info' | 'warning' | 'danger' | 'success';
export type StatTrend = 'UP' | 'DOWN' | 'STABLE';

interface StatsCardProps {
  label:       string;
  value:       string | number;
  unit?:       string;
  icon:        LucideIcon;
  tone?:       StatTone;
  trend?:      StatTrend;
  trendValue?: string;
  subLabel?:   string;
}

const TONE_MAP: Record<StatTone, { icon: string; border: string; bg: string; iconColor: string; valueColor: string }> = {
  info:    { icon: 'text-sky-400',     border: 'border-sky-500/15',    bg: 'bg-sky-500/8',     iconColor: 'text-sky-400',     valueColor: 'text-white' },
  success: { icon: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'bg-emerald-500/8', iconColor: 'text-emerald-400', valueColor: 'text-white' },
  warning: { icon: 'text-amber-400',   border: 'border-amber-500/15',  bg: 'bg-amber-500/8',   iconColor: 'text-amber-400',   valueColor: 'text-white' },
  danger:  { icon: 'text-rose-400',    border: 'border-rose-500/15',   bg: 'bg-rose-500/8',    iconColor: 'text-rose-400',    valueColor: 'text-rose-300' },
};

const TREND_ICON: Record<StatTrend, LucideIcon> = {
  UP:     TrendingUp,
  DOWN:   TrendingDown,
  STABLE: Minus,
};

const TREND_COLOR: Record<StatTrend, string> = {
  UP:     'text-emerald-400',
  DOWN:   'text-rose-400',
  STABLE: 'text-slate-500',
};

export default function StatsCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'info',
  trend,
  trendValue,
  subLabel,
}: StatsCardProps) {
  const t = TONE_MAP[tone];
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <div
      className={`relative flex flex-col gap-3 overflow-hidden rounded-xl border ${t.border} bg-slate-950/70 p-5 backdrop-blur-sm`}
    >
      {/* Faint top-line accent */}
      <div className={`absolute inset-x-0 top-0 h-[2px] ${tone === 'danger' ? 'bg-rose-500/40' : tone === 'warning' ? 'bg-amber-500/40' : tone === 'success' ? 'bg-emerald-500/40' : 'bg-sky-500/40'}`} />

      {/* Icon + label row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${t.border} ${t.bg}`}>
          <Icon className={`h-4 w-4 ${t.iconColor}`} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span className={`text-3xl font-black tabular-nums leading-none ${t.valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="mb-0.5 text-xs font-mono text-slate-500 uppercase">{unit}</span>
        )}
      </div>

      {/* Trend + sub-label */}
      <div className="flex items-center justify-between">
        {subLabel && (
          <p className="text-[10px] font-mono text-slate-600 uppercase">{subLabel}</p>
        )}
        {trend && TrendIcon && (
          <div className={`ml-auto flex items-center gap-1 text-[10px] font-mono ${TREND_COLOR[trend]}`}>
            <TrendIcon className="h-3 w-3" />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
