import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (p: number) => void;
}

export default function PaginationBar({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onGoTo,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-2"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Previous page"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-7 w-7 items-center justify-center text-[10px] font-mono text-slate-600"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onGoTo(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black transition ${
              p === page
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:border-sky-500/20 hover:text-slate-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Next page"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
