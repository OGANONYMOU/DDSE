# Legacy Backend Notice

The `server/` folder is no longer the live operational backend for DDSE.

Active production direction:
- Frontend: Vite/React app in `src/`
- Live backend and datastore: Convex functions and schema in `convex/`

Why this still exists:
- historical foundation work
- isolated reference code and non-live tests

Guardrails:
- do not wire new product logic to `server/`
- do not use `server/` auth or persistence as runtime fallback
- all live auth, registration, inspection, evidence, dashboard, and audit behavior must go through Convex
