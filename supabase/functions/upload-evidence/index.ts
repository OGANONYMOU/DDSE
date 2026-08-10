// I-9: SHA-256 hash computed server-side before writing to DB.
// I-13: Version tracking — supersedes_id for document revision control.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
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
        status: 401, headers: { 'Content-Type': 'application/json' },
      })
    }

    const contentType = req.headers.get('content-type') ?? ''

    let inspectionId: string
    let sectionId: string | null = null
    let itemId: string | null = null
    let fileName: string
    let fileContentType: string
    let sizeBytes: number
    let fileBuffer: ArrayBuffer | null = null
    let supersedesId: string | null = null
    let documentTitle: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return new Response(JSON.stringify({ error: 'Missing file in form data' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        })
      }
      inspectionId   = formData.get('inspectionId') as string
      sectionId      = formData.get('sectionId')    as string | null
      itemId         = formData.get('itemId')        as string | null
      supersedesId   = formData.get('supersedesId') as string | null
      documentTitle  = formData.get('documentTitle')as string | null
      fileName       = file.name
      fileContentType = file.type
      sizeBytes      = file.size
      fileBuffer     = await file.arrayBuffer()
    } else {
      const p        = await req.json()
      inspectionId   = p.inspectionId
      sectionId      = p.sectionId      || null
      itemId         = p.itemId         || null
      supersedesId   = p.supersedesId   || null
      documentTitle  = p.documentTitle  || null
      fileName       = p.fileName
      fileContentType = p.contentType
      sizeBytes      = p.sizeBytes
    }

    if (!inspectionId || !fileName) {
      return new Response(JSON.stringify({ error: 'Missing required fields: inspectionId, fileName' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // I-9: Compute SHA-256 integrity hash before storing
    let sha256Hash: string | null = null
    if (fileBuffer) {
      sha256Hash = await computeSHA256(fileBuffer)
    }

    const timestamp   = Date.now()
    const safeName    = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `evidence/${inspectionId}/${timestamp}-${safeName}`

    if (fileBuffer) {
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(storagePath, fileBuffer, { contentType: fileContentType })

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // I-13: Determine version number from superseded document
    let version = 1
    if (supersedesId) {
      const { data: prev } = await supabase
        .from('evidence')
        .select('version')
        .eq('id', supersedesId)
        .maybeSingle()
      if (prev) version = (Number(prev.version) || 0) + 1
    }

    const { data, error } = await supabase
      .from('evidence')
      .insert({
        inspection_id:  inspectionId,
        section_id:     sectionId,
        item_id:        itemId,
        file_name:      fileName,
        content_type:   fileContentType,
        size_bytes:     sizeBytes,
        storage_path:   storagePath,
        sha256_hash:    sha256Hash,    // I-9: integrity hash
        version,                       // I-13: version number
        supersedes_id:  supersedesId,  // I-13: link to previous version
        document_title: documentTitle,
        uploaded_by:    user.id,
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, storagePath, sha256Hash, version }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
