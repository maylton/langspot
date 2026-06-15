alter table public.student_records
  add column if not exists age integer check (age is null or (age >= 1 and age <= 120));

create policy "teachers update their student profiles"
on public.profiles for update
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid() and role = 'student');

create policy "students update own record"
on public.student_records for update
using (student_id = auth.uid())
with check (student_id = auth.uid());

create or replace function public.protect_student_managed_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.student_id and auth.uid() <> old.teacher_id then
    new.teacher_id := old.teacher_id;
    new.student_id := old.student_id;
    new.level := old.level;
    new.notes := old.notes;
    new.skills := old.skills;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_student_managed_fields on public.student_records;
create trigger protect_student_managed_fields
before update on public.student_records
for each row execute function public.protect_student_managed_fields();
