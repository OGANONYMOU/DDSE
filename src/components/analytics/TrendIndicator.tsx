import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Trend = 'UP' | 'DOWN' | 'STABLE';

interface Props {
  trend:   Trend;
  label?:  string;
}

const CONFIG: Record<Trend, { icon: React.ElementType; color: string }> = {
  UP:     { icon: TrendingUp,   color: 'text-emerald-400' },
  DOWN:   { icon: TrendingDown, color: 'text-rose-400'    },
  STABLE: { icon: Minus,        color: 'text-slate-500'   },
};

export default function TrendIndicator({ trend, label }: Props) {
  const { icon: Icon, color } = CONFIG[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase ${color}`}>
      <Icon className="h-2.5 w-2.5" />
      {label ?? trend}
    </span>
  );
}
