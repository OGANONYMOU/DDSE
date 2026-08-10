-- =============================================================================
-- DDSE Migration: audit_logs table
--
-- The frontend audit trail (src/services/auditLogger.ts, AuditLogPage,
-- observability health check) has always written/read `public.audit_logs`,
-- but the table was never created in any migration — every write 404'd
-- (silently swallowed by the caller's try/catch, but visible as a console
-- error on effectively every page load once a user is signed in).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action      text        NOT NULL,
  actor_id    uuid        REFERENCES auth.users(id),
  actor_role  text,
  entity_type text,
  entity_id   text,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status      text        NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON public.audit_logs(actor_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may append audit events (fire-and-forget trail of
-- their own actions); only elevated roles may read the trail.
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY audit_logs_read ON public.audit_logs
  FOR SELECT USING (public.is_admin_or_above());
