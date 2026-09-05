import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

// Admin-driven personnel creation. Only callable by super_admin / platform_owner.
//
// This intentionally does NOT use the public supabase.auth.signUp() flow that
// the self-registration form uses: calling signUp() from an already-authenticated
// browser session replaces that session with the newly created (unrelated)
// user, effectively signing the admin out. Creating the auth user server-side
// via the Admin API avoids touching the caller's session entirely.

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')             ?? ''
const ANON_KEY          = Deno.env.get('SUPABASE_ANON_KEY')        ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function serviceNumberToEmail(serviceNumber: string) {
  return `${serviceNumber.trim().toLowerCase()}@ddse.local`
}

function generateTemporaryPassword() {
  // 16 random bytes, base64url — comfortably clears the 8-char minimum and
  // isn't guessable/reused across new hires like the previous hardcoded default.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 20) + 'Aa1!'
}

Deno.serve(withCors(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // Identify the caller using their own JWT (never trust a client-asserted role).
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: callerAuth, error: callerAuthError } = await callerClient.auth.getUser()
  if (callerAuthError || !callerAuth?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const { data: callerProfile } = await callerClient
    .from('user_profiles')
    .select('role_code, is_platform_owner')
    .eq('id', callerAuth.user.id)
    .single()

  const isAuthorized = callerProfile?.is_platform_owner === true || callerProfile?.role_code === 'super_admin'
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Super admin access required' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const body = await req.json()
    const fullName        = String(body.fullName ?? '').trim()
    const serviceNumber   = String(body.serviceNumber ?? '').trim()
    const rankCode        = String(body.rankCode ?? '').trim()
    const directorateCode = String(body.directorateCode ?? '').trim()
    const roleCode        = String(body.roleCode ?? 'staff').trim()
    const email            = String(body.email ?? '').trim()
    const phoneNumber      = String(body.phoneNumber ?? '').trim()

    if (!fullName || !serviceNumber || !rankCode || !directorateCode) {
      return new Response(JSON.stringify({ error: 'fullName, serviceNumber, rankCode and directorateCode are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const temporaryPassword = generateTemporaryPassword()
    const authEmail = serviceNumberToEmail(serviceNumber)

    const { data: created, error: createError } = await (adminClient.auth as any).admin.createUser({
      email: authEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        fullName,
        email,
        serviceNumber,
        phoneNumber,
        rankCode,
        directorateCode,
        roleCode,
        status: 'active',
        mfaRequired: false,
        mfaEnrolled: false,
        mustChangePassword: true,
        isPlatformOwner: false,
      },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const userId = created?.user?.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User creation did not return an id' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // The on_auth_user_created trigger inserts the user_profiles row from the
    // metadata above (including the new rank_code/email/phone_number columns
    // and role_code/directorate_code), but hardcodes status='pending' and
    // must_change_password=false — admin-created accounts should be usable
    // immediately, with a forced password change on first sign-in.
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({ status: 'active', must_change_password: true })
      .eq('id', userId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(
      JSON.stringify({ success: true, userId, serviceNumber, temporaryPassword }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}))
