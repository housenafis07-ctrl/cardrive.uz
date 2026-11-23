-- Verify editorial SEO migration is additive and has safe defaults.
do $$
declare
 missing text[];
begin
 select array_agg(required.column_name order by required.column_name)
 into missing
 from (values
  ('editorial_note_uz'),('editorial_note_ru'),('is_featured'),('ticker_order')
 ) as required(column_name)
 where not exists (
  select 1 from information_schema.columns c
  where c.table_schema='public'
   and c.table_name='news_articles'
   and c.column_name=required.column_name
 );
 if missing is not null then
  raise exception 'Missing editorial columns: %', missing;
 end if;
 if (select column_default from information_schema.columns where table_schema='public' and table_name='news_articles' and column_name='is_featured') not like 'false%' then
  raise exception 'is_featured must default to false';
 end if;
 if (select column_default from information_schema.columns where table_schema='public' and table_name='news_articles' and column_name='ticker_order') not like '100%' then
  raise exception 'ticker_order must default to 100';
 end if;
 if not exists (select 1 from pg_indexes where schemaname='public' and tablename='news_articles' and indexname='news_articles_featured_ticker_idx') then
  raise exception 'Missing news_articles_featured_ticker_idx';
 end if;
end
$$;

insert into public.news_articles (is_published,published_at) values (true,now());
do $$
begin
 if not exists(select 1 from public.news_articles where is_featured=false and ticker_order=100) then
  raise exception 'Editorial column defaults were not applied to existing/new article rows';
 end if;
end
$$;
