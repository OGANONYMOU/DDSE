import { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Clock, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import { getAuditLogs, type AuditEvent, type AuditAction } from '../services/auditLogger';
import { usePagination } from '../hooks/usePagination';
import PageHeader from '../components/ui/PageHeader';
import PaginationBar from '../components/ui/PaginationBar';
import ErrorState from '../components/ui/ErrorState';
import { TableRowSkeleton } from '../components/ui/SkeletonLoader';

const ACTION_LABELS: Record<AuditAction, string> = {
  'auth.login':               'Login',
  'auth.logout':              'Logout',
  'auth.mfa_enroll':          'MFA Enrolled',
  'auth.password_change':     'Password Changed',
  'auth.session_extended':    'Session Extended',
  'inspection.created':       'Inspection Created',
  'inspection.submitted':     'Inspection Submitted',
  'inspection.approved':      'Inspection Approved',
  'inspection.rejected':      'Inspection Rejected',
  'report.created':           'Report Created',
  'report.submitted':         'Report Submitted',
  'report.approved':          'Report Approved',
  'report.modified':          'Report Modified',
  'hazard.created':                    'Hazard Created',
  'hazard.workflow_updated':           'Hazard Workflow Updated',
  'hazard.corrective_action_closed':   'Corrective Action Closed',
  'hazard.escalated':         'Hazard Escalated',
  'hazard.resolved':          'Hazard Resolved',
  'automation.inspection_flagged_overdue': 'Inspection Flagged Overdue',
  'personnel.role_changed':   'Role Changed',
  'personnel.registered':     'Personnel Registered',
  'personnel.approved':       'Personnel Approved',
  'personnel.suspended':      'Personnel Suspended',
  'project.updated':          'Project Updated',
  'project.created':          'Project Created',
  'document.uploaded':        'Document Uploaded',
  'document.deleted':         'Document Deleted',
  'system.emergency_lockdown':'Emergency Lockdown',
  'system.config_changed':    'Config Changed',
};

const CATEGORY_COLORS: Record<string, string> = {
  auth:       'text-sky-400 bg-sky-500/10 border-sky-500/20',
  inspection: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  report:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hazard:     'text-rose-400 bg-rose-500/10 border-rose-500/20',
  personnel:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  project:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  document:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
  system:     'text-red-400 bg-red-500/10 border-red-500/20',
};

function actionCategory(action: string): string {
  return action.split('.')[0];
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)   return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const PAGE_SIZE = 15;

export default function AuditLogPage() {
  const { user }  = useAuth();
  const canView   = hasPermission(user.roleCode, 'system.audit_logs') || hasPermission(user.roleCode, 'audit.view');

  const [logs,    setLogs]    = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [filter,  setFilter]  = useState<string>('all');

  const filtered  = useMemo(
    () => filter === 'all' ? logs : logs.filter((l) => actionCategory(l.action) === filter),
    [logs, filter]
  );

  const { page, totalPages, offset, hasPrev, hasNext, goTo, next, prev } =
    usePagination({ total: filtered.length, pageSize: PAGE_SIZE });

  const paginated = useMemo(
    () => filtered.slice(offset, offset + PAGE_SIZE),
    [filtered, offset]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getAuditLogs({ limit: 200 });
      setLogs(data);
    } catch {
      setError(true);
      toast.error('Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (!canView) {
    return (
      <div className="pt-20">
        <ErrorState variant="unauthorized" />
      </div>
    );
  }

  const categories = ['all', 'auth', 'inspection', 'report', 'hazard', 'personnel', 'project', 'document', 'system'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Tamper-evident record of all platform actions"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            aria-label="Refresh audit log"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <Filter className="h-3.5 w-3.5 self-center text-slate-600" aria-hidden="true" />
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setFilter(cat); goTo(1); }}
            aria-pressed={filter === cat}
            className={`rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
              filter === cat
                ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                : 'border-slate-700/50 bg-slate-900/30 text-slate-500 hover:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Events', value: logs.length,                                       icon: Shield },
          { label: 'Successful',   value: logs.filter((l) => l.status === 'success').length, icon: CheckCircle },
          { label: 'Failed',       value: logs.filter((l) => l.status === 'failure').length, icon: XCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
            </div>
            <p className="mt-1 text-xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_120px_80px] gap-4 border-b border-slate-800/60 px-5 py-3">
          {['Action', 'Actor Role', 'Time', 'Status'].map((h) => (
            <p key={h} className="text-[9px] font-black uppercase tracking-widest text-slate-600">{h}</p>
          ))}
        </div>

        {loading && (
          <div className="divide-y divide-slate-800/40" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}
          </div>
        )}

        {!loading && error && (
          <div className="p-8">
            <ErrorState variant="unavailable" onRetry={() => void load()} />
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="h-8 w-8 text-slate-700 mb-3" aria-hidden="true" />
            <p className="text-[11px] font-mono uppercase text-slate-600">No audit events found</p>
          </div>
        )}

        {!loading && !error && (
          <div className="divide-y divide-slate-800/40">
            {paginated.map((log, i) => {
              const cat      = actionCategory(log.action);
              const catColor = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.system;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.16 }}
                  className="grid grid-cols-[1fr_160px_120px_80px] gap-4 items-center px-5 py-3 hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${catColor}`}>
                      {cat}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-white">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      {log.entityId && (
                        <p className="truncate text-[9px] font-mono text-slate-600 uppercase">
                          {log.entityType} · {log.entityId}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] font-mono uppercase text-slate-400 truncate">
                    {log.actorRole?.replace(/_/g, ' ') ?? '—'}
                  </p>

                  <p className="text-[10px] font-mono text-slate-500">{relativeTime(log.createdAt)}</p>

                  <div className="flex items-center gap-1.5">
                    {log.status === 'success'
                      ? <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" aria-hidden="true" />
                      : <XCircle    className="h-3 w-3 text-rose-400 shrink-0"    aria-hidden="true" />}
                    <span className={`text-[9px] font-black uppercase ${log.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      )}
    </div>
  );
}
