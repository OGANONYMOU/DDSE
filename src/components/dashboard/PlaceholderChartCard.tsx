import { BarChart2 } from 'lucide-react';

interface PlaceholderChartCardProps {
  title: string;
  description?: string;
  height?: number;
  className?: string;
}

export default function PlaceholderChartCard({
  title,
  description,
  height = 200,
  className = '',
}: PlaceholderChartCardProps) {
  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 ${className}`}>
      <div className="border-b border-slate-800/40 pb-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
            {description}
          </p>
        )}
      </div>
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800/60 bg-slate-900/20"
        style={{ height }}
      >
        <BarChart2 className="h-8 w-8 text-slate-700" />
        <p className="mt-2 text-[10px] font-mono uppercase text-slate-700">
          Analytics — Coming Soon
        </p>
      </div>
    </div>
  );
}
