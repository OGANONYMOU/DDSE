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

    const contentType = req.headers.get('content-type') ?? ''

    let inspectionId: string
    let sectionId: string | null = null
    let itemId: string | null = null
    let fileName: string
    let fileContentType: string
    let sizeBytes: number
    let fileBuffer: ArrayBuffer | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'Missing file in form data' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      inspectionId = formData.get('inspectionId') as string
      sectionId = formData.get('sectionId') as string | null
      itemId = formData.get('itemId') as string | null
      fileName = file.name
      fileContentType = file.type
      sizeBytes = file.size
      fileBuffer = await file.arrayBuffer()
    } else {
      const payload = await req.json()
      inspectionId = payload.inspectionId
      sectionId = payload.sectionId || null
      itemId = payload.itemId || null
      fileName = payload.fileName
      fileContentType = payload.contentType
      sizeBytes = payload.sizeBytes
    }

    if (!inspectionId || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: inspectionId, fileName' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const timestamp = Date.now()
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `evidence/${inspectionId}/${timestamp}-${safeName}`

    if (fileBuffer) {
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(storagePath, fileBuffer, { contentType: fileContentType })

      if (uploadError) {
        return new Response(
          JSON.stringify({ error: uploadError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const { data, error } = await supabase
      .from('evidence')
      .insert({
        inspection_id: inspectionId,
        section_id: sectionId,
        item_id: itemId,
        file_name: fileName,
        content_type: fileContentType,
        size_bytes: sizeBytes,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, storagePath }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
