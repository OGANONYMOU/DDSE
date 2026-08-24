import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')     ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const DEV_CREATION_SECRET = Deno.env.get('DEV_CREATION_SECRET') ?? ''

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(withCors(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  // allow either service role or a short-lived creation secret
  const bearer = authHeader.replace(/^Bearer\s+/, '')
  if (bearer !== SERVICE_ROLE_KEY && DEV_CREATION_SECRET && bearer !== DEV_CREATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const body = await req.json()
    const email = String(body.email ?? '')
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '')

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing email, password or fullName' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Attempt to create an auth user via admin API
    let userId: string | null = null
    try {
      // @ts-ignore runtime method may exist
      const { data, error } = await (adminClient.auth as any).admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { fullName },
      })
      if (error) throw error
      userId = data?.user?.id ?? data?.id ?? null
    } catch (err) {
      // If admin.createUser isn't available in this runtime, log and continue to insert profile if possible
      console.warn('admin.createUser failed, will attempt profile upsert only', err)
    }

    // Upsert user_profiles row (service role bypasses RLS)
    const profileRow: Record<string, unknown> = {
      id: userId ?? null,
      full_name: fullName,
      email: email,
      service_number: 'DEV-0001',
      rank_code: 'developer',
      directorate_code: 'devops',
      role_code: 'super_admin',
      status: 'active',
      is_platform_owner: true,
      created_at: new Date().toISOString(),
    }

    // If we don't have a userId, let Supabase generate one by inserting without id (may fail if id required)
    if (!profileRow.id) delete profileRow.id

    const { data: upsertData, error: upsertError } = await adminClient
      .from('user_profiles')
      .upsert(profileRow)
      .select('id')
      .maybeSingle()

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const createdId = userId ?? upsertData?.id ?? null

    return new Response(JSON.stringify({ success: true, userId: createdId }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}))
