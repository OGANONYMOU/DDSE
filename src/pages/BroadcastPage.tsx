import { useCallback, useEffect, useState } from 'react';
import {
  Radio, Plus, Megaphone, Clock, Users, Eye,
  AlertTriangle, ChevronDown, ChevronUp, X, CheckSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import {
  getBroadcasts, publishBroadcast, isExpired, readPercentage,
  PRIORITY_CONFIG, CLASSIFICATION_CONFIG,
  type CommandBroadcast, type BroadcastDraft, type BroadcastPriority, type BroadcastClassification,
} from '../services/broadcastService';
import type { RoleCode } from '../lib/rbac';
import PageHeader from '../components/ui/PageHeader';
import ErrorState from '../components/ui/ErrorState';

const ALL_ROLES: RoleCode[] = [
  'super_admin', 'director', 'commander', 'admin',
  'engineering_officer', 'safety_officer', 'armoury_officer',
  'logistics_officer', 'inspection_officer', 'staff', 'auditor',
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BroadcastCard({
  broadcast,
  expanded,
  onToggle,
  onAcknowledge,
  acknowledged,
}: {
  broadcast:      CommandBroadcast;
  expanded:       boolean;
  onToggle:       () => void;
  onAcknowledge?: () => void;
  acknowledged?:  boolean;
}) {
  const expired  = isExpired(broadcast);
  const readPct  = readPercentage(broadcast);
  const priority = PRIORITY_CONFIG[broadcast.priority];
  const cls      = CLASSIFICATION_CONFIG[broadcast.classification];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border bg-slate-950/70 transition-all ${
        expired ? 'border-slate-800/30 opacity-50' : 'border-slate-800/60'
      }`}
    >
      {/* Priority stripe */}
      <div className={`absolute left-0 inset-y-0 w-[3px] ${priority.dot.replace(' animate-pulse', '')}`} />

      <div
        className="flex cursor-pointer items-start gap-4 px-5 py-4 pl-6"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-expanded={expanded}
      >
        {/* Priority dot */}
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priority.dot}`} aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${priority.badge}`}>
              {priority.label}
            </span>
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${cls.badge}`}>
              {broadcast.classification}
            </span>
            {expired && (
              <span className="rounded border border-slate-700/40 bg-slate-800/20 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                EXPIRED
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12px] font-bold uppercase tracking-wide text-white">
            {broadcast.subject}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {timeAgo(broadcast.publishedAt)}
            </span>
            <span>{broadcast.authorName} · {broadcast.authorRole.replace(/_/g, ' ').toUpperCase()}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {broadcast.readCount}{broadcast.totalRecipients ? `/${broadcast.totalRecipients}` : ''} read
              {broadcast.totalRecipients ? ` (${readPct}%)` : ''}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-slate-600">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-800/40 px-6 py-4 space-y-3">
              <p className="text-[12px] font-mono leading-7 text-slate-400">
                {broadcast.body}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-mono uppercase text-slate-600">To:</span>
                {broadcast.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded border border-slate-700/40 bg-slate-800/20 px-1.5 py-0.5 text-[9px] font-mono uppercase text-slate-500"
                  >
                    {role.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              {broadcast.expiresAt && (
                <p className="text-[10px] font-mono text-slate-600 uppercase">
                  Expires: {new Date(broadcast.expiresAt).toLocaleString()}
                </p>
              )}
              {/* I-11: Acknowledgement requirement */}
              {broadcast.requiresAck && (
                <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${acknowledged ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${acknowledged ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {acknowledged ? 'Acknowledged' : 'Acknowledgement Required'}
                    </p>
                    {broadcast.ackDeadlineAt && !acknowledged && (
                      <p className="mt-0.5 text-[9px] font-mono text-slate-600">
                        Deadline: {new Date(broadcast.ackDeadlineAt).toLocaleString()}
                        {broadcast.ackDeadlineAt < Date.now() && ' — OVERDUE'}
                      </p>
                    )}
                  </div>
                  {!acknowledged && onAcknowledge && (
                    <button
                      type="button"
                      onClick={onAcknowledge}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-300 transition hover:bg-amber-500/15"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      Acknowledge
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ComposeModal({
  onClose,
  onPublish,
}: {
  onClose:   () => void;
  onPublish: (draft: BroadcastDraft) => Promise<void>;
}) {
  const [form, setForm] = useState<BroadcastDraft>({
    subject:        '',
    body:           '',
    priority:       'NORMAL',
    classification: 'UNCLASSIFIED',
    targetRoles:    ['inspection_officer', 'engineering_officer'],
  });
  const [publishing, setPublishing] = useState(false);

  function toggle(role: RoleCode) {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  }

  async function handlePublish() {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    if (form.targetRoles.length === 0) {
      toast.error('Select at least one target role.');
      return;
    }
    setPublishing(true);
    try {
      await onPublish(form);
      onClose();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-sky-500/20 bg-[#040810] shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-sky-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
              Compose Command Broadcast
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 p-1.5 text-slate-400 hover:text-white"
            aria-label="Close compose modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Subject
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Broadcast subject line..."
              className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-[12px] text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Message Body
            </label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              placeholder="Broadcast message content..."
              className="w-full resize-none rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-[12px] text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Priority + Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as BroadcastPriority }))}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-[12px] text-white focus:border-sky-500/40 focus:outline-none"
              >
                {(['URGENT', 'NORMAL', 'ROUTINE'] as const).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Classification
              </label>
              <select
                value={form.classification}
                onChange={(e) => setForm((p) => ({ ...p, classification: e.target.value as BroadcastClassification }))}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-[12px] text-white focus:border-sky-500/40 focus:outline-none"
              >
                {(['UNCLASSIFIED', 'RESTRICTED', 'CONFIDENTIAL'] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Target roles */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Target Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggle(role)}
                  aria-pressed={form.targetRoles.includes(role)}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    form.targetRoles.includes(role)
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                      : 'border-slate-700/50 bg-slate-900/30 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {role.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/60 px-6 py-4">
          <p className="text-[10px] font-mono text-slate-600 uppercase">
            <Users className="mr-1 inline h-3 w-3" aria-hidden="true" />
            {form.targetRoles.length} roles selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/25 disabled:opacity-50"
            >
              <Radio className="h-3 w-3" aria-hidden="true" />
              {publishing ? 'Publishing…' : 'Publish Broadcast'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BroadcastPage() {
  const { user }   = useAuth();
  const canPublish = hasPermission(user.roleCode, 'system.config') ||
                     hasPermission(user.roleCode, 'data.view_nationwide') ||
                     user.roleCode === 'commander' || user.roleCode === 'director';

  const [broadcasts,   setBroadcasts]   = useState<CommandBroadcast[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [composing,    setComposing]    = useState(false);
  // I-11: Track which broadcasts the current user has acknowledged
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBroadcasts({ status: 'active' });
      setBroadcasts(data);
    } catch {
      toast.error('Could not load broadcasts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // I-11: Load existing acknowledgements for current user
  useEffect(() => {
    void (async () => {
      try {
        const { data } = await supabase.from('broadcast_acknowledgements')
          .select('broadcast_id')
          .eq('recipient_id', user.id)
          .eq('status', 'acknowledged');
        if (data) setAcknowledged(new Set(data.map((r) => String(r.broadcast_id))));
      } catch { /* table may not exist yet */ }
    })();
  }, [user.id]);

  async function handleAcknowledge(broadcastId: string) {
    await supabase.from('broadcast_acknowledgements').upsert({
      broadcast_id:     broadcastId,
      recipient_id:     user.id,
      acknowledged_at:  new Date().toISOString(),
      status:           'acknowledged',
    });
    setAcknowledged((prev) => new Set([...prev, broadcastId]));
    toast.success('Broadcast acknowledged.');
  }

  async function handlePublish(draft: BroadcastDraft) {
    const result = await publishBroadcast(draft, {
      name: user.fullName,
      role: user.roleCode,
      id:   user.id,
    });
    setBroadcasts((prev) => [result, ...prev]);
    toast.success('Broadcast published.');
  }

  const urgent = broadcasts.filter((b) => b.priority === 'URGENT');
  const others = broadcasts.filter((b) => b.priority !== 'URGENT');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Broadcasts"
        subtitle="Command-wide operational communications and directives"
        action={
          canPublish ? (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New Broadcast
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* URGENT broadcasts */}
          {urgent.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-500">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Urgent Broadcasts ({urgent.length})
              </p>
              {urgent.map((b) => (
                <BroadcastCard
                  key={b.id}
                  broadcast={b}
                  expanded={expanded === b.id}
                  onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                  onAcknowledge={() => void handleAcknowledge(b.id)}
                  acknowledged={acknowledged.has(b.id)}
                />
              ))}
            </div>
          )}

          {/* Normal + Routine */}
          {others.length > 0 && (
            <div className="space-y-2">
              {urgent.length > 0 && (
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  Other Broadcasts ({others.length})
                </p>
              )}
              {others.map((b) => (
                <BroadcastCard
                  key={b.id}
                  broadcast={b}
                  expanded={expanded === b.id}
                  onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                  onAcknowledge={() => void handleAcknowledge(b.id)}
                  acknowledged={acknowledged.has(b.id)}
                />
              ))}
            </div>
          )}

          {broadcasts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Radio className="h-8 w-8 text-slate-700 mb-3" aria-hidden="true" />
              <p className="text-[11px] font-mono uppercase text-slate-600">No active broadcasts</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {composing && (
          <ComposeModal
            onClose={() => setComposing(false)}
            onPublish={handlePublish}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
