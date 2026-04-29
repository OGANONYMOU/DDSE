# Localhost Bootstrap and Platform Owner Setup

This repository uses a secure bootstrap workflow for the first `platform_owner` account. The initial owner account is always created with appointment number `ANONYMOUS` and must be bootstrapped from a local environment variable.

## Required environment variables

Create a local env file such as `.env.local` and set:

```env
VITE_CONVEX_URL=http://localhost:8080
DDSE_BOOTSTRAP_OWNER_PASSWORD=YourSecureBootstrapPassword123!
VITE_DDSE_BOOTSTRAP_OWNER_PASSWORD=YourSecureBootstrapPassword123!
DDSE_ENABLE_DEV_OTP_PREVIEW=true
```

If you prefer the legacy fallback name, `BOOTSTRAP_PASSWORD` is also accepted for non-browser bootstrap helpers.

> Do not commit `.env.local` or any file containing the bootstrap password.

## Bootstrap process

1. Start the local Convex server and the frontend app.
2. Run the bootstrap helper:

```bash
node scripts/bootstrap-platform.js
```

3. If successful, the script will print the new Platform Owner `userId` and the login instructions.
4. Sign in as `ANONYMOUS` with the bootstrap password you configured.
5. The first sign-in will:
   - require OTP verification
   - force a password change
   - finalize MFA enrollment

6. After the first login, delete `DDSE_BOOTSTRAP_OWNER_PASSWORD` from your local env file.

## Security controls

- Platform owner initialization is only possible through the bootstrap action.
- The bootstrap password is read from `DDSE_BOOTSTRAP_OWNER_PASSWORD` or fallback `BOOTSTRAP_PASSWORD`.
- The initial owner account is created with:
  - `appointmentNumber: ANONYMOUS`
  - `activeRoleCode: platform_owner`
  - `mustChangePassword: true`
  - `mfaRequired: true`
  - `mfaEnrolled: false`
- The account cannot be modified through standard registration approval paths.
- The first login is gated so the owner must change the bootstrap password before regular access.

## Developer notes

- For local OTP preview, ensure dev OTP preview is enabled in your environment.
- This flow is designed for localhost development and secure bootstrap only.
