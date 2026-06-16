alter table public.assignments
  add column if not exists submission_file_path text,
  add column if not exists submission_file_name text,
  add column if not exists submission_file_size bigint,
  add column if not exists submission_file_mime_type text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assignment-submissions', 'assignment-submissions', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant update (
  submission_text,
  submitted_at,
  submission_file_path,
  submission_file_name,
  submission_file_size,
  submission_file_mime_type,
  status
) on public.assignments to authenticated;

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

drop policy if exists "students upload own assignment submissions" on storage.objects;
create policy "students upload own assignment submissions"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "students read own assignment submissions" on storage.objects;
create policy "students read own assignment submissions"
on storage.objects for select to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "teachers read assignment submissions" on storage.objects;
create policy "teachers read assignment submissions"
on storage.objects for select to authenticated
using (
  bucket_id = 'assignment-submissions'
  and exists (
    select 1
    from public.assignments a
    where a.submission_file_path = name
      and a.teacher_id = auth.uid()
  )
);

drop policy if exists "students delete own assignment submissions" on storage.objects;
create policy "students delete own assignment submissions"
on storage.objects for delete to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);
