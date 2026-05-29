// Enterprise error logging service.
// Captures frontend errors with context, deduplicates, and sends to a
// monitoring endpoint when available. In development, logs to console.

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorReport {
  id:         string;
  message:    string;
  stack?:     string;
  severity:   ErrorSeverity;
  context?:   Record<string, unknown>;
  url:        string;
  userAgent:  string;
  timestamp:  number;
  userId?:    string;
  roleCode?:  string;
}

// ─── Internal buffer (prevents log flooding) ──────────────────────────────────

const SEEN_MESSAGES = new Set<string>();
const MAX_DEDUP     = 50;

function shouldSuppress(message: string): boolean {
  if (SEEN_MESSAGES.has(message)) return true;
  if (SEEN_MESSAGES.size >= MAX_DEDUP) SEEN_MESSAGES.clear();
  SEEN_MESSAGES.add(message);
  return false;
}

// ─── Main logger ──────────────────────────────────────────────────────────────

export function logError(
  error: unknown,
  opts: {
    severity?: ErrorSeverity;
    context?:  Record<string, unknown>;
    userId?:   string;
    roleCode?: string;
  } = {}
): void {
  const err     = error instanceof Error ? error : new Error(String(error));
  const message = err.message;

  if (shouldSuppress(message)) return;

  const report: ErrorReport = {
    id:        `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message,
    stack:     err.stack,
    severity:  opts.severity ?? 'medium',
    context:   opts.context,
    url:       window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    userId:    opts.userId,
    roleCode:  opts.roleCode,
  };

  if (import.meta.env.DEV) {
    const prefix = `[DDSE Error — ${report.severity.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    console.error(prefix, report.message, report.context ?? '', err);
  }

  // Buffer for potential remote reporting (wired up when monitoring is active)
  try {
    const buffer = JSON.parse(sessionStorage.getItem('ddse_error_log') ?? '[]') as ErrorReport[];
    buffer.push(report);
    if (buffer.length > 100) buffer.splice(0, buffer.length - 100);
    sessionStorage.setItem('ddse_error_log', JSON.stringify(buffer));
  } catch {
    // sessionStorage unavailable
  }
}

// ─── Retry utility ────────────────────────────────────────────────────────────

export interface RetryOptions {
  attempts?:    number;   // default 3
  delayMs?:     number;   // initial back-off, default 500
  backoff?:     number;   // multiplier per attempt, default 2
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function withRetry<T>(
  fn:   () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    attempts    = 3,
    delayMs     = 500,
    backoff     = 2,
    shouldRetry = () => true,
  } = opts;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isLast = attempt === attempts;
      if (isLast || !shouldRetry(err, attempt)) break;

      const wait = delayMs * Math.pow(backoff, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}

// ─── Global unhandled error capture ──────────────────────────────────────────

export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) => {
    logError(event.error ?? event.message, { severity: 'high', context: { type: 'unhandled_error' } });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    logError(event.reason, { severity: 'high', context: { type: 'unhandled_rejection' } });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
