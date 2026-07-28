// DDSE Platform Module Manifest — v3.0
// Self-documenting registry of every operational module in the platform.
// Each module is a bounded domain that owns its routes, data, and events.
// This manifest is the single source of truth for platform structure.

import type { Permission, DeckId } from './rbac';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleStatus = 'active' | 'beta' | 'deprecated' | 'planned';
export type ModuleDataOwner = 'supabase' | 'local' | 'mock' | 'external';

export interface ModuleRoute {
  path:        string;
  label:       string;
  permission?: Permission;
  deck?:       DeckId;
  isDetail?:   boolean;  // /resource/:id pages
}

export interface PlatformModule {
  id:           string;
  name:         string;
  description:  string;
  version:      string;
  status:       ModuleStatus;
  owner:        string;       // team/person responsible
  dataOwner:    ModuleDataOwner;

  routes:       ModuleRoute[];
  permissions:  Permission[];

  events: {
    emits:   string[];   // events this module produces
    listens: string[];   // events this module responds to
  };

  dataBoundary: {
    tables:  string[];   // Supabase tables this module owns
    indexes: string[];   // performance-critical indexes
    caches:  string[];   // cached computed values
  };

  integrations: string[];  // integration bridge IDs it uses
  plugins:      string[];  // plugin IDs that extend this module

  sla: {
    apiResponseMs:  number;
    pageLoadMs:     number;
    availabilityPct: number;
  };
}

// ─── Module registry ──────────────────────────────────────────────────────────

export const PLATFORM_MODULES: PlatformModule[] = [

  // ── 1. Dashboard / Command Center ─────────────────────────────────────────
  {
    id: 'dashboard', name: 'Command Dashboard', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Executive command overview — real-time metrics, approvals, alerts, and activity feed',
    routes: [{ path: '/', label: 'Dashboard' }],
    permissions: ['notifications.access'],
    events: {
      emits:   ['approval.required'],
      listens: ['inspection.submitted', 'hazard.escalated', 'broadcast.published'],
    },
    dataBoundary: {
      tables:  ['dashboard_metrics', 'activity_log'],
      indexes: ['activity_log.created_at', 'activity_log.actor_role'],
      caches:  ['commandCenterSummary', 'pendingApprovalsCount'],
    },
    integrations: [],
    plugins:      [],
    sla: { apiResponseMs: 800, pageLoadMs: 1200, availabilityPct: 99.9 },
  },

  // ── 2. Projects ───────────────────────────────────────────────────────────
  {
    id: 'projects', name: 'Engineering Projects', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Project lifecycle management — BOQ, milestones, progress tracking, contractor management',
    routes: [
      { path: '/projects',    label: 'Projects' },
      { path: '/projects/:id', label: 'Project Detail', isDetail: true },
    ],
    permissions: ['engineering.upload', 'engineering.assess'],
    events: {
      emits:   ['inspection.created', 'document.uploaded'],
      listens: ['inspection.approved', 'report.approved'],
    },
    dataBoundary: {
      tables:  ['projects', 'milestones', 'project_documents', 'recommendations'],
      indexes: ['projects.directorate_code', 'projects.status', 'projects.updated_at'],
      caches:  ['projectList', 'projectDetail'],
    },
    integrations: ['procurement', 'gis'],
    plugins:      ['gis-mapping', 'procurement-integration'],
    sla: { apiResponseMs: 600, pageLoadMs: 1000, availabilityPct: 99.5 },
  },

  // ── 3. Inspections ────────────────────────────────────────────────────────
  {
    id: 'inspections', name: 'Inspection Checklists', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Dynamic inspection execution — weighted scoring, evidence capture, approval chains',
    routes: [
      { path: '/inspections',    label: 'Inspections' },
      { path: '/inspections/:id', label: 'Inspection Detail', isDetail: true },
    ],
    permissions: ['inspections.create', 'inspections.conduct', 'inspections.view_all'],
    events: {
      emits:   ['inspection.created', 'inspection.submitted', 'inspection.approved', 'inspection.rejected', 'document.uploaded'],
      listens: ['approval.required'],
    },
    dataBoundary: {
      tables:  ['inspections', 'inspection_items', 'inspection_evidence', 'inspection_approvals', 'findings'],
      indexes: ['inspections.status', 'inspections.project_id', 'inspections.directorate_code'],
      caches:  ['inspectionList', 'inspectionTemplates'],
    },
    integrations: [],
    plugins:      ['drone-inspection', 'ai-recommendation-engine', 'mobile-companion'],
    sla: { apiResponseMs: 500, pageLoadMs: 900, availabilityPct: 99.9 },
  },

  // ── 4. Safety / Hazard ────────────────────────────────────────────────────
  {
    id: 'safety', name: 'Safety & Hazard Assessments', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'HSE hazard identification, risk classification, corrective action tracking',
    routes: [
      { path: '/safety',    label: 'Safety Assessments' },
      { path: '/safety/:id', label: 'Assessment Detail', isDetail: true },
    ],
    permissions: ['safety.conduct', 'safety.submit_report', 'safety.incident_log'],
    events: {
      emits:   ['hazard.reported', 'hazard.escalated', 'hazard.resolved'],
      listens: ['inspection.submitted'],
    },
    dataBoundary: {
      tables:  ['hazard_assessments', 'hazard_check_items', 'corrective_actions'],
      indexes: ['hazard_assessments.risk_level', 'hazard_assessments.workflow_status'],
      caches:  ['hazardList'],
    },
    integrations: [],
    plugins:      ['ai-recommendation-engine'],
    sla: { apiResponseMs: 500, pageLoadMs: 900, availabilityPct: 99.9 },
  },

  // ── 5. Reports ────────────────────────────────────────────────────────────
  {
    id: 'reports', name: 'Operational Reports', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Structured report authoring, classification, approval chains, and publication',
    routes: [
      { path: '/reports',    label: 'Reports' },
      { path: '/reports/:id', label: 'Report Detail', isDetail: true },
    ],
    permissions: ['reports.strategic', 'reports.departmental', 'reports.submit', 'reports.view_finalized'],
    events: {
      emits:   ['report.created', 'report.submitted', 'report.approved', 'report.modified'],
      listens: ['inspection.approved', 'hazard.resolved'],
    },
    dataBoundary: {
      tables:  ['reports', 'report_findings', 'report_approvals'],
      indexes: ['reports.status', 'reports.classification', 'reports.directorate_code'],
      caches:  ['reportList'],
    },
    integrations: [],
    plugins:      [],
    sla: { apiResponseMs: 600, pageLoadMs: 1000, availabilityPct: 99.5 },
  },

  // ── 6. Analytics ──────────────────────────────────────────────────────────
  {
    id: 'analytics', name: 'Compliance Analytics', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Compliance trends, risk distribution, module performance, activity timeline',
    routes: [{ path: '/analytics', label: 'Analytics', deck: 'analytics' }],
    permissions: ['data.view_nationwide', 'inspections.view_all'],
    events: {
      emits:   [],
      listens: ['inspection.submitted', 'inspection.approved', 'hazard.escalated', 'compliance.threshold_breached'],
    },
    dataBoundary: {
      tables:  ['compliance_metrics', 'module_performance', 'activity_log'],
      indexes: ['compliance_metrics.period', 'compliance_metrics.module_code'],
      caches:  ['complianceTrend', 'modulePerformance', 'riskDistribution'],
    },
    integrations: [],
    plugins:      ['ai-recommendation-engine'],
    sla: { apiResponseMs: 1000, pageLoadMs: 1500, availabilityPct: 99.0 },
  },

  // ── 9. Broadcasts ─────────────────────────────────────────────────────────
  {
    id: 'broadcasts', name: 'Command Broadcasts', version: '3.0.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Command-to-field broadcast system with priority, classification, and role targeting',
    routes: [{ path: '/broadcasts', label: 'Broadcasts' }],
    permissions: ['notifications.access'],
    events: {
      emits:   ['broadcast.published'],
      listens: [],
    },
    dataBoundary: {
      tables:  ['broadcasts', 'broadcast_reads'],
      indexes: ['broadcasts.priority', 'broadcasts.status', 'broadcasts.expires_at'],
      caches:  [],
    },
    integrations: [],
    plugins:      [],
    sla: { apiResponseMs: 400, pageLoadMs: 700, availabilityPct: 99.9 },
  },

  // ── 10. Audit Log ─────────────────────────────────────────────────────────
  {
    id: 'audit', name: 'Audit Log', version: '2.5.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'supabase',
    description: 'Tamper-evident record of all platform actions with offline queue and flush',
    routes: [{ path: '/audit-log', label: 'Audit Log', permission: 'audit.view' }],
    permissions: ['audit.view', 'audit.verify', 'system.audit_logs'],
    events: {
      emits:   [],
      listens: ['*'], // listens to all events
    },
    dataBoundary: {
      tables:  ['audit_logs'],
      indexes: ['audit_logs.action', 'audit_logs.actor_role', 'audit_logs.created_at'],
      caches:  [],
    },
    integrations: [],
    plugins:      [],
    sla: { apiResponseMs: 800, pageLoadMs: 1200, availabilityPct: 99.9 },
  },

  // ── 11. System Health (Phase 12) ──────────────────────────────────────────
  {
    id: 'system_health', name: 'System Health & Observability', version: '3.0.0', status: 'active',
    owner: 'DDSE Core', dataOwner: 'local',
    description: 'Platform observability, automation rules, workflow status, and integration health',
    routes: [
      { path: '/system-health', label: 'System Health',  permission: 'system.config' },
    ],
    permissions: ['system.config', 'system.audit_logs'],
    events: {
      emits:   ['system.health_degraded', 'system.health_restored'],
      listens: ['automation.rule_triggered', 'automation.rule_failed'],
    },
    dataBoundary: {
      tables:  [],
      indexes: [],
      caches:  ['healthReport', 'automationRules'],
    },
    integrations: ['hr', 'procurement', 'gis', 'asset'],
    plugins:      [],
    sla: { apiResponseMs: 200, pageLoadMs: 500, availabilityPct: 99.9 },
  },
];

// ─── Registry helpers ─────────────────────────────────────────────────────────

export function getModule(id: string): PlatformModule | undefined {
  return PLATFORM_MODULES.find((m) => m.id === id);
}

export function getActiveModules(): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) => m.status === 'active');
}

export function getModulesForDeck(deck: string): PlatformModule[] {
  return PLATFORM_MODULES.filter((m) =>
    m.routes.some((r) => r.deck === deck)
  );
}

export function getPlatformEventGraph(): Record<string, { produces: string[]; consumes: string[] }> {
  return Object.fromEntries(
    PLATFORM_MODULES.map((m) => [
      m.id,
      { produces: m.events.emits, consumes: m.events.listens },
    ])
  );
}
