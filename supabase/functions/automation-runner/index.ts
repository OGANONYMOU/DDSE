// DDSE Automation Runner — Supabase Edge Function
// Executes server-side automation rules on a schedule.
// Invoke via Supabase pg_cron or external scheduler (e.g. daily cron).
// Does NOT require a user session — uses service_role key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')     ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Service-role client bypasses RLS — required for cross-user notifications
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleResult {
  ruleKey:    string
  matched:    boolean
  actionsRun: number
  details:    string
  durationMs: number
}

// ─── Auth check: only allow calls from authorised sources ─────────────────────

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return false
  // Accept service-role key or a shared cron secret
  const cronSecret = Deno.env.get('AUTOMATION_CRON_SECRET')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return authHeader === `Bearer ${SERVICE_ROLE_KEY}`
}

// ─── Rule: Flag overdue inspections ──────────────────────────────────────────

async function runOverdueInspections(config: Record<string, unknown>): Promise<RuleResult> {
  const start       = Date.now()
  const thresholdDays = Number(config['overdueThresholdDays'] ?? 14)
  const cutoff      = new Date(Date.now() - thresholdDays * 86_400_000).toISOString()

  const { data: overdue, error } = await adminClient
    .from('inspections')
    .select('id, title, created_by, directorate_code')
    .eq('status', 'in_progress')
    .lt('updated_at', cutoff)

  if (error) throw error

  let actionsRun = 0
  for (const insp of (overdue ?? [])) {
    // Notify the creator
    await adminClient.from('notifications').insert({
      recipient_id: insp.created_by,
      type:         'warning',
      priority:     'HIGH',
      title:        'Inspection Overdue',
      body:         `Inspection "${insp.title}" has been in-progress for more than ${thresholdDays} days without submission.`,
      entity_type:  'inspection',
      entity_id:    insp.id,
    })
    actionsRun++

    // Log automation event
    await adminClient.from('audit_logs').insert({
      action:      'automation.inspection_flagged_overdue',
      actor_id:    null,
      actor_role:  'system',
      entity_type: 'inspection',
      entity_id:   insp.id,
      metadata:    { daysOverdue: thresholdDays },
    }).throwOnError().catch(() => {}) // audit log failure must not abort the run
  }

  return {
    ruleKey:    'overdue_inspections',
    matched:    (overdue?.length ?? 0) > 0,
    actionsRun,
    details:    `Flagged ${overdue?.length ?? 0} overdue inspections`,
    durationMs: Date.now() - start,
  }
}

// ─── Rule: Flag overdue corrective actions ────────────────────────────────────

async function runOverdueCorrectiveActions(config: Record<string, unknown>): Promise<RuleResult> {
  const start           = Date.now()
  const escalateAfterDays = Number(config['escalateAfterDays'] ?? 3)
  const today           = new Date().toISOString().split('T')[0]

  const { data: overdue, error } = await adminClient
    .from('corrective_actions')
    .select('id, title, inspection_id, inspections(created_by, title)')
    .not('status', 'eq', 'closed')
    .not('due_date', 'is', null)
    .lt('due_date', today)

  if (error) throw error

  let actionsRun = 0
  for (const ca of (overdue ?? [])) {
    const inspection = (ca as Record<string, unknown>).inspections as Record<string, unknown> | null
    if (!inspection?.created_by) continue

    await adminClient.from('notifications').insert({
      recipient_id: inspection.created_by,
      type:         'alert',
      priority:     'HIGH',
      title:        'Corrective Action Overdue',
      body:         `Corrective action "${ca.title}" is past its due date and has not been closed.`,
      entity_type:  'corrective_action',
      entity_id:    ca.id,
    })
    actionsRun++
  }

  return {
    ruleKey:    'overdue_corrective_actions',
    matched:    (overdue?.length ?? 0) > 0,
    actionsRun,
    details:    `Found ${overdue?.length ?? 0} overdue corrective actions`,
    durationMs: Date.now() - start,
  }
}

// ─── Rule: Auto-escalate critical hazards ────────────────────────────────────

async function runCriticalHazardEscalation(config: Record<string, unknown>): Promise<RuleResult> {
  const start          = Date.now()
  const thresholdHours = Number(config['thresholdHours'] ?? 24)
  const cutoff         = new Date(Date.now() - thresholdHours * 3_600_000).toISOString()

  const { data: hazards, error } = await adminClient
    .from('hazard_assessments')
    .select('id, hazard_title, created_by, directorate_code, workflow_status')
    .eq('risk_level', 'CRITICAL')
    .eq('workflow_status', 'open')
    .lt('created_at', cutoff)

  if (error) throw error

  let actionsRun = 0
  for (const hazard of (hazards ?? [])) {
    // Escalate workflow status
    await adminClient
      .from('hazard_assessments')
      .update({ workflow_status: 'escalated' })
      .eq('id', hazard.id)

    // Insert escalation record
    await adminClient.from('hazard_escalations').insert({
      assessment_id:      hazard.id,
      escalated_by:       hazard.created_by,
      escalated_to_role:  'commander',
      reason:             `Automated escalation: CRITICAL hazard open for more than ${thresholdHours} hours.`,
    })

    // Notify the creator
    await adminClient.from('notifications').insert({
      recipient_id: hazard.created_by,
      type:         'alert',
      priority:     'CRITICAL',
      title:        'Critical Hazard Auto-Escalated',
      body:         `Hazard "${hazard.hazard_title}" has been automatically escalated to command level after ${thresholdHours}h without action.`,
      entity_type:  'hazard',
      entity_id:    hazard.id,
    })
    actionsRun++
  }

  return {
    ruleKey:    'critical_hazard_escalation',
    matched:    (hazards?.length ?? 0) > 0,
    actionsRun,
    details:    `Escalated ${hazards?.length ?? 0} critical hazards`,
    durationMs: Date.now() - start,
  }
}

// ─── Rule: Alert on unreviewed submissions ────────────────────────────────────

async function runUnreviewedSubmissions(config: Record<string, unknown>): Promise<RuleResult> {
  const start          = Date.now()
  const thresholdHours = Number(config['thresholdHours'] ?? 72)
  const cutoff         = new Date(Date.now() - thresholdHours * 3_600_000).toISOString()

  const { data: submissions, error } = await adminClient
    .from('inspections')
    .select('id, title, directorate_code')
    .eq('status', 'submitted')
    .lt('updated_at', cutoff)

  if (error) throw error

  // Notify all admins in the affected directorates
  const directorates = [...new Set((submissions ?? []).map((s) => s.directorate_code))]
  let actionsRun = 0

  for (const dir of directorates) {
    const { data: admins } = await adminClient
      .from('user_profiles')
      .select('id')
      .eq('directorate_code', dir)
      .in('role_code', ['admin', 'commander', 'director', 'platform_owner'])
      .eq('status', 'active')

    const dirSubmissions = (submissions ?? []).filter((s) => s.directorate_code === dir)

    for (const admin of (admins ?? [])) {
      await adminClient.from('notifications').insert({
        recipient_id: admin.id,
        type:         'warning',
        priority:     'MEDIUM',
        title:        'Unreviewed Inspection Submissions',
        body:         `${dirSubmissions.length} inspection(s) in directorate ${dir} have been awaiting review for more than ${thresholdHours} hours.`,
        entity_type:  'directorate',
      })
      actionsRun++
    }
  }

  return {
    ruleKey:    'unreviewed_submissions',
    matched:    (submissions?.length ?? 0) > 0,
    actionsRun,
    details:    `Found ${submissions?.length ?? 0} unreviewed submissions across ${directorates.length} directorates`,
    durationMs: Date.now() - start,
  }
}

// ─── Rule: Workflow SLA breach escalation ─────────────────────────────────────

async function runSLABreachEscalation(): Promise<RuleResult> {
  const start = Date.now()
  const now   = new Date().toISOString()

  const { data: overdueSteps, error } = await adminClient
    .from('workflow_step_history')
    .select('id, instance_id, step_id, step_name, assigned_role, sla_due_at, workflow_instances(entity_type, entity_id, created_by)')
    .eq('status', 'in_progress')
    .not('sla_due_at', 'is', null)
    .lt('sla_due_at', now)

  if (error) throw error

  let actionsRun = 0
  for (const step of (overdueSteps ?? [])) {
    // Mark step as overdue
    await adminClient
      .from('workflow_step_history')
      .update({ status: 'overdue' })
      .eq('id', step.id)

    // Mark the instance as overdue
    await adminClient
      .from('workflow_instances')
      .update({ status: 'overdue' })
      .eq('id', step.instance_id)

    const instance = (step as Record<string, unknown>).workflow_instances as Record<string, unknown> | null
    if (instance?.created_by) {
      await adminClient.from('notifications').insert({
        recipient_id: instance.created_by,
        type:         'alert',
        priority:     'HIGH',
        title:        'Workflow SLA Breached',
        body:         `Approval step "${step.step_name}" (assigned to ${step.assigned_role}) has exceeded its SLA deadline.`,
        entity_type:  instance.entity_type,
        entity_id:    instance.entity_id,
      })
      actionsRun++
    }
  }

  return {
    ruleKey:    'sla_breach_escalation',
    matched:    (overdueSteps?.length ?? 0) > 0,
    actionsRun,
    details:    `Processed ${overdueSteps?.length ?? 0} SLA breaches`,
    durationMs: Date.now() - start,
  }
}

// ─── Rule dispatch ────────────────────────────────────────────────────────────

async function runRule(ruleKey: string, config: Record<string, unknown>): Promise<RuleResult> {
  switch (ruleKey) {
    case 'overdue_inspections':       return runOverdueInspections(config)
    case 'overdue_corrective_actions': return runOverdueCorrectiveActions(config)
    case 'critical_hazard_escalation': return runCriticalHazardEscalation(config)
    case 'unreviewed_submissions':    return runUnreviewedSubmissions(config)
    case 'sla_breach_escalation':     return runSLABreachEscalation()
    default:
      return { ruleKey, matched: false, actionsRun: 0, details: 'Unknown rule', durationMs: 0 }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: rules, error: rulesError } = await adminClient
    .from('automation_rules')
    .select('id, rule_key, config')
    .eq('enabled', true)

  if (rulesError) {
    return new Response(JSON.stringify({ error: rulesError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results: RuleResult[] = []

  for (const rule of (rules ?? [])) {
    const executionStart = Date.now()
    let result: RuleResult

    try {
      result = await runRule(
        rule.rule_key as string,
        (rule.config ?? {}) as Record<string, unknown>
      )
    } catch (err) {
      result = {
        ruleKey:    rule.rule_key as string,
        matched:    false,
        actionsRun: 0,
        details:    `Error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - executionStart,
      }
    }

    results.push(result)

    // Record execution
    const { data: exec } = await adminClient
      .from('automation_executions')
      .insert({
        rule_id:      rule.id,
        trigger_type: 'schedule_daily',
        matched:      result.matched,
        actions_run:  result.actionsRun,
        details:      result.details,
        duration_ms:  result.durationMs,
      })
      .select('id')
      .maybeSingle()

    // Update last_run_at on the rule
    await adminClient
      .from('automation_rules')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', rule.id)

    // Log execution details
    if (exec?.id) {
      await adminClient.from('automation_logs').insert({
        execution_id: exec.id,
        level:        result.matched ? 'info' : 'debug',
        message:      result.details,
        metadata:     { actionsRun: result.actionsRun, durationMs: result.durationMs },
      })
    }
  }

  return new Response(
    JSON.stringify({ success: true, rulesRun: results.length, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
