import { FileBarChart2, Download, Filter, Plus } from 'lucide-react';

const PLACEHOLDER_REPORTS = [
  { id: '1', title: 'Q2 Compliance Summary',      module: 'ARMOURY',      status: 'FINALIZED', date: '2026-05-15', score: 84 },
  { id: '2', title: 'Site Hazard Assessment',      module: 'SAFETY',       status: 'DRAFT',     date: '2026-05-20', score: 71 },
  { id: '3', title: 'Infrastructure Audit Report', module: 'ENGINEERING',  status: 'REVIEW',    date: '2026-05-22', score: 91 },
  { id: '4', title: 'Personnel Readiness Report',  module: 'PERSONNEL',    status: 'FINALIZED', date: '2026-05-10', score: 88 },
];

const STATUS_STYLES: Record<string, string> = {
  FINALIZED: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8',
  DRAFT:     'text-amber-400  border-amber-500/20  bg-amber-500/8',
  REVIEW:    'text-sky-400    border-sky-500/20    bg-sky-500/8',
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.15em] text-white">Reports</h2>
          <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
            Compliance & operational report registry
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
        >
          <Plus className="h-3.5 w-3.5" />
          Generate Report
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[11px] font-mono text-slate-400 transition hover:text-slate-200"
        >
          <Filter className="h-3.5 w-3.5" />
          Filter by Module
        </button>
      </div>

      {/* Report table */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 border-b border-slate-800/60 px-5 py-3">
          {['Report Title', 'Module', 'Status', 'Date', 'Score', ''].map((col, i) => (
            <div
              key={i}
              className={`text-[9px] font-black uppercase tracking-[0.18em] text-slate-600 ${
                i === 0 ? 'col-span-4' : i === 5 ? 'col-span-1 text-right' : 'col-span-2'
              }`}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/30">
          {PLACEHOLDER_REPORTS.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-slate-900/20 transition">
              <div className="col-span-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white">{r.title}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] font-mono uppercase text-slate-500">{r.module}</span>
              </div>
              <div className="col-span-2">
                <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-mono text-slate-500">{r.date}</span>
              </div>
              <div className="col-span-1">
                <span className="text-[11px] font-black text-white">{r.score}%</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-slate-800/60 p-1.5 text-slate-500 transition hover:border-sky-500/30 hover:text-sky-400"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder chart area */}
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40">
        <div className="text-center">
          <FileBarChart2 className="mx-auto h-8 w-8 text-slate-700" />
          <p className="mt-2 text-[10px] font-mono uppercase text-slate-700">Report analytics coming soon</p>
        </div>
      </div>
    </div>
  );
}
