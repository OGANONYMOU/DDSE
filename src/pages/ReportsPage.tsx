import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { FileBarChart2, Search, Plus, Download, Archive } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/ui/PageHeader';
import { listReports } from '../services/reports';
import { approveReport, declineReport } from '../services/reports';
import { supabase } from '../lib/supabase';
import type { Report, ReportStatus, ReportType } from '../types/reports';
import { CLASSIFICATION_COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { isAdminOrAbove } from '../lib/rbac';

function exportReportsToCsv(reports: Report[]) {
  const headers = ['Title', 'Type', 'Directorate', 'Submitted By', 'Status', 'Classification', 'Created', 'Approved By', 'Approved At'];
  const rows = reports.map((r) => [
    r.title, r.type, r.directorateCode, r.generatedByName ?? r.generatedBy,
    r.status, r.classification, r.createdAt.split('T')[0],
    r.approvedByName ?? '', r.approvedAt ? r.approvedAt.split('T')[0] : '',
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reports-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type StatusFilter = ReportStatus | 'all';
type TypeFilter   = ReportType   | 'all';

const STATUS_FILTERS: StatusFilter[] = ['all', 'pending_review', 'approved', 'draft', 'rejected', 'archived'];
const STATUS_STYLE: Record<ReportStatus, string> = {
  draft:          'border-slate-700/60 bg-slate-800/30 text-slate-400',
  pending_review: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  approved:       'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  rejected:       'border-rose-500/30 bg-rose-500/10 text-rose-400',
  archived:       'border-slate-700/40 bg-slate-900/30 text-slate-500',
};

const TYPE_FILTERS: TypeFilter[] = [
  'all',
  'Inspection Report',
  'Hazard Assessment Report',
  'Project Progress Report',
  'Contractor Evaluation',
  'Compliance Summary',
  'Safety Violation Report',
  'Operational Readiness Summary',
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [search,      setSearch]      = useState('');
  const [statusF,     setStatusF]     = useState<StatusFilter>('all');
  const [typeF,       setTypeF]       = useState<TypeFilter>('all');
  const [allReports,  setAllReports]  = useState<Report[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  // I-8: Bulk selection
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkBusy,    setBulkBusy]    = useState(false);
  const debouncedSearch               = useDebounce(search, 250);
  const { user } = useAuth();
  // Mirrors the `reports_update` RLS policy — anyone the DB actually lets approve/decline.
  const isApprover = isAdminOrAbove(user.roleCode, user.isPlatformOwner);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    listReports({
      search: debouncedSearch || undefined,
      type:   typeF   === 'all' ? undefined : typeF,
      status: statusF === 'all' ? undefined : statusF,
    })
      .then(setAllReports)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [debouncedSearch, typeF, statusF]);

  // I-8: Bulk archive selected reports
  async function handleBulkArchive() {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'archived' })
        .in('id', [...selected])
        .in('status', ['approved', 'rejected']);
      if (error) throw error;
      toast.success(`${selected.size} report${selected.size !== 1 ? 's' : ''} archived.`);
      setSelected(new Set());
      const fresh = await listReports({
        search: debouncedSearch || undefined,
        type:   typeF   === 'all' ? undefined : typeF,
        status: statusF === 'all' ? undefined : statusF,
      });
      setAllReports(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk archive failed.');
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === allReports.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allReports.map((r) => r.id)));
    }
  }

  const counts = useMemo(() => ({
    total:    allReports.length,
    pending:  allReports.filter((r) => r.status === 'pending_review').length,
    approved: allReports.filter((r) => r.status === 'approved').length,
    draft:    allReports.filter((r) => r.status === 'draft').length,
  }), [allReports]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Inspection, compliance & operational report registry"
        action={
            <button
              type="button"
              onClick={() => {
                if (isApprover) exportReportsToCsv(selected.size > 0 ? allReports.filter((r) => selected.has(r.id)) : allReports);
                else navigate('/reports/create');
              }}
              className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15">
              {isApprover ? <Download className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {isApprover ? 'Export Report' : 'Generate Report'}
            </button>
          }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Reports',  value: counts.total,   color: 'text-white' },
          { label: 'Pending Review', value: counts.pending, color: 'text-sky-400' },
          { label: 'Approved',       value: counts.approved,color: 'text-emerald-400' },
          { label: 'Drafts',         value: counts.draft,   color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${s.color}`}>
              {loading ? '…' : s.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[11px] font-mono text-rose-400">
          Failed to load reports: {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text" placeholder="Search by title, project or author..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button key={s} type="button" onClick={() => setStatusF(s)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                  statusF === s ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                }`}>
                {s === 'all' ? 'All Status' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button key={t} type="button" onClick={() => setTypeF(t)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                typeF === t ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
              }`}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* I-8: Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
          <span className="text-[11px] font-black uppercase text-sky-300">
            {selected.size} selected
          </span>
          {isApprover && (
            <button
              type="button"
              onClick={() => exportReportsToCsv(allReports.filter((r) => selected.has(r.id)))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 transition hover:border-sky-500/30 hover:text-sky-400"
            >
              <Download className="h-3 w-3" />
              Export Selected
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleBulkArchive()}
            disabled={bulkBusy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 transition hover:border-amber-500/30 hover:text-amber-400 disabled:opacity-50"
          >
            <Archive className="h-3 w-3" />
            {bulkBusy ? 'Archiving…' : 'Archive Selected'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
        <div className="hidden lg:grid grid-cols-[32px_minmax(0,3fr)_200px_minmax(0,1.5fr)_100px_100px_110px_80px] gap-4 border-b border-slate-800/60 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
          {/* I-8: Select all checkbox */}
          <input type="checkbox"
            checked={selected.size === allReports.length && allReports.length > 0}
            onChange={toggleSelectAll}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 accent-sky-500"
          />
          <span>Report</span><span>Submitted By</span><span>Type</span><span>Directorate</span>
          <span>Classification</span><span>Status</span><span className="text-right">Export</span>
        </div>

        <div className="divide-y divide-slate-800/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading reports…</p>
            </div>
          ) : allReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileBarChart2 className="h-10 w-10 text-slate-700" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">No reports match your filter</p>
            </div>
          ) : (
            allReports.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="grid grid-cols-1 lg:grid-cols-[32px_minmax(0,3fr)_minmax(0,1.5fr)_100px_100px_110px_80px] gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-900/40 cursor-pointer"
              >
                {/* I-8: Row checkbox */}
                <div onClick={(e) => { e.stopPropagation(); toggleSelect(r.id); }}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)}
                    className="rounded border-slate-700 bg-slate-900 accent-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white leading-snug">{r.title}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500">
                    {r.projectName ?? r.directorateCode} · {r.createdAt.split('T')[0]}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-snug">{r.generatedByName ?? r.generatedBy}</p>
                <p className="text-[10px] font-mono text-slate-400 leading-snug">{r.type}</p>
                <p className="text-[10px] font-mono text-slate-400 uppercase">{r.directorateCode}</p>
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit ${CLASSIFICATION_COLORS[r.classification]}`}>
                  {r.classification}
                </span>
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit ${STATUS_STYLE[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </span>
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {isApprover && r.status === 'pending_review' ? (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={async () => {
                        try {
                          await approveReport(r.id, user.fullName || user.email || 'Approver', user.id);
                          toast.success('Report approved');
                          const fresh = await listReports({ search: debouncedSearch || undefined, type: typeF === 'all' ? undefined : typeF, status: statusF === 'all' ? undefined : statusF });
                          setAllReports(fresh);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Approve failed');
                        }
                      }} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-300">Approve</button>
                      <button type="button" onClick={async () => {
                        const note = window.prompt('Enter a note explaining the rejection:');
                        if (note === null) return;
                        try {
                          await declineReport(r.id, user.fullName || user.email || 'Reviewer', user.id, note || undefined);
                          toast.success('Report rejected');
                          const fresh = await listReports({ search: debouncedSearch || undefined, type: typeF === 'all' ? undefined : typeF, status: statusF === 'all' ? undefined : statusF });
                          setAllReports(fresh);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Reject failed');
                        }
                      }} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase text-rose-300">Decline</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => exportReportsToCsv([r])}
                      className="rounded-lg border border-slate-800/60 p-1.5 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400"
                      title="Export"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-right text-[10px] font-mono text-slate-600 uppercase">
        Showing {allReports.length} reports
      </p>
    </div>
  );
}
