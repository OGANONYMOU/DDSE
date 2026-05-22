-- =============================================================================
-- DDSE Migration: Expand role system from 3 → 11 roles + clearance levels
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop the old role check constraint and add the expanded one
-- ---------------------------------------------------------------------------
alter table public.personnel
  drop constraint if exists personnel_role_check;

alter table public.personnel
  add constraint personnel_role_check check (role in (
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
  ));

-- ---------------------------------------------------------------------------
-- 2. Add clearance_level as a stored generated column (auto-derived from role)
-- ---------------------------------------------------------------------------
alter table public.personnel
  add column if not exists clearance_level integer generated always as (
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
  ) stored;

-- ---------------------------------------------------------------------------
-- 3. Add command_jurisdiction for commanders (nullable — only commanders need it)
-- ---------------------------------------------------------------------------
alter table public.personnel
  add column if not exists command_jurisdiction text;

comment on column public.personnel.clearance_level     is 'Security clearance 1–6, auto-derived from role.';
comment on column public.personnel.command_jurisdiction is 'Unit/base code for commanders; null for other roles.';

-- ---------------------------------------------------------------------------
-- 4. Expand registration_approvals.requested_role_code constraint
-- ---------------------------------------------------------------------------
alter table public.registration_approvals
  drop constraint if exists registration_approvals_requested_role_code_check;

alter table public.registration_approvals
  add constraint registration_approvals_requested_role_code_check check (requested_role_code in (
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
  ));

-- ---------------------------------------------------------------------------
-- 5. Update my_role() helper — no change needed (reads role column directly)
--    Update RLS policies to reflect new role hierarchy
-- ---------------------------------------------------------------------------

-- Drop old policies that hard-code old role names
drop policy if exists "personnel_select_elevated"   on public.personnel;
drop policy if exists "personnel_update_director"   on public.personnel;
drop policy if exists "personnel_delete_director"   on public.personnel;
drop policy if exists "approvals_select_elevated"   on public.registration_approvals;
drop policy if exists "approvals_update_elevated"   on public.registration_approvals;

-- Elevated read: super_admin, director, commander, admin, auditor can view all personnel
create policy "personnel_select_elevated"
  on public.personnel for select
  using (public.my_role() in ('super_admin','director','commander','admin','auditor'));

-- System admins (super_admin, director) can update any row
create policy "personnel_update_director"
  on public.personnel for update
  using (public.my_role() in ('super_admin','director'));

-- System admins can delete personnel records
create policy "personnel_delete_director"
  on public.personnel for delete
  using (public.my_role() in ('super_admin','director'));

-- Registration queue: super_admin, director, commander, admin see full queue
create policy "approvals_select_elevated"
  on public.registration_approvals for select
  using (public.my_role() in ('super_admin','director','commander','admin'));

-- Only super_admin, director, admin can approve/reject
create policy "approvals_update_elevated"
  on public.registration_approvals for update
  using (public.my_role() in ('super_admin','director','admin'));

-- ---------------------------------------------------------------------------
-- 6. Update set_user_role() — allow super_admin and director to promote roles
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

  -- Super admins cannot be promoted by directors (only by other super admins)
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
-- 7. Update approve_registration() — recognise new elevated roles
-- ---------------------------------------------------------------------------
create or replace function public.approve_registration(
  p_approval_id uuid,
  p_decision    text,
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

  update public.registration_approvals
     set decision   = p_decision,
         notes      = p_notes,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_approval_id;

  update public.personnel
     set status = case p_decision when 'approved' then 'active' else 'suspended' end,
         role   = case p_decision when 'approved' then coalesce(v_role, 'staff') else role end
   where id = v_user_id;

  update auth.users
     set raw_user_meta_data = raw_user_meta_data ||
         jsonb_build_object(
           'status',  case p_decision when 'approved' then 'active' else 'suspended' end,
           'roleCode', case p_decision when 'approved' then coalesce(v_role, 'staff') else null end
         )
   where id = v_user_id;
end; $$;

-- ---------------------------------------------------------------------------
-- 8. Update handle_new_user trigger — default role stays 'staff'
--    (no change needed, but re-create to document the new valid roles)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  -- Sanitise incoming role — only non-privileged roles allowed on self-registration
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
    v_role,
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- 9. Index clearance_level for fast clearance-based queries
-- ---------------------------------------------------------------------------
create index if not exists idx_personnel_clearance
  on public.personnel (clearance_level);
