-- =============================================================================
-- DDSE Migration: inspection review decisions + super-admin question templates
-- =============================================================================

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS template jsonb NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP POLICY IF EXISTS modules_super_admin_update ON public.modules;
CREATE POLICY modules_super_admin_update ON public.modules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND (up.is_platform_owner = true OR up.role_code IN ('platform_owner', 'super_admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND (up.is_platform_owner = true OR up.role_code IN ('platform_owner', 'super_admin'))
    )
  );

ALTER TABLE public.inspections
  DROP CONSTRAINT IF EXISTS inspections_status_check;

ALTER TABLE public.inspections
  ADD CONSTRAINT inspections_status_check CHECK (
    status IN (
      'draft',
      'in_progress',
      'submitted',
      'under_review',
      'approved',
      'completed',
      'rejected',
      'correction_required'
    )
  );
