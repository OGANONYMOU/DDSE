import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
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
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { moduleCode, grant } = await req.json()
    if (!moduleCode || typeof grant !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Missing moduleCode or grant boolean' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_platform_owner, role_code')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Only platform_owner or super_admin may grant/revoke edit rights
    if (!(profile.is_platform_owner === true || profile.role_code === 'platform_owner' || profile.role_code === 'super_admin')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updates: Record<string, unknown> = {
      template_edit_granted: grant,
      template_edit_granted_by: grant ? user.id : null,
      template_edit_granted_at: grant ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('code', moduleCode)
      .select('code, title, template_edit_granted, template_edit_granted_by, template_edit_granted_at')
      .maybeSingle()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Module not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Record an audit log for the grant/revoke action; fire-and-forget.
    try {
      await supabase.from('audit_logs').insert({
        action: grant ? 'module.template_grant' : 'module.template_revoke',
        entity_type: 'module',
        entity_id: data.code,
        actor_id: user.id,
        actor_role: profile.role_code ?? null,
        metadata: { module: data.code, title: data.title, granted: grant },
        created_at: new Date().toISOString(),
        status: 'success',
      }).throwOnError();
    } catch (e) {
      // don't fail the main request if audit write fails
    }

    return new Response(JSON.stringify({ success: true, module: data }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}))
