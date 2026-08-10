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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_platform_owner')
      .eq('id', user.user.id)
      .single()

    if (!profile?.is_platform_owner) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()

    const { error: updateError } = await supabase
      .from('registration_approvals')
      .update({
        status: payload.decision,
        decision_by: user.user.id,
        decision_notes: payload.notes || null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', payload.registrationApprovalId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If approved, update user role
    if (payload.decision === 'approved') {
      const { data: approval } = await supabase
        .from('registration_approvals')
        .select('user_id, requested_role_code')
        .eq('id', payload.registrationApprovalId)
        .single()

      if (approval) {
        await supabase
          .from('user_profiles')
          .update({ role_code: approval.requested_role_code, status: 'active' })
          .eq('id', approval.user_id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Approval processed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
