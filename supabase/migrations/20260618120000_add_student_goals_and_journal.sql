create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'Geral',
  target_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_journal_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  mood text not null default 'good' check (mood in ('great', 'good', 'neutral', 'hard')),
  study_minutes integer not null default 0 check (study_minutes between 0 and 1440),
  new_words text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists learning_goals_student_idx on public.learning_goals(student_id, status, target_date);
create index if not exists learning_journal_student_idx on public.learning_journal_entries(student_id, created_at desc);

alter table public.learning_goals enable row level security;
alter table public.learning_journal_entries enable row level security;

create policy "Students manage their own learning goals"
on public.learning_goals for all
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "Teachers view their students learning goals"
on public.learning_goals for select
to authenticated
using (teacher_id = auth.uid());

create policy "Students manage their own learning journal"
on public.learning_journal_entries for all
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "Teachers view their students learning journal"
on public.learning_journal_entries for select
to authenticated
using (teacher_id = auth.uid());
