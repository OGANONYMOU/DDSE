import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

type TemplateItem = {
  code: string
  prompt: string
  responseType: 'yes_no' | 'score_5' | 'narrative' | 'checklist'
  weight: number
}

type TemplateSection = {
  title: string
  items: TemplateItem[]
}

const RESPONSE_TYPES = new Set(['yes_no', 'score_5', 'narrative', 'checklist'])

function cleanTemplate(raw: unknown): { sections: TemplateSection[] } {
  const source = raw as { sections?: unknown[] } | null
  if (!source || !Array.isArray(source.sections)) {
    throw new Error('Template must include a sections array.')
  }

  return {
    sections: source.sections.map((sectionRaw, sectionIndex) => {
      const section = sectionRaw as { title?: unknown; items?: unknown[] }
      const title = String(section.title ?? '').trim()
      if (!title) throw new Error(`Section ${sectionIndex + 1} needs a title.`)
      if (!Array.isArray(section.items)) throw new Error(`Section "${title}" needs an items array.`)

      return {
        title,
        items: section.items.map((itemRaw, itemIndex) => {
          const item = itemRaw as Record<string, unknown>
          const prompt = String(item.prompt ?? '').trim()
          if (!prompt) throw new Error(`Question ${itemIndex + 1} in "${title}" needs question text.`)

          const responseType = String(item.responseType ?? 'yes_no')
          if (!RESPONSE_TYPES.has(responseType)) {
            throw new Error(`Question ${itemIndex + 1} in "${title}" has an invalid response type.`)
          }

          const weight = Number(item.weight ?? 10)
          if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
            throw new Error(`Question ${itemIndex + 1} in "${title}" must have a weight from 0 to 100.`)
          }

          return {
            code: String(item.code ?? itemIndex + 1).trim() || String(itemIndex + 1),
            prompt,
            responseType: responseType as TemplateItem['responseType'],
            weight: Math.round(weight),
          }
        }),
      }
    }),
  }
}

Deno.serve(withCors(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
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
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { moduleCode, template } = await req.json()
    if (!moduleCode) {
      return new Response(JSON.stringify({ error: 'Missing moduleCode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_platform_owner, role_code')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const canManageTemplates = profile.is_platform_owner === true ||
      profile.role_code === 'platform_owner' ||
      profile.role_code === 'super_admin'

    if (!canManageTemplates) {
      return new Response(JSON.stringify({ error: 'Only super admins can update inspection questions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cleanedTemplate = cleanTemplate(template)

    const { data: currentModule, error: currentError } = await supabase
      .from('modules')
      .select('version, template_edit_granted')
      .eq('code', moduleCode)
      .maybeSingle()

    if (currentError) {
      return new Response(JSON.stringify({ error: currentError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!currentModule) {
      return new Response(JSON.stringify({ error: 'Module not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Enforce server-side grant: platform owners can always update templates.
    // Super-admins must have `template_edit_granted` set true on the module.
    if (profile.role_code === 'super_admin' && currentModule.template_edit_granted !== true && profile.is_platform_owner !== true) {
      return new Response(JSON.stringify({ error: 'Editing this module template is not currently granted.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase
      .from('modules')
      .update({
        template: cleanedTemplate,
        version: Number(currentModule.version ?? 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('code', moduleCode)
      .select('code, title, description, classification, version, updated_at, template')
      .maybeSingle()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Module not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      module: {
        id: data.code,
        moduleCode: data.code,
        title: data.title,
        description: data.description ?? '',
        classification: data.classification ?? 'general',
        version: data.version ?? 1,
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
        template: data.template ?? { sections: [] },
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}))
