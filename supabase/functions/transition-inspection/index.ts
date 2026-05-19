import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

Deno.serve(async (req) => {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { inspectionId, toStatus, comments } = await req.json()

    if (!inspectionId || !toStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing inspectionId or toStatus' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: inspection, error: fetchError } = await supabase
      .from('inspections')
      .select('status, created_by')
      .eq('id', inspectionId)
      .single()

    if (fetchError || !inspection) {
      return new Response(
        JSON.stringify({ error: 'Inspection not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_platform_owner')
      .eq('id', user.id)
      .single()

    const isOwner = inspection.created_by === user.id
    const isAdmin = profile?.is_platform_owner === true

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error: updateError } = await supabase
      .from('inspections')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', inspectionId)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (comments) {
      await supabase.from('review_comments').insert({
        inspection_id: inspectionId,
        user_id: user.id,
        body: comments,
      })
    }

    return new Response(
      JSON.stringify({ success: true, status: toStatus }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
