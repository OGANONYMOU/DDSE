import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

Deno.serve(withCors(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_platform_owner, directorate_code')
      .eq('id', user.id)
      .single()

    const [
      { data: inspections },
      { data: findings },
      { data: correctiveActions },
      { data: modules },
      { data: evidence },
      { data: schedules },
    ] = await Promise.all([
      supabase.from('inspections').select('id, module_code, status, directorate_code, created_at, final_score'),
      supabase.from('findings').select('id, severity, status, inspection_id'),
      supabase.from('corrective_actions').select('id, status, inspection_id'),
      supabase.from('modules').select('code, title, classification'),
      supabase.from('evidence').select('id, inspection_id'),
      supabase.from('inspection_schedules').select('module_code, status'),
    ])

    const allInspections = inspections ?? []
    const allFindings = findings ?? []
    const allCorrective = correctiveActions ?? []
    const allEvidence = evidence ?? []
    const allSchedules = schedules ?? []
    const inspectionsWithEvidence = new Set(allEvidence.map((e: any) => e.inspection_id))

    const totalInspections = allInspections.length
    const completedInspections = allInspections.filter((i: any) => i.status === 'completed').length
    const openFindings = allFindings.filter((f: any) => f.status === 'open').length
    const criticalFindings = allFindings.filter((f: any) => f.severity === 'critical').length
    const openCorrective = allCorrective.filter((c: any) => c.status !== 'closed').length

    const readinessAverage = totalInspections > 0
      ? Math.round((completedInspections / totalInspections) * 100)
      : 0

    const safetyRiskLevel = criticalFindings > 0 ? 'HIGH' : openFindings > 5 ? 'MEDIUM' : 'LOW'

    const moduleSummaries = (modules ?? []).map((mod: any) => {
      const modInspections = allInspections.filter((i: any) => i.module_code === mod.code)
      const modInspectionIds = modInspections.map((i: any) => i.id)
      const modCorrective = allCorrective.filter((c: any) => modInspectionIds.includes(c.inspection_id))

      const scored = modInspections.filter((i: any) => i.final_score !== null && i.final_score !== undefined)
      const averageScore = scored.length > 0
        ? Math.round(scored.reduce((sum: number, i: any) => sum + Number(i.final_score), 0) / scored.length)
        : 0

      const withEvidence = modInspections.filter((i: any) => inspectionsWithEvidence.has(i.id)).length
      const evidenceComplete = modInspections.length > 0
        ? Math.round((withEvidence / modInspections.length) * 100)
        : 0

      const overdue = allSchedules.filter((s: any) => s.module_code === mod.code && s.status === 'overdue').length

      return {
        moduleCode: mod.code,
        inspections: modInspections.length,
        overdue,
        averageScore,
        openCorrectiveActions: modCorrective.filter((c: any) => c.status !== 'closed').length,
        evidenceComplete,
      }
    })

    const restrictedModulesVisible = (modules ?? []).filter((m: any) => m.classification !== 'general').length
    const evidenceCompleteness = totalInspections > 0
      ? Math.round((allInspections.filter((i: any) => inspectionsWithEvidence.has(i.id)).length / totalInspections) * 100)
      : 0

    const severityDistribution: Record<string, number> = {
      critical: 0,
      major: 0,
      minor: 0,
      observation: 0,
    }
    allFindings.forEach((f: any) => {
      if (f.severity in severityDistribution) {
        severityDistribution[f.severity]++
      }
    })

    const recentActivity = allInspections
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((i: any) => ({
        id: i.id,
        action: `Inspection ${i.status.replace(/_/g, ' ')}`,
        entityType: 'inspection',
        moduleCode: i.module_code,
        createdAt: new Date(i.created_at).getTime(),
      }))

    const alerts = allFindings
      .filter((f: any) => f.severity === 'critical' && f.status === 'open')
      .slice(0, 5)
      .map((f: any) => {
        const insp = allInspections.find((i: any) => i.id === f.inspection_id)
        return {
          id: f.id,
          title: `Critical finding requires immediate attention`,
          severity: 'critical',
          moduleCode: insp?.module_code ?? 'unknown',
        }
      })

    let approvalQueue = 0
    if (profile?.is_platform_owner) {
      const { count } = await supabase
        .from('registration_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      approvalQueue = count ?? 0
    }

    const summary = {
      metrics: [
        { key: 'total_inspections', label: 'Total Inspections', value: totalInspections, trend: `${completedInspections} completed`, tone: 'info' },
        { key: 'open_findings', label: 'Open Findings', value: openFindings, trend: `${criticalFindings} critical`, tone: openFindings > 0 ? 'warning' : 'info' },
        { key: 'corrective_actions', label: 'Corrective Actions', value: openCorrective, trend: 'open items', tone: openCorrective > 0 ? 'warning' : 'info' },
        { key: 'approval_queue', label: 'Approval Queue', value: approvalQueue, trend: 'pending approvals', tone: approvalQueue > 0 ? 'warning' : 'info' },
      ],
      posture: {
        readinessAverage,
        safetyRiskLevel,
        evidenceCompleteness,
        restrictedModulesVisible,
      },
      moduleSummaries,
      severityDistribution,
      approvalQueue,
      recentActivity,
      alerts,
    }

    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
