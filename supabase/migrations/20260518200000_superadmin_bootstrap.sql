-- ============================================================================
-- SUPERADMIN BOOTSTRAP
-- Grants platform_owner status to designated superadmin email addresses.
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- ============================================================================
-- 1. Store canonical superadmin emails in a config table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.superadmin_emails (
  email text PRIMARY KEY,
  added_at timestamptz DEFAULT now()
);

INSERT INTO public.superadmin_emails (email) VALUES
  ('adegbesanadebola1@gmail.com'),
  ('validdarkmode@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Only platform owners can read this table; no external write access
ALTER TABLE public.superadmin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY superadmin_emails_read ON public.superadmin_emails
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_platform_owner = true
    )
  );

-- ============================================================================
-- 2. Helper: check if an email is a designated superadmin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.superadmin_emails WHERE email = lower(p_email));
$$;

-- ============================================================================
-- 3. Update signup trigger to auto-activate superadmins
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_superadmin boolean;
  v_service_number text;
BEGIN
  v_is_superadmin := public.is_superadmin_email(NEW.email);

  -- Derive a service_number: use metadata if present, else strip domain from email
  v_service_number := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'serviceNumber', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.user_profiles (
    id,
    full_name,
    service_number,
    role_code,
    directorate_code,
    status,
    is_platform_owner,
    mfa_required,
    mfa_enrolled,
    must_change_password
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'fullName', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      'DDSE Admin'
    ),
    v_service_number,
    CASE WHEN v_is_superadmin THEN 'platform_owner' ELSE
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'roleCode', ''), 'base_soldier')
    END,
    CASE WHEN v_is_superadmin THEN 'admin' ELSE
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'directorateCode', ''), 'unassigned')
    END,
    CASE WHEN v_is_superadmin THEN 'active' ELSE 'pending' END,
    v_is_superadmin,
    false,
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    role_code          = CASE WHEN v_is_superadmin THEN 'platform_owner' ELSE user_profiles.role_code END,
    directorate_code   = CASE WHEN v_is_superadmin THEN 'admin'          ELSE user_profiles.directorate_code END,
    status             = CASE WHEN v_is_superadmin THEN 'active'         ELSE user_profiles.status END,
    is_platform_owner  = v_is_superadmin OR user_profiles.is_platform_owner,
    updated_at         = now();

  RETURN NEW;
END;
$$;

-- Re-attach trigger (replace old one)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. Promote any superadmin emails that ALREADY exist in auth.users
--    (idempotent upsert — safe on every migration run)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  v_service_number text;
BEGIN
  FOR r IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    WHERE lower(au.email) IN (
      SELECT email FROM public.superadmin_emails
    )
  LOOP
    v_service_number := COALESCE(
      NULLIF(r.raw_user_meta_data->>'serviceNumber', ''),
      split_part(r.email, '@', 1)
    );

    INSERT INTO public.user_profiles (
      id,
      full_name,
      service_number,
      role_code,
      directorate_code,
      status,
      is_platform_owner,
      mfa_required,
      mfa_enrolled,
      must_change_password
    )
    VALUES (
      r.id,
      COALESCE(
        NULLIF(r.raw_user_meta_data->>'fullName', ''),
        NULLIF(r.raw_user_meta_data->>'full_name', ''),
        'DDSE Admin'
      ),
      v_service_number,
      'platform_owner',
      'admin',
      'active',
      true,
      false,
      false,
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      role_code         = 'platform_owner',
      directorate_code  = 'admin',
      status            = 'active',
      is_platform_owner = true,
      updated_at        = now();

    RAISE NOTICE 'Superadmin privileges granted to: %', r.email;
  END LOOP;
END;
$$;

-- ============================================================================
-- 5. RLS: ensure superadmins (is_platform_owner) can always read/write
--    their own profile regardless of status
-- ============================================================================

-- Drop and recreate admin self-read to cover superadmins regardless of status
DROP POLICY IF EXISTS user_profiles_self_read ON public.user_profiles;
CREATE POLICY user_profiles_self_read ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Superadmins can update any user profile
DROP POLICY IF EXISTS user_profiles_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_admin_update ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
  );
