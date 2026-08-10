// Shared CORS handling for all DDSE edge functions.
//
// Supabase Edge Functions do not get CORS headers for free — each function's
// response (including the OPTIONS preflight) must set them explicitly, or the
// browser blocks the request before the app ever sees a response. Wrap every
// handler with `withCors()` so every response path (success, error, thrown
// exception) gets the headers without having to touch each `new Response(...)`
// call site individually.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

export function withCors(
  handler: (req: Request) => Promise<Response> | Response
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const response = await handler(req)
    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value)
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
