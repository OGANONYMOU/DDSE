// C-1: NotificationsPage — fully backed by Supabase, no mock data

import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markRead, markAllRead, type AdvancedNotification } from '../services/notificationService';

const TYPE_CONFIG = {
  alert:   { icon: AlertTriangle, color: 'text-rose-400',    dot: 'bg-rose-500',    border: 'border-rose-500/15'   },
  warning: { icon: AlertCircle,   color: 'text-amber-400',   dot: 'bg-amber-500',   border: 'border-amber-500/15'  },
  info:    { icon: Info,          color: 'text-sky-400',     dot: 'bg-sky-500',     border: 'border-sky-500/15'    },
  success: { icon: CheckCircle2,  color: 'text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/15'},
} as const;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdvancedNotification[]>([]);
  const [loading,       setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 100 });
      setNotifications(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unread  = notifications.filter((n) => !n.read).length;
  const allRead = !loading && notifications.length > 0 && unread === 0;

  async function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await markRead(id);
    } catch {
      // revert on error
      void load();
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllRead(user.id);
    } catch {
      void load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="System alerts, assignments & status updates"
        action={
          unread > 0 ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            >
              <Check className="h-3.5 w-3.5" />
              Mark All Read
            </button>
          ) : undefined
        }
      />

      {!loading && unread > 0 && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-black uppercase text-sky-300">
            <Bell className="h-3.5 w-3.5" />
            {unread} unread
          </span>
        </div>
      )}

      {allRead && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-[11px] font-mono text-emerald-400 uppercase">All notifications read</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">Loading notifications…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 py-16 text-center">
          <Bell className="h-10 w-10 text-slate-700" />
          <p className="mt-3 text-[11px] font-mono uppercase text-slate-600">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const isRead = n.read;
            const cfg    = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
            const Icon   = cfg.icon;

            return (
              <div
                key={n.id}
                onClick={() => { if (!isRead) void handleMarkRead(n.id); }}
                className={`relative flex items-start gap-4 rounded-xl border px-5 py-4 transition ${
                  isRead
                    ? 'border-slate-800/40 bg-slate-950/40'
                    : `${cfg.border} bg-slate-950/70 cursor-pointer hover:bg-slate-900/30`
                }`}
              >
                {!isRead && (
                  <span className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                )}
                <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-bold uppercase tracking-wide ${isRead ? 'text-slate-400' : 'text-white'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono text-slate-500 leading-relaxed">
                    {n.body}
                  </p>
                  {n.priority === 'CRITICAL' && (
                    <span className="mt-1 inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-400">
                      Critical
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[10px] font-mono text-slate-600">
                  <Clock className="h-3 w-3" />
                  {timeAgo(n.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
