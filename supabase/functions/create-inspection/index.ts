// I-15: Snapshot the module's current version into inspection.template_version
// so in-progress inspections are locked to the template they started with.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

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

    const payload = await req.json()

    if (!payload.moduleCode || !payload.title || !payload.directorateCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: moduleCode, title, directorateCode' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // I-15: Read the module's current version + question template to snapshot into the inspection
    const { data: moduleData } = await supabase
      .from('modules')
      .select('code, version, template')
      .eq('code', payload.moduleCode)
      .maybeSingle()

    const templateVersion = moduleData?.version ?? 1

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        module_code:       payload.moduleCode,
        title:             payload.title,
        directorate_code:  payload.directorateCode,
        formation_code:    payload.formationCode    || null,
        unit_code:         payload.unitCode         || null,
        unit_id:           payload.unitId           || null,
        subject_name:      payload.subjectName      || null,
        subject_reference: payload.subjectReference || null,
        status:            'draft',
        created_by:        user.id,
        template_version:  templateVersion,  // I-15: locked at creation
      })
      .select('id')
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // Clone the module's question template into this inspection's own sections/items
    // so the officer sees the real evaluation checklist instead of a blank dossier.
    const templateSections: Array<{ title: string; items: Array<{ code: string; prompt: string; responseType: string; weight: number }> }> =
      moduleData?.template?.sections ?? []

    if (templateSections.length > 0) {
      const sectionRows = templateSections.map((section, sIdx) => ({
        id:             `${data.id}:s${sIdx}`,
        inspection_id:  data.id,
        title:          section.title,
        display_order:  sIdx,
      }))

      const { error: sectionsError } = await supabase.from('inspection_sections').insert(sectionRows)
      if (sectionsError) {
        return new Response(JSON.stringify({ error: `Inspection created, but failed to load its questions: ${sectionsError.message}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        })
      }

      const itemRows = templateSections.flatMap((section, sIdx) =>
        section.items.map((item, iIdx) => ({
          id:             `${data.id}:s${sIdx}:i${iIdx}`,
          section_id:     `${data.id}:s${sIdx}`,
          code:           item.code,
          prompt:         item.prompt,
          weight:         item.weight,
          response_type:  item.responseType,
        }))
      )

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase.from('inspection_items').insert(itemRows)
        if (itemsError) {
          return new Response(JSON.stringify({ error: `Inspection created, but failed to load its questions: ${itemsError.message}` }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, templateVersion }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
