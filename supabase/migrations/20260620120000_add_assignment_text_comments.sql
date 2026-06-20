alter table public.assignments
  add column if not exists text_comments jsonb not null default '[]'::jsonb;

grant update (text_comments) on public.assignments to authenticated;

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
      or new.text_comments is distinct from old.text_comments
      or new.created_at is distinct from old.created_at then
      raise exception 'Students may only submit their own assignment response';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
