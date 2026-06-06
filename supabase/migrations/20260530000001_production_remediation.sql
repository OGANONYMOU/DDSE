-- =============================================================================
-- DDSE Production Remediation Migration
-- Covers findings C-2 through C-10 from the pre-production security review.
-- Safe to run against a fresh or existing database (uses IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- ============================================================================
-- HELPER FUNCTIONS  (used by RLS policies below)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.my_role_code()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role_code FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_clearance()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE my_role_code()
    WHEN 'platform_owner'       THEN 6
    WHEN 'super_admin'          THEN 6
    WHEN 'director'             THEN 6
    WHEN 'commander'            THEN 5
    WHEN 'admin'                THEN 4
    WHEN 'armoury_officer'      THEN 4
    WHEN 'auditor'              THEN 4
    WHEN 'engineering_officer'  THEN 3
    WHEN 'safety_officer'       THEN 3
    WHEN 'logistics_officer'    THEN 3
    WHEN 'inspection_officer'   THEN 2
    WHEN 'staff'                THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_platform_owner = true)
    OR my_role_code() IN ('super_admin','director','commander','admin','auditor')
  );
$$;

CREATE OR REPLACE FUNCTION public.my_directorate()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT directorate_code FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Auto-update trigger function (reusable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- C-2: PROJECTS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code     text        NOT NULL UNIQUE,
  title            text        NOT NULL,
  type             text        NOT NULL CHECK (type IN ('New Construction','Rehabilitation','Extension','Maintenance')),
  status           text        NOT NULL DEFAULT 'planning'
                               CHECK (status IN ('planning','in_progress','completed','on_hold','cancelled')),
  priority         text        NOT NULL DEFAULT 'ROUTINE'
                               CHECK (priority IN ('ROUTINE','PRIORITY','URGENT','EMERGENCY')),
  risk_level       text        NOT NULL DEFAULT 'LOW'
                               CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  location         text        NOT NULL,
  directorate_code text        NOT NULL,
  contractor       text,
  lead_inspector_id   uuid     REFERENCES auth.users(id),
  lead_inspector_name text,
  budget_ngn       numeric(15,2),
  completion_percent integer   DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  start_date       date,
  end_date         date,
  classification   text        DEFAULT 'INTERNAL'
                               CHECK (classification IN ('PUBLIC','INTERNAL','RESTRICTED','CONFIDENTIAL','SECRET','TOP_SECRET')),
  final_score      numeric(5,2),
  notes            text,
  created_by       uuid        NOT NULL REFERENCES auth.users(id),
  updated_by       uuid        REFERENCES auth.users(id),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  target_date    date,
  completed_date date,
  status         text        NOT NULL DEFAULT 'upcoming'
                             CHECK (status IN ('completed','in_progress','upcoming','delayed')),
  display_order  integer     DEFAULT 0,
  notes          text,
  created_by     uuid        NOT NULL REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_budget_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  description    text        NOT NULL,
  category       text        NOT NULL CHECK (category IN ('Labour','Materials','Equipment','Preliminaries','Contingency','Other')),
  quantity       numeric(12,3),
  unit           text,
  unit_rate_ngn  numeric(12,2),
  amount_ngn     numeric(15,2) NOT NULL,
  boq_revision   integer     DEFAULT 1,
  approved       boolean     DEFAULT false,
  approved_by    uuid        REFERENCES auth.users(id),
  approved_at    timestamptz,
  created_by     uuid        NOT NULL REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_documents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  doc_type       text        NOT NULL CHECK (doc_type IN ('BOQ','Drawing','Report','Certificate','Photo','Permit','Other')),
  file_name      text        NOT NULL,
  file_path      text        NOT NULL,
  content_type   text,
  size_bytes     bigint,
  sha256_hash    text,        -- C-I-9: evidence integrity
  classification text        DEFAULT 'INTERNAL',
  revision       integer     DEFAULT 1,
  supersedes_id  uuid        REFERENCES public.project_documents(id),
  uploaded_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_risk_flags (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  severity       text        NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status         text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','monitoring')),
  description    text,
  reported_by    uuid        NOT NULL REFERENCES auth.users(id),
  reported_at    timestamptz DEFAULT now(),
  resolved_by    uuid        REFERENCES auth.users(id),
  resolved_at    timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_reviews (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  body           text,
  priority       text        NOT NULL DEFAULT 'MEDIUM'
                             CHECK (priority IN ('URGENT','HIGH','MEDIUM','LOW')),
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','in_progress','resolved')),
  issued_by      uuid        NOT NULL REFERENCES auth.users(id),
  issued_at      timestamptz DEFAULT now(),
  resolved_by    uuid        REFERENCES auth.users(id),
  resolved_at    timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================================
-- C-3: HAZARD / SAFETY MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hazard_assessments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name        text,
  project_code        text,
  directorate_code    text        NOT NULL,
  category            text        NOT NULL,
  hazard_title        text        NOT NULL,
  risk_level          text        NOT NULL DEFAULT 'LOW'
                                  CHECK (risk_level IN ('LOW','MODERATE','HIGH','CRITICAL')),
  compliance_status   text        NOT NULL DEFAULT 'under_review'
                                  CHECK (compliance_status IN ('compliant','partial','non_compliant','under_review')),
  workflow_status     text        NOT NULL DEFAULT 'open'
                                  CHECK (workflow_status IN ('open','investigating','action_required','escalated','resolved','closed')),
  observations        text,
  inspector_id        uuid        REFERENCES auth.users(id),
  inspector_name      text,
  classification      text        DEFAULT 'INTERNAL'
                                  CHECK (classification IN ('PUBLIC','INTERNAL','RESTRICTED','CONFIDENTIAL','SECRET','TOP_SECRET')),
  created_by          uuid        NOT NULL REFERENCES auth.users(id),
  updated_by          uuid        REFERENCES auth.users(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hazard_check_items (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  uuid        NOT NULL REFERENCES public.hazard_assessments(id) ON DELETE CASCADE,
  prompt         text        NOT NULL,
  compliant      boolean,
  notes          text,
  display_order  integer     DEFAULT 0,
  checked_by     uuid        REFERENCES auth.users(id),
  checked_at     timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hazard_corrective_actions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id         uuid        NOT NULL REFERENCES public.hazard_assessments(id) ON DELETE CASCADE,
  recommendation        text        NOT NULL,
  department            text,
  urgency               text        NOT NULL DEFAULT 'MEDIUM'
                                    CHECK (urgency IN ('IMMEDIATE','HIGH','MEDIUM','LOW')),
  due_date              date,
  status                text        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','in_progress','resolved')),
  assigned_to           uuid        REFERENCES auth.users(id),
  -- C-9 verification fields
  completed_by          uuid        REFERENCES auth.users(id),
  completed_at          timestamptz,
  verification_evidence text,
  verified_by           uuid        REFERENCES auth.users(id),
  verified_at           timestamptz,
  verification_notes    text,
  created_by            uuid        NOT NULL REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  CONSTRAINT no_close_without_verifier
    CHECK (status <> 'resolved' OR verified_by IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.hazard_evidence (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  uuid        NOT NULL REFERENCES public.hazard_assessments(id) ON DELETE CASCADE,
  file_name      text        NOT NULL,
  file_path      text        NOT NULL,
  content_type   text,
  size_bytes     bigint,
  sha256_hash    text        NOT NULL, -- C-I-9: evidence integrity hash
  classification text        DEFAULT 'INTERNAL',
  uploaded_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hazard_escalations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       uuid        NOT NULL REFERENCES public.hazard_assessments(id) ON DELETE CASCADE,
  escalated_by        uuid        NOT NULL REFERENCES auth.users(id),
  escalated_to_role   text        NOT NULL,
  reason              text        NOT NULL,
  resolved_by         uuid        REFERENCES auth.users(id),
  resolved_at         timestamptz,
  resolution_notes    text,
  created_at          timestamptz DEFAULT now()
);

-- ============================================================================
-- C-4: WORKFLOW PERSISTENCE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id    text        NOT NULL,
  entity_type      text        NOT NULL CHECK (entity_type IN ('inspection','report','hazard','registration','project')),
  entity_id        uuid        NOT NULL,
  status           text        NOT NULL DEFAULT 'running'
                               CHECK (status IN ('not_started','running','completed','cancelled','overdue')),
  current_step_id  text,
  metadata         jsonb,
  started_at       timestamptz DEFAULT now(),
  completed_at     timestamptz,
  created_by       uuid        NOT NULL REFERENCES auth.users(id),
  UNIQUE (definition_id, entity_id)  -- one active workflow per entity per definition
);

CREATE TABLE IF NOT EXISTS public.workflow_step_history (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    uuid        NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_id        text        NOT NULL,
  step_name      text        NOT NULL,
  assigned_role  text        NOT NULL,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','in_progress','completed','skipped','overdue')),
  actor_id       uuid        REFERENCES auth.users(id),
  actor_role     text,
  notes          text,
  sla_due_at     timestamptz,
  started_at     timestamptz DEFAULT now(),
  completed_at   timestamptz
);

CREATE TABLE IF NOT EXISTS public.workflow_assignments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id      uuid        NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_id          text        NOT NULL,
  assigned_to_role text        NOT NULL,
  assigned_to_user uuid        REFERENCES auth.users(id),
  assigned_at      timestamptz DEFAULT now(),
  accepted_at      timestamptz,
  completed_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.workflow_escalations (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id            uuid        NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_id                text        NOT NULL,
  escalated_from_role    text        NOT NULL,
  escalated_to_role      text        NOT NULL,
  reason                 text,
  auto_escalated         boolean     DEFAULT false,
  created_at             timestamptz DEFAULT now(),
  resolved_at            timestamptz
);

CREATE TABLE IF NOT EXISTS public.workflow_comments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid        NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_id       text,
  actor_id      uuid        NOT NULL REFERENCES auth.users(id),
  actor_role    text,
  body          text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================================
-- C-5: AUTOMATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key     text        NOT NULL UNIQUE,
  name         text        NOT NULL,
  description  text,
  trigger_type text        NOT NULL CHECK (trigger_type IN ('schedule_hourly','schedule_daily','platform_event','threshold_check','on_startup')),
  category     text        NOT NULL CHECK (category IN ('compliance','safety','reporting','personnel','system')),
  enabled      boolean     NOT NULL DEFAULT true,
  priority     text        NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  config       jsonb,
  last_run_at  timestamptz,
  run_count    integer     DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_executions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      uuid        NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  executed_at  timestamptz DEFAULT now(),
  trigger_type text,
  matched      boolean     DEFAULT false,
  actions_run  integer     DEFAULT 0,
  details      text,
  duration_ms  integer
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id   uuid        NOT NULL REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  level          text        NOT NULL DEFAULT 'info' CHECK (level IN ('debug','info','warn','error')),
  message        text        NOT NULL,
  metadata       jsonb,
  created_at     timestamptz DEFAULT now()
);

-- Seed built-in automation rules
INSERT INTO public.automation_rules (rule_key, name, description, trigger_type, category, priority, config)
VALUES
  ('overdue_inspections',      'Flag Overdue Inspections',             'Mark in-progress inspections overdue when past their expected completion date.',                    'schedule_daily',  'compliance', 'HIGH',     '{"overdueThresholdDays": 14}'::jsonb),
  ('overdue_corrective_actions','Flag Overdue Corrective Actions',     'Escalate corrective actions that have passed their due date without being resolved.',              'schedule_daily',  'safety',     'HIGH',     '{"escalateAfterDays": 3}'::jsonb),
  ('critical_hazard_escalation','Auto-Escalate Critical Hazards',      'Automatically escalate CRITICAL hazard assessments that remain open for more than 24 hours.',       'schedule_hourly', 'safety',     'CRITICAL',  '{"thresholdHours": 24}'::jsonb),
  ('unreviewed_submissions',    'Alert on Unreviewed Submissions',      'Notify admins of inspection submissions that have been awaiting review for more than 72 hours.',   'schedule_daily',  'compliance', 'MEDIUM',   '{"thresholdHours": 72}'::jsonb),
  ('sla_breach_escalation',     'Workflow SLA Breach Escalation',       'Escalate workflow steps that have exceeded their SLA timer.',                                       'schedule_hourly', 'compliance', 'HIGH',     '{"checkIntervalMinutes": 60}'::jsonb),
  ('inactive_user_audit',       'Inactive User Audit',                  'Flag user accounts inactive for more than 90 days for administrative review.',                     'schedule_daily',  'personnel',  'LOW',      '{"inactiveDays": 90}'::jsonb)
ON CONFLICT (rule_key) DO NOTHING;

-- ============================================================================
-- C-1: NOTIFICATIONS TABLE (replaces MOCK_NOTIFICATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text        NOT NULL DEFAULT 'info'
                             CHECK (type IN ('alert','info','warning','success')),
  title          text        NOT NULL,
  body           text        NOT NULL,
  entity_type    text,
  entity_id      uuid,
  priority       text        DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  read           boolean     NOT NULL DEFAULT false,
  read_at        timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================================
-- C-1: REPORTS TABLE (replaces MOCK_REPORTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              text        NOT NULL,
  title             text        NOT NULL,
  project_id        uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name      text,
  project_code      text,
  directorate_code  text        NOT NULL,
  classification    text        NOT NULL DEFAULT 'UNCLASSIFIED'
                                CHECK (classification IN ('UNCLASSIFIED','RESTRICTED','CONFIDENTIAL','SECRET','TOP_SECRET')),
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','pending_review','approved','rejected','archived')),
  executive_summary text,
  safety_findings   text[],
  recommendations   text[],
  generated_by      uuid        NOT NULL REFERENCES auth.users(id),
  generated_by_name text,
  approved_by       uuid        REFERENCES auth.users(id),
  approved_by_name  text,
  approved_at       timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_findings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       uuid        NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  category        text        NOT NULL,
  description     text        NOT NULL,
  severity        text        NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  recommendation  text,
  display_order   integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================================
-- C-8: EXTEND inspection_responses (respondent chain of custody)
-- ============================================================================

ALTER TABLE public.inspection_responses
  ADD COLUMN IF NOT EXISTS responded_by      uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS responded_at      timestamptz,
  ADD COLUMN IF NOT EXISTS response_version  integer     DEFAULT 1,
  ADD COLUMN IF NOT EXISTS device_info       text,
  ADD COLUMN IF NOT EXISTS submission_source text        DEFAULT 'web';

-- Backfill responded_at for existing rows to match created_at
UPDATE public.inspection_responses
SET responded_at = created_at
WHERE responded_at IS NULL;

-- ============================================================================
-- C-9: EXTEND corrective_actions (verification workflow)
-- ============================================================================

ALTER TABLE public.corrective_actions
  ADD COLUMN IF NOT EXISTS completed_by          uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS completed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS verification_evidence text,
  ADD COLUMN IF NOT EXISTS verified_by           uuid        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verified_at           timestamptz,
  ADD COLUMN IF NOT EXISTS verification_notes    text;

-- Enforce: a corrective action cannot be 'closed' without verified_by being set.
-- We add the constraint conditionally to avoid breaking existing data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ca_closed_requires_verifier' AND conrelid = 'public.corrective_actions'::regclass
  ) THEN
    ALTER TABLE public.corrective_actions
      ADD CONSTRAINT ca_closed_requires_verifier
      CHECK (status <> 'closed' OR verified_by IS NOT NULL);
  END IF;
END;
$$;

-- ============================================================================
-- C-10: OTP RATE LIMITING — server-side enforcement
-- ============================================================================

-- Server-side rate limit tracking (replaces client-only rateLimiter.ts)
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  key           text        PRIMARY KEY,
  hit_count     integer     NOT NULL DEFAULT 0,
  window_start  timestamptz NOT NULL DEFAULT now(),
  locked_until  timestamptz,
  updated_at    timestamptz DEFAULT now()
);

-- Extend password_reset_tokens with abuse-detection fields
-- The table may not exist (it is referenced in API code but not in the visible migrations).
-- We create it here if absent, and add columns if it already exists.
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash     text        NOT NULL,
  phone_number   text,
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz,
  attempt_count  integer     NOT NULL DEFAULT 0,
  request_ip     inet,
  request_device text,
  locked_until   timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- Add columns to existing table if they were missing
ALTER TABLE public.password_reset_tokens
  ADD COLUMN IF NOT EXISTS attempt_count  integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS request_ip     inet,
  ADD COLUMN IF NOT EXISTS request_device text,
  ADD COLUMN IF NOT EXISTS locked_until   timestamptz;

-- RLS on OTP tables (service-role only — no public access)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits       ENABLE ROW LEVEL SECURITY;

-- No public-facing policies; edge functions use service_role which bypasses RLS.

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_directorate     ON public.projects(directorate_code);
CREATE INDEX IF NOT EXISTS idx_projects_status          ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by      ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_milestones_proj  ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_proj        ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_proj       ON public.project_risk_flags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_proj     ON public.project_reviews(project_id);

CREATE INDEX IF NOT EXISTS idx_hazards_directorate      ON public.hazard_assessments(directorate_code);
CREATE INDEX IF NOT EXISTS idx_hazards_status           ON public.hazard_assessments(workflow_status);
CREATE INDEX IF NOT EXISTS idx_hazards_risk             ON public.hazard_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_hazards_project          ON public.hazard_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_hazard_items_assessment  ON public.hazard_check_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_hazard_ca_assessment     ON public.hazard_corrective_actions(assessment_id);

CREATE INDEX IF NOT EXISTS idx_workflow_entity          ON public.workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status          ON public.workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_inst      ON public.workflow_step_history(instance_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient  ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON public.notifications(recipient_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_reports_directorate      ON public.reports(directorate_code);
CREATE INDEX IF NOT EXISTS idx_reports_status           ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_report_findings_report   ON public.report_findings(report_id);

CREATE INDEX IF NOT EXISTS idx_automation_execs_rule    ON public.automation_executions(rule_id);

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated_at') THEN
    CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_project_milestones_updated_at') THEN
    CREATE TRIGGER trg_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hazard_assessments_updated_at') THEN
    CREATE TRIGGER trg_hazard_assessments_updated_at BEFORE UPDATE ON public.hazard_assessments
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hazard_ca_updated_at') THEN
    CREATE TRIGGER trg_hazard_ca_updated_at BEFORE UPDATE ON public.hazard_corrective_actions
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reports_updated_at') THEN
    CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.reports
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_automation_rules_updated_at') THEN
    CREATE TRIGGER trg_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- C-7: ROW LEVEL SECURITY — ALL TABLES
-- ============================================================================

ALTER TABLE public.projects                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_risk_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_assessments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_check_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_corrective_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_evidence            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_escalations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_escalations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_findings            ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- PROJECTS RLS
-- ---------------------------------------------------------------------------
-- Directorate members and admins can read projects in their directorate
CREATE POLICY projects_read ON public.projects FOR SELECT USING (
  public.is_admin_or_above()
  OR directorate_code = public.my_directorate()
  OR created_by = auth.uid()
);

CREATE POLICY projects_insert ON public.projects FOR INSERT WITH CHECK (
  public.my_role_code() IN ('platform_owner','super_admin','director','commander','admin','engineering_officer')
  AND auth.uid() = created_by
);

CREATE POLICY projects_update ON public.projects FOR UPDATE USING (
  public.is_admin_or_above()
  OR (directorate_code = public.my_directorate()
      AND public.my_role_code() IN ('engineering_officer','inspection_officer','safety_officer'))
);

CREATE POLICY projects_delete ON public.projects FOR DELETE USING (
  public.is_admin_or_above()
);

-- Project sub-tables inherit parent project scoping
CREATE POLICY project_milestones_read ON public.project_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR p.created_by = auth.uid()))
);
CREATE POLICY project_milestones_write ON public.project_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

CREATE POLICY project_budget_items_read ON public.project_budget_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);
CREATE POLICY project_budget_items_write ON public.project_budget_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (public.is_admin_or_above()
         OR (p.directorate_code = public.my_directorate()
             AND public.my_role_code() IN ('engineering_officer','admin'))))
);

CREATE POLICY project_documents_read ON public.project_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
  AND (classification = 'PUBLIC' OR classification = 'INTERNAL'
       OR (classification = 'RESTRICTED'    AND public.my_clearance() >= 3)
       OR (classification = 'CONFIDENTIAL'  AND public.my_clearance() >= 4)
       OR (classification = 'SECRET'        AND public.my_clearance() >= 5)
       OR (classification = 'TOP_SECRET'    AND public.my_clearance() >= 6))
);
CREATE POLICY project_documents_insert ON public.project_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

CREATE POLICY project_risk_flags_read ON public.project_risk_flags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR p.created_by = auth.uid()))
);
CREATE POLICY project_risk_flags_write ON public.project_risk_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

CREATE POLICY project_reviews_read ON public.project_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);
CREATE POLICY project_reviews_write ON public.project_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

-- ---------------------------------------------------------------------------
-- HAZARD ASSESSMENTS RLS
-- ---------------------------------------------------------------------------
CREATE POLICY hazards_read ON public.hazard_assessments FOR SELECT USING (
  public.is_admin_or_above()
  OR directorate_code = public.my_directorate()
  OR created_by = auth.uid()
);

CREATE POLICY hazards_insert ON public.hazard_assessments FOR INSERT WITH CHECK (
  public.my_role_code() IN ('platform_owner','super_admin','director','commander','admin','safety_officer','inspection_officer')
  AND auth.uid() = created_by
);

CREATE POLICY hazards_update ON public.hazard_assessments FOR UPDATE USING (
  public.is_admin_or_above()
  OR (directorate_code = public.my_directorate()
      AND public.my_role_code() IN ('safety_officer','inspection_officer'))
  OR created_by = auth.uid()
);

CREATE POLICY hazards_delete ON public.hazard_assessments FOR DELETE USING (
  public.is_admin_or_above()
);

-- Hazard sub-tables
CREATE POLICY hazard_items_read ON public.hazard_check_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR h.created_by = auth.uid()))
);
CREATE POLICY hazard_items_write ON public.hazard_check_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR h.created_by = auth.uid()))
);

CREATE POLICY hazard_ca_read ON public.hazard_corrective_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR h.created_by = auth.uid()))
);
CREATE POLICY hazard_ca_write ON public.hazard_corrective_actions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

CREATE POLICY hazard_evidence_read ON public.hazard_evidence FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);
CREATE POLICY hazard_evidence_insert ON public.hazard_evidence FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR h.created_by = auth.uid()))
);

CREATE POLICY hazard_escalations_read ON public.hazard_escalations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND (h.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);
CREATE POLICY hazard_escalations_write ON public.hazard_escalations FOR ALL USING (
  public.is_admin_or_above()
  OR EXISTS (SELECT 1 FROM public.hazard_assessments h WHERE h.id = assessment_id
    AND h.directorate_code = public.my_directorate()
    AND public.my_role_code() IN ('safety_officer','commander','director'))
);

-- ---------------------------------------------------------------------------
-- WORKFLOW RLS
-- ---------------------------------------------------------------------------
CREATE POLICY wf_instances_read ON public.workflow_instances FOR SELECT USING (
  public.is_admin_or_above()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workflow_assignments wa
    WHERE wa.instance_id = id AND wa.assigned_to_user = auth.uid()
  )
);
CREATE POLICY wf_instances_write ON public.workflow_instances FOR ALL USING (
  public.is_admin_or_above() OR created_by = auth.uid()
);

CREATE POLICY wf_steps_read ON public.workflow_step_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workflow_instances wi WHERE wi.id = instance_id
    AND (wi.created_by = auth.uid() OR public.is_admin_or_above()))
);
CREATE POLICY wf_steps_write ON public.workflow_step_history FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workflow_instances wi WHERE wi.id = instance_id
    AND (wi.created_by = auth.uid() OR public.is_admin_or_above()))
);

CREATE POLICY wf_assignments_read ON public.workflow_assignments FOR SELECT USING (
  assigned_to_user = auth.uid() OR public.is_admin_or_above()
);
CREATE POLICY wf_assignments_write ON public.workflow_assignments FOR ALL USING (
  public.is_admin_or_above()
);

CREATE POLICY wf_escalations_read ON public.workflow_escalations FOR SELECT USING (
  public.is_admin_or_above()
);
CREATE POLICY wf_escalations_write ON public.workflow_escalations FOR ALL USING (
  public.is_admin_or_above()
);

CREATE POLICY wf_comments_read ON public.workflow_comments FOR SELECT USING (
  actor_id = auth.uid() OR public.is_admin_or_above()
  OR EXISTS (SELECT 1 FROM public.workflow_instances wi WHERE wi.id = instance_id
    AND wi.created_by = auth.uid())
);
CREATE POLICY wf_comments_insert ON public.workflow_comments FOR INSERT WITH CHECK (
  auth.uid() = actor_id
);

-- ---------------------------------------------------------------------------
-- AUTOMATION RLS (read: admin+; write: platform_owner only)
-- ---------------------------------------------------------------------------
CREATE POLICY automation_rules_read ON public.automation_rules FOR SELECT USING (
  public.is_admin_or_above()
);
CREATE POLICY automation_rules_write ON public.automation_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_platform_owner = true)
);

CREATE POLICY automation_execs_read ON public.automation_executions FOR SELECT USING (
  public.is_admin_or_above()
);
CREATE POLICY automation_logs_read ON public.automation_logs FOR SELECT USING (
  public.is_admin_or_above()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS RLS (users see only their own)
-- ---------------------------------------------------------------------------
CREATE POLICY notifications_read ON public.notifications FOR SELECT USING (
  recipient_id = auth.uid() OR public.is_admin_or_above()
);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (
  recipient_id = auth.uid()
);
-- Inserts via service_role (automation runner) only — no client insert policy

-- ---------------------------------------------------------------------------
-- REPORTS RLS (clearance-aware)
-- ---------------------------------------------------------------------------
CREATE POLICY reports_read ON public.reports FOR SELECT USING (
  (public.is_admin_or_above() OR directorate_code = public.my_directorate() OR generated_by = auth.uid())
  AND (
    classification = 'UNCLASSIFIED'
    OR (classification = 'RESTRICTED'   AND public.my_clearance() >= 3)
    OR (classification = 'CONFIDENTIAL' AND public.my_clearance() >= 4)
    OR (classification = 'SECRET'       AND public.my_clearance() >= 5)
    OR (classification = 'TOP_SECRET'   AND public.my_clearance() >= 6)
  )
);

CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (
  auth.uid() = generated_by
  AND public.my_role_code() IN ('platform_owner','super_admin','director','commander','admin',
                                 'engineering_officer','safety_officer','inspection_officer','auditor')
);

CREATE POLICY reports_update ON public.reports FOR UPDATE USING (
  public.is_admin_or_above()
  OR (generated_by = auth.uid() AND status = 'draft')
);

CREATE POLICY report_findings_read ON public.report_findings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id
    AND (r.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR r.generated_by = auth.uid()))
);
CREATE POLICY report_findings_write ON public.report_findings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id
    AND (public.is_admin_or_above() OR (r.generated_by = auth.uid() AND r.status = 'draft')))
);

-- ---------------------------------------------------------------------------
-- C-7: HARDEN EXISTING inspection_responses WITH clearance-aware policy
-- ---------------------------------------------------------------------------
-- Drop the overly broad existing policy and replace with clearance-gated one
DROP POLICY IF EXISTS inspection_responses_read ON public.inspection_responses;
CREATE POLICY inspection_responses_read ON public.inspection_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_id
    AND (
      i.created_by = auth.uid()
      OR i.directorate_code = public.my_directorate()
      OR public.is_admin_or_above()
    )
  )
);

-- Enforce respondent attribution on insert
DROP POLICY IF EXISTS inspection_responses_insert ON public.inspection_responses;
CREATE POLICY inspection_responses_insert ON public.inspection_responses FOR INSERT WITH CHECK (
  responded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_id AND i.created_by = auth.uid()
  )
);

-- C-9: Enforce verification on corrective action close
DROP POLICY IF EXISTS corrective_actions_insert ON public.corrective_actions;
CREATE POLICY corrective_actions_insert ON public.corrective_actions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_id AND i.created_by = auth.uid()
  )
);

CREATE POLICY corrective_actions_update ON public.corrective_actions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.inspections i
    WHERE i.id = inspection_id
    AND (i.created_by = auth.uid() OR public.is_admin_or_above())
  )
) WITH CHECK (
  -- Closing requires verified_by
  (status <> 'closed' OR verified_by IS NOT NULL)
);
