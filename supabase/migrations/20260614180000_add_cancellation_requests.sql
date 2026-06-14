create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 5),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  teacher_response text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (lesson_id, student_id)
);

alter table public.cancellation_requests enable row level security;

create policy "students read own cancellation requests"
on public.cancellation_requests for select
using (student_id = auth.uid());

create policy "students request cancellation for own future lessons"
on public.cancellation_requests for insert
with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.lessons lesson
    where lesson.id = lesson_id
      and lesson.student_id = auth.uid()
      and lesson.teacher_id = teacher_id
      and lesson.starts_at > now()
      and lesson.status = 'scheduled'
  )
);

create policy "teachers read cancellation requests"
on public.cancellation_requests for select
using (teacher_id = auth.uid());

create policy "teachers update cancellation requests"
on public.cancellation_requests for update
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid() and status in ('approved', 'rejected'));

revoke update on public.cancellation_requests from authenticated;
grant update (status, teacher_response, resolved_at) on public.cancellation_requests to authenticated;
