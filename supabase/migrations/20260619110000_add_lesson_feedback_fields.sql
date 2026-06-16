alter table public.lessons
  add column if not exists strengths text not null default '',
  add column if not exists improvements text not null default '';
