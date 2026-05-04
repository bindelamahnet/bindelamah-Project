create extension if not exists "pgcrypto";

create schema if not exists private;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  group_no integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_no text unique,
  name_ar text not null,
  project_type text not null check (project_type in ('electrical', 'private', 'shared', 'other')),
  group_no integer not null,
  subgroup_no integer,
  region_code text not null default '0',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_id uuid references public.companies(id),
  default_project_id uuid references public.projects(id),
  group_no integer default 0,
  subgroup_no integer,
  region_code text default '0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  wbs_code text not null unique,
  parent_wbs_code text references public.menu_items(wbs_code) on delete cascade,
  name_ar text not null,
  name_en text,
  slug text not null unique,
  full_path_ar text not null,
  level integer not null check (level > 0),
  sort_order integer not null default 0,
  group_no integer not null default 0,
  subgroup_no integer,
  requires_project boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_menu_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (role_id, menu_item_id)
);

create table if not exists public.workflow_actions (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references public.menu_items(id),
  entity_table text not null,
  entity_id uuid,
  action_type text not null check (action_type in ('create', 'update', 'delete', 'submit', 'approve', 'reject', 'transfer', 'archive')),
  from_user_id uuid references public.user_profiles(id),
  to_user_id uuid references public.user_profiles(id),
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create or replace view public.v_menu_tree
with (security_invoker = true) as
select
  mi.*,
  exists (
    select 1
    from public.menu_items child
    where child.parent_wbs_code = mi.wbs_code
      and child.is_active = true
  ) as has_children
from public.menu_items mi
where mi.is_active = true;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_profiles_updated_at on public.user_profiles;
create trigger touch_user_profiles_updated_at
before update on public.user_profiles
for each row execute function private.touch_updated_at();

drop trigger if exists touch_menu_items_updated_at on public.menu_items;
create trigger touch_menu_items_updated_at
before update on public.menu_items
for each row execute function private.touch_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_app_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  select new.id, roles.id
  from public.roles
  where roles.code = 'viewer'
  on conflict (user_id, role_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.menu_items enable row level security;
alter table public.role_menu_permissions enable row level security;
alter table public.workflow_actions enable row level security;

drop policy if exists "Anyone can read companies for login" on public.companies;
create policy "Anyone can read companies for login"
on public.companies for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can read active projects for login" on public.projects;
create policy "Anyone can read active projects for login"
on public.projects for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
on public.roles for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read permission catalog" on public.permissions;
create policy "Authenticated users can read permission catalog"
on public.permissions for select
to authenticated
using (true);

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile context" on public.user_profiles;
create policy "Users can update own profile context"
on public.user_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated users can read active menu items" on public.menu_items;
create policy "Authenticated users can read active menu items"
on public.menu_items for select
to authenticated
using (is_active = true);

drop policy if exists "Users can read permissions for assigned roles" on public.role_menu_permissions;
create policy "Users can read permissions for assigned roles"
on public.role_menu_permissions for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_id = role_menu_permissions.role_id
  )
);

drop policy if exists "Users can read own workflow actions" on public.workflow_actions;
create policy "Users can read own workflow actions"
on public.workflow_actions for select
to authenticated
using (from_user_id = auth.uid() or to_user_id = auth.uid());
