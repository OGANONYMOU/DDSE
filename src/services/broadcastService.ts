// DDSE Command Broadcast Service
// Manages command-wide operational broadcasts to specific roles/directorates.
// Broadcasts are one-directional: command → field personnel.

import { supabase, supabaseMisconfigured } from '../lib/supabase';
import type { RoleCode } from '../lib/rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BroadcastPriority       = 'URGENT' | 'NORMAL' | 'ROUTINE';
export type BroadcastClassification = 'UNCLASSIFIED' | 'RESTRICTED' | 'CONFIDENTIAL';
export type BroadcastStatus         = 'active' | 'expired' | 'recalled';

export interface CommandBroadcast {
  id:               string;
  subject:          string;
  body:             string;
  priority:         BroadcastPriority;
  classification:   BroadcastClassification;
  targetRoles:      RoleCode[];
  targetDirectorates?: string[];
  authorId?:        string;
  authorName:       string;
  authorRole:       string;
  status:           BroadcastStatus;
  publishedAt:      number;
  expiresAt?:       number;
  readCount:        number;
  totalRecipients?: number;
  // I-11: Acknowledgement enforcement
  requiresAck:      boolean;
  ackDeadlineAt?:   number;
}

export interface BroadcastDraft {
  subject:          string;
  body:             string;
  priority:         BroadcastPriority;
  classification:   BroadcastClassification;
  targetRoles:      RoleCode[];
  targetDirectorates?: string[];
  expiresInHours?:  number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<BroadcastPriority, {
  label: string;
  color: string;
  dot:   string;
  badge: string;
}> = {
  URGENT: {
    label: 'URGENT',
    color: 'text-rose-400',
    dot:   'bg-rose-500 animate-pulse',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  NORMAL: {
    label: 'NORMAL',
    color: 'text-amber-400',
    dot:   'bg-amber-500',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  ROUTINE: {
    label: 'ROUTINE',
    color: 'text-slate-400',
    dot:   'bg-slate-600',
    badge: 'border-slate-700/50 bg-slate-800/20 text-slate-400',
  },
};

export const CLASSIFICATION_CONFIG: Record<BroadcastClassification, {
  color: string;
  badge: string;
}> = {
  UNCLASSIFIED: { color: 'text-slate-400',  badge: 'border-slate-700/40  bg-slate-800/20  text-slate-400' },
  RESTRICTED:   { color: 'text-amber-400',  badge: 'border-amber-500/30  bg-amber-500/10  text-amber-300' },
  CONFIDENTIAL: { color: 'text-rose-400',   badge: 'border-rose-500/30   bg-rose-500/10   text-rose-300'  },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BROADCASTS: CommandBroadcast[] = [
  {
    id: 'bc-001', subject: 'URGENT: Safety Protocol Update — All Site Personnel',
    body: 'Effective immediately, all personnel entering active construction zones must wear full PPE including hard hats, high-visibility vests, and steel-capped boots. Non-compliance will result in immediate site exclusion. Site engineers are responsible for enforcement.',
    priority: 'URGENT', classification: 'UNCLASSIFIED',
    targetRoles: ['engineering_officer', 'safety_officer', 'inspection_officer', 'staff'],
    authorName: 'Col. A.D. Bello', authorRole: 'Director',
    status: 'active', publishedAt: Date.now() - 1000 * 60 * 60 * 2,
    expiresAt: Date.now() + 1000 * 60 * 60 * 22,
    readCount: 8, totalRecipients: 12,
    requiresAck: true, ackDeadlineAt: Date.now() + 1000 * 60 * 60 * 4,
  },
  {
    id: 'bc-002', subject: 'Q4 2025 Inspection Schedule Released',
    body: 'The Q4 2025 inspection schedule has been finalized and published. All inspection officers are required to review their assigned projects and confirm availability by 30th November 2025. Schedule available on the Inspections module.',
    priority: 'NORMAL', classification: 'UNCLASSIFIED',
    targetRoles: ['inspection_officer', 'engineering_officer', 'admin'],
    authorName: 'Maj. Gen. K.O. Adebayo', authorRole: 'Commander',
    status: 'active', publishedAt: Date.now() - 1000 * 60 * 60 * 24,
    readCount: 5, totalRecipients: 7, requiresAck: false,
  },
  {
    id: 'bc-003', subject: 'RESTRICTED: Annual Asset Inventory Exercise',
    body: 'The annual infrastructure asset inventory will be conducted from 1–15 December 2025. All directorates must submit completed asset registers to the DQMS by 30th November. This information is restricted and should not be shared externally.',
    priority: 'NORMAL', classification: 'RESTRICTED',
    targetRoles: ['director', 'commander', 'admin', 'logistics_officer'],
    targetDirectorates: ['DESE', 'DEME', 'DQMS', 'DWE'],
    authorName: 'Col. A.D. Bello', authorRole: 'Director',
    status: 'active', publishedAt: Date.now() - 1000 * 60 * 60 * 48,
    readCount: 3, totalRecipients: 5, requiresAck: true,
    ackDeadlineAt: Date.now() - 1000 * 60 * 60 * 24,  // already overdue
  },
  {
    id: 'bc-004', subject: 'Holiday Period Operations Notice',
    body: 'Routine inspections are suspended for the Christmas/New Year period (24 Dec – 2 Jan). Emergency site visits remain available on request. Duty officer contacts will be circulated via the Personnel module.',
    priority: 'ROUTINE', classification: 'UNCLASSIFIED',
    targetRoles: ['engineering_officer', 'safety_officer', 'inspection_officer', 'logistics_officer', 'staff'],
    authorName: 'Admin Office', authorRole: 'admin',
    status: 'active', publishedAt: Date.now() - 1000 * 60 * 60 * 72,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30,
    readCount: 12, totalRecipients: 14, requiresAck: false,
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getBroadcasts(opts: {
  status?:   BroadcastStatus;
  priority?: BroadcastPriority;
  limit?:    number;
} = {}): Promise<CommandBroadcast[]> {
  const limit = opts.limit ?? 20;

  if (!supabaseMisconfigured) {
    try {
      let query = supabase
        .from('broadcasts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (opts.status)   query = query.eq('status', opts.status);
      if (opts.priority) query = query.eq('priority', opts.priority);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((r) => ({
          id:             r.id,
          subject:        r.subject,
          body:           r.body,
          priority:       r.priority as BroadcastPriority,
          classification: r.classification as BroadcastClassification,
          targetRoles:    r.target_roles ?? [],
          authorName:     r.author_name,
          authorRole:     r.author_role,
          status:         r.status as BroadcastStatus,
          publishedAt:    new Date(r.published_at).getTime(),
          expiresAt:      r.expires_at ? new Date(r.expires_at).getTime() : undefined,
          readCount:      r.read_count ?? 0,
          // I-11: acknowledgement fields
          requiresAck:    Boolean(r.requires_ack ?? false),
          ackDeadlineAt:  r.ack_deadline_at ? new Date(r.ack_deadline_at).getTime() : undefined,
        }));
      }
    } catch {
      // Fall through to mock data
    }
  }

  let result = [...MOCK_BROADCASTS];
  if (opts.status)   result = result.filter((b) => b.status === opts.status);
  if (opts.priority) result = result.filter((b) => b.priority === opts.priority);
  return result
    .sort((a, b) => {
      const po: Record<BroadcastPriority, number> = { URGENT: 0, NORMAL: 1, ROUTINE: 2 };
      return po[a.priority] - po[b.priority] || b.publishedAt - a.publishedAt;
    })
    .slice(0, limit);
}

export async function publishBroadcast(
  draft: BroadcastDraft,
  author: { name: string; role: string; id?: string }
): Promise<CommandBroadcast> {
  const broadcast: CommandBroadcast = {
    id:             `bc-${Date.now()}`,
    subject:        draft.subject,
    body:           draft.body,
    priority:       draft.priority,
    classification: draft.classification,
    targetRoles:    draft.targetRoles,
    targetDirectorates: draft.targetDirectorates,
    authorId:       author.id,
    authorName:     author.name,
    authorRole:     author.role,
    status:         'active',
    publishedAt:    Date.now(),
    expiresAt:      draft.expiresInHours
      ? Date.now() + draft.expiresInHours * 60 * 60 * 1000
      : undefined,
    readCount:      0,
    // I-11: URGENT and CRITICAL broadcasts require acknowledgement
    requiresAck:    draft.priority === 'URGENT',
    ackDeadlineAt:  draft.priority === 'URGENT' && draft.expiresInHours
      ? Date.now() + Math.min(draft.expiresInHours, 4) * 60 * 60 * 1000
      : undefined,
  };

  if (!supabaseMisconfigured) {
    try {
      const { data, error } = await supabase.from('broadcasts').insert({
        subject:        broadcast.subject,
        body:           broadcast.body,
        priority:       broadcast.priority,
        classification: broadcast.classification,
        target_roles:   broadcast.targetRoles,
        author_name:    broadcast.authorName,
        author_role:    broadcast.authorRole,
        status:         'active',
        published_at:   new Date(broadcast.publishedAt).toISOString(),
        expires_at:     broadcast.expiresAt ? new Date(broadcast.expiresAt).toISOString() : null,
      }).select().single();

      if (!error && data) {
        broadcast.id = data.id;
      }
      // Trigger server-side distribution to recipients via edge function
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        if (token && SUPABASE_URL) {
          // Call edge function to create notifications for recipients (service-role required server-side)
          await fetch(`${SUPABASE_URL}/functions/v1/publish-broadcast`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              broadcastId: broadcast.id,
              subject: broadcast.subject,
              body: broadcast.body,
              priority: broadcast.priority,
              targetRoles: broadcast.targetRoles,
            }),
          }).catch(() => {});
        }
      } catch {
        // non-fatal
      }
    } catch {
      // Proceed with local mock
    }
  }

  // Push to local mock for immediate UI feedback
  MOCK_BROADCASTS.unshift(broadcast);
  return broadcast;
}

export function isExpired(broadcast: CommandBroadcast): boolean {
  return !!broadcast.expiresAt && Date.now() > broadcast.expiresAt;
}

export function readPercentage(broadcast: CommandBroadcast): number {
  if (!broadcast.totalRecipients || broadcast.totalRecipients === 0) return 0;
  return Math.round((broadcast.readCount / broadcast.totalRecipients) * 100);
}
