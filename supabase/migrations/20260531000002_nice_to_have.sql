-- =============================================================================
-- DDSE Nice-to-Have Findings Migration
-- Covers N-2, N-3, N-5, N-6 schema requirements.
-- Run after 20260531000001_important_findings.sql
-- =============================================================================

-- ============================================================================
-- N-3: FULL-TEXT SEARCH — Enable pg_trgm for fuzzy cross-module search
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast trigram search across critical text columns
CREATE INDEX IF NOT EXISTS idx_inspections_fts    ON public.inspections    USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_findings_fts       ON public.findings       USING GIN (title gin_trgm_ops, detail gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_reports_fts        ON public.reports        USING GIN (title gin_trgm_ops, executive_summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hazards_fts        ON public.hazard_assessments USING GIN (hazard_title gin_trgm_ops, observations gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_fts       ON public.projects       USING GIN (title gin_trgm_ops, location gin_trgm_ops);

-- ============================================================================
-- N-2: INSPECTION SCHEDULING MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inspection_schedules (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text        NOT NULL,
  module_code        text        NOT NULL REFERENCES public.modules(code),
  directorate_code   text        NOT NULL,
  unit_id            uuid        REFERENCES public.units(id),
  frequency          text        NOT NULL DEFAULT 'quarterly'
                                 CHECK (frequency IN ('weekly','monthly','quarterly','biannual','annual','one_off')),
  scheduled_date     date        NOT NULL,
  scheduled_time     time,
  lead_inspector_id  uuid        REFERENCES auth.users(id),
  status             text        NOT NULL DEFAULT 'scheduled'
                                 CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','overdue')),
  inspection_id      uuid        REFERENCES public.inspections(id),  -- linked when started
  notes              text,
  recurrence_rule    text,       -- iCal-style RRULE for repeating schedules
  next_occurrence    date,       -- computed next date for recurring schedules
  created_by         uuid        NOT NULL REFERENCES auth.users(id),
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_schedule_reminders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id    uuid        NOT NULL REFERENCES public.inspection_schedules(id) ON DELETE CASCADE,
  remind_at      timestamptz NOT NULL,
  sent           boolean     NOT NULL DEFAULT false,
  sent_at        timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_date        ON public.inspection_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_directorate ON public.inspection_schedules(directorate_code);
CREATE INDEX IF NOT EXISTS idx_schedules_inspector   ON public.inspection_schedules(lead_inspector_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status      ON public.inspection_schedules(status);

ALTER TABLE public.inspection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_schedule_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY sched_read  ON public.inspection_schedules FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    public.is_admin_or_above()
    OR directorate_code = public.my_directorate()
    OR lead_inspector_id = auth.uid()
  )
);
CREATE POLICY sched_write ON public.inspection_schedules FOR ALL USING (
  public.is_admin_or_above()
  OR (directorate_code = public.my_directorate()
      AND public.my_role_code() IN ('commander','admin','engineering_officer','inspection_officer'))
);
CREATE POLICY sched_rem_read  ON public.inspection_schedule_reminders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inspection_schedules s WHERE s.id = schedule_id
    AND (public.is_admin_or_above() OR s.directorate_code = public.my_directorate()))
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schedules_updated_at') THEN
    CREATE TRIGGER trg_schedules_updated_at BEFORE UPDATE ON public.inspection_schedules
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- N-5: TWO-PERSON INTEGRITY (TPI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tpi_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type       text        NOT NULL
                                CHECK (action_type IN ('report_approval','armoury_inspection','emergency_lockdown','role_change','data_export','budget_approval')),
  entity_type       text        NOT NULL,
  entity_id         uuid,
  description       text        NOT NULL,
  classification    text        NOT NULL DEFAULT 'TOP_SECRET',
  initiator_id      uuid        NOT NULL REFERENCES auth.users(id),
  initiator_role    text        NOT NULL,
  confirmer_id      uuid        REFERENCES auth.users(id),
  confirmer_role    text,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','rejected','expired','cancelled')),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  confirmed_at      timestamptz,
  rejected_at       timestamptz,
  rejection_reason  text,
  audit_hash        text,       -- SHA-256 of (action_type||entity_id||initiator_id||confirmer_id||timestamp)
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT tpi_different_persons CHECK (initiator_id <> confirmer_id)
);

CREATE INDEX IF NOT EXISTS idx_tpi_status      ON public.tpi_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tpi_initiator   ON public.tpi_requests(initiator_id);
CREATE INDEX IF NOT EXISTS idx_tpi_entity      ON public.tpi_requests(entity_type, entity_id);

ALTER TABLE public.tpi_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tpi_read ON public.tpi_requests FOR SELECT USING (
  initiator_id = auth.uid() OR confirmer_id = auth.uid() OR public.is_admin_or_above()
);
CREATE POLICY tpi_insert ON public.tpi_requests FOR INSERT WITH CHECK (
  auth.uid() = initiator_id
  AND public.my_role_code() IN ('platform_owner','super_admin','director','commander','admin')
);
CREATE POLICY tpi_update ON public.tpi_requests FOR UPDATE USING (
  -- Only the confirmer (a different person) can accept
  (confirmer_id = auth.uid() AND initiator_id <> auth.uid())
  OR public.is_admin_or_above()
);

-- ============================================================================
-- N-6: INCIDENT TIMELINE / AFTER-ACTION REPORT (AAR)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.incidents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number      text        NOT NULL UNIQUE,  -- e.g. INC-2025-001
  title                text        NOT NULL,
  incident_type        text        NOT NULL
                                   CHECK (incident_type IN ('safety','security','operational','environmental','equipment','personnel','other')),
  severity             text        NOT NULL DEFAULT 'MEDIUM'
                                   CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status               text        NOT NULL DEFAULT 'open'
                                   CHECK (status IN ('open','investigating','under_review','closed','archived')),
  occurred_at          timestamptz NOT NULL,
  reported_at          timestamptz NOT NULL DEFAULT now(),
  location             text,
  directorate_code     text        NOT NULL,
  unit_id              uuid        REFERENCES public.units(id),
  project_id           uuid        REFERENCES public.projects(id),
  hazard_assessment_id uuid        REFERENCES public.hazard_assessments(id),
  initial_description  text        NOT NULL,
  immediate_actions    text,
  reported_by          uuid        NOT NULL REFERENCES auth.users(id),
  investigating_officer uuid       REFERENCES auth.users(id),
  classification       text        DEFAULT 'RESTRICTED',
  closed_at            timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_timeline (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id   uuid        NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  occurred_at   timestamptz NOT NULL,
  title         text        NOT NULL,
  description   text        NOT NULL,
  actor         text,
  evidence_ref  text,
  display_order integer     DEFAULT 0,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.after_action_reports (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id          uuid        NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  executive_summary    text,
  root_cause           text,
  contributing_factors text[],
  immediate_actions_taken text,
  corrective_actions   text[],
  lessons_learned      text[],
  recommendations      text[],
  prepared_by          uuid        NOT NULL REFERENCES auth.users(id),
  reviewed_by          uuid        REFERENCES auth.users(id),
  approved_by          uuid        REFERENCES auth.users(id),
  status               text        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft','under_review','approved','published')),
  approved_at          timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Auto-generate incident number
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  yr  text := to_char(now(), 'YYYY');
  seq integer;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM public.incidents
  WHERE incident_number LIKE 'INC-' || yr || '-%';
  NEW.incident_number := 'INC-' || yr || '-' || LPAD(seq::text, 3, '0');
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_incident_number') THEN
    CREATE TRIGGER trg_incident_number BEFORE INSERT ON public.incidents
      FOR EACH ROW WHEN (NEW.incident_number IS NULL OR NEW.incident_number = '')
      EXECUTE FUNCTION public.generate_incident_number();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_directorate ON public.incidents(directorate_code);
CREATE INDEX IF NOT EXISTS idx_incidents_status      ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred    ON public.incidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_timeline     ON public.incident_timeline(incident_id, display_order);

ALTER TABLE public.incidents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_timeline  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.after_action_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_read ON public.incidents FOR SELECT USING (
  public.is_admin_or_above()
  OR directorate_code = public.my_directorate()
  OR reported_by = auth.uid()
);
CREATE POLICY incidents_insert ON public.incidents FOR INSERT WITH CHECK (
  auth.uid() = reported_by
);
CREATE POLICY incidents_update ON public.incidents FOR UPDATE USING (
  public.is_admin_or_above()
  OR (directorate_code = public.my_directorate()
      AND public.my_role_code() IN ('safety_officer','commander','admin'))
);

CREATE POLICY timeline_read  ON public.incident_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id
    AND (i.directorate_code = public.my_directorate() OR public.is_admin_or_above() OR i.reported_by = auth.uid()))
);
CREATE POLICY timeline_write ON public.incident_timeline FOR ALL USING (
  EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id
    AND (i.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);

CREATE POLICY aar_read ON public.after_action_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id
    AND (i.directorate_code = public.my_directorate() OR public.is_admin_or_above()))
);
CREATE POLICY aar_write ON public.after_action_reports FOR ALL USING (
  prepared_by = auth.uid() OR public.is_admin_or_above()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_incidents_updated_at') THEN
    CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON public.incidents
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_aar_updated_at') THEN
    CREATE TRIGGER trg_aar_updated_at BEFORE UPDATE ON public.after_action_reports
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
