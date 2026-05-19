-- DDSE Supabase Backend Schema
-- Comprehensive PostgreSQL schema for auth, users, inspections, and operations

-- ============================================================================
-- USER & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  service_number text NOT NULL UNIQUE,
  role_code text NOT NULL DEFAULT 'base_soldier',
  directorate_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  mfa_required boolean NOT NULL DEFAULT false,
  mfa_enrolled boolean NOT NULL DEFAULT false,
  must_change_password boolean NOT NULL DEFAULT false,
  is_platform_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registration_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role_code text NOT NULL,
  directorate_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_by uuid REFERENCES auth.users(id),
  decision_notes text,
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz
);

-- ============================================================================
-- CATALOG & MODULE DEFINITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.modules (
  code text PRIMARY KEY,
  title text NOT NULL,
  description text,
  classification text DEFAULT 'general' CHECK (classification IN ('general', 'restricted_security', 'restricted_armoury')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INSPECTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code text NOT NULL REFERENCES public.modules(code),
  title text NOT NULL,
  directorate_code text NOT NULL,
  formation_code text,
  unit_code text,
  subject_name text,
  subject_reference text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'under_review', 'approved', 'completed', 'rejected')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_sections (
  id text PRIMARY KEY,
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  title text NOT NULL,
  display_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.inspection_items (
  id text PRIMARY KEY,
  section_id text NOT NULL REFERENCES public.inspection_sections(id) ON DELETE CASCADE,
  code text,
  prompt text,
  weight integer DEFAULT 10,
  response_type text CHECK (response_type IN ('yes_no', 'score_5', 'narrative', 'checklist')),
  UNIQUE(section_id, id)
);

CREATE TABLE IF NOT EXISTS public.inspection_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  response_value text,
  numeric_score numeric(3,2),
  severity text CHECK (severity IN ('critical', 'major', 'minor', 'observation')),
  immediate_risk boolean DEFAULT false,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(inspection_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_id text,
  title text NOT NULL,
  detail text,
  severity text NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'observation')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'verified')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  stop_work_issued boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES public.findings(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.review_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  body text NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- EVIDENCE & STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  section_id text,
  item_id text,
  file_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL,
  classification text DEFAULT 'official' CHECK (classification IN ('official', 'confidential', 'secret')),
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_service_number ON public.user_profiles(service_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_code ON public.user_profiles(role_code);
CREATE INDEX IF NOT EXISTS idx_registration_approvals_status ON public.registration_approvals(status);
CREATE INDEX IF NOT EXISTS idx_registration_approvals_user_id ON public.registration_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_module_code ON public.inspections(module_code);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_created_by ON public.inspections(created_by);
CREATE INDEX IF NOT EXISTS idx_inspections_directorate ON public.inspections(directorate_code);
CREATE INDEX IF NOT EXISTS idx_inspection_responses_inspection_id ON public.inspection_responses(inspection_id);
CREATE INDEX IF NOT EXISTS idx_findings_inspection_id ON public.findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON public.findings(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_inspection_id ON public.corrective_actions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_inspection_id ON public.review_comments(inspection_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_finding_id ON public.review_comments(finding_id);
CREATE INDEX IF NOT EXISTS idx_evidence_inspection_id ON public.evidence(inspection_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY user_profiles_self_read ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_profiles_authenticated_read ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY user_profiles_self_insert ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY user_profiles_admin_update ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
  );

-- registration_approvals
CREATE POLICY registration_approvals_self_read ON public.registration_approvals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY registration_approvals_self_insert ON public.registration_approvals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY registration_approvals_admin_all ON public.registration_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
  );

-- modules: readable by all authenticated users
CREATE POLICY modules_read ON public.modules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- inspections
CREATE POLICY inspections_creator_read ON public.inspections
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY inspections_directorate_read ON public.inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.directorate_code = inspections.directorate_code
    )
  );

CREATE POLICY inspections_admin_read ON public.inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
  );

CREATE POLICY inspections_insert ON public.inspections
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY inspections_creator_update ON public.inspections
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY inspections_admin_update ON public.inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
  );

-- inspection_sections
CREATE POLICY inspection_sections_read ON public.inspection_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_sections.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY inspection_sections_insert ON public.inspection_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_sections.inspection_id AND i.created_by = auth.uid()
    )
  );

-- inspection_items
CREATE POLICY inspection_items_read ON public.inspection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspection_sections s
      JOIN public.inspections i ON i.id = s.inspection_id
      WHERE s.id = inspection_items.section_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY inspection_items_insert ON public.inspection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspection_sections s
      JOIN public.inspections i ON i.id = s.inspection_id
      WHERE s.id = inspection_items.section_id AND i.created_by = auth.uid()
    )
  );

-- inspection_responses
CREATE POLICY inspection_responses_read ON public.inspection_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_responses.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY inspection_responses_insert ON public.inspection_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_responses.inspection_id AND i.created_by = auth.uid()
    )
  );

CREATE POLICY inspection_responses_update ON public.inspection_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_responses.inspection_id AND i.created_by = auth.uid()
    )
  );

-- findings
CREATE POLICY findings_read ON public.findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = findings.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY findings_insert ON public.findings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = findings.inspection_id AND i.created_by = auth.uid()
    )
  );

CREATE POLICY findings_update ON public.findings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = findings.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY findings_delete ON public.findings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = findings.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

-- corrective_actions
CREATE POLICY corrective_actions_read ON public.corrective_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = corrective_actions.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY corrective_actions_insert ON public.corrective_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = corrective_actions.inspection_id AND i.created_by = auth.uid()
    )
  );

-- review_comments
CREATE POLICY review_comments_read ON public.review_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = review_comments.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.directorate_code = i.directorate_code)
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_platform_owner = true)
      )
    )
  );

CREATE POLICY review_comments_insert ON public.review_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY review_comments_update ON public.review_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- evidence
CREATE POLICY evidence_read ON public.evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = evidence.inspection_id
      AND (
        i.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND (up.directorate_code = i.directorate_code OR up.is_platform_owner = true))
      )
    )
  );

CREATE POLICY evidence_insert ON public.evidence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = evidence.inspection_id AND i.created_by = auth.uid()
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.modules (code, title, description, classification) VALUES
  ('armoury', 'Armoury Management', 'Weapons inventory and security inspections', 'restricted_armoury'),
  ('magazine', 'Magazine Operations', 'Ammunition storage and handling inspections', 'restricted_security'),
  ('general_security', 'General Security', 'Perimeter and facility security assessments', 'general'),
  ('jtf_readiness', 'JTF Readiness', 'Joint Task Force operational readiness evaluations', 'restricted_security'),
  ('personnel', 'Personnel Management', 'Human resources and welfare assessments', 'general')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- TRIGGER: Create user profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    service_number,
    role_code,
    directorate_code,
    status,
    must_change_password
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'serviceNumber', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'roleCode', 'base_soldier'),
    COALESCE(NEW.raw_user_meta_data->>'directorateCode', 'unassigned'),
    'pending',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Approve or reject registration
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_registration_decision(
  p_approval_id uuid,
  p_decision text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval public.registration_approvals;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision');
  END IF;

  SELECT * INTO v_approval FROM public.registration_approvals WHERE id = p_approval_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Approval not found');
  END IF;

  UPDATE public.registration_approvals
  SET status = p_decision, decision_by = auth.uid(), decision_notes = p_notes, decided_at = now()
  WHERE id = p_approval_id;

  IF p_decision = 'approved' THEN
    UPDATE public.user_profiles
    SET status = 'active', role_code = v_approval.requested_role_code,
        directorate_code = v_approval.directorate_code, updated_at = now()
    WHERE id = v_approval.user_id;
  ELSE
    UPDATE public.user_profiles SET status = 'inactive', updated_at = now()
    WHERE id = v_approval.user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Decision recorded');
END;
$$;

-- ============================================================================
-- FUNCTION: Validate status transition
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_valid_inspection_transition(
  p_current text,
  p_next text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (
    (p_current = 'draft'        AND p_next IN ('in_progress', 'submitted'))
    OR (p_current = 'in_progress'  AND p_next IN ('submitted', 'draft'))
    OR (p_current = 'submitted'    AND p_next IN ('under_review', 'draft'))
    OR (p_current = 'under_review' AND p_next IN ('approved', 'rejected', 'draft'))
    OR (p_current = 'approved'     AND p_next = 'completed')
    OR (p_current = 'rejected'     AND p_next = 'draft')
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Calculate inspection score
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_inspection_score(p_inspection_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_weight integer;
  v_weighted_score numeric;
BEGIN
  SELECT SUM(ii.weight) INTO v_total_weight
  FROM public.inspection_items ii
  JOIN public.inspection_sections s ON s.id = ii.section_id
  WHERE s.inspection_id = p_inspection_id;

  SELECT SUM(ir.numeric_score * ii.weight) INTO v_weighted_score
  FROM public.inspection_responses ir
  JOIN public.inspection_items ii ON ii.id = ir.item_id
  JOIN public.inspection_sections s ON s.id = ii.section_id
  WHERE s.inspection_id = p_inspection_id;

  IF v_total_weight IS NULL OR v_total_weight = 0 THEN RETURN 0; END IF;

  RETURN LEAST(ROUND((v_weighted_score / (v_total_weight * 5)) * 100, 2), 100);
END;
$$;

-- ============================================================================
-- STORAGE BUCKET: evidence
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'video/mp4','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY evidence_storage_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY evidence_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence'
    AND auth.uid() IS NOT NULL
  );
