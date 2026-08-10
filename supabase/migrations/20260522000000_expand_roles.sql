-- =============================================================================
-- DDSE Migration: Expand role system from 3 → 11 roles + clearance levels
--
-- NOTE: This migration originally targeted a `public.personnel` table and a
-- `public.my_role()` helper that were never part of the deployed schema (they
-- belonged to an early draft in schema.sql that was superseded by
-- `public.user_profiles` in 20260518113307_init_schema.sql). It failed to
-- apply. Rewritten below to target the real table/columns. The role-based RLS
-- helper functions (`my_role_code()`, `my_clearance()`, `is_admin_or_above()`)
-- and policy updates this migration originally attempted are already defined
-- correctly against `user_profiles` in 20260530000001_production_remediation.sql,
-- so they are not duplicated here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add clearance_level as a stored generated column (auto-derived from role_code)
-- ---------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists clearance_level integer generated always as (
    case role_code
      when 'platform_owner'      then 6
      when 'super_admin'         then 6
      when 'director'            then 6
      when 'commander'           then 5
      when 'admin'               then 4
      when 'armoury_officer'     then 4
      when 'auditor'             then 4
      when 'engineering_officer' then 3
      when 'safety_officer'      then 3
      when 'logistics_officer'   then 3
      when 'inspection_officer'  then 2
      when 'staff'               then 2
      else                            1
    end
  ) stored;

-- ---------------------------------------------------------------------------
-- 2. Add command_jurisdiction for commanders (nullable — only commanders need it)
-- ---------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists command_jurisdiction text;

comment on column public.user_profiles.clearance_level     is 'Security clearance 1-6, auto-derived from role_code.';
comment on column public.user_profiles.command_jurisdiction is 'Unit/base code for commanders; null for other roles.';

-- ---------------------------------------------------------------------------
-- 3. Index clearance_level for fast clearance-based queries
-- ---------------------------------------------------------------------------
create index if not exists idx_user_profiles_clearance
  on public.user_profiles (clearance_level);
