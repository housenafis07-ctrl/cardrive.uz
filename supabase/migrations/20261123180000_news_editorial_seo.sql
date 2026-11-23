alter table public.news_articles
  add column if not exists editorial_note_uz text,
  add column if not exists editorial_note_ru text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists ticker_order integer not null default 100;

create index if not exists news_articles_featured_ticker_idx
  on public.news_articles (is_published, is_featured desc, ticker_order asc, published_at desc);
