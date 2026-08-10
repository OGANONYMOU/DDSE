// C-9: Corrective action close now requires verified_by — enforced server-side.
// Supports both create and close operations via action field.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action = 'create' } = body

    // ── Create a new corrective action ──────────────────────────────────────
    if (action === 'create') {
      const { inspectionId, title, detail, stopWorkIssued } = body

      if (!inspectionId || !title) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: inspectionId, title' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('corrective_actions')
        .insert({
          inspection_id:    inspectionId,
          title,
          detail:           detail || null,
          stop_work_issued: stopWorkIssued ?? false,
        })
        .select()
        .single()

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // C-9: Close a corrective action — requires verification ─────────────────
    if (action === 'close') {
      const {
        correctiveActionId,
        verificationEvidence,
        verificationNotes,
        // verifiedBy is always set to the authenticated user — client cannot override
      } = body

      if (!correctiveActionId) {
        return new Response(
          JSON.stringify({ error: 'correctiveActionId is required to close an action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (!verificationEvidence) {
        return new Response(
          JSON.stringify({ error: 'Corrective action cannot be closed without verification evidence.' }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('corrective_actions')
        .update({
          status:                'closed',
          completed_by:          user.id,
          completed_at:          new Date().toISOString(),
          verification_evidence: verificationEvidence,
          verified_by:           user.id,           // server-side — cannot be spoofed
          verified_at:           new Date().toISOString(),
          verification_notes:    verificationNotes ?? null,
        })
        .eq('id', correctiveActionId)

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
