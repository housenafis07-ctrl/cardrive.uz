-- Allow a user to keep an analyzed review draft while starting a new listing.
-- Only collection/analysis states are mutually exclusive per Telegram user.
drop index if exists public.telegram_ai_listing_drafts_one_open_per_user;
create unique index telegram_ai_listing_drafts_one_open_per_user
  on public.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing');

drop index if exists news_stage.telegram_ai_listing_drafts_one_open_per_user;
create unique index telegram_ai_listing_drafts_one_open_per_user
  on news_stage.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing');
