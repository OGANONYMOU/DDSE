import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  ShieldAlert,
  FileBarChart2,
  Users,
  Bell,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  ScrollText,
  Radio,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClearanceLabel, getClearanceLevel, getRoleConfig, hasPermission, type Permission } from '../lib/rbac';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to:         string;
  label:      string;
  icon:       LucideIcon;
  end?:       boolean;
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',              label: 'Dashboard',          icon: LayoutDashboard, end: true },
  { to: '/projects',      label: 'Projects',           icon: FolderKanban },
  { to: '/inspections',   label: 'Inspections',        icon: ClipboardCheck },
  { to: '/safety',        label: 'Safety Assessments', icon: ShieldAlert },
  { to: '/reports',       label: 'Reports',            icon: FileBarChart2 },
  { to: '/personnel',     label: 'Personnel',          icon: Users, permission: 'personnel.view_all' },
  // Phase 11 — Enterprise modules
  { to: '/broadcasts',    label: 'Broadcasts',         icon: Radio },
];

const BOTTOM_ITEMS: NavItem[] = [
  { to: '/notifications',  label: 'Notifications', icon: Bell },
  { to: '/settings',       label: 'Settings',      icon: Settings },
  { to: '/audit-log',      label: 'Audit Log',     icon: ScrollText,  permission: 'audit.view' },
  // Phase 12 — Platform Ecosystem
  { to: '/system-health',  label: 'System Health', icon: HeartPulse,  permission: 'system.audit_logs' },
];

export default function Sidebar() {
  const { user, onLogout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isOpen, close } = useSidebar();

  // Close sidebar on route change (mobile)
  useEffect(() => { close(); }, [location.pathname, close]);

  const roleConfig    = getRoleConfig(user.roleCode);
  const clearanceLevel = getClearanceLevel(user.roleCode);
  const clearanceLabel = getClearanceLabel(clearanceLevel);

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  async function handleLogout() {
    await onLogout();
    navigate('/');
  }

  return (
    <aside
      aria-label="Primary navigation"
      className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-800/60 bg-[#040810] transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* ── Brand Header ── */}
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-slate-800/60 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10">
          <Shield className="h-4 w-4 text-sky-400" />
        </div>
        <div className="leading-none">
          <p className="text-[11px] font-black tracking-[0.2em] text-white uppercase">DDSE</p>
          <p className="mt-0.5 text-[9px] font-mono tracking-widest text-slate-500 uppercase">
            Command Directory
          </p>
        </div>
        <div className="ml-auto">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
        </div>
      </div>

      {/* ── Primary Navigation ── */}
      <nav aria-label="Main menu" className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
          Navigation
        </p>
        {NAV_ITEMS.filter(({ permission }) =>
          !permission || hasPermission(user.roleCode, permission)
        ).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className={({ isActive }: { isActive: boolean }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sky-500/10 text-white'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-500" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wider">
                  {label}
                </span>
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-sky-500/60" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-3 border-t border-slate-800/60" />

        <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
          System
        </p>
        {BOTTOM_ITEMS.filter(({ permission }) =>
          !permission || hasPermission(user.roleCode, permission)
        ).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }: { isActive: boolean }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sky-500/10 text-white'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-500" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wider">
                  {label}
                </span>
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-sky-500/60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Card + Logout ── */}
      <div className="shrink-0 border-t border-slate-800/60 p-3 space-y-2">
        {/* User identity block */}
        <div className="flex items-center gap-3 rounded-lg bg-slate-900/40 border border-slate-800/40 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-[11px] font-black text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-white">
              {user.fullName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] font-black uppercase tracking-wider ${roleConfig.uiTheme.badgeText}`}
              >
                {roleConfig.label}
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                L{clearanceLevel} {clearanceLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="Sign out of DDSE"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-all hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
