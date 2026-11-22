alter table public.news_articles
  add column if not exists moderation_status text not null default 'approved';

update public.news_articles
set moderation_status = case when is_published then 'approved' else 'pending' end
where moderation_status is null or moderation_status = 'approved';

alter table public.news_articles
  drop constraint if exists news_articles_moderation_status_check;

alter table public.news_articles
  add constraint news_articles_moderation_status_check
  check (moderation_status in ('pending','approved','rejected'));

create index if not exists news_articles_moderation_queue_idx
  on public.news_articles (moderation_status, created_at desc);

-- Existing published articles remain visible; new RSS imports enter the review queue.
update public.news_articles
set is_published = true
where moderation_status = 'approved';
