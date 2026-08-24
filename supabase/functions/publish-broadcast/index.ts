import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')     ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(withCors(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // Validate caller session
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userErr } = await callerClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const callerId = userData.user.id

  try {
    const body = await req.json()
    const broadcastId = String(body.broadcastId ?? '')
    const subject = String(body.subject ?? '')
    const message = String(body.body ?? '')
    const priority = String(body.priority ?? 'NORMAL')
    const targetRoles = Array.isArray(body.targetRoles) ? body.targetRoles.map(String) : []

    // Ensure caller has permission to publish broadcasts (admins, commanders, directors, super_admin/platform_owner)
    const { data: profile } = await callerClient
      .from('user_profiles')
      .select('role_code, is_platform_owner')
      .eq('id', callerId)
      .maybeSingle()

    const role = (profile as any)?.role_code ?? null
    const isPlatformOwner = (profile as any)?.is_platform_owner === true
    const allowed = isPlatformOwner || ['admin','commander','director','super_admin','platform_owner'].includes(role)
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Resolve recipients: all active users in the target roles (or all active users if no roles specified)
    let usersQuery = adminClient.from('user_profiles').select('id').eq('status', 'active')
    if (targetRoles.length > 0) {
      usersQuery = usersQuery.in('role_code', targetRoles)
    }
    const { data: users, error: usersErr } = await usersQuery
    if (usersErr) throw usersErr

    const rows = (users ?? []).map((u: any) => ({
      recipient_id: u.id,
      type: 'alert',
      priority: priority === 'URGENT' ? 'CRITICAL' : 'MEDIUM',
      title: subject,
      body: message,
      entity_type: 'broadcast',
      entity_id: broadcastId || null,
    }))

    if (rows.length > 0) {
      // Bulk insert notifications
      await adminClient.from('notifications').insert(rows)
    }

    // Optionally create acknowledgement requirements for URGENT broadcasts
    if (priority === 'URGENT' && rows.length > 0) {
      const ackRows = (users ?? []).map((u: any) => ({
        broadcast_id: broadcastId || `bc-${Date.now()}`,
        recipient_id: u.id,
        required_by: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
        status: 'pending',
      }))
      await adminClient.from('broadcast_acknowledgements').insert(ackRows)
    }

    return new Response(JSON.stringify({ success: true, recipients: (users ?? []).length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}))
