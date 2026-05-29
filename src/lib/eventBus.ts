// DDSE Platform Event Bus — v3.0
// Type-safe publish/subscribe system. Every significant platform operation
// emits an event here. Consumers (audit logger, notifications, AI engine,
// automation rules) subscribe without tight coupling to producers.
//
// Design: synchronous dispatch in the same tick, async side-effects via
// setTimeout(0) so producers never block on slow subscribers.

import { logAuditEvent, type AuditAction } from '../services/auditLogger';
import { logError } from './errorLogger';
import type { RoleCode } from './rbac';

// ─── Canonical platform event map ────────────────────────────────────────────
// Every event that can occur on the platform is defined here.
// Adding a new event = adding an entry to this map. No other changes needed.

export interface PlatformEventMap {
  // ── Inspection lifecycle ──────────────────────────────────────────────────
  'inspection.created':   { inspectionId: string; projectId: string; moduleCode: string; roleCode: RoleCode };
  'inspection.submitted': { inspectionId: string; scoreOverall: number; riskLevel: string; roleCode: RoleCode };
  'inspection.approved':  { inspectionId: string; approverRole: RoleCode; comments?: string };
  'inspection.rejected':  { inspectionId: string; approverRole: RoleCode; reason?: string };

  // ── Hazard / Safety lifecycle ─────────────────────────────────────────────
  'hazard.reported':   { hazardId: string; riskLevel: string; category: string; roleCode: RoleCode };
  'hazard.escalated':  { hazardId: string; riskLevel: string; escalatedTo: RoleCode };
  'hazard.resolved':   { hazardId: string; resolvedBy: RoleCode };

  // ── Report lifecycle ──────────────────────────────────────────────────────
  'report.created':   { reportId: string; reportType: string; roleCode: RoleCode };
  'report.submitted': { reportId: string; classification: string; roleCode: RoleCode };
  'report.approved':  { reportId: string; approverRole: RoleCode };
  'report.modified':  { reportId: string; field: string; roleCode: RoleCode };

  // ── Approval workflow ─────────────────────────────────────────────────────
  'approval.required': { entityType: string; entityId: string; assignedRole: RoleCode; slaHours: number };
  'approval.overdue':  { entityType: string; entityId: string; assignedRole: RoleCode; hoursOverdue: number };

  // ── Compliance ────────────────────────────────────────────────────────────
  'compliance.threshold_breached': { projectId: string; score: number; threshold: number; module: string };
  'compliance.restored':           { projectId: string; score: number; module: string };

  // ── Personnel lifecycle ───────────────────────────────────────────────────
  'user.registered':    { userId: string; roleCode: RoleCode; directorateCode: string };
  'user.approved':      { userId: string; approverRole: RoleCode };
  'user.role_changed':  { userId: string; fromRole: RoleCode; toRole: RoleCode; changedBy: RoleCode };
  'user.suspended':     { userId: string; reason?: string; suspendedBy: RoleCode };

  // ── Documents / Evidence ──────────────────────────────────────────────────
  'document.uploaded': { documentId: string; entityType: string; entityId: string; sizeBytes: number };
  'document.deleted':  { documentId: string; entityType: string; deletedBy: RoleCode };

  // ── Broadcasts ────────────────────────────────────────────────────────────
  'broadcast.published': { broadcastId: string; priority: string; targetRoleCount: number };

  // ── System health ─────────────────────────────────────────────────────────
  'system.health_degraded': { component: string; severity: 'warning' | 'critical'; reason: string };
  'system.health_restored': { component: string };
  'system.config_changed':  { setting: string; changedBy: RoleCode };

  // ── Automation lifecycle ──────────────────────────────────────────────────
  'automation.rule_triggered': { ruleId: string; ruleName: string; entityId?: string };
  'automation.rule_failed':    { ruleId: string; error: string };

  // ── Offline/sync ─────────────────────────────────────────────────────────
  'offline.sync_complete':  { syncedCount: number; failedCount: number };
  'offline.queue_flushed':  { auditEvents: number };
}

export type PlatformEventName = keyof PlatformEventMap;
export type PlatformEventPayload<K extends PlatformEventName> = PlatformEventMap[K];

// ─── Stored event record ──────────────────────────────────────────────────────

export interface StoredEvent<K extends PlatformEventName = PlatformEventName> {
  id:        string;
  name:      K;
  payload:   PlatformEventPayload<K>;
  emittedAt: number;
  source?:   string;
}

// ─── Audit event mapping ─────────────────────────────────────────────────────
// Maps platform events → audit actions automatically.

const EVENT_TO_AUDIT: Partial<Record<PlatformEventName, AuditAction>> = {
  'inspection.submitted': 'inspection.submitted',
  'inspection.approved':  'inspection.approved',
  'inspection.rejected':  'inspection.rejected',
  'inspection.created':   'inspection.created',
  'hazard.escalated':     'hazard.escalated',
  'hazard.resolved':      'hazard.resolved',
  'report.submitted':     'report.submitted',
  'report.modified':      'report.modified',
  'report.approved':      'report.created',
  'user.registered':      'personnel.registered',
  'user.approved':        'personnel.approved',
  'user.role_changed':    'personnel.role_changed',
  'user.suspended':       'personnel.suspended',
  'document.uploaded':    'document.uploaded',
  'document.deleted':     'document.deleted',
  'broadcast.published':  'report.created',
  'system.config_changed':'system.config_changed',
};

// ─── Bus implementation ───────────────────────────────────────────────────────

type Subscriber<K extends PlatformEventName> = (
  event: StoredEvent<K>
) => void | Promise<void>;

type AnySubscriber = (event: StoredEvent) => void | Promise<void>;

class PlatformEventBus {
  private readonly listeners = new Map<string, Set<AnySubscriber>>();
  private readonly history:   StoredEvent[] = [];
  private readonly MAX_HISTORY = 100;
  private seq = 0;

  // Subscribe to a specific event type.
  // Returns an unsubscribe function.
  on<K extends PlatformEventName>(
    name: K,
    handler: Subscriber<K>
  ): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    this.listeners.get(name)!.add(handler as AnySubscriber);

    return () => this.off(name, handler);
  }

  off<K extends PlatformEventName>(name: K, handler: Subscriber<K>): void {
    this.listeners.get(name)?.delete(handler as AnySubscriber);
  }

  // Subscribe to all events (useful for logging and monitoring).
  onAny(handler: AnySubscriber): () => void {
    const WILDCARD = '*';
    if (!this.listeners.has(WILDCARD)) {
      this.listeners.set(WILDCARD, new Set());
    }
    this.listeners.get(WILDCARD)!.add(handler);
    return () => this.listeners.get(WILDCARD)?.delete(handler);
  }

  // Emit a typed event. Dispatches synchronously to all subscribers.
  // Async subscriber failures are caught and logged — never crash the producer.
  emit<K extends PlatformEventName>(
    name: K,
    payload: PlatformEventPayload<K>,
    source?: string
  ): void {
    const event: StoredEvent<K> = {
      id:        `evt_${++this.seq}_${Date.now()}`,
      name,
      payload,
      emittedAt: Date.now(),
      source,
    };

    // Store in history ring buffer
    this.history.unshift(event as StoredEvent);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.length = this.MAX_HISTORY;
    }

    // Auto-audit via mapping
    const auditAction = EVENT_TO_AUDIT[name];
    if (auditAction) {
      const p = payload as Record<string, unknown>;
      void logAuditEvent(auditAction, {
        entityType: p['entityType'] as string | undefined,
        entityId:   (p['inspectionId'] ?? p['reportId'] ?? p['hazardId'] ?? p['userId']) as string | undefined,
        actorRole:  (p['roleCode'] ?? p['approverRole'] ?? p['changedBy']) as string | undefined,
        metadata:   { eventName: name, source },
      }).catch(() => undefined);
    }

    // Dispatch to specific listeners + wildcard listeners
    const targets = [
      ...(this.listeners.get(name) ?? []),
      ...(this.listeners.get('*')  ?? []),
    ];

    // Dispatch async so producers are never blocked
    for (const handler of targets) {
      setTimeout(() => {
        try {
          const result = handler(event as StoredEvent);
          if (result instanceof Promise) {
            result.catch((err: unknown) => {
              logError(err, {
                severity: 'medium',
                context:  { eventName: name, handlerName: handler.name },
              });
            });
          }
        } catch (err) {
          logError(err, {
            severity: 'medium',
            context:  { eventName: name },
          });
        }
      }, 0);
    }
  }

  // Get recent event history (for debugging / monitoring UIs).
  getHistory(limit = 20): StoredEvent[] {
    return this.history.slice(0, limit);
  }

  // Get count of registered listeners.
  listenerCount(name?: PlatformEventName): number {
    if (name) return this.listeners.get(name)?.size ?? 0;
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }

  // Clear history (for testing).
  clearHistory(): void {
    this.history.length = 0;
    this.seq = 0;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// One bus for the entire platform lifetime.

export const eventBus = new PlatformEventBus();

// ─── Typed emit helpers ────────────────────────────────────────────────────────
// Convenience wrappers so call sites are clean.

export function emitInspectionSubmitted(
  inspectionId: string,
  scoreOverall: number,
  riskLevel:    string,
  roleCode:     RoleCode
): void {
  eventBus.emit('inspection.submitted', { inspectionId, scoreOverall, riskLevel, roleCode });
}

export function emitHazardEscalated(
  hazardId: string, riskLevel: string, escalatedTo: RoleCode
): void {
  eventBus.emit('hazard.escalated', { hazardId, riskLevel, escalatedTo });
}

export function emitApprovalRequired(
  entityType: string, entityId: string, assignedRole: RoleCode, slaHours = 48
): void {
  eventBus.emit('approval.required', { entityType, entityId, assignedRole, slaHours });
}

export function emitComplianceBreach(
  projectId: string, score: number, threshold: number, module: string
): void {
  eventBus.emit('compliance.threshold_breached', { projectId, score, threshold, module });
}

export function emitSystemHealthDegraded(
  component: string, severity: 'warning' | 'critical', reason: string
): void {
  eventBus.emit('system.health_degraded', { component, severity, reason });
}
