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

    const url = new URL(req.url)
    const moduleCode = url.searchParams.get('moduleCode')

    let query = supabase
      .from('inspections')
      .select(
        `id, module_code, title, directorate_code, status, created_by, created_at,
         modules(code, title)`
      )

    if (moduleCode) {
      query = query.eq('module_code', moduleCode)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const inspections = data.map((insp: any) => ({
      _id: insp.id,
      moduleCode: insp.module_code,
      title: insp.title,
      status: insp.status,
      directorateCode: insp.directorate_code,
      createdBy: insp.created_by,
      createdAt: insp.created_at,
    }))

    return new Response(JSON.stringify(inspections), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
