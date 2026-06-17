create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  category text not null default 'Grammar' check (category in ('Grammar')),
  question_type text not null check (question_type in ('multiple_choice', 'fill_blank', 'true_false', 'ordering')),
  prompt text not null,
  options text[] not null default '{}',
  answer text not null,
  explanation text,
  created_at timestamptz not null default now()
);

alter table public.question_bank enable row level security;

drop policy if exists "teachers manage own question bank" on public.question_bank;
create policy "teachers manage own question bank"
on public.question_bank for all to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

grant select, insert, update, delete on public.question_bank to authenticated;

create index if not exists question_bank_teacher_level_category_idx
on public.question_bank (teacher_id, level, category, created_at desc);
