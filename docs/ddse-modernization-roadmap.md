# DDSE Modernization Roadmap

## Phase 1: Architecture and Schema Redesign
- Active live backend direction is now Convex under `convex/`, with the older `server/` path explicitly isolated as legacy-only.
- Added Convex schema, auth flows, dashboard queries, inspection workflows, evidence metadata, and audit structures as the authoritative operational path.
- Mapping to DDSE document:
  - Training establishments, JTF readiness, general security, armoury, magazine, AFSB, civil projects, construction QA, and hazard/safety are now first-class module definitions rather than vague generic forms.
- Security implications:
  - Replaces frontend-only trust assumptions with backend permission enforcement and classification-aware module visibility through Convex.
- Remaining risks:
  - Database migration execution, real seed data import, malware scanning, and file encryption still need environment deployment and integration.
- Next steps:
  - Provision PostgreSQL, execute migrations, load baseline reference data, and add object storage plus malware scanning.

## Phase 2: Auth and Security Hardening
- Added secure Convex-backed auth primitives: hashed passwords, OTP verification challenges, privileged-role approval gating, session tables, audit logging, and role-aware session restoration.
- Mapping to DDSE document:
  - Supports the required roles, server-side authorization, immutable audit trails, and MFA-aware login flow for sensitive roles.
- Security implications:
  - Removes localStorage-based trust from the core login path and centralizes access enforcement on the live Convex backend.
- Remaining risks:
  - TOTP or hardware key verification is represented in the contract but still needs production integration with a real second-factor provider.
- Next steps:
  - Add TOTP enrollment, refresh token rotation endpoint, anomaly detection, session management UI, and admin verification for high-risk actions.

## Phase 3: Inspection Engine and Checklist Framework
- Added DDSE module catalog definitions that preserve the document’s operational structure by section and item counts.
- Mapping to DDSE document:
  - Each major section in your prompt now maps to a dedicated module with sections prepared for template-backed inspections.
- Security implications:
  - Restricted modules such as armoury and magazine are classification-tagged for backend visibility controls.
- Remaining risks:
  - Template item-level scoring rules, weighted scoring, approval workflows, and evidence chains still need CRUD endpoints and persistence services.
- Next steps:
  - Persist template sections and items in the database, add inspection create/update/submit/approve APIs, and add evidence upload pipeline controls.

## Phase 4: Operational Modules
- Established the module taxonomy and data backbone needed for command dashboarding and module-specific workflows.
- Mapping to DDSE document:
  - The backend catalog explicitly covers training establishments, JTF readiness, general security, armoury, magazine, AFSB screening, civil projects, construction QA, and hazard/safety.
- Security implications:
  - Restricted modules are segregated before UI rendering, not just hidden client-side.
- Remaining risks:
  - Individual module workflows, corrective actions, and approvals require dedicated endpoints and UI forms.
- Next steps:
  - Build server CRUD and frontend task flows for each module, starting with hazard/safety, JTF readiness, and civil project monitoring.

## Phase 5: Reporting, Notifications, Audit, and Analytics
- Added audit log persistence and command summary endpoints as the initial backbone for reporting and analytics.
- Mapping to DDSE document:
  - Supports command dashboards, approval visibility, corrective action tracking, and restricted access monitoring.
- Security implications:
  - Critical actions are prepared for actor, role, timestamp, correlation ID, and change payload capture.
- Remaining risks:
  - PDF export, notification routing, analytics jobs, and access anomaly detection are not yet implemented.
- Next steps:
  - Add background jobs, report generation, export watermarking, and notification escalation rules.

## Phase 6: Go-live Hardening and Deployment Readiness
- Added `.env.example`, server startup separation, and an explicit modernization roadmap to support environment separation and operational rollout.
- Mapping to DDSE document:
  - Supports the go-live readiness requirement with backend configuration, migration artifacts, and phased rollout guidance.
- Security implications:
  - Secrets are environment-driven and no longer embedded in the frontend path.
- Remaining risks:
  - CI/CD, backup/restore automation, penetration tests, and incident response drills still need implementation in the target hosting environment.
- Next steps:
  - Add deployment manifests, observability integrations, backup jobs, QA gates, and security regression automation.
