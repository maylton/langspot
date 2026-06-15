-- One monthly streak protection can recover yesterday when a real streak
-- existed through the day before it.
create table if not exists public.streak_freezes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  protected_date date not null,
  created_at timestamptz not null default now(),
  unique (student_id, protected_date)
);

create index if not exists streak_freezes_student_date_idx
  on public.streak_freezes(student_id, protected_date desc);

alter table public.streak_freezes enable row level security;

create policy "Students read own streak freezes"
  on public.streak_freezes for select to authenticated
  using (student_id = auth.uid());

create policy "Teachers read their students streak freezes"
  on public.streak_freezes for select to authenticated
  using (teacher_id = auth.uid());

create or replace function public.use_monthly_streak_freeze()
returns public.streak_freezes
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := (now() at time zone 'America/Fortaleza')::date;
  target_date date := today_date - 1;
  target_teacher uuid;
  result public.streak_freezes;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select teacher_id into target_teacher
  from public.profiles
  where id = auth.uid() and role = 'student';

  if not found then raise exception 'Student account required'; end if;

  if exists (
    select 1 from public.study_activities
    where student_id = auth.uid() and activity_date = target_date
  ) then raise exception 'Yesterday already has a study activity'; end if;

  if exists (
    select 1 from public.streak_freezes
    where student_id = auth.uid() and protected_date = target_date
  ) then raise exception 'Yesterday is already protected'; end if;

  if not exists (
    select 1 from public.study_activities
    where student_id = auth.uid() and activity_date = target_date - 1
  ) and not exists (
    select 1 from public.streak_freezes
    where student_id = auth.uid() and protected_date = target_date - 1
  ) then raise exception 'There is no recent streak to protect'; end if;

  if exists (
    select 1 from public.streak_freezes
    where student_id = auth.uid()
      and date_trunc('month', protected_date::timestamp) = date_trunc('month', target_date::timestamp)
  ) then raise exception 'Monthly streak protection already used'; end if;

  insert into public.streak_freezes (student_id, teacher_id, protected_date)
  values (auth.uid(), target_teacher, target_date)
  returning * into result;

  return result;
end;
$$;

revoke all on function public.use_monthly_streak_freeze() from public;
grant execute on function public.use_monthly_streak_freeze() to authenticated;
