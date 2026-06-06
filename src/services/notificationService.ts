// Notification service — fully backed by Supabase (no mock data)

import { supabase } from '../lib/supabase';
import type { RoleCode } from '../lib/rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationType     = 'alert' | 'warning' | 'info' | 'success';

export interface AdvancedNotification {
  id:               string;
  type:             NotificationType;
  priority:         NotificationPriority;
  title:            string;
  body:             string;
  module?:          string;
  entityId?:        string;
  entityType?:      string;
  read:             boolean;
  acknowledged:     boolean;
  requiresAck:      boolean;
  escalationLevel:  number;
  escalatedToRole?: RoleCode;
  ackDeadlineMs?:   number;
  createdAt:        number;
  readAt?:          number;
  ackAt?:           number;
}

export interface NotificationStats {
  total:     number;
  unread:    number;
  critical:  number;
  unacked:   number;
  escalated: number;
}

// ─── Priority ordering ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

// ─── DB row → domain type mapper ──────────────────────────────────────────────

function dbToNotification(r: Record<string, unknown>): AdvancedNotification {
  return {
    id:              String(r.id ?? ''),
    type:            (r.type ?? 'info') as NotificationType,
    priority:        (r.priority ?? 'MEDIUM') as NotificationPriority,
    title:           String(r.title ?? ''),
    body:            String(r.body ?? ''),
    module:          r.module         ? String(r.module) : undefined,
    entityId:        r.entity_id      ? String(r.entity_id) : undefined,
    entityType:      r.entity_type    ? String(r.entity_type) : undefined,
    read:            Boolean(r.read),
    acknowledged:    Boolean(r.acknowledged),
    requiresAck:     Boolean(r.requires_ack),
    escalationLevel: Number(r.escalation_level ?? 0),
    escalatedToRole: r.escalated_to_role ? (r.escalated_to_role as RoleCode) : undefined,
    ackDeadlineMs:   r.ack_deadline_ms ? Number(r.ack_deadline_ms) : undefined,
    createdAt:       r.created_at ? new Date(String(r.created_at)).getTime() : Date.now(),
    readAt:          r.read_at  ? new Date(String(r.read_at)).getTime()  : undefined,
    ackAt:           r.ack_at   ? new Date(String(r.ack_at)).getTime()   : undefined,
  };
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getNotifications(opts: {
  unreadOnly?: boolean;
  priority?:   NotificationPriority;
  limit?:      number;
} = {}): Promise<AdvancedNotification[]> {
  const limit = opts.limit ?? 50;

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.unreadOnly) query = query.eq('read', false);
  if (opts.priority)   query = query.eq('priority', opts.priority);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .map(dbToNotification)
    .sort((a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt - a.createdAt
    );
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('read', false);
  if (error) throw error;
}

export async function acknowledgeNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ acknowledged: true, ack_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  if (error) return 0;
  return count ?? 0;
}

export function getNotificationStats(notifications: AdvancedNotification[]): NotificationStats {
  return {
    total:     notifications.length,
    unread:    notifications.filter((n) => !n.read).length,
    critical:  notifications.filter((n) => n.priority === 'CRITICAL').length,
    unacked:   notifications.filter((n) => n.requiresAck && !n.acknowledged).length,
    escalated: notifications.filter((n) => n.escalationLevel > 0).length,
  };
}

export function priorityColor(priority: NotificationPriority): string {
  const map: Record<NotificationPriority, string> = {
    CRITICAL: 'text-rose-400   border-rose-500/30   bg-rose-500/10',
    HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
    MEDIUM:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
    LOW:      'text-slate-400  border-slate-700/50  bg-slate-800/20',
  };
  return map[priority];
}

export function priorityDot(priority: NotificationPriority): string {
  const map: Record<NotificationPriority, string> = {
    CRITICAL: 'bg-rose-500 animate-pulse',
    HIGH:     'bg-orange-500',
    MEDIUM:   'bg-amber-500',
    LOW:      'bg-slate-500',
  };
  return map[priority];
}

export function shouldEscalate(notif: AdvancedNotification): boolean {
  if (!notif.requiresAck || notif.acknowledged || !notif.ackDeadlineMs) return false;
  return (Date.now() - notif.createdAt) > notif.ackDeadlineMs;
}
