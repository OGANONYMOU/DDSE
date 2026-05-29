// DDSE Advanced Notification Service
// Supports priority levels, acknowledgment states, and escalation chains.
// Wraps the existing MOCK_NOTIFICATIONS and extends with real Supabase support.

import { supabase, supabaseMisconfigured } from '../lib/supabase';
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
  escalationLevel:  number;           // 0 = not escalated
  escalatedToRole?: RoleCode;
  ackDeadlineMs?:   number;           // ms from createdAt before auto-escalation
  createdAt:        number;
  readAt?:          number;
  ackAt?:           number;
}

export interface NotificationStats {
  total:       number;
  unread:      number;
  critical:    number;
  unacked:     number;
  escalated:   number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ADVANCED_NOTIFICATIONS: AdvancedNotification[] = [
  {
    id: 'notif-001', type: 'alert', priority: 'CRITICAL',
    title: 'Stop-Work Order — PRJ-2025-002',
    body: 'A stop-work condition was identified during today\'s safety inspection. All site activities must cease until the critical electrical hazard is resolved.',
    module: 'Safety', entityType: 'hazard', entityId: 'HAZ-001',
    read: false, acknowledged: false, requiresAck: true,
    escalationLevel: 1, escalatedToRole: 'commander',
    ackDeadlineMs: 2 * 60 * 60 * 1000,
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'notif-002', type: 'warning', priority: 'HIGH',
    title: 'Inspection Overdue — INS-008-B',
    body: 'Engineering Workshop Structural Inspection has been in review for 15 days without a decision. The 30-day review SLA expires in 15 days.',
    module: 'Compliance', entityType: 'inspection', entityId: 'INS-008-B',
    read: false, acknowledged: false, requiresAck: false,
    escalationLevel: 0,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 'notif-003', type: 'info', priority: 'MEDIUM',
    title: 'Project Milestone Reached — Barracks Block C',
    body: 'Milestone M004 (Roofing & Waterproofing) has been completed and signed off. The project is tracking on schedule.',
    module: 'Projects', entityType: 'project', entityId: 'PRJ-2025-001',
    read: true, acknowledged: true, requiresAck: false,
    escalationLevel: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    readAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'notif-004', type: 'alert', priority: 'HIGH',
    title: 'Pending Registration — 3 Officers',
    body: 'Three new officer registrations are awaiting command authorization. Oldest request is 48 hours old.',
    module: 'Personnel',
    read: false, acknowledged: false, requiresAck: true,
    escalationLevel: 0,
    ackDeadlineMs: 48 * 60 * 60 * 1000,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'notif-005', type: 'success', priority: 'LOW',
    title: 'Report Approved — Q3 Safety Summary',
    body: 'Your Q3 2025 Safety Summary Report has been reviewed and approved by the Director.',
    module: 'Reports',
    read: true, acknowledged: false, requiresAck: false,
    escalationLevel: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    readAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'notif-006', type: 'warning', priority: 'MEDIUM',
    title: 'Medical Centre Project — Progress Warning',
    body: 'PRJ-2025-002 completion is at 34% against a target of 55% for this period. A recovery plan is required.',
    module: 'Projects', entityType: 'project', entityId: 'PRJ-2025-002',
    read: false, acknowledged: false, requiresAck: false,
    escalationLevel: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
  },
];

// ─── Priority ordering ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3,
};

// ─── Service functions ────────────────────────────────────────────────────────

export async function getNotifications(opts: {
  unreadOnly?: boolean;
  priority?:   NotificationPriority;
  limit?:      number;
} = {}): Promise<AdvancedNotification[]> {
  const limit = opts.limit ?? 50;

  if (!supabaseMisconfigured) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (opts.unreadOnly) query = query.eq('read', false);
      if (opts.priority)   query = query.eq('priority', opts.priority);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((r) => ({
          id:              r.id,
          type:            r.type as NotificationType,
          priority:        r.priority as NotificationPriority,
          title:           r.title,
          body:            r.body,
          module:          r.module,
          entityId:        r.entity_id,
          entityType:      r.entity_type,
          read:            r.read,
          acknowledged:    r.acknowledged,
          requiresAck:     r.requires_ack,
          escalationLevel: r.escalation_level ?? 0,
          createdAt:       new Date(r.created_at).getTime(),
        }));
      }
    } catch {
      // Fall through to mock data
    }
  }

  let result = [...MOCK_ADVANCED_NOTIFICATIONS];
  if (opts.unreadOnly) result = result.filter((n) => !n.read);
  if (opts.priority)   result = result.filter((n) => n.priority === opts.priority);
  return result
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt - a.createdAt)
    .slice(0, limit);
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
  const elapsed = Date.now() - notif.createdAt;
  return elapsed > notif.ackDeadlineMs;
}
