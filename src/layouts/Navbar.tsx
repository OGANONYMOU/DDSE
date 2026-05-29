import { useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, Clock, Menu, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { getClearanceLevel, getClearanceLabel, getRoleConfig, hasPermission } from '../lib/rbac';
import { MOCK_NOTIFICATIONS } from '../lib/mock-data';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { observability } from '../lib/observability';

const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

export default function Navbar() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { toggle } = useSidebar();
  const { online } = useNetworkStatus();
  const canViewHealth = hasPermission(user.roleCode, 'system.config') ||
                        hasPermission(user.roleCode, 'system.audit_logs');

  const roleConfig     = getRoleConfig(user.roleCode);
  const clearanceLevel = getClearanceLevel(user.roleCode);
  const clearanceLabel = getClearanceLabel(clearanceLevel);

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year:    'numeric',
    month:   'short',
    day:     'numeric',
  });

  // Derive overall health status from observability
  const healthReport    = observability.getReport();
  const healthStatus    = healthReport.overallStatus;
  const healthIndicator = !online ? 'offline'
    : healthStatus === 'critical'  ? 'critical'
    : healthStatus === 'degraded'  ? 'degraded'
    : 'healthy';

  const healthDot: Record<string, string> = {
    healthy:  'bg-emerald-500',
    degraded: 'bg-amber-500 animate-pulse',
    critical: 'bg-rose-500  animate-pulse',
    offline:  'bg-slate-500',
  };
  const healthLabel: Record<string, string> = {
    healthy: 'All Systems Operational', degraded: 'Degraded', critical: 'Critical', offline: 'Offline',
  };

  return (
    <header role="banner" className="fixed inset-x-0 top-0 z-30 lg:ml-[260px] flex h-[60px] items-center gap-3 border-b border-slate-800/60 bg-[#040810]/95 px-4 lg:px-6 backdrop-blur-md">

      {/* ── Mobile hamburger ── */}
      <button
        type="button"
        onClick={toggle}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-400 transition hover:text-slate-200 shrink-0"
        aria-label="Toggle navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* ── Global search ── */}
      <div role="search" className="relative flex-1 max-w-xs hidden sm:block">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search inspections, reports..."
          aria-label="Global search"
          readOnly
          className="h-8 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 pl-8 pr-3 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none cursor-pointer transition focus:border-sky-500/40"
        />
      </div>

      <div className="flex-1" />

      {/* ── System health indicator (authorized users only) ── */}
      {canViewHealth && (
        <button
          type="button"
          onClick={() => navigate('/system-health')}
          title={`System Health: ${healthLabel[healthIndicator]}`}
          className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-[10px] font-mono text-slate-500 transition hover:border-sky-500/20 hover:text-slate-300"
          aria-label={`System Health — ${healthLabel[healthIndicator]}`}
        >
          <Activity className="h-3 w-3 text-slate-600" aria-hidden="true" />
          <span className={`h-1.5 w-1.5 rounded-full ${healthDot[healthIndicator]}`} aria-hidden="true" />
          <span className="hidden xl:inline">{healthLabel[healthIndicator]}</span>
        </button>
      )}

      {/* ── Date/Time ── */}
      <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-slate-500 border-r border-slate-800/60 pr-4">
        <Clock className="h-3 w-3" aria-hidden="true" />
        <span>{dateStr}</span>
      </div>

      {/* ── Notifications ── */}
      <button
        type="button"
        onClick={() => navigate('/notifications')}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40 text-slate-400 transition hover:border-sky-500/30 hover:text-sky-400"
        aria-label={`Notifications — ${unreadCount} unread`}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[8px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── User Profile ── */}
      <button
        type="button"
        aria-label={`User profile — ${user.fullName}`}
        className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 transition hover:border-sky-500/20"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-[10px] font-black text-white">
          {initials}
        </div>

        <div className="hidden sm:block text-left leading-none">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white">
            {user.fullName.split(' ')[0]}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <span className={`text-[9px] font-black uppercase tracking-wider ${roleConfig.uiTheme.badgeText}`}>
              {roleConfig.label}
            </span>
            <span className="text-slate-700">·</span>
            <span className={`text-[9px] font-mono uppercase ${
              clearanceLevel >= 5 ? 'text-yellow-400' : clearanceLevel >= 3 ? 'text-sky-400' : 'text-slate-400'
            }`}>
              L{clearanceLevel} {clearanceLabel}
            </span>
          </div>
        </div>

        <ChevronDown className="h-3 w-3 text-slate-500" />
      </button>
    </header>
  );
}
