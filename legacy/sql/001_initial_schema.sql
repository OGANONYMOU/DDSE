create extension if not exists "pgcrypto";

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table if not exists directorates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists formations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid references formations(id),
  name text not null,
  code text not null unique
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id),
  directorate_id uuid references directorates(id),
  formation_id uuid references formations(id),
  unit_id uuid references units(id),
  appointment_number text not null unique,
  full_name text not null,
  rank text,
  password_hash text not null,
  status text not null default 'active',
  mfa_required boolean not null default true,
  mfa_secret text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists inspection_templates (
  id uuid primary key default gen_random_uuid(),
  module_code text not null,
  title text not null,
  classification text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inspection_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references inspection_templates(id) on delete cascade,
  title text not null,
  display_order integer not null
);

create table if not exists inspection_template_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references inspection_template_sections(id) on delete cascade,
  code text not null,
  prompt text not null,
  response_type text not null,
  risk_weight integer not null default 1,
  display_order integer not null
);

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references inspection_templates(id),
  formation_id uuid references formations(id),
  unit_id uuid references units(id),
  created_by uuid not null references users(id),
  status text not null default 'draft',
  classification text not null,
  submitted_at timestamptz,
  approved_at timestamptz,
  overall_score numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists inspection_responses (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  template_item_id uuid not null references inspection_template_items(id),
  response_value jsonb not null,
  remarks text,
  severity text,
  immediate_risk boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists corrective_actions (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  owner_user_id uuid references users(id),
  title text not null,
  description text,
  due_date date,
  status text not null default 'open',
  stop_work_issued boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  approver_user_id uuid not null references users(id),
  decision text not null,
  justification text,
  created_at timestamptz not null default now()
);

create table if not exists evidence_uploads (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid references inspections(id) on delete cascade,
  uploaded_by uuid not null references users(id),
  original_filename text not null,
  storage_path text not null,
  mime_type text not null,
  sha256_hash text not null,
  classification text not null default 'official',
  chain_of_custody jsonb,
  created_at timestamptz not null default now()
);

create table if not exists project_records (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id),
  contractor_name text,
  project_title text not null,
  status text not null default 'planning',
  boq_reference text,
  programme_of_work_reference text,
  risk_level text,
  created_at timestamptz not null default now()
);

create table if not exists stage_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project_records(id) on delete cascade,
  milestone_name text not null,
  amount numeric(14,2) not null,
  status text not null default 'pending',
  certified_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null,
  user_agent text,
  ip_address inet,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  classification text not null,
  old_value jsonb,
  new_value jsonb,
  justification text,
  correlation_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

insert into roles (code, name, description)
values
  ('super_admin', 'Super Admin', 'Platform-wide administration'),
  ('ddse_admin', 'DDSE Admin', 'Operational and compliance administration'),
  ('evaluator', 'Evaluator / Inspector', 'Conducts inspections and findings'),
  ('directorate_officer', 'Directorate Officer', 'Directorate-level oversight'),
  ('project_officer', 'Project Officer', 'Project monitoring and stop-work authority'),
  ('base_commander', 'Base Commander / Unit Commander', 'Approvals and corrective oversight'),
  ('base_soldier', 'Base Soldier / Field Personnel', 'Field reporting and evidence submission'),
  ('audit_reviewer', 'Audit / Compliance Reviewer', 'Independent audit and compliance review'),
  ('senior_command_readonly', 'Senior Command Read-only', 'Read-only command access')
on conflict (code) do nothing;
