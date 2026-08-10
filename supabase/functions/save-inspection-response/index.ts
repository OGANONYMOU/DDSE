// C-8: responded_by attributed server-side.
// I-7: After every response save, recalculate and persist final_score + risk_band.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

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
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()

    // C-8: responded_by is the authenticated user — never from client payload
    const { error: upsertError } = await supabase
      .from('inspection_responses')
      .upsert({
        inspection_id:     payload.inspectionId,
        item_id:           payload.itemId,
        response_value:    payload.responseValue,
        numeric_score:     payload.numericScore,
        severity:          payload.severity         ?? null,
        immediate_risk:    payload.immediateRisk,
        remarks:           payload.remarks           ?? null,
        responded_by:      user.id,
        responded_at:      new Date().toISOString(),
        submission_source: payload.submissionSource  ?? 'web',
        response_version:  1,
      })

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // I-7: Recalculate and persist inspection score after every response
    const { data: responses } = await serviceClient
      .from('inspection_responses')
      .select('numeric_score, inspection_items(weight, response_type)')
      .eq('inspection_id', payload.inspectionId)

    if (responses && responses.length > 0) {
      let totalWeight = 0
      let earnedWeight = 0

      for (const r of responses) {
        const item = (r as Record<string, unknown>).inspection_items as Record<string, unknown> | null
        const weight = Number(item?.weight ?? 1)
        const score  = Number((r as Record<string, unknown>).numeric_score ?? 0)
        const rtype  = String(item?.response_type ?? 'yes_no')

        if (weight > 0) {
          totalWeight += weight
          if (rtype === 'yes_no') {
            earnedWeight += score > 0 ? weight : 0
          } else if (rtype === 'score_5') {
            earnedWeight += (score / 5) * weight
          } else {
            earnedWeight += score > 0 ? weight : 0
          }
        }
      }

      const finalScore = totalWeight > 0
        ? Math.round((earnedWeight / totalWeight) * 100 * 100) / 100
        : 0

      const riskBand = finalScore >= 90 ? 'A'
        : finalScore >= 75 ? 'B'
        : finalScore >= 60 ? 'C'
        : finalScore >= 45 ? 'D'
        : 'F'

      await serviceClient
        .from('inspections')
        .update({
          final_score:      finalScore,
          risk_band:        riskBand,
          score_updated_at: new Date().toISOString(),
        })
        .eq('id', payload.inspectionId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
