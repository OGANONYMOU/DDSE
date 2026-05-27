import { Bell, AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';

const PLACEHOLDER_NOTIFICATIONS = [
  { id: '1', type: 'alert',   title: 'Critical Finding Raised',         body: 'Inspection #INS-2041 has a new CRITICAL severity finding requiring immediate action.',  time: '5m ago',  read: false },
  { id: '2', type: 'info',    title: 'Registration Pending Approval',   body: 'Capt. A. Bello (SGT_ARMOURY) is awaiting access authorization.',                         time: '22m ago', read: false },
  { id: '3', type: 'success', title: 'Report Finalized',                body: 'Q2 Compliance Summary has been finalized and is ready for download.',                     time: '1h ago',  read: true  },
  { id: '4', type: 'alert',   title: 'Overdue Corrective Action',       body: 'CA-0032 on Engineering Audit has exceeded its resolution deadline by 3 days.',           time: '2h ago',  read: true  },
  { id: '5', type: 'info',    title: 'New Inspection Assigned',         body: 'You have been assigned as lead officer on Inspection #INS-2045.',                         time: '4h ago',  read: true  },
];

const TYPE_CONFIG = {
  alert:   { icon: AlertTriangle, color: 'text-rose-400',    dot: 'bg-rose-500',    border: 'border-rose-500/15' },
  info:    { icon: Info,          color: 'text-sky-400',     dot: 'bg-sky-500',     border: 'border-sky-500/15'  },
  success: { icon: CheckCircle2,  color: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/15' },
} as const;

export default function NotificationsPage() {
  const unreadCount = PLACEHOLDER_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.15em] text-white">Notifications</h2>
          <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
            System alerts, assignments & status updates
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-black uppercase text-sky-300">
            <Bell className="h-3.5 w-3.5" />
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {PLACEHOLDER_NOTIFICATIONS.map((n) => {
          const cfg  = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`relative flex items-start gap-4 rounded-xl border ${n.read ? 'border-slate-800/40 bg-slate-950/40' : `${cfg.border} bg-slate-950/70`} px-5 py-4 transition hover:bg-slate-900/30`}
            >
              {!n.read && (
                <span className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              )}
              <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${n.read ? 'text-slate-400' : 'text-white'}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-[11px] font-mono text-slate-500 leading-relaxed">
                  {n.body}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[10px] font-mono text-slate-600">
                <Clock className="h-3 w-3" />
                {n.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
