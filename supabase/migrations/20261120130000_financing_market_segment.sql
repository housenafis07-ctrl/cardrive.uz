alter table public.financing_programs
  add column if not exists market_segment text not null default 'new';

alter table public.financing_programs
  drop constraint if exists financing_programs_market_segment_check;

alter table public.financing_programs
  add constraint financing_programs_market_segment_check
  check (market_segment in ('new', 'used'));

create index if not exists financing_programs_segment_active_idx
  on public.financing_programs(market_segment, is_active, bank_id);

comment on column public.financing_programs.market_segment is
  'new = new vehicle catalog financing; used = Avtobozor used-car financing. Existing programs default to new.';
