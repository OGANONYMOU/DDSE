import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

// Monday-anchored ISO week label, e.g. "Aug 04"
function weekLabel(date: Date): string {
  const d = new Date(date)
  const day = (d.getUTCDay() + 6) % 7 // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' })
}

function weekStart(date: Date): number {
  const d = new Date(date)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime()
}

Deno.serve(withCors(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const [
      { data: inspections },
      { data: modules },
      { data: correctiveActions },
      { data: projects },
      { data: hazards },
      { data: reports },
    ] = await Promise.all([
      supabase.from('inspections').select('id, module_code, status, directorate_code, final_score, created_at, score_updated_at'),
      supabase.from('modules').select('code, title'),
      supabase.from('corrective_actions').select('id, status, inspection_id'),
      supabase.from('projects').select('id, status'),
      supabase.from('hazard_assessments').select('id, directorate_code, risk_level'),
      supabase.from('reports').select('id, status'),
    ])

    const allInspections = inspections ?? []
    const allModules = modules ?? []
    const allCorrective = correctiveActions ?? []
    const allProjects = projects ?? []
    const allHazards = hazards ?? []
    const allReports = reports ?? []

    const activeProjects = allProjects.filter((p: any) => p.status === 'in_progress').length
    const onHoldProjects = allProjects.filter((p: any) => p.status === 'on_hold').length
    const criticalHazards = allHazards.filter((h: any) => h.risk_level === 'CRITICAL').length
    const pendingReviews = allInspections.filter((i: any) => i.status === 'submitted' || i.status === 'under_review').length
    const overdueActions = allCorrective.filter((c: any) => c.status !== 'closed').length
    const openReports = allReports.filter((r: any) => r.status === 'draft' || r.status === 'pending_review').length

    const scoredInspections = allInspections.filter((i: any) => i.final_score !== null && i.final_score !== undefined)
    const complianceAvg = scoredInspections.length > 0
      ? Math.round(scoredInspections.reduce((sum: number, i: any) => sum + Number(i.final_score), 0) / scoredInspections.length)
      : 0

    // Weekly compliance trend — last 8 ISO weeks (Monday-anchored), oldest first
    const now = new Date()
    const weeks: Array<{ key: number; period: string }> = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() - i * 7)
      weeks.push({ key: weekStart(d), period: weekLabel(d) })
    }
    const complianceTrend = weeks.map(({ key, period }) => {
      const inWeek = scoredInspections.filter((i: any) => {
        const ts = new Date(i.score_updated_at ?? i.created_at).getTime()
        return weekStart(new Date(ts)) === key
      })
      const compliance = inWeek.length > 0
        ? Math.round(inWeek.reduce((sum: number, i: any) => sum + Number(i.final_score), 0) / inWeek.length)
        : null
      return { period, compliance }
    })

    // Risk distribution by directorate, from hazard assessments
    const directorates = Array.from(new Set(allHazards.map((h: any) => h.directorate_code))).sort()
    const riskDistribution = directorates.map((directorate) => {
      const inDirectorate = allHazards.filter((h: any) => h.directorate_code === directorate)
      return {
        directorate,
        critical: inDirectorate.filter((h: any) => h.risk_level === 'CRITICAL').length,
        high: inDirectorate.filter((h: any) => h.risk_level === 'HIGH').length,
        moderate: inDirectorate.filter((h: any) => h.risk_level === 'MODERATE').length,
        low: inDirectorate.filter((h: any) => h.risk_level === 'LOW').length,
      }
    })

    // Module performance
    const modulePerformance = allModules.map((mod: any) => {
      const modInspections = allInspections.filter((i: any) => i.module_code === mod.code)
      const modScored = modInspections.filter((i: any) => i.final_score !== null && i.final_score !== undefined)
      const avgScore = modScored.length > 0
        ? Math.round(modScored.reduce((sum: number, i: any) => sum + Number(i.final_score), 0) / modScored.length)
        : 0
      const modInspectionIds = new Set(modInspections.map((i: any) => i.id))
      const openActions = allCorrective.filter((c: any) => modInspectionIds.has(c.inspection_id) && c.status !== 'closed').length
      return { module: mod.title, avgScore, inspections: modInspections.length, openActions }
    })

    const recentActivity = allInspections
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map((i: any) => ({
        id: i.id,
        action: `Inspection ${String(i.status).replace(/_/g, ' ')}`,
        entityType: 'inspection',
        moduleCode: i.module_code,
        createdAt: new Date(i.created_at).getTime(),
      }))

    return new Response(
      JSON.stringify({
        activeProjects,
        onHoldProjects,
        criticalHazards,
        pendingReviews,
        overdueActions,
        openReports,
        complianceAvg,
        totalAssessments: allInspections.length,
        inspectionModules: allModules.length,
        registeredProjects: allProjects.length,
        complianceTrend,
        riskDistribution,
        modulePerformance,
        recentActivity,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
