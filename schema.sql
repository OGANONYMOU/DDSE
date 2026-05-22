-- =============================================================================
-- DDSE Personnel System — Full RBAC SQL Schema  (v3 — 11 roles, 6 clearance levels)
-- Supabase Auth backend
-- Role hierarchy: super_admin > director > commander > admin >
--                 {armoury_officer, auditor} > {engineering_officer, safety_officer, logistics_officer} >
--                 {inspection_officer, staff}
-- Run in Supabase SQL Editor (as postgres / service_role)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0.  Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid(), crypt()

-- ---------------------------------------------------------------------------
-- 1.  Personnel profiles
--     One row per auth.users entry.  Seeded via trigger on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.personnel (
  id               uuid        primary key references auth.users (id) on delete cascade,
  full_name        text        not null,
  email            text        not null unique,                    -- real contact email
  service_number   text        not null unique,
  phone_number     text        not null,
  rank_code        text        not null default 'pte'
                                 check (rank_code in (
                                   'pte','lcpl','cpl','sgt','ssgt',
                                   'wo','mwo','awo',
                                   '2lt','lt','capt','maj','ltcol','col',
                                   'brig','mgen','ltgen','gen'
                                 )),
  directorate_code text        not null
                                 check (directorate_code in (
                                   'standard_evaluation',
                                   'safety_manual',
                                   'project_monitoring'
                                 )),
  role             text        not null default 'staff'
                                 check (role in (
                                   'super_admin',
                                   'director',
                                   'commander',
                                   'admin',
                                   'engineering_officer',
                                   'safety_officer',
                                   'armoury_officer',
                                   'logistics_officer',
                                   'inspection_officer',
                                   'staff',
                                   'auditor'
                                 )),
  clearance_level  integer     generated always as (
                                 case role
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
                               ) stored,
  command_jurisdiction text,                             -- unit/base code for commanders
  status           text        not null default 'pending'
                                 check (status in ('pending','active','suspended')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.personnel.email                is 'Real contact email — not the internal Supabase Auth alias.';
comment on column public.personnel.service_number       is 'Unique military identifier used as the login credential.';
comment on column public.personnel.role                 is 'RBAC role. super_admin/director/commander are never self-registered.';
comment on column public.personnel.clearance_level      is 'Security clearance 1–6, auto-derived from role.';
comment on column public.personnel.command_jurisdiction is 'Unit/base code — only relevant for commanders.';

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_personnel_updated_at on public.personnel;
create trigger trg_personnel_updated_at
  before update on public.personnel
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2.  Registration approval queue
-- ---------------------------------------------------------------------------
create table if not exists public.registration_approvals (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users (id) on delete cascade,
  requested_role_code  text        not null default 'staff'
                                   check (requested_role_code in (
                                     'super_admin','director','commander','admin',
                                     'engineering_officer','safety_officer','armoury_officer',
                                     'logistics_officer','inspection_officer','staff','auditor'
                                   )),
  directorate_code     text        not null,
  decision             text        check (decision in ('approved','rejected')),
  notes                text,
  decided_by           uuid        references auth.users (id),
  created_at           timestamptz not null default now(),
  decided_at           timestamptz
);

-- ---------------------------------------------------------------------------
-- 3.  Trigger: auto-populate personnel from auth.users metadata on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  -- Sanitise incoming role — privileged roles cannot be self-assigned
  v_role := coalesce(new.raw_user_meta_data->>'roleCode', 'staff');
  if v_role in ('super_admin','director','commander') then
    v_role := 'staff';
  end if;

  insert into public.personnel (
    id, full_name, email, service_number,
    phone_number, rank_code, directorate_code,
    role, status
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullName',        'Unknown'),
    coalesce(new.raw_user_meta_data->>'email',           ''),
    coalesce(new.raw_user_meta_data->>'serviceNumber',   ''),
    coalesce(new.raw_user_meta_data->>'phoneNumber',     ''),
    coalesce(new.raw_user_meta_data->>'rankCode',        'pte'),
    coalesce(new.raw_user_meta_data->>'directorateCode', 'standard_evaluation'),
    v_role,   -- validated above; super_admin/director/commander always fall back to staff
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4.  Row Level Security
-- ---------------------------------------------------------------------------
alter table public.personnel             enable row level security;
alter table public.registration_approvals enable row level security;

-- Helper: returns current user's role from personnel table
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.personnel where id = auth.uid();
$$;

-- Helper: returns current user's status
create or replace function public.my_status()
returns text language sql stable security definer as $$
  select status from public.personnel where id = auth.uid();
$$;

-- ── Personnel policies ───────────────────────────────────────────────────────

-- Users can always read their own row
create policy "personnel_select_own"
  on public.personnel for select
  using (id = auth.uid());

-- Elevated roles can read all rows
create policy "personnel_select_elevated"
  on public.personnel for select
  using (public.my_role() in ('super_admin','director','commander','admin','auditor'));

-- Users can insert their own row (trigger does this; policy enforces it)
create policy "personnel_insert_own"
  on public.personnel for insert
  with check (id = auth.uid());

-- Users can update their own non-privileged fields (full_name, phone, email)
-- Role escalation is prevented: they cannot change their own role column
create policy "personnel_update_own_safe"
  on public.personnel for update
  using (id = auth.uid())
  with check (
    role = (select role from public.personnel where id = auth.uid())
    and status = (select status from public.personnel where id = auth.uid())
  );

-- super_admin and director can update any row (including role promotion)
create policy "personnel_update_director"
  on public.personnel for update
  using (public.my_role() in ('super_admin','director'));

-- super_admin and director can delete personnel records
create policy "personnel_delete_director"
  on public.personnel for delete
  using (public.my_role() in ('super_admin','director'));

-- ── Approval queue policies ──────────────────────────────────────────────────

-- Elevated roles see the full approval queue
create policy "approvals_select_elevated"
  on public.registration_approvals for select
  using (public.my_role() in ('super_admin','director','commander','admin'));

-- Users can see their own approval entry
create policy "approvals_select_own"
  on public.registration_approvals for select
  using (user_id = auth.uid());

-- Insert allowed for the signed-up user only (triggered by registerPersonnel)
create policy "approvals_insert_own"
  on public.registration_approvals for insert
  with check (user_id = auth.uid());

-- super_admin, director, admin can approve/reject registrations
create policy "approvals_update_elevated"
  on public.registration_approvals for update
  using (public.my_role() in ('super_admin','director','admin'));

-- ---------------------------------------------------------------------------
-- 5.  Director seeding
--
--     Run this ONCE after initial deploy to create the director account.
--     Replace all <…> placeholders before executing.
--
--     The director is created directly in auth.users so no public
--     registration path ever assigns the 'director' role.
-- ---------------------------------------------------------------------------

/*  ── DIRECTOR SEED (execute manually, one-time) ──────────────────────────

-- Step 1: create the Supabase Auth user (use the Dashboard or supabase-cli)
--   supabase auth user create \
--     --email "director@ddse.local"  \   -- internal alias
--     --password "<strong-password>"
--   Then note the returned UUID as <director-uuid>.

-- Step 2: upsert the personnel row with director role
insert into public.personnel (
  id, full_name, email, service_number,
  phone_number, rank_code, directorate_code,
  role, status
) values (
  '<director-uuid>',
  'Director Name',
  '<real-contact-email>',
  '<service-number>',
  '<phone-number>',
  'col',                        -- or appropriate rank
  'standard_evaluation',
  'director',
  'active'
)
on conflict (id) do update set
  role   = 'director',
  status = 'active';

-- Step 3: also update the auth.users metadata so toPlatformUser picks it up
update auth.users
set raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'roleCode',   'director',
  'status',     'active'
)
where id = '<director-uuid>';

────────────────────────────────────────────────────────────────────────── */

-- ---------------------------------------------------------------------------
-- 6.  Approve-registration helper (callable by admin/director edge function)
-- ---------------------------------------------------------------------------
create or replace function public.approve_registration(
  p_approval_id uuid,
  p_decision    text,          -- 'approved' or 'rejected'
  p_notes       text default null
)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_dir     text;
  v_role    text;
begin
  if public.my_role() not in ('super_admin','director','admin') then
    raise exception 'Insufficient privileges to approve registrations';
  end if;
  if p_decision not in ('approved','rejected') then
    raise exception 'Invalid decision value';
  end if;

  select user_id, directorate_code, requested_role_code
    into v_user_id, v_dir, v_role
    from public.registration_approvals
   where id = p_approval_id and decision is null;

  if v_user_id is null then
    raise exception 'Approval record not found or already decided';
  end if;

  -- Record the decision
  update public.registration_approvals
     set decision   = p_decision,
         notes      = p_notes,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_approval_id;

  -- Activate/suspend and assign approved role
  update public.personnel
     set status = case p_decision when 'approved' then 'active' else 'suspended' end,
         role   = case p_decision when 'approved' then coalesce(v_role, 'staff') else role end
   where id = v_user_id;

  -- Keep auth metadata in sync
  update auth.users
     set raw_user_meta_data = raw_user_meta_data ||
         jsonb_build_object(
           'status',  case p_decision when 'approved' then 'active' else 'suspended' end,
           'roleCode', case p_decision when 'approved' then coalesce(v_role, 'staff') else null end
         )
   where id = v_user_id;
end; $$;

-- ---------------------------------------------------------------------------
-- 7.  Promote/demote role (director only)
-- ---------------------------------------------------------------------------
create or replace function public.set_user_role(
  p_target_id uuid,
  p_new_role  text
)
returns void language plpgsql security definer as $$
begin
  if public.my_role() not in ('super_admin', 'director') then
    raise exception 'Only super admins and directors may change roles';
  end if;

  if p_new_role not in (
    'super_admin','director','commander','admin',
    'engineering_officer','safety_officer','armoury_officer',
    'logistics_officer','inspection_officer','staff','auditor'
  ) then
    raise exception 'Invalid role value: %', p_new_role;
  end if;

  -- Directors cannot promote to super_admin
  if p_new_role = 'super_admin' and public.my_role() != 'super_admin' then
    raise exception 'Only super admins may promote to super admin';
  end if;

  update public.personnel
     set role = p_new_role
   where id = p_target_id;

  update auth.users
     set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('roleCode', p_new_role)
   where id = p_target_id;
end; $$;

-- ---------------------------------------------------------------------------
-- 8.  Password reset tokens
--     Populated by the `request-password-reset` edge function.
--     Verified and consumed by the `verify-password-reset` edge function.
--     Both edge functions run with the service role — no RLS required.
-- ---------------------------------------------------------------------------
create table if not exists public.password_reset_tokens (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  token_hash   text        not null,      -- bcrypt hash of the 6-digit OTP
  phone_number text        not null,      -- phone the OTP was sent to
  expires_at   timestamptz not null default (now() + interval '10 minutes'),
  used_at      timestamptz,               -- set when consumed; null = still valid
  created_at   timestamptz not null default now()
);

comment on table public.password_reset_tokens is
  'Short-lived OTP tokens for phone-verified password resets. '
  'Only accessible via service-role edge functions.';

-- Prevent duplicate active tokens for the same user — expire the old one first
create unique index if not exists idx_reset_tokens_active_user
  on public.password_reset_tokens (user_id)
  where used_at is null;

create index if not exists idx_reset_tokens_expires
  on public.password_reset_tokens (expires_at);

-- No RLS — table is only touched by service-role edge functions.
-- Public/anon roles have zero access to this table.

-- ---------------------------------------------------------------------------
-- 9.  Indexes
-- ---------------------------------------------------------------------------
create unique index if not exists idx_personnel_email          on public.personnel (email);
create unique index if not exists idx_personnel_service_number on public.personnel (service_number);
create        index if not exists idx_personnel_role           on public.personnel (role);
create        index if not exists idx_personnel_status         on public.personnel (status);
create        index if not exists idx_personnel_clearance      on public.personnel (clearance_level);
create        index if not exists idx_approvals_user_id        on public.registration_approvals (user_id);
create        index if not exists idx_approvals_decision       on public.registration_approvals (decision);

-- ---------------------------------------------------------------------------
-- 10. Edge function contracts (reference — implement in supabase/functions/)
-- ---------------------------------------------------------------------------
/*
  request-password-reset   POST  { serviceNumber, phoneNumber }
  ─────────────────────────────────────────────────────────────────────────
  1. Select personnel WHERE service_number = $1 → get user_id, phone_number
  2. Assert phone_number digits match phoneNumber digits
  3. Assert status = 'active'
  4. Generate random 6-digit OTP string
  5. Expire any existing unused token:
       UPDATE password_reset_tokens SET used_at = now()
        WHERE user_id = $user_id AND used_at IS NULL
  6. Insert new token:
       INSERT INTO password_reset_tokens (user_id, token_hash, phone_number)
       VALUES ($user_id, crypt($otp, gen_salt('bf')), $phoneNumber)
  7. Send SMS via configured provider (Twilio / Termii):
       POST https://api.twilio.com/... with body = "Your DDSE OTP: $otp"
  8. Return 200 {}

  verify-password-reset    POST  { serviceNumber, phoneNumber, otp, newPassword }
  ─────────────────────────────────────────────────────────────────────────
  1. Select personnel WHERE service_number = $1 → get user_id
  2. Select token WHERE user_id = $user_id AND used_at IS NULL
                    AND expires_at > now()
  3. Assert crypt($otp, token_hash) = token_hash  (bcrypt verify)
  4. Assert token.phone_number digits = phoneNumber digits
  5. Mark token consumed:
       UPDATE password_reset_tokens SET used_at = now() WHERE id = $token_id
  6. Reset password via admin client:
       await supabaseAdmin.auth.admin.updateUserById(user_id, { password: newPassword })
  7. Return 200 {}
*/
