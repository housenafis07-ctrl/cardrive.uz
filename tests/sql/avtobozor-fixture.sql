-- Minimal Supabase-compatible PostgreSQL fixture for Avtobozor migrations.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create type public.user_role as enum ('customer','admin','manager');
create table public.profiles (
  id uuid primary key,
  role public.user_role not null default 'customer',
  is_active boolean not null default true
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
grant select on public.profiles to authenticated, service_role;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
