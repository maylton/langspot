-- Meaningful study activity used to calculate student streaks.
create table if not exists public.study_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  activity_date date not null default ((now() at time zone 'America/Fortaleza')::date),
  activity_type text not null check (activity_type in ('lesson', 'assignment', 'journal', 'goal', 'flashcard')),
  source_id uuid not null,
  created_at timestamptz not null default now(),
  unique (student_id, activity_date, activity_type, source_id)
);

create index if not exists study_activities_student_date_idx
  on public.study_activities(student_id, activity_date desc);

alter table public.study_activities enable row level security;

create policy "Students read own study activities"
  on public.study_activities for select to authenticated
  using (student_id = auth.uid());

create policy "Teachers read their students study activities"
  on public.study_activities for select to authenticated
  using (teacher_id = auth.uid());

create or replace function public.record_study_activity(
  target_student uuid,
  target_teacher uuid,
  target_type text,
  target_source uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.study_activities (student_id, teacher_id, activity_type, source_id)
  values (target_student, target_teacher, target_type, target_source)
  on conflict (student_id, activity_date, activity_type, source_id) do nothing;
end;
$$;

revoke all on function public.record_study_activity(uuid, uuid, text, uuid) from public;

create or replace function public.track_assignment_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    perform public.record_study_activity(new.student_id, new.teacher_id, 'assignment', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.track_lesson_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.record_study_activity(new.student_id, new.teacher_id, 'lesson', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.track_journal_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.record_study_activity(new.student_id, new.teacher_id, 'journal', new.id);
  return new;
end;
$$;

create or replace function public.track_goal_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform public.record_study_activity(new.student_id, new.teacher_id, 'goal', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.track_flashcard_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  deck_teacher uuid;
begin
  select d.teacher_id into deck_teacher
  from public.flashcards c
  join public.flashcard_decks d on d.id = c.deck_id
  where c.id = new.card_id;
  perform public.record_study_activity(new.user_id, deck_teacher, 'flashcard', new.card_id);
  return new;
end;
$$;

drop trigger if exists track_assignment_study_activity on public.assignments;
create trigger track_assignment_study_activity after update on public.assignments
for each row execute function public.track_assignment_study_activity();

drop trigger if exists track_lesson_study_activity on public.lessons;
create trigger track_lesson_study_activity after update on public.lessons
for each row execute function public.track_lesson_study_activity();

drop trigger if exists track_journal_study_activity on public.learning_journal_entries;
create trigger track_journal_study_activity after insert on public.learning_journal_entries
for each row execute function public.track_journal_study_activity();

drop trigger if exists track_goal_study_activity on public.learning_goals;
create trigger track_goal_study_activity after update on public.learning_goals
for each row execute function public.track_goal_study_activity();

drop trigger if exists track_flashcard_study_activity on public.flashcard_reviews;
create trigger track_flashcard_study_activity after insert or update on public.flashcard_reviews
for each row execute function public.track_flashcard_study_activity();

-- Seed existing meaningful activity so current students do not start with an empty history.
insert into public.study_activities (student_id, teacher_id, activity_date, activity_type, source_id, created_at)
select student_id, teacher_id, (coalesce(submitted_at, created_at) at time zone 'America/Fortaleza')::date, 'assignment', id, coalesce(submitted_at, created_at)
from public.assignments where status in ('submitted', 'reviewed')
on conflict do nothing;

insert into public.study_activities (student_id, teacher_id, activity_date, activity_type, source_id, created_at)
select student_id, teacher_id, (created_at at time zone 'America/Fortaleza')::date, 'journal', id, created_at
from public.learning_journal_entries
on conflict do nothing;

insert into public.study_activities (student_id, teacher_id, activity_date, activity_type, source_id, created_at)
select student_id, teacher_id, (updated_at at time zone 'America/Fortaleza')::date, 'goal', id, updated_at
from public.learning_goals where status = 'completed'
on conflict do nothing;

insert into public.study_activities (student_id, teacher_id, activity_date, activity_type, source_id, created_at)
select l.student_id, l.teacher_id, (l.starts_at at time zone 'America/Fortaleza')::date, 'lesson', l.id, l.starts_at
from public.lessons l where l.status = 'completed'
on conflict do nothing;

insert into public.study_activities (student_id, teacher_id, activity_date, activity_type, source_id, created_at)
select r.user_id, d.teacher_id, (r.last_reviewed_at at time zone 'America/Fortaleza')::date, 'flashcard', r.card_id, r.last_reviewed_at
from public.flashcard_reviews r
join public.flashcards c on c.id = r.card_id
join public.flashcard_decks d on d.id = c.deck_id
where r.last_reviewed_at is not null
on conflict do nothing;
