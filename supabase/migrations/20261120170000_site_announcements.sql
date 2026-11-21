create table if not exists public.site_announcements (
 id uuid primary key default gen_random_uuid(),
 kind text not null default 'news' check (kind in ('news','announcement')),
 title_uz text not null,
 title_ru text,
 href text,
 sort_order integer not null default 0,
 is_active boolean not null default true,
 starts_at timestamptz,
 ends_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint site_announcements_href_local check (href is null or href like '/%')
);
create index if not exists site_announcements_active_order_idx on public.site_announcements(is_active,sort_order,created_at desc);
alter table public.site_announcements enable row level security;
revoke all on public.site_announcements from anon,authenticated;
grant all on public.site_announcements to service_role;
