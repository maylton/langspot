-- Tasks, student submissions and teacher feedback.
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  title text not null,
  instructions text not null default '',
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'reviewed')),
  submission_text text not null default '',
  submitted_at timestamptz,
  feedback text not null default '',
  grade numeric check (grade is null or (grade >= 0 and grade <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

drop policy if exists "teachers manage own assignments" on public.assignments;
create policy "teachers manage own assignments"
on public.assignments for all to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "students read own assignments" on public.assignments;
create policy "students read own assignments"
on public.assignments for select to authenticated
using (student_id = auth.uid());

drop policy if exists "students submit own assignments" on public.assignments;
create policy "students submit own assignments"
on public.assignments for update to authenticated
using (student_id = auth.uid() and status in ('pending', 'submitted'))
with check (student_id = auth.uid() and status = 'submitted');

-- Students can only change submission fields. Teachers retain full table access.
revoke update on public.assignments from authenticated;
grant update (submission_text, submitted_at, status) on public.assignments to authenticated;
grant select, insert, delete on public.assignments to authenticated;
grant update (title, instructions, due_date, material_id, feedback, grade, status, updated_at) on public.assignments to authenticated;

create index if not exists assignments_teacher_due_idx on public.assignments (teacher_id, due_date);
create index if not exists assignments_student_due_idx on public.assignments (student_id, due_date);

create or replace function public.protect_assignment_teacher_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.student_id and auth.uid() <> old.teacher_id then
    if new.teacher_id is distinct from old.teacher_id
      or new.student_id is distinct from old.student_id
      or new.material_id is distinct from old.material_id
      or new.title is distinct from old.title
      or new.instructions is distinct from old.instructions
      or new.due_date is distinct from old.due_date
      or new.feedback is distinct from old.feedback
      or new.grade is distinct from old.grade
      or new.created_at is distinct from old.created_at then
      raise exception 'Students may only submit their own assignment response';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_assignment_teacher_fields on public.assignments;
create trigger protect_assignment_teacher_fields
before update on public.assignments
for each row execute function public.protect_assignment_teacher_fields();
