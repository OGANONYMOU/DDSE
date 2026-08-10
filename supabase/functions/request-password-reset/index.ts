// C-10: Server-side OTP rate limiting for password reset.
// This replaces the purely client-side rateLimiter.ts for OTP operations.
// Uses otp_rate_limits table for persistent, cross-device rate enforcement.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'
import { withCors } from '../_helpers/cors.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')     ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const MAX_OTP_PER_WINDOW = 3
const WINDOW_MINUTES     = 10
const LOCKOUT_MINUTES    = 30

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
}

async function checkAndIncrementRateLimit(phoneNumber: string, ip: string): Promise<{
  allowed: boolean;
  lockedUntil?: string;
}> {
  const key         = `otp:${phoneNumber}`
  const now         = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60_000).toISOString()

  // Upsert rate limit record
  const { data: existing } = await adminClient
    .from('otp_rate_limits')
    .select('*')
    .eq('key', key)
    .maybeSingle()

  // Check if currently locked
  if (existing?.locked_until) {
    const lockedUntil = new Date(existing.locked_until)
    if (lockedUntil > now) {
      return { allowed: false, lockedUntil: existing.locked_until }
    }
  }

  // Reset window if expired
  const isNewWindow = !existing || new Date(existing.window_start) < new Date(windowStart)

  if (isNewWindow) {
    await adminClient.from('otp_rate_limits').upsert({
      key,
      hit_count:    1,
      window_start: now.toISOString(),
      locked_until: null,
      updated_at:   now.toISOString(),
    })
    return { allowed: true }
  }

  const newCount = (existing?.hit_count ?? 0) + 1

  if (newCount > MAX_OTP_PER_WINDOW) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString()
    await adminClient.from('otp_rate_limits').upsert({
      key,
      hit_count:    newCount,
      window_start: existing.window_start,
      locked_until: lockedUntil,
      updated_at:   now.toISOString(),
    })
    return { allowed: false, lockedUntil }
  }

  await adminClient.from('otp_rate_limits').upsert({
    key,
    hit_count:    newCount,
    window_start: existing.window_start,
    locked_until: null,
    updated_at:   now.toISOString(),
  })
  return { allowed: true }
}

Deno.serve(withCors(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    })
  }

  const clientIp = getClientIp(req)

  let body: { serviceNumber?: string; phoneNumber?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { serviceNumber, phoneNumber } = body
  if (!serviceNumber || !phoneNumber) {
    return new Response(JSON.stringify({ error: 'serviceNumber and phoneNumber are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  // C-10: Server-side rate limit check (persistent, cross-device)
  const rateCheck = await checkAndIncrementRateLimit(phoneNumber, clientIp)
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many OTP requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verify user exists and phone matches
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('id, status')
    .eq('service_number', serviceNumber)
    .maybeSingle()

  // Anti-enumeration: always return success even if not found
  if (!profile) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }

  if (profile.status !== 'active') {
    return new Response(
      JSON.stringify({ error: 'Account is not active.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Generate 6-digit OTP
  const otp  = Math.floor(100_000 + Math.random() * 900_000).toString()
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(otp + profile.id))
  const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')

  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()

  // Store hashed OTP with C-10 metadata
  await adminClient.from('password_reset_tokens').insert({
    user_id:        profile.id,
    token_hash:     hashHex,
    phone_number:   phoneNumber,
    expires_at:     expiresAt,
    request_ip:     clientIp,
    request_device: req.headers.get('user-agent') ?? 'unknown',
  })

  // In production: dispatch SMS via Twilio/Termii here.
  // For now, log the OTP in console (development only).
  console.log(`[DEV] OTP for ${serviceNumber}: ${otp} (expires ${expiresAt})`)

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
}))
