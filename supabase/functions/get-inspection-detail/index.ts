import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

Deno.serve(async (req) => {
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

    const url = new URL(req.url)
    const inspectionId = url.searchParams.get('inspectionId')

    if (!inspectionId) {
      return new Response(
        JSON.stringify({ error: 'Missing inspectionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: inspection, error: inspError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single()

    if (inspError || !inspection) {
      return new Response(
        JSON.stringify({ error: 'Inspection not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const [
      { data: sectionsRaw },
      { data: findings },
      { data: correctiveActions },
      { data: evidence },
      { data: reviewComments },
    ] = await Promise.all([
      supabase
        .from('inspection_sections')
        .select(`
          id, title, display_order,
          inspection_items(
            id, code, prompt, weight, response_type,
            inspection_responses(response_value, numeric_score, severity, immediate_risk, remarks)
          )
        `)
        .eq('inspection_id', inspectionId)
        .order('display_order'),
      supabase
        .from('findings')
        .select('id, item_id, title, detail, severity, status, created_at')
        .eq('inspection_id', inspectionId)
        .order('created_at'),
      supabase
        .from('corrective_actions')
        .select('id, title, detail, status, stop_work_issued, created_at')
        .eq('inspection_id', inspectionId)
        .order('created_at'),
      supabase
        .from('evidence')
        .select('id, section_id, item_id, file_name, content_type, size_bytes, created_at')
        .eq('inspection_id', inspectionId),
      supabase
        .from('review_comments')
        .select('id, finding_id, parent_comment_id, user_id, body, resolved_at, created_at, user_profiles(role_code)')
        .eq('inspection_id', inspectionId)
        .order('created_at'),
    ])

    const sections = (sectionsRaw ?? []).map((section: any) => ({
      _id: section.id,
      title: section.title,
      items: (section.inspection_items ?? []).map((item: any) => {
        const response = Array.isArray(item.inspection_responses)
          ? item.inspection_responses[0] ?? null
          : item.inspection_responses ?? null
        const itemEvidence = (evidence ?? []).filter((e: any) => e.item_id === item.id)
        return {
          _id: item.id,
          code: item.code ?? item.id,
          prompt: item.prompt ?? '',
          responseType: item.response_type ?? 'yes_no',
          weight: item.weight ?? 10,
          response: response
            ? {
                responseValue: response.response_value,
                numericScore: response.numeric_score,
                severity: response.severity,
                immediateRisk: response.immediate_risk,
                remarks: response.remarks,
              }
            : null,
          evidence: itemEvidence.map((e: any) => ({
            _id: e.id,
            fileName: e.file_name,
            contentType: e.content_type,
          })),
        }
      }),
    }))

    const formattedFindings = (findings ?? []).map((f: any) => ({
      _id: f.id,
      itemId: f.item_id,
      title: f.title,
      detail: f.detail,
      severity: f.severity,
      status: f.status,
    }))

    const formattedCorrectiveActions = (correctiveActions ?? []).map((c: any) => ({
      _id: c.id,
      title: c.title,
      detail: c.detail,
      status: c.status,
      stopWorkIssued: c.stop_work_issued,
    }))

    const formattedComments = (reviewComments ?? []).map((c: any) => ({
      _id: c.id,
      findingId: c.finding_id,
      parentCommentId: c.parent_comment_id,
      actorRoleCode: c.user_profiles?.role_code ?? 'unknown',
      body: c.body,
      createdAt: new Date(c.created_at).getTime(),
      resolvedAt: c.resolved_at ? new Date(c.resolved_at).getTime() : undefined,
    }))

    return new Response(
      JSON.stringify({
        inspection: {
          _id: inspection.id,
          title: inspection.title,
          moduleCode: inspection.module_code,
          status: inspection.status,
          scoreOverall: 0,
          complianceBand: 'N/A',
          riskLevel: 'LOW',
          completionPercent: 0,
          directorateCode: inspection.directorate_code,
        },
        sections,
        findings: formattedFindings,
        correctiveActions: formattedCorrectiveActions,
        approvals: [],
        reviewComments: formattedComments,
        auditLogs: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
