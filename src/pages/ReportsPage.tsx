import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { FileBarChart2, Search, Plus, Download } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { filterReports } from '../services/reports';
import { MOCK_REPORTS, type MockReport, type ReportStatus, type ReportType } from '../lib/mock-data';
import { CLASSIFICATION_COLORS } from '../constants/app';
import { getReports } from '../lib/api';

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
  const [allReports,  setAllReports]  = useState<MockReport[]>(MOCK_REPORTS);
  const debouncedSearch               = useDebounce(search, 250);

  useEffect(() => {
    getReports()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setAllReports(data as MockReport[]); })
      .catch(() => {});
  }, []);

  const reports = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return allReports.filter((r) => {
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.projectName ?? '').toLowerCase().includes(q) ||
        r.generatedBy.toLowerCase().includes(q);
      return (
        matchSearch &&
        (statusF === 'all' || r.status === statusF) &&
        (typeF === 'all' || r.type === typeF)
      );
    });
  }, [allReports, debouncedSearch, statusF, typeF]);

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
            className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Report
          </button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Reports',   value: counts.total,   color: 'text-white' },
          { label: 'Pending Review',  value: counts.pending, color: 'text-sky-400' },
          { label: 'Approved',        value: counts.approved,color: 'text-emerald-400' },
          { label: 'Drafts',          value: counts.draft,   color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, project or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusF(s)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                  statusF === s
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                    : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s === 'all' ? 'All Status' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeF(t)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                typeF === t
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
        <div className="hidden lg:grid grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)_100px_100px_110px_80px] gap-4 border-b border-slate-800/60 px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
          <span>Report</span>
          <span>Type</span>
          <span>Directorate</span>
          <span>Classification</span>
          <span>Status</span>
          <span className="text-right">Export</span>
        </div>

        <div className="divide-y divide-slate-800/30">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileBarChart2 className="h-10 w-10 text-slate-700" />
              <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">No reports match your filter</p>
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)_100px_100px_110px_80px] gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-900/40 cursor-pointer"
              >
                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono text-slate-600">{r.id}</span>
                  </div>
                  <p className="text-[12px] font-bold text-white leading-snug">{r.title}</p>
                  <p className="mt-0.5 text-[10px] font-mono text-slate-500">
                    {r.projectName ?? r.directorateCode} · {r.createdAt}
                  </p>
                </div>

                {/* Type */}
                <p className="text-[10px] font-mono text-slate-400 leading-snug">{r.type}</p>

                {/* Directorate */}
                <p className="text-[10px] font-mono text-slate-400 uppercase">{r.directorateCode}</p>

                {/* Classification */}
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit ${CLASSIFICATION_COLORS[r.classification]}`}>
                  {r.classification}
                </span>

                {/* Status */}
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider w-fit ${STATUS_STYLE[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </span>

                {/* Export */}
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-800/60 p-1.5 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400"
                    title="Export report"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-right text-[10px] font-mono text-slate-600 uppercase">
        Showing {reports.length} of {allReports.length} reports
      </p>
    </div>
  );
}
