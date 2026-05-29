// DDSE Automation Engine — v3.0
// Rule-based operational automation. Rules are evaluated on a schedule
// and when triggered by platform events. Each rule describes:
//   WHY it exists (the operational need)
//   WHAT it detects (the condition)
//   WHAT it does (the action)
//   WHO it affects (the target roles/entities)

import { MOCK_INSPECTIONS, MOCK_HAZARD_ASSESSMENTS, MOCK_REPORTS } from './mock-data';
import { eventBus } from './eventBus';
import { logAuditEvent } from '../services/auditLogger';
import type { RoleCode } from './rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutomationTrigger =
  | 'schedule_hourly'
  | 'schedule_daily'
  | 'platform_event'
  | 'threshold_check'
  | 'on_startup';

export type AutomationAction =
  | 'emit_notification'
  | 'escalate_entity'
  | 'generate_summary'
  | 'trigger_workflow'
  | 'audit_log';

export interface AutomationContext {
  triggeredAt:   number;
  triggerType:   AutomationTrigger;
  eventPayload?: Record<string, unknown>;
}

export interface AutomationResult {
  ruleId:      string;
  executedAt:  number;
  matched:     boolean;
  actionsRun:  number;
  details?:    string;
}

export interface AutomationRule {
  id:          string;
  name:        string;
  description: string;
  trigger:     AutomationTrigger;
  category:    'compliance' | 'safety' | 'reporting' | 'personnel' | 'system';
  enabled:     boolean;
  lastRun?:    number;
  lastResult?: AutomationResult;
  runCount:    number;
  priority:    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  condition:   (ctx: AutomationContext) => boolean | Promise<boolean>;
  action:      (ctx: AutomationContext) => void | Promise<void>;
}

// ─── Built-in automation rules ────────────────────────────────────────────────

export const AUTOMATION_RULES: AutomationRule[] = [

  // ── Compliance rules ───────────────────────────────────────────────────────

  {
    id: 'auto-001', category: 'compliance', priority: 'HIGH',
    name: 'Inspection Overdue Alert',
    description: 'Flags inspections that have been in-progress for more than 30 days without submission',
    trigger: 'schedule_daily', enabled: true, runCount: 0,
    condition: () => {
      const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days
      const overdue   = MOCK_INSPECTIONS.filter(
        (i) => i.status === 'in_progress' &&
               Date.now() - new Date(i.createdAt).getTime() > threshold
      );
      return overdue.length > 0;
    },
    action: (ctx) => {
      const overdue = MOCK_INSPECTIONS.filter((i) => i.status === 'in_progress');
      eventBus.emit('approval.overdue', {
        entityType:   'inspection',
        entityId:     overdue[0]?.id ?? 'unknown',
        assignedRole: 'inspection_officer' as RoleCode,
        hoursOverdue: 720,
      });
      void logAuditEvent('inspection.submitted', {
        metadata: { automation: 'auto-001', overdueCount: overdue.length, triggeredAt: ctx.triggeredAt },
      });
    },
  },

  {
    id: 'auto-002', category: 'compliance', priority: 'HIGH',
    name: 'Low Compliance Score Alert',
    description: 'Detects when platform-wide average inspection score drops below 70%',
    trigger: 'schedule_daily', enabled: true, runCount: 0,
    condition: () => {
      const approved = MOCK_INSPECTIONS.filter((i) => i.status === 'approved');
      if (approved.length === 0) return false;
      const avg = approved.reduce((s, i) => s + i.score, 0) / approved.length;
      return avg < 70;
    },
    action: (ctx) => {
      const approved = MOCK_INSPECTIONS.filter((i) => i.status === 'approved');
      const avg      = approved.reduce((s, i) => s + i.score, 0) / (approved.length || 1);
      eventBus.emit('compliance.threshold_breached', {
        projectId: 'platform-wide', score: Math.round(avg), threshold: 70, module: 'all',
      });
      void logAuditEvent('inspection.submitted', {
        metadata: { automation: 'auto-002', avgScore: Math.round(avg), triggeredAt: ctx.triggeredAt },
      });
    },
  },

  // ── Safety rules ───────────────────────────────────────────────────────────

  {
    id: 'auto-003', category: 'safety', priority: 'CRITICAL',
    name: 'Critical Hazard Escalation',
    description: 'Auto-escalates critical hazards that have not been actioned within 24 hours',
    trigger: 'schedule_hourly', enabled: true, runCount: 0,
    condition: () => {
      const threshold = 24 * 60 * 60 * 1000;
      return MOCK_HAZARD_ASSESSMENTS.some(
        (h) => h.riskLevel === 'CRITICAL' &&
               h.workflowStatus !== 'closed' &&
               Date.now() - new Date(h.createdAt).getTime() > threshold
      );
    },
    action: (ctx) => {
      const critical = MOCK_HAZARD_ASSESSMENTS.filter(
        (h) => h.riskLevel === 'CRITICAL' && h.workflowStatus !== 'closed'
      );
      for (const hazard of critical) {
        eventBus.emit('hazard.escalated', {
          hazardId:    hazard.id,
          riskLevel:   hazard.riskLevel,
          escalatedTo: 'commander' as RoleCode,
        });
      }
      void logAuditEvent('hazard.escalated', {
        metadata: { automation: 'auto-003', count: critical.length, triggeredAt: ctx.triggeredAt },
      });
    },
  },

  {
    id: 'auto-004', category: 'safety', priority: 'HIGH',
    name: 'Recurring Hazard Pattern Detection',
    description: 'Identifies when the same hazard category appears 3+ times — indicates systemic issue',
    trigger: 'schedule_daily', enabled: true, runCount: 0,
    condition: () => {
      const freq: Record<string, number> = {};
      for (const h of MOCK_HAZARD_ASSESSMENTS) {
        freq[h.category] = (freq[h.category] ?? 0) + 1;
      }
      return Object.values(freq).some((count) => count >= 3);
    },
    action: (ctx) => {
      const freq: Record<string, number> = {};
      for (const h of MOCK_HAZARD_ASSESSMENTS) {
        freq[h.category] = (freq[h.category] ?? 0) + 1;
      }
      const recurring = Object.entries(freq).filter(([, c]) => c >= 3);
      eventBus.emit('system.health_degraded', {
        component: 'safety',
        severity:  'warning',
        reason:    `Recurring hazard patterns: ${recurring.map(([k, v]) => `${k} (×${v})`).join(', ')}`,
      });
      void logAuditEvent('hazard.escalated', {
        metadata: { automation: 'auto-004', patterns: recurring, triggeredAt: ctx.triggeredAt },
      });
    },
  },

  // ── Reporting rules ────────────────────────────────────────────────────────

  {
    id: 'auto-005', category: 'reporting', priority: 'MEDIUM',
    name: 'Report Backlog Warning',
    description: 'Alerts when more than 3 reports are pending review for 72+ hours',
    trigger: 'schedule_daily', enabled: true, runCount: 0,
    condition: () => MOCK_REPORTS.filter((r) => r.status === 'pending_review').length > 3,
    action: (ctx) => {
      const pending = MOCK_REPORTS.filter((r) => r.status === 'pending_review');
      eventBus.emit('approval.required', {
        entityType:   'report',
        entityId:     'batch',
        assignedRole: 'director' as RoleCode,
        slaHours:     24,
      });
      void logAuditEvent('report.submitted', {
        metadata: { automation: 'auto-005', pendingCount: pending.length, triggeredAt: ctx.triggeredAt },
      });
    },
  },

  {
    id: 'auto-006', category: 'reporting', priority: 'LOW',
    name: 'Monthly Compliance Summary',
    description: 'Generates a compliance summary at the start of each month',
    trigger: 'schedule_daily', enabled: true, runCount: 0,
    condition: () => {
      const now  = new Date();
      return now.getDate() === 1; // First day of month
    },
    action: async (ctx) => {
      await logAuditEvent('report.submitted', {
        metadata: {
          automation:  'auto-006',
          reportType:  'monthly_compliance_summary',
          generatedAt: ctx.triggeredAt,
        },
      });
      eventBus.emit('automation.rule_triggered', {
        ruleId:   'auto-006',
        ruleName: 'Monthly Compliance Summary',
      });
    },
  },

  // ── System rules ───────────────────────────────────────────────────────────

  {
    id: 'auto-007', category: 'system', priority: 'MEDIUM',
    name: 'Startup Health Check',
    description: 'Performs a system health assessment when the platform starts',
    trigger: 'on_startup', enabled: true, runCount: 0,
    condition: () => true,
    action: async (ctx) => {
      const criticalHazards = MOCK_HAZARD_ASSESSMENTS.filter((h) => h.riskLevel === 'CRITICAL').length;
      if (criticalHazards > 0) {
        eventBus.emit('system.health_degraded', {
          component: 'safety',
          severity:  'critical',
          reason:    `${criticalHazards} critical unmitigated hazard${criticalHazards > 1 ? 's' : ''} detected on startup`,
        });
      }
      await logAuditEvent('system.config_changed', {
        metadata: { automation: 'auto-007', startupCheck: true, triggeredAt: ctx.triggeredAt },
      });
    },
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

class AutomationEngineClass {
  private timers:     number[] = [];
  private initialized = false;

  async runRule(rule: AutomationRule, triggerType: AutomationTrigger): Promise<AutomationResult> {
    const ctx: AutomationContext = { triggeredAt: Date.now(), triggerType };
    rule.lastRun = Date.now();
    rule.runCount++;

    try {
      const matched = await rule.condition(ctx);
      let actionsRun = 0;

      if (matched) {
        await rule.action(ctx);
        actionsRun = 1;
        eventBus.emit('automation.rule_triggered', { ruleId: rule.id, ruleName: rule.name });
      }

      const result: AutomationResult = {
        ruleId:     rule.id,
        executedAt: Date.now(),
        matched,
        actionsRun,
        details:    matched ? 'Condition met — action executed' : 'Condition not met — no action',
      };
      rule.lastResult = result;
      return result;
    } catch (error) {
      const result: AutomationResult = {
        ruleId:     rule.id,
        executedAt: Date.now(),
        matched:    false,
        actionsRun: 0,
        details:    `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
      rule.lastResult = result;
      eventBus.emit('automation.rule_failed', {
        ruleId: rule.id,
        error:  result.details ?? 'Unknown error',
      });
      return result;
    }
  }

  async runTrigger(triggerType: AutomationTrigger): Promise<AutomationResult[]> {
    const rules = AUTOMATION_RULES.filter((r) => r.enabled && r.trigger === triggerType);
    return Promise.all(rules.map((rule) => this.runRule(rule, triggerType)));
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Run startup rules immediately
    void this.runTrigger('on_startup');

    // Hourly rules (run every 60 minutes)
    const hourlyTimer = window.setInterval(
      () => void this.runTrigger('schedule_hourly'),
      60 * 60 * 1000
    );

    // Daily rules (run every 24 hours)
    const dailyTimer = window.setInterval(
      () => void this.runTrigger('schedule_daily'),
      24 * 60 * 60 * 1000
    );

    this.timers.push(hourlyTimer, dailyTimer);
  }

  destroy(): void {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    this.initialized = false;
  }

  getRules(): AutomationRule[] {
    return AUTOMATION_RULES;
  }

  enableRule(ruleId: string): void {
    const rule = AUTOMATION_RULES.find((r) => r.id === ruleId);
    if (rule) rule.enabled = true;
  }

  disableRule(ruleId: string): void {
    const rule = AUTOMATION_RULES.find((r) => r.id === ruleId);
    if (rule) rule.enabled = false;
  }
}

export const automationEngine = new AutomationEngineClass();
