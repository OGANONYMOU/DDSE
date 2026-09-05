-- =============================================================================
-- DDSE Migration: Personnel roster — full details + super-admin actions
--
-- Fixes:
--  1. `rank_code`, `email`, `phone_number` were collected at registration but
--     never persisted to user_profiles (only buried in unreadable auth
--     metadata) — the client-side PlatformUser type and listPersonnel() query
--     already expected these columns; they were simply never added.
--  2. `status` CHECK constraint didn't allow 'deleted', so the existing
--     softDeletePersonnel() helper would fail on every call.
--  3. No column existed to support "flag personnel for review".
--  4. user_profiles_admin_update RLS policy only allowed is_platform_owner=true
--     to update any profile — role_code = 'super_admin' alone could not
--     freeze/flag/delete anyone else's profile.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add missing detail + flag columns
-- ---------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists rank_code     text,
  add column if not exists email         text,
  add column if not exists phone_number  text,
  add column if not exists flagged       boolean not null default false,
  add column if not exists flagged_reason text,
  add column if not exists flagged_at    timestamptz,
  add column if not exists flagged_by    uuid references auth.users(id) on delete set null;

comment on column public.user_profiles.rank_code      is 'Military rank code, set at registration.';
comment on column public.user_profiles.email           is 'Real contact email (distinct from the internal auth alias).';
comment on column public.user_profiles.phone_number     is 'Contact phone number, set at registration.';
comment on column public.user_profiles.flagged          is 'Flagged for review by an admin/super-admin.';
comment on column public.user_profiles.flagged_reason   is 'Free-text reason recorded when flagging a profile.';

-- ---------------------------------------------------------------------------
-- 2. Backfill existing rows from auth.users metadata (one-time, idempotent)
-- ---------------------------------------------------------------------------
update public.user_profiles up
set rank_code    = coalesce(up.rank_code,    au.raw_user_meta_data->>'rankCode'),
    email        = coalesce(up.email,        au.raw_user_meta_data->>'email'),
    phone_number = coalesce(up.phone_number, au.raw_user_meta_data->>'phoneNumber')
from auth.users au
where au.id = up.id
  and (up.rank_code is null or up.email is null or up.phone_number is null);

-- ---------------------------------------------------------------------------
-- 3. Persist rank/email/phone for future signups too
-- ---------------------------------------------------------------------------
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
    must_change_password,
    rank_code,
    email,
    phone_number
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'serviceNumber', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'roleCode', 'base_soldier'),
    COALESCE(NEW.raw_user_meta_data->>'directorateCode', 'unassigned'),
    'pending',
    false,
    NEW.raw_user_meta_data->>'rankCode',
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'phoneNumber'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Allow 'deleted' as a valid status (matches the existing soft-delete
--    helper's intent, which previously violated this constraint on every call)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_profiles DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_status_check
  CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'deleted'));

-- ---------------------------------------------------------------------------
-- 5. Widen the admin-update policy: super_admin (by role, not just the
--    is_platform_owner escape hatch) can now freeze/flag/delete personnel.
--    Reuses my_role_code() (SECURITY DEFINER, defined in
--    20260530000001_production_remediation.sql) to avoid RLS self-recursion.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS user_profiles_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_admin_update ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.is_platform_owner = true
    )
    OR public.my_role_code() = 'super_admin'
  );
