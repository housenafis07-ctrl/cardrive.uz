-- Keep an analyzed draft in review while allowing the same Telegram user
-- to start a new listing. Only one collecting/analyzing draft is allowed.
drop index if exists public.telegram_ai_listing_drafts_one_open_per_user;
create unique index telegram_ai_listing_drafts_one_open_per_user
  on public.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing');

drop index if exists news_stage.telegram_ai_listing_drafts_one_open_per_user;
create unique index telegram_ai_listing_drafts_one_open_per_user
  on news_stage.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing');
