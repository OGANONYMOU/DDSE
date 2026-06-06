// DDSE Dynamic Workflow Engine — v3.0
// Replaces hardcoded approval chains with configurable workflow definitions.
// Each workflow is a named sequence of steps, each assigned to a role.
// Workflows are triggered by platform events and track state per entity.

import type { RoleCode } from './rbac';
import { APPROVAL_FLOW } from './rbac';
import { eventBus } from './eventBus';
import { supabase } from './supabase';

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

// ─── DB persistence helpers ───────────────────────────────────────────────────

function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function persistInstance(instance: WorkflowInstance): Promise<void> {
  await supabase.from('workflow_instances').upsert({
    id:              instance.id,
    definition_id:   instance.definitionId,
    entity_type:     instance.entityType,
    entity_id:       instance.entityId,
    status:          instance.status,
    current_step_id: instance.currentStepId,
    metadata:        instance.metadata ?? {},
    started_at:      new Date(instance.startedAt).toISOString(),
    completed_at:    instance.completedAt ? new Date(instance.completedAt).toISOString() : null,
    created_by:      (await supabase.auth.getUser()).data.user?.id ?? '',
  });
}

async function persistStepHistory(instanceId: string, records: WorkflowStepRecord[]): Promise<void> {
  if (records.length === 0) return;
  const latest = records[records.length - 1];
  await supabase.from('workflow_step_history').insert({
    instance_id:   instanceId,
    step_id:       latest.stepId,
    step_name:     latest.stepName,
    assigned_role: latest.assignedRole,
    status:        latest.status,
    actor_role:    latest.actorRole ?? null,
    notes:         latest.notes ?? null,
    started_at:    new Date(latest.startedAt).toISOString(),
    completed_at:  latest.completedAt ? new Date(latest.completedAt).toISOString() : null,
  });
}

// ─── Engine API ───────────────────────────────────────────────────────────────

export async function startWorkflow(
  definitionId: string,
  entityType:   string,
  entityId:     string,
  metadata?:    Record<string, unknown>
): Promise<WorkflowInstance | null> {
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
      stepId:       firstStep.id,
      stepName:     firstStep.name,
      assignedRole: firstStep.assignedRole,
      status:       'in_progress',
      startedAt:    Date.now(),
    }],
    startedAt: Date.now(),
    metadata,
  };

  // Persist to DB — workflow survives refresh/logout/restart
  await persistInstance(instance);
  await persistStepHistory(instance.id, instance.stepHistory);

  eventBus.emit('approval.required', {
    entityType,
    entityId,
    assignedRole: firstStep.assignedRole,
    slaHours:     firstStep.slaHours,
  });

  return instance;
}

export async function advanceWorkflow(
  instanceId: string,
  actorRole:  RoleCode,
  outcome:    'approved' | 'rejected' | 'forwarded',
  notes?:     string
): Promise<WorkflowInstance | null> {
  // Load from DB to get current state (survives page reloads)
  const { data: dbInstance, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('id', instanceId)
    .maybeSingle();

  if (error || !dbInstance) return null;
  if (dbInstance.status !== 'running') return null;

  const definition = WORKFLOW_REGISTRY[dbInstance.definition_id as string];
  if (!definition) return null;

  const currentStepId = dbInstance.current_step_id as string | null;
  const currentStep   = currentStepId ? definition.steps[currentStepId] : null;
  if (!currentStep) return null;

  // Reconstruct instance from DB row
  const instance: WorkflowInstance = {
    id:            String(dbInstance.id),
    definitionId:  String(dbInstance.definition_id),
    entityType:    String(dbInstance.entity_type),
    entityId:      String(dbInstance.entity_id),
    status:        dbInstance.status as WorkflowStatus,
    currentStepId: dbInstance.current_step_id as string | null,
    stepHistory:   [],
    startedAt:     new Date(String(dbInstance.started_at)).getTime(),
    completedAt:   dbInstance.completed_at ? new Date(String(dbInstance.completed_at)).getTime() : undefined,
    metadata:      dbInstance.metadata as Record<string, unknown>,
  };

  const completedStepRecord: WorkflowStepRecord = {
    stepId:       currentStep.id,
    stepName:     currentStep.name,
    assignedRole: currentStep.assignedRole,
    status:       outcome === 'rejected' ? 'skipped' : 'completed',
    startedAt:    Date.now() - 1000,
    completedAt:  Date.now(),
    actorRole,
    notes,
  };

  if (outcome === 'rejected') {
    instance.status        = 'cancelled';
    instance.currentStepId = null;
    instance.completedAt   = Date.now();
    instance.stepHistory   = [completedStepRecord];
    await persistInstance(instance);
    await persistStepHistory(instance.id, instance.stepHistory);
    return instance;
  }

  const nextStepId = currentStep.nextStepId;
  if (!nextStepId) {
    instance.status        = 'completed';
    instance.currentStepId = null;
    instance.completedAt   = Date.now();
    instance.stepHistory   = [completedStepRecord];
  } else {
    const nextStep          = definition.steps[nextStepId];
    instance.currentStepId  = nextStepId;
    const nextRecord: WorkflowStepRecord = {
      stepId:       nextStepId,
      stepName:     nextStep.name,
      assignedRole: nextStep.assignedRole,
      status:       'in_progress',
      startedAt:    Date.now(),
    };
    instance.stepHistory = [completedStepRecord, nextRecord];

    // Record SLA due date
    const slaDue = new Date(Date.now() + nextStep.slaHours * 3600_000).toISOString();
    await supabase.from('workflow_step_history').insert({
      instance_id:   instanceId,
      step_id:       nextStepId,
      step_name:     nextStep.name,
      assigned_role: nextStep.assignedRole,
      status:        'in_progress',
      sla_due_at:    slaDue,
      started_at:    new Date().toISOString(),
    });

    eventBus.emit('approval.required', {
      entityType:   instance.entityType,
      entityId:     instance.entityId,
      assignedRole: nextStep.assignedRole,
      slaHours:     nextStep.slaHours,
    });
  }

  await persistInstance(instance);
  await persistStepHistory(instance.id, [completedStepRecord]);
  return instance;
}

export async function getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('id', instanceId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id:            String(data.id),
    definitionId:  String(data.definition_id),
    entityType:    String(data.entity_type),
    entityId:      String(data.entity_id),
    status:        data.status as WorkflowStatus,
    currentStepId: data.current_step_id as string | null,
    stepHistory:   [],
    startedAt:     new Date(String(data.started_at)).getTime(),
    completedAt:   data.completed_at ? new Date(String(data.completed_at)).getTime() : undefined,
    metadata:      data.metadata as Record<string, unknown>,
  };
}

export async function getWorkflowsForEntity(entityId: string): Promise<WorkflowInstance[]> {
  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('entity_id', entityId)
    .order('started_at', { ascending: false });
  if (error) return [];

  return (data ?? []).map((row) => ({
    id:            String(row.id),
    definitionId:  String(row.definition_id),
    entityType:    String(row.entity_type),
    entityId:      String(row.entity_id),
    status:        row.status as WorkflowStatus,
    currentStepId: row.current_step_id as string | null,
    stepHistory:   [],
    startedAt:     new Date(String(row.started_at)).getTime(),
    completedAt:   row.completed_at ? new Date(String(row.completed_at)).getTime() : undefined,
    metadata:      row.metadata as Record<string, unknown>,
  }));
}

export async function getAllActiveWorkflows(): Promise<WorkflowInstance[]> {
  const { data, error } = await supabase
    .from('workflow_instances')
    .select('*')
    .eq('status', 'running')
    .order('started_at', { ascending: false });
  if (error) return [];

  return (data ?? []).map((row) => ({
    id:            String(row.id),
    definitionId:  String(row.definition_id),
    entityType:    String(row.entity_type),
    entityId:      String(row.entity_id),
    status:        'running' as WorkflowStatus,
    currentStepId: row.current_step_id as string | null,
    stepHistory:   [],
    startedAt:     new Date(String(row.started_at)).getTime(),
    metadata:      row.metadata as Record<string, unknown>,
  }));
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
        // Fire-and-forget; workflow engine persists to DB
        startWorkflow(defId, definition.entityType, entityId, { triggeredBy: event.name })
          .catch((err) => console.error('[WorkflowEngine] Failed to start workflow:', err));
      }
    );
    unsubs.push(unsub);
  }

  return () => unsubs.forEach((fn) => fn());
}
