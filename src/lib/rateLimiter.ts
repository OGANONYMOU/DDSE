// ─── Client-side sliding-window rate limiter ─────────────────────────────────
//
// This is a UX-layer defence that prevents accidental hammer-clicking and gives
// clear feedback before a request hits the server.
//
// TRUE rate limiting must live server-side:
//   • Supabase Auth has built-in per-IP limits on /auth/v1/token
//   • Add middleware in each Edge Function using the pattern below
//
// ─── Edge Function server-side pattern ───────────────────────────────────────
//   const ip   = req.headers.get('x-forwarded-for') ?? 'unknown';
//   const key  = `rate:${fnName}:${ip}`;
//   const hits = parseInt(await kv.get(key) ?? '0', 10);
//   if (hits >= MAX) return new Response('Too Many Requests', { status: 429 });
//   await kv.set(key, hits + 1, { ex: WINDOW_SECONDS });
// ─────────────────────────────────────────────────────────────────────────────

const store = new Map<string, number[]>();

// ─── Core check ───────────────────────────────────────────────────────────────

export function checkRateLimit(
  key:      string,
  max:      number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now  = Date.now();
  const prev = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (prev.length >= max) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - prev[0])) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  store.set(key, [...prev, now]);
  return { allowed: true, retryAfterSeconds: 0 };
}

// ─── Convenience helper ───────────────────────────────────────────────────────

export function formatRetryTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.ceil(seconds / 60)}m`;
}

// ─── Preconfigured limiters ───────────────────────────────────────────────────
// Call these at the top of each API function before the Supabase request.

/** Max 5 sign-in attempts per service number per 15 minutes. */
export function checkSignInLimit(serviceNumber: string) {
  return checkRateLimit(`signin:${serviceNumber}`, 5, 15 * 60 * 1000);
}

/** Max 3 OTP requests per phone number per 10 minutes. */
export function checkOtpRequestLimit(phoneNumber: string) {
  return checkRateLimit(`otp_req:${phoneNumber}`, 3, 10 * 60 * 1000);
}

/** Max 3 registration attempts per service number per 30 minutes. */
export function checkRegistrationLimit(serviceNumber: string) {
  return checkRateLimit(`register:${serviceNumber}`, 3, 30 * 60 * 1000);
}

/** Clear a key — useful in tests or after a successful action. */
export function resetLimit(key: string) {
  store.delete(key);
}
