# DDSE Localhost Setup

## Known-Good Local Run Path

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `VITE_CONVEX_URL`
   - `VITE_CONVEX_SITE_URL`
   - `CONVEX_DEPLOYMENT`
   - `APP_ORIGIN=http://localhost:5173`
3. For localhost OTP flows, set:
   - `DDSE_ENABLE_DEV_OTP_PREVIEW=true`
   - `VITE_ENABLE_DEV_OTP_PREVIEW=true`
4. Run `npm install`
5. Run `npm run check:env`
6. In terminal 1, run `npm run convex:dev`
7. In terminal 2, run `npm run dev`

## Expected Local Behavior

- The app loads without a blank screen.
- Missing config is shown as a readable configuration error instead of a crash loop.
- Registration works end-to-end.
- OTP flows work with preview codes when `DDSE_ENABLE_DEV_OTP_PREVIEW=true`.
- Privileged registrations remain pending approval.
- Sign-in creates an HttpOnly session cookie through the Convex HTTP session broker.
- Session restore works after reload.
- Command dashboard loads and inspection creation/detail views work.

## Localhost Auth Notes

- DDSE no longer depends on browser-stored session tokens.
- Secure session transport now uses a Convex HTTP broker with an HttpOnly cookie on the Convex site origin.
- Browser JavaScript does not read the session token directly.
- Session inventory, revoke-one, revoke-other, and logout remain available.

## Local Verification Commands

- `npm run check:env`
- `npm test`
- `npm run dev`
- `npm run convex:dev`
- `npm run test:e2e`

## E2E Preconditions

`npm run test:e2e` expects:

- the frontend to be running on `http://localhost:5173`
- Convex dev to be running
- `DDSE_E2E_ADMIN_APPOINTMENT` and `DDSE_E2E_ADMIN_PASSWORD` if approval-gated flows should be exercised automatically

## Production Safety

- Keep `DDSE_ENABLE_DEV_OTP_PREVIEW=false` outside localhost development.
- Configure `OTP_DELIVERY_WEBHOOK_URL` for non-local environments.
- Do not replace Convex business logic with a separate backend. The HTTP broker is a session transport layer only.
