# DDSE Live Architecture

## Active Operational Path

- Frontend runtime: `src/`
- Live backend, data model, workflow logic, audit, and evidence controls: `convex/`
- Session transport: Convex HTTP broker routes in `convex/http.js`
- Deployment posture: Convex is the only supported live backend path

## Explicit Non-Live Areas

- `legacy/server/`
- `legacy/sql/`

These directories are retained only for historical reference. They are not valid runtime fallbacks for:

- authentication
- persistence
- inspection workflows
- dashboard queries
- evidence handling
- audit logging

## Security Boundaries

- All live sessions, approvals, dashboard summaries, inspection access, and evidence downloads must resolve through Convex functions.
- The HTTP broker exists only to move session handling to HttpOnly cookies and forward requests into Convex logic. It is not a second business backend.
- Role membership alone is not sufficient for access. Live access is scoped by organization, module, classification, and record ownership or assignment.
- Restricted modules (`armoury`, `magazine`, `general_security`, `jtf_readiness`) require backend authorization checks on every query and evidence access path.

## Operational Guardrails

- Do not wire new runtime code to any Express or PostgreSQL path.
- Do not add frontend-only security checks as substitutes for backend authorization.
- Do not reintroduce demo or placeholder data into live dashboards.
