alter table public.learning_journal_entries
  add column if not exists lesson_id uuid references public.lessons(id) on delete set null;

create index if not exists learning_journal_lesson_idx
  on public.learning_journal_entries(lesson_id)
  where lesson_id is not null;
