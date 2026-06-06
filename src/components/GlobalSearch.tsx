// N-3: Global full-text search using Supabase pg_trgm across all modules.
// Activated by Ctrl+K / Cmd+K from anywhere in the app.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileBarChart2, ClipboardCheck, ShieldAlert, FolderKanban, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDebounce } from '../hooks/useDebounce';

interface SearchResult {
  id:       string;
  module:   'inspection' | 'report' | 'hazard' | 'project' | 'finding';
  title:    string;
  subtitle: string;
  href:     string;
  score?:   number;
}

const MODULE_ICON = {
  inspection: ClipboardCheck,
  report:     FileBarChart2,
  hazard:     ShieldAlert,
  project:    FolderKanban,
  finding:    AlertTriangle,
};

const MODULE_COLOR = {
  inspection: 'text-sky-400',
  report:     'text-teal-400',
  hazard:     'text-rose-400',
  project:    'text-violet-400',
  finding:    'text-amber-400',
};

async function runSearch(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];
  const q = `%${query}%`;

  const [inspections, reports, hazards, projects, findings] = await Promise.all([
    supabase.from('inspections')
      .select('id, title, status, directorate_code')
      .ilike('title', q).limit(4),
    supabase.from('reports')
      .select('id, title, status, type')
      .ilike('title', q).limit(4),
    supabase.from('hazard_assessments')
      .select('id, hazard_title, risk_level, category')
      .ilike('hazard_title', q).limit(4),
    supabase.from('projects')
      .select('id, title, status, directorate_code')
      .ilike('title', q).limit(4),
    supabase.from('findings')
      .select('id, title, severity, inspection_id')
      .ilike('title', q).limit(3),
  ]);

  const results: SearchResult[] = [];

  for (const r of inspections.data ?? []) {
    results.push({ id: String(r.id), module: 'inspection', title: String(r.title), subtitle: `${r.status} · ${r.directorate_code}`, href: `/inspections/${r.id}` });
  }
  for (const r of reports.data ?? []) {
    results.push({ id: String(r.id), module: 'report', title: String(r.title), subtitle: `${r.type} · ${r.status}`, href: `/reports/${r.id}` });
  }
  for (const r of hazards.data ?? []) {
    results.push({ id: String(r.id), module: 'hazard', title: String(r.hazard_title), subtitle: `${r.category} · ${r.risk_level}`, href: `/safety/${r.id}` });
  }
  for (const r of projects.data ?? []) {
    results.push({ id: String(r.id), module: 'project', title: String(r.title), subtitle: `${r.status} · ${r.directorate_code}`, href: `/projects/${r.id}` });
  }
  for (const r of findings.data ?? []) {
    results.push({ id: String(r.id), module: 'finding', title: String(r.title), subtitle: `Finding · ${r.severity}`, href: `/inspections/${r.inspection_id}` });
  }

  return results;
}

interface Props {
  onClose: () => void;
}

export default function GlobalSearch({ onClose }: Props) {
  const navigate   = useNavigate();
  const inputRef   = useRef<HTMLInputElement>(null);
  const [query,    setQuery]   = useState('');
  const [results,  setResults] = useState<SearchResult[]>([]);
  const [loading,  setLoading] = useState(false);
  const [cursor,   setCursor]  = useState(-1);
  const debounced              = useDebounce(query, 200);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!debounced) { setResults([]); return; }
    setLoading(true);
    runSearch(debounced)
      .then((r) => { setResults(r); setCursor(-1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debounced]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.href);
    onClose();
  }, [navigate, onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, -1));
    } else if (e.key === 'Enter' && cursor >= 0) {
      handleSelect(results[cursor]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-950/98 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search inspections, reports, hazards, projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-600 outline-none"
          />
          <div className="flex items-center gap-2">
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />}
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700/60 p-1 text-slate-500 hover:text-slate-300 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
            {results.map((r, i) => {
              const Icon  = MODULE_ICON[r.module];
              const color = MODULE_COLOR[r.module];
              return (
                <button
                  key={r.id + r.module}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition ${i === cursor ? 'bg-slate-800/60' : 'hover:bg-slate-900/40'}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-white truncate">{r.title}</p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-500 uppercase">{r.subtitle}</p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black uppercase ${color}`}>{r.module}</span>
                </button>
              );
            })}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-[12px] font-mono text-slate-600">No results for "{query}"</p>
          </div>
        )}

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-slate-800/60 px-5 py-2.5">
          {[['↑↓', 'Navigate'], ['Enter', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-600">
              <kbd className="rounded border border-slate-700/60 bg-slate-800/60 px-1 py-0.5 text-slate-500">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
