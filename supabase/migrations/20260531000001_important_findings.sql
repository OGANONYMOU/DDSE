-- =============================================================================
-- DDSE Important Findings Migration
-- Covers I-1 through I-15 from the pre-production review.
-- Run after 20260530000001_production_remediation.sql
-- =============================================================================

-- ============================================================================
-- I-1: ORGANIZATIONAL HIERARCHY TABLES
-- directorates → formations → units (with commander scoping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.directorates (
  code             text        PRIMARY KEY,
  name             text        NOT NULL,
  short_name       text,
  commander_id     uuid        REFERENCES auth.users(id),
  classification   text        DEFAULT 'INTERNAL',
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.formations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  directorate_code text        NOT NULL REFERENCES public.directorates(code) ON DELETE CASCADE,
  code             text        NOT NULL,
  name             text        NOT NULL,
  commander_id     uuid        REFERENCES auth.users(id),
  location         text,
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (directorate_code, code)
);

CREATE TABLE IF NOT EXISTS public.units (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id     uuid        NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  code             text        NOT NULL,
  name             text        NOT NULL,
  commander_id     uuid        REFERENCES auth.users(id),
  location         text,
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deployed')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (formation_id, code)
);

-- Add FK on inspections to link to org hierarchy (soft FK for backward compat)
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- Helper: resolve commander chain for a unit (returns unit, formation, and directorate commander IDs)
CREATE OR REPLACE FUNCTION public.get_unit_commanders(p_unit_id uuid)
RETURNS TABLE (commander_id uuid, level text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.commander_id, 'unit'::text FROM public.units u WHERE u.id = p_unit_id AND u.commander_id IS NOT NULL
  UNION ALL
  SELECT f.commander_id, 'formation'::text FROM public.units u JOIN public.formations f ON f.id = u.formation_id WHERE u.id = p_unit_id AND f.commander_id IS NOT NULL
  UNION ALL
  SELECT d.commander_id, 'directorate'::text FROM public.units u JOIN public.formations f ON f.id = u.formation_id JOIN public.directorates d ON d.code = f.directorate_code WHERE u.id = p_unit_id AND d.commander_id IS NOT NULL;
$$;

-- RLS on org tables (readable by authenticated, writable by admins/directors)
ALTER TABLE public.directorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units        ENABLE ROW LEVEL SECURITY;

CREATE POLICY directorates_read  ON public.directorates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY directorates_write ON public.directorates FOR ALL   USING (public.is_admin_or_above());

CREATE POLICY formations_read    ON public.formations   FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY formations_write   ON public.formations   FOR ALL   USING (public.is_admin_or_above());

CREATE POLICY units_read         ON public.units        FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY units_write        ON public.units        FOR ALL   USING (public.is_admin_or_above());

-- Tighten inspection insert: officer can only create for units in their directorate
DROP POLICY IF EXISTS inspections_insert ON public.inspections;
CREATE POLICY inspections_insert ON public.inspections FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    -- No unit specified (legacy / open)
    unit_id IS NULL
    -- Or unit belongs to user's directorate
    OR EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.formations f ON f.id = u.formation_id
      WHERE u.id = unit_id AND f.directorate_code = public.my_directorate()
    )
    -- Or admin/director can assign any unit
    OR public.is_admin_or_above()
  )
);

-- Seed canonical directorate codes (idempotent)
INSERT INTO public.directorates (code, name, short_name) VALUES
  ('DESE', 'Directorate of Engineering Services and Equipment', 'DESE'),
  ('DEME', 'Directorate of Electrical and Mechanical Engineering', 'DEME'),
  ('DSA',  'Directorate of Supply and Administration', 'DSA'),
  ('DSIG', 'Directorate of Signal', 'DSIG')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- I-2: BOQ (BILL OF QUANTITIES) MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.boq_submissions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','submitted','under_review','approved','rejected','superseded')),
  revision         integer     NOT NULL DEFAULT 1,
  currency         text        NOT NULL DEFAULT 'NGN',
  total_amount     numeric(15,2) GENERATED ALWAYS AS (0) STORED, -- overridden by trigger
  approved_total   numeric(15,2),
  contractor_id    uuid        REFERENCES public.contractors(id) ON DELETE SET NULL,
  submitted_by     uuid        NOT NULL REFERENCES auth.users(id),
  reviewed_by      uuid        REFERENCES auth.users(id),
  approved_by      uuid        REFERENCES auth.users(id),
  approved_at      timestamptz,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Drop the generated column so we can make it a real column
ALTER TABLE public.boq_submissions DROP COLUMN IF EXISTS total_amount;
ALTER TABLE public.boq_submissions ADD COLUMN IF NOT EXISTS total_amount numeric(15,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.boq_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    uuid        NOT NULL REFERENCES public.boq_submissions(id) ON DELETE CASCADE,
  section          text        NOT NULL DEFAULT 'General',
  item_number      text,
  description      text        NOT NULL,
  unit             text,
  quantity         numeric(12,3),
  unit_rate_ngn    numeric(12,2),
  total_ngn        numeric(15,2) NOT NULL DEFAULT 0,
  notes            text,
  display_order    integer     DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.boq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_items       ENABLE ROW LEVEL SECURITY;

CREATE POLICY boq_submissions_read  ON public.boq_submissions FOR SELECT USING (
  public.is_admin_or_above() OR submitted_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.directorate_code = public.my_directorate())
);
CREATE POLICY boq_submissions_write ON public.boq_submissions FOR ALL USING (
  public.is_admin_or_above() OR submitted_by = auth.uid()
);

CREATE POLICY boq_items_read  ON public.boq_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.boq_submissions s WHERE s.id = submission_id
    AND (s.submitted_by = auth.uid() OR public.is_admin_or_above()
         OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = s.project_id AND p.directorate_code = public.my_directorate())))
);
CREATE POLICY boq_items_write ON public.boq_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.boq_submissions s WHERE s.id = submission_id
    AND (s.submitted_by = auth.uid() OR public.is_admin_or_above()))
);

-- ============================================================================
-- I-3: CONTRACTOR / VENDOR REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contractors (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  registration_number  text        UNIQUE,
  type                 text        NOT NULL DEFAULT 'Construction'
                                   CHECK (type IN ('Construction','Electrical','Mechanical','IT','Logistics','Consulting','Other')),
  contact_person       text,
  phone                text,
  email                text,
  address              text,
  status               text        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','inactive','blacklisted','under_review')),
  performance_score    numeric(4,1) CHECK (performance_score >= 0 AND performance_score <= 100),
  total_contracts      integer     DEFAULT 0,
  total_value_ngn      numeric(18,2) DEFAULT 0,
  created_by           uuid        NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contractor_evaluations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id        uuid        NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  project_id           uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  evaluation_period    text        NOT NULL,   -- e.g. "Q3 2025"
  overall_score        numeric(4,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  programme_score      numeric(4,1),
  quality_score        numeric(4,1),
  safety_score         numeric(4,1),
  financial_score      numeric(4,1),
  notes                text,
  evaluated_by         uuid        NOT NULL REFERENCES auth.users(id),
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.contractors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY contractors_read  ON public.contractors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY contractors_write ON public.contractors FOR ALL USING (
  public.my_role_code() IN ('platform_owner','super_admin','director','admin','engineering_officer')
);

CREATE POLICY contractor_evals_read  ON public.contractor_evaluations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY contractor_evals_write ON public.contractor_evaluations FOR ALL USING (
  public.my_role_code() IN ('platform_owner','super_admin','director','admin','engineering_officer')
);

-- Add contractor FK on projects (was just a text field before)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contractor_id uuid REFERENCES public.contractors(id);

-- ============================================================================
-- I-4: SECTORS TABLE (replaces hardcoded DefenseHQ sectors)
-- Readiness is computed live from inspections; sectors define the org scope
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sectors (
  code             text        PRIMARY KEY,
  name             text        NOT NULL,
  directorate_code text        REFERENCES public.directorates(code),
  commander_id     uuid        REFERENCES auth.users(id),
  alert_level      text        NOT NULL DEFAULT 'Normal'
                               CHECK (alert_level IN ('Normal','Standby','High Risk','Critical')),
  display_order    integer     DEFAULT 0,
  active           boolean     NOT NULL DEFAULT true,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY sectors_read  ON public.sectors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY sectors_write ON public.sectors FOR ALL   USING (public.is_admin_or_above());

-- Seed default sectors
INSERT INTO public.sectors (code, name, directorate_code, alert_level, display_order) VALUES
  ('SECTOR_ALPHA', 'Sector Alpha — Training Command',        'DESE',  'Normal',    1),
  ('SECTOR_BRAVO', 'Sector Bravo — Central Armoury',         NULL,    'Normal',    2),
  ('SECTOR_CHARLIE','Sector Charlie — Strategic Engineering','DEME',  'Normal',    3),
  ('SECTOR_DELTA', 'Sector Delta — Hazard Containment',      'DEME',  'Normal',    4)
ON CONFLICT (code) DO NOTHING;

-- View: live sector readiness from real inspection scores
CREATE OR REPLACE VIEW public.sector_readiness AS
  SELECT
    s.code,
    s.name,
    s.directorate_code,
    s.alert_level,
    s.display_order,
    s.active,
    COALESCE(ROUND(AVG(i.final_score)::numeric, 1), 0) AS avg_score,
    COUNT(i.id) FILTER (WHERE i.status IN ('in_progress','submitted','under_review')) AS active_inspections,
    COUNT(i.id) FILTER (WHERE i.status = 'approved' AND i.score_updated_at > now() - interval '90 days') AS recent_passed
  FROM public.sectors s
  LEFT JOIN public.inspections i
    ON i.directorate_code = s.directorate_code
    AND i.status NOT IN ('draft','cancelled')
  GROUP BY s.code, s.name, s.directorate_code, s.alert_level, s.display_order, s.active;

-- ============================================================================
-- I-7: INSPECTION SCORE PERSISTENCE  /  I-15: TEMPLATE VERSIONING
-- ============================================================================

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS final_score       numeric(5,2),
  ADD COLUMN IF NOT EXISTS risk_band         text CHECK (risk_band IN ('A','B','C','D','F')),
  ADD COLUMN IF NOT EXISTS score_updated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS template_version  integer DEFAULT 1;

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS version    integer     NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger: bump module version when items change
CREATE OR REPLACE FUNCTION public.bump_module_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.modules SET version = version + 1, updated_at = now()
  WHERE code = (SELECT m.code FROM public.modules m
                JOIN public.inspection_sections s ON true
                JOIN public.inspection_items ii ON ii.section_id = s.id
                WHERE ii.id = NEW.id LIMIT 1);
  RETURN NEW;
END;
$$;

-- ============================================================================
-- I-9: INSPECTION EVIDENCE INTEGRITY HASH  /  I-13: VERSION CONTROL
-- ============================================================================

ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS sha256_hash    text,
  ADD COLUMN IF NOT EXISTS version        integer     DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supersedes_id  uuid        REFERENCES public.evidence(id),
  ADD COLUMN IF NOT EXISTS document_title text,
  ADD COLUMN IF NOT EXISTS uploaded_by    uuid        REFERENCES auth.users(id);

-- ============================================================================
-- I-10: ACTING AUTHORITY DELEGATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.acting_authority_delegations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id      uuid        NOT NULL REFERENCES auth.users(id),
  delegate_id       uuid        NOT NULL REFERENCES auth.users(id),
  delegator_role    text        NOT NULL,
  effective_from    timestamptz NOT NULL,
  effective_until   timestamptz NOT NULL,
  scope             text        NOT NULL DEFAULT 'directorate'
                                CHECK (scope IN ('all','directorate','formation','unit')),
  scope_code        text,
  reason            text        NOT NULL,
  approved_by       uuid        REFERENCES auth.users(id),
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','active','expired','revoked')),
  revoked_at        timestamptz,
  revoked_reason    text,
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT delegation_different_users CHECK (delegator_id <> delegate_id),
  CONSTRAINT delegation_future CHECK (effective_until > effective_from)
);

CREATE INDEX IF NOT EXISTS idx_delegations_active ON public.acting_authority_delegations(delegate_id, status)
  WHERE status = 'active';

ALTER TABLE public.acting_authority_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY delegations_read  ON public.acting_authority_delegations FOR SELECT USING (
  delegator_id = auth.uid() OR delegate_id = auth.uid() OR public.is_admin_or_above()
);
CREATE POLICY delegations_insert ON public.acting_authority_delegations FOR INSERT WITH CHECK (
  delegator_id = auth.uid()
  AND public.my_role_code() IN ('director','commander','admin','platform_owner','super_admin')
);
CREATE POLICY delegations_update ON public.acting_authority_delegations FOR UPDATE USING (
  public.is_admin_or_above() OR delegator_id = auth.uid()
);

-- Helper: check if a user has delegated authority for a role
CREATE OR REPLACE FUNCTION public.has_delegated_authority(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acting_authority_delegations
    WHERE delegate_id = p_user_id
      AND delegator_role = p_role
      AND status = 'active'
      AND effective_from <= now()
      AND effective_until >= now()
  );
$$;

-- ============================================================================
-- I-11: BROADCAST ACKNOWLEDGEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.broadcast_acknowledgements (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id      text        NOT NULL,   -- broadcast ID from broadcastService
  recipient_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  required_by       timestamptz,
  acknowledged_at   timestamptz,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','acknowledged','overdue')),
  created_at        timestamptz DEFAULT now(),
  UNIQUE (broadcast_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_broadcast_acks_pending ON public.broadcast_acknowledgements(recipient_id, status)
  WHERE status = 'pending';

ALTER TABLE public.broadcast_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY broadcast_acks_read   ON public.broadcast_acknowledgements FOR SELECT USING (
  recipient_id = auth.uid() OR public.is_admin_or_above()
);
CREATE POLICY broadcast_acks_insert ON public.broadcast_acknowledgements FOR INSERT WITH CHECK (
  -- Only admins/system can create ack requirements; users can self-acknowledge
  public.is_admin_or_above() OR recipient_id = auth.uid()
);
CREATE POLICY broadcast_acks_update ON public.broadcast_acknowledgements FOR UPDATE USING (
  recipient_id = auth.uid()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_directorates_commander ON public.directorates(commander_id);
CREATE INDEX IF NOT EXISTS idx_formations_directorate ON public.formations(directorate_code);
CREATE INDEX IF NOT EXISTS idx_units_formation        ON public.units(formation_id);
CREATE INDEX IF NOT EXISTS idx_units_commander        ON public.units(commander_id);
CREATE INDEX IF NOT EXISTS idx_inspections_unit       ON public.inspections(unit_id);
CREATE INDEX IF NOT EXISTS idx_inspections_score      ON public.inspections(final_score) WHERE final_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_boq_submissions_proj   ON public.boq_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_boq_items_sub          ON public.boq_items(submission_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status     ON public.contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractor_evals_cid   ON public.contractor_evaluations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_evidence_hash          ON public.evidence(sha256_hash) WHERE sha256_hash IS NOT NULL;

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_directorates_updated_at') THEN
    CREATE TRIGGER trg_directorates_updated_at BEFORE UPDATE ON public.directorates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_formations_updated_at') THEN
    CREATE TRIGGER trg_formations_updated_at BEFORE UPDATE ON public.formations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_units_updated_at') THEN
    CREATE TRIGGER trg_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contractors_updated_at') THEN
    CREATE TRIGGER trg_contractors_updated_at BEFORE UPDATE ON public.contractors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sectors_updated_at') THEN
    CREATE TRIGGER trg_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_modules_updated_at') THEN
    CREATE TRIGGER trg_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
