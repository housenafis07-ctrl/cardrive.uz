-- Minimal news_articles fixture to validate the additive editorial SEO migration.
create table public.news_articles (
 id uuid primary key default gen_random_uuid(),
 is_published boolean not null default false,
 published_at timestamptz
);
