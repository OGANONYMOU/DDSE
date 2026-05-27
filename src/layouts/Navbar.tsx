import { useState } from 'react';
import { Bell, Search, ChevronDown, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClearanceLevel, getClearanceLabel, getRoleConfig } from '../lib/rbac';

export default function Navbar() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const roleConfig     = getRoleConfig(user.roleCode);
  const clearanceLevel = getClearanceLevel(user.roleCode);
  const clearanceLabel = getClearanceLabel(clearanceLevel);

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year:    'numeric',
    month:   'short',
    day:     'numeric',
  });

  return (
    <header className="fixed inset-x-0 top-0 z-30 ml-[260px] flex h-[60px] items-center gap-4 border-b border-slate-800/60 bg-[#040810]/95 px-6 backdrop-blur-md">

      {/* ── Search ── */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search inspections, reports, personnel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
        />
      </div>

      <div className="flex-1" />

      {/* ── Date/Time ── */}
      <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-slate-500 border-r border-slate-800/60 pr-4">
        <Clock className="h-3 w-3" />
        <span>{dateStr}</span>
      </div>

      {/* ── Notifications ── */}
      <button
        type="button"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-400 transition hover:border-sky-500/30 hover:text-sky-400"
        aria-label="Notifications"
      >
        <Bell className="h-3.5 w-3.5" />
        {/* Badge — swap with real count when wired up */}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[8px] font-black text-white">
          3
        </span>
      </button>

      {/* ── User Profile ── */}
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 transition hover:border-sky-500/20"
      >
        {/* Avatar */}
        <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-[10px] font-black text-white">
          {initials}
        </div>

        {/* Name + rank block */}
        <div className="hidden sm:block text-left leading-none">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white">
            {user.fullName.split(' ')[0]}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={`text-[9px] font-black uppercase tracking-wider ${roleConfig.uiTheme.badgeText}`}
            >
              {roleConfig.label}
            </span>
            <span className="text-slate-700">·</span>
            <span
              className={`text-[9px] font-mono uppercase ${
                clearanceLevel >= 5
                  ? 'text-yellow-400'
                  : clearanceLevel >= 3
                  ? 'text-sky-400'
                  : 'text-slate-400'
              }`}
            >
              L{clearanceLevel} {clearanceLabel}
            </span>
          </div>
        </div>

        <ChevronDown className="h-3 w-3 text-slate-500" />
      </button>
    </header>
  );
}
