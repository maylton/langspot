alter table public.lessons
  add column if not exists attendance text
    check (attendance is null or attendance in ('presente', 'ausente', 'remarcada')),
  add column if not exists skill_scores jsonb not null default '{}'::jsonb;
