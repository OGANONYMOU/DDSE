/** Themed skeleton primitives for the dark military enterprise UI. */

interface SkeletonProps {
  className?: string;
}

export function Skel({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-800/60 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  const widths = ['flex-[2.5]', 'flex-[1.5]', 'flex-1', 'flex-1', 'flex-1'];
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-800/30 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <Skel key={i} className={`h-3 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70" aria-busy="true">
      <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/60">
        {Array.from({ length: cols }).map((_, i) => (
          <Skel key={i} className="h-2 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3 space-y-2.5">
          <Skel className="h-2 w-24" />
          <Skel className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page content">
      <div className="space-y-2">
        <Skel className="h-6 w-56" />
        <Skel className="h-3 w-96 max-w-full" />
      </div>
      <CardGridSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
