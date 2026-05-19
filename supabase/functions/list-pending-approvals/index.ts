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
        JSON.stringify([]),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: approvals, error } = await supabase
      .from('registration_approvals')
      .select(`
        id,
        user_id,
        requested_role_code,
        directorate_code,
        status,
        created_at,
        user_profiles!inner(full_name, service_number)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formatted = (approvals || []).map((a: any) => ({
      approvalId: a.id,
      userId: a.user_id,
      fullName: a.user_profiles?.full_name || '',
      serviceNumber: a.user_profiles?.service_number || '',
      requestedRoleCode: a.requested_role_code,
      directorateCode: a.directorate_code,
      status: a.status,
      createdAt: a.created_at,
    }))

    return new Response(JSON.stringify(formatted), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
