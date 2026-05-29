// DDSE Dynamic Workflow Engine — v3.0
// Replaces hardcoded approval chains with configurable workflow definitions.
// Each workflow is a named sequence of steps, each assigned to a role.
// Workflows are triggered by platform events and track state per entity.

import type { RoleCode } from './rbac';
import { APPROVAL_FLOW } from './rbac';
import { eventBus } from './eventBus';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowAction = 'review' | 'approve' | 'sign' | 'forward' | 'escalate';
export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue';
export type WorkflowStatus = 'not_started' | 'running' | 'completed' | 'cancelled' | 'overdue';

export interface WorkflowStep {
  id:            string;
  name:          string;
  assignedRole:  RoleCode;
  action:        WorkflowAction;
  slaHours:      number;        // hours before this step is flagged overdue
  required:      boolean;
  nextStepId?:   string;        // on completion, advance to this step
  escalateToId?: string;        // on overdue, advance to this step instead
  description?:  string;
}

export interface WorkflowDefinition {
  id:             string;
  name:           string;
  description:    string;
  entityType:     'inspection' | 'report' | 'hazard' | 'registration' | 'project';
  triggerEvent?:  string;        // platform event name that auto-starts this workflow
  firstStepId:    string;
  steps:          Record<string, WorkflowStep>;
  parallelSteps?: string[];     // step IDs that run concurrently
}

export interface WorkflowInstance {
  id:             string;
  definitionId:   string;
  entityType:     string;
  entityId:       string;
  status:         WorkflowStatus;
  currentStepId:  string | null;
  stepHistory:    WorkflowStepRecord[];
  startedAt:      number;
  completedAt?:   number;
  metadata?:      Record<string, unknown>;
}

export interface WorkflowStepRecord {
  stepId:      string;
  stepName:    string;
  assignedRole: RoleCode;
  status:      WorkflowStepStatus;
  startedAt:   number;
  completedAt?: number;
  actorRole?:  RoleCode;
  notes?:      string;
}

// ─── Built-in workflow definitions ───────────────────────────────────────────
// These replicate and extend the APPROVAL_FLOW from rbac.ts,
// making the chain explicit, configurable, and SLA-aware.

export const INSPECTION_APPROVAL_WORKFLOW: WorkflowDefinition = {
  id:          'inspection_approval',
  name:        'Inspection Approval Chain',
  description: 'Standard approval chain for completed inspection submissions',
  entityType:  'inspection',
  triggerEvent: 'inspection.submitted',
  firstStepId: 'step_admin_review',
  steps: {
    step_admin_review: {
      id: 'step_admin_review', name: 'Administrative Review',
      assignedRole: APPROVAL_FLOW.inspection_officer ?? 'admin',
      action: 'review', slaHours: 48, required: true,
      nextStepId: 'step_commander_approval',
      description: 'Initial quality and completeness review by administration',
    },
    step_commander_approval: {
      id: 'step_commander_approval', name: 'Commander Approval',
      assignedRole: 'commander',
      action: 'approve', slaHours: 72, required: true,
      nextStepId: 'step_director_sign',
      escalateToId: 'step_director_sign',
      description: 'Tactical approval by unit commander',
    },
    step_director_sign: {
      id: 'step_director_sign', name: 'Director Sign-Off',
      assignedRole: 'director',
      action: 'sign', slaHours: 96, required: false,
      description: 'Strategic sign-off for high-risk or classified inspections',
    },
  },
};

export const HAZARD_ESCALATION_WORKFLOW: WorkflowDefinition = {
  id:          'hazard_escalation',
  name:        'Hazard Escalation Protocol',
  description: 'Escalation chain for reported safety hazards based on risk level',
  entityType:  'hazard',
  triggerEvent: 'hazard.reported',
  firstStepId: 'step_safety_assess',
  steps: {
    step_safety_assess: {
      id: 'step_safety_assess', name: 'Safety Officer Assessment',
      assignedRole: 'safety_officer',
      action: 'review', slaHours: 24, required: true,
      nextStepId: 'step_commander_hazard_review',
      escalateToId: 'step_commander_hazard_review',
      description: 'Initial hazard assessment and risk classification',
    },
    step_commander_hazard_review: {
      id: 'step_commander_hazard_review', name: 'Commander Hazard Review',
      assignedRole: 'commander',
      action: 'approve', slaHours: 24, required: true,
      nextStepId: 'step_corrective_action',
      description: 'Command-level review and corrective action authorisation',
    },
    step_corrective_action: {
      id: 'step_corrective_action', name: 'Corrective Action Execution',
      assignedRole: 'safety_officer',
      action: 'forward', slaHours: 168, required: true,
      description: 'Implementation and verification of corrective measures',
    },
  },
};

export const REPORT_APPROVAL_WORKFLOW: WorkflowDefinition = {
  id:          'report_approval',
  name:        'Report Approval & Publication',
  description: 'Review and approval chain for submitted operational reports',
  entityType:  'report',
  triggerEvent: 'report.submitted',
  firstStepId: 'step_review',
  steps: {
    step_review: {
      id: 'step_review', name: 'Content Review',
      assignedRole: 'admin',
      action: 'review', slaHours: 48, required: true,
      nextStepId: 'step_approval',
      description: 'Editorial and factual review of report content',
    },
    step_approval: {
      id: 'step_approval', name: 'Final Approval',
      assignedRole: 'director',
      action: 'approve', slaHours: 72, required: true,
      description: 'Director-level approval for publication',
    },
  },
};

export const REGISTRATION_WORKFLOW: WorkflowDefinition = {
  id:          'user_registration',
  name:        'Personnel Registration Authorisation',
  description: 'Security screening and authorisation for new personnel registrations',
  entityType:  'registration',
  triggerEvent: 'user.registered',
  firstStepId: 'step_admin_verify',
  steps: {
    step_admin_verify: {
      id: 'step_admin_verify', name: 'Identity Verification',
      assignedRole: 'admin',
      action: 'review', slaHours: 48, required: true,
      nextStepId: 'step_commander_authorise',
      description: 'Service number and credentials verification',
    },
    step_commander_authorise: {
      id: 'step_commander_authorise', name: 'Command Authorisation',
      assignedRole: 'commander',
      action: 'approve', slaHours: 48, required: true,
      description: 'Command-level access authorisation',
    },
  },
};

// ─── Workflow Registry ────────────────────────────────────────────────────────

export const WORKFLOW_REGISTRY: Record<string, WorkflowDefinition> = {
  inspection_approval: INSPECTION_APPROVAL_WORKFLOW,
  hazard_escalation:   HAZARD_ESCALATION_WORKFLOW,
  report_approval:     REPORT_APPROVAL_WORKFLOW,
  user_registration:   REGISTRATION_WORKFLOW,
};

// ─── In-memory instance store (replace with Supabase in production) ───────────

const INSTANCES: Map<string, WorkflowInstance> = new Map();

function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Engine API ───────────────────────────────────────────────────────────────

export function startWorkflow(
  definitionId: string,
  entityType:   string,
  entityId:     string,
  metadata?:    Record<string, unknown>
): WorkflowInstance | null {
  const definition = WORKFLOW_REGISTRY[definitionId];
  if (!definition) return null;

  const firstStep = definition.steps[definition.firstStepId];
  if (!firstStep) return null;

  const instance: WorkflowInstance = {
    id:            generateId(),
    definitionId,
    entityType,
    entityId,
    status:        'running',
    currentStepId: definition.firstStepId,
    stepHistory:   [{
      stepId:      firstStep.id,
      stepName:    firstStep.name,
      assignedRole: firstStep.assignedRole,
      status:       'in_progress',
      startedAt:    Date.now(),
    }],
    startedAt:     Date.now(),
    metadata,
  };

  INSTANCES.set(instance.id, instance);

  // Notify via event bus
  eventBus.emit('approval.required', {
    entityType,
    entityId,
    assignedRole: firstStep.assignedRole,
    slaHours:     firstStep.slaHours,
  });

  return instance;
}

export function advanceWorkflow(
  instanceId: string,
  actorRole:  RoleCode,
  outcome:    'approved' | 'rejected' | 'forwarded',
  notes?:     string
): WorkflowInstance | null {
  const instance = INSTANCES.get(instanceId);
  if (!instance || instance.status !== 'running') return null;

  const definition  = WORKFLOW_REGISTRY[instance.definitionId];
  if (!definition) return null;

  const currentStep = instance.currentStepId
    ? definition.steps[instance.currentStepId]
    : null;
  if (!currentStep) return null;

  // Mark current step completed
  const lastRecord = instance.stepHistory.find((r) => r.stepId === currentStep.id && !r.completedAt);
  if (lastRecord) {
    lastRecord.completedAt = Date.now();
    lastRecord.actorRole   = actorRole;
    lastRecord.notes       = notes;
    lastRecord.status      = outcome === 'rejected' ? 'skipped' : 'completed';
  }

  if (outcome === 'rejected') {
    instance.status        = 'cancelled';
    instance.currentStepId = null;
    instance.completedAt   = Date.now();
    return instance;
  }

  // Advance to next step
  const nextStepId = currentStep.nextStepId;
  if (!nextStepId) {
    // Workflow complete
    instance.status        = 'completed';
    instance.currentStepId = null;
    instance.completedAt   = Date.now();
  } else {
    const nextStep = definition.steps[nextStepId];
    instance.currentStepId = nextStepId;
    instance.stepHistory.push({
      stepId:       nextStepId,
      stepName:     nextStep.name,
      assignedRole: nextStep.assignedRole,
      status:       'in_progress',
      startedAt:    Date.now(),
    });

    eventBus.emit('approval.required', {
      entityType:   instance.entityType,
      entityId:     instance.entityId,
      assignedRole: nextStep.assignedRole,
      slaHours:     nextStep.slaHours,
    });
  }

  INSTANCES.set(instanceId, instance);
  return instance;
}

export function getWorkflowInstance(instanceId: string): WorkflowInstance | null {
  return INSTANCES.get(instanceId) ?? null;
}

export function getWorkflowsForEntity(entityId: string): WorkflowInstance[] {
  return Array.from(INSTANCES.values()).filter((i) => i.entityId === entityId);
}

export function getAllActiveWorkflows(): WorkflowInstance[] {
  return Array.from(INSTANCES.values()).filter((i) => i.status === 'running');
}

// ─── Auto-registration: listen to platform events → start workflows ───────────

export function initWorkflowEngine(): () => void {
  const unsubs: Array<() => void> = [];

  for (const [defId, definition] of Object.entries(WORKFLOW_REGISTRY)) {
    if (!definition.triggerEvent) continue;

    const unsub = eventBus.on(
      definition.triggerEvent as keyof import('./eventBus').PlatformEventMap,
      (event) => {
        const p = event.payload as Record<string, unknown>;
        const entityId = (
          p['inspectionId'] ?? p['reportId'] ?? p['hazardId'] ?? p['userId'] ?? event.id
        ) as string;
        startWorkflow(defId, definition.entityType, entityId, { triggeredBy: event.name });
      }
    );
    unsubs.push(unsub);
  }

  return () => unsubs.forEach((fn) => fn());
}
