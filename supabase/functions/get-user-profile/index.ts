import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

interface UserProfile {
  id: string
  fullName: string
  serviceNumber: string
  roleCode: string
  directorateCode: string
  status: string
  mfaRequired: boolean
  mfaEnrolled: boolean
  mustChangePassword: boolean
  isPlatformOwner: boolean
}

Deno.serve(async (req) => {
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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const profile: UserProfile = {
      id: data.id,
      fullName: data.full_name,
      serviceNumber: data.service_number,
      roleCode: data.role_code,
      directorateCode: data.directorate_code,
      status: data.status,
      mfaRequired: data.mfa_required,
      mfaEnrolled: data.mfa_enrolled,
      mustChangePassword: data.must_change_password,
      isPlatformOwner: data.is_platform_owner,
    }

    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
