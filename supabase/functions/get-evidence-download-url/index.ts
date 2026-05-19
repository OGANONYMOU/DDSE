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

    const url = new URL(req.url)
    const evidenceId = url.searchParams.get('evidenceId')
    const expiresIn = parseInt(url.searchParams.get('expiresIn') ?? '3600', 10)

    if (!evidenceId) {
      return new Response(
        JSON.stringify({ error: 'Missing evidenceId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: record, error: queryError } = await supabase
      .from('evidence')
      .select('storage_path')
      .eq('id', evidenceId)
      .single()

    if (queryError || !record) {
      return new Response(
        JSON.stringify({ error: 'Evidence not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await supabase.storage
      .from('evidence')
      .createSignedUrl(record.storage_path, expiresIn)

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: error?.message ?? 'Could not generate download URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ url: data.signedUrl }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
