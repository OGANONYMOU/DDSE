import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  total: number;
  pageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  goTo: (p: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export function usePagination({ total, pageSize = 15 }: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const goTo     = useCallback((p: number) => setPage(Math.min(Math.max(1, p), totalPages)), [totalPages]);
  const next     = useCallback(() => goTo(page + 1), [goTo, page]);
  const prev     = useCallback(() => goTo(page - 1), [goTo, page]);
  const reset    = useCallback(() => setPage(1), []);

  return {
    page,
    pageSize,
    totalPages,
    offset: (page - 1) * pageSize,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    goTo,
    next,
    prev,
    reset,
  };
}
