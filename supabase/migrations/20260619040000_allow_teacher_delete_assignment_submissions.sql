drop policy if exists "teachers delete assignment submissions" on storage.objects;
create policy "teachers delete assignment submissions"
on storage.objects for delete to authenticated
using (
  bucket_id = 'assignment-submissions'
  and exists (
    select 1
    from public.assignments a
    where a.submission_file_path = name
      and a.teacher_id = auth.uid()
  )
);
