import { Settings, User, Lock, Bell, Shield, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClearanceLabel, getClearanceLevel, getRoleConfig } from '../lib/rbac';

const SETTING_SECTIONS = [
  { icon: User,     label: 'Profile',        description: 'Display name, rank, contact details' },
  { icon: Lock,     label: 'Security',       description: 'Password, MFA configuration, session policy' },
  { icon: Bell,     label: 'Notifications',  description: 'Alert preferences, email digest settings' },
  { icon: Shield,   label: 'Access Control', description: 'Role, clearance, directorate assignment' },
  { icon: Terminal, label: 'API & Tokens',   description: 'Manage API tokens and integration keys' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const roleConfig     = getRoleConfig(user.roleCode);
  const clearanceLevel = getClearanceLevel(user.roleCode);
  const clearanceLabel = getClearanceLabel(clearanceLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-slate-500" />
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.15em] text-white">Settings</h2>
          <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
            Account, security & platform configuration
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identity card */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-5 space-y-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            Active Identity
          </p>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-sm font-black text-white">
              {user.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-white">{user.fullName}</p>
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                SVC: {user.serviceNumber}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/40 pt-3 space-y-2">
            {[
              { label: 'Role',        value: roleConfig.label },
              { label: 'Clearance',   value: `L${clearanceLevel} · ${clearanceLabel}` },
              { label: 'Directorate', value: user.directorateCode },
              { label: 'Status',      value: user.status.toUpperCase() },
              { label: 'MFA',         value: user.mfaEnrolled ? 'Enrolled' : 'Not Enrolled' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-600 uppercase">{label}</span>
                <span className="text-slate-300 uppercase">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings menu */}
        <div className="lg:col-span-2 space-y-2">
          {SETTING_SECTIONS.map(({ icon: Icon, label, description }) => (
            <button
              key={label}
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-950/70 px-5 py-4 text-left transition hover:border-sky-500/20 hover:bg-slate-900/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/40">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-200">{label}</p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">{description}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-700 uppercase">Configure →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
