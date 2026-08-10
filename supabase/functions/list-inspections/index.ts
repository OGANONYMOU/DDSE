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
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  )

  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const moduleCode = url.searchParams.get('moduleCode')

    let query = supabase
      .from('inspections')
      .select(
        `id, module_code, title, directorate_code, unit_code, status, created_by, created_at, updated_at,
         final_score, risk_band,
         modules(code, title)`
      )

    if (moduleCode) {
      query = query.eq('module_code', moduleCode)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const inspectionIds = data.map((insp: any) => insp.id)
    const totalsByInspection: Record<string, { total: number; answered: number }> = {}

    if (inspectionIds.length > 0) {
      const { data: sectionsWithItems } = await supabase
        .from('inspection_sections')
        .select('inspection_id, inspection_items(id, inspection_responses(id))')
        .in('inspection_id', inspectionIds)

      for (const section of sectionsWithItems ?? []) {
        const items = (section as any).inspection_items ?? []
        const key = (section as any).inspection_id
        const bucket = totalsByInspection[key] ?? { total: 0, answered: 0 }
        bucket.total += items.length
        bucket.answered += items.filter((i: any) =>
          Array.isArray(i.inspection_responses) ? i.inspection_responses.length > 0 : !!i.inspection_responses
        ).length
        totalsByInspection[key] = bucket
      }
    }

    const inspections = data.map((insp: any) => {
      const totals = totalsByInspection[insp.id]
      const completionPercent = totals && totals.total > 0
        ? Math.round((totals.answered / totals.total) * 100)
        : 0
      const riskLevel = insp.risk_band === 'D' || insp.risk_band === 'F'
        ? 'HIGH'
        : insp.risk_band === 'C'
        ? 'MEDIUM'
        : insp.risk_band
        ? 'LOW'
        : 'LOW'

      return {
        _id: insp.id,
        moduleCode: insp.module_code,
        title: insp.title,
        status: insp.status,
        scoreOverall: Number(insp.final_score ?? 0),
        complianceBand: insp.risk_band ?? 'N/A',
        riskLevel,
        completionPercent,
        directorateCode: insp.directorate_code,
        unitCode: insp.unit_code ?? '',
        createdBy: insp.created_by,
        createdAt: new Date(insp.created_at).getTime(),
        updatedAt: new Date(insp.updated_at ?? insp.created_at).getTime(),
      }
    })

    return new Response(JSON.stringify(inspections), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
