alter table public.materials
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text,
  add column if not exists material_source text not null default 'link';

alter table public.materials
  add constraint materials_source_check check (material_source in ('link', 'upload'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materials', 'materials', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "teachers upload own material files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
);

create policy "teachers read own material files"
on storage.objects for select to authenticated
using (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "students read assigned material files"
on storage.objects for select to authenticated
using (
  bucket_id = 'materials'
  and exists (
    select 1
    from public.materials m
    join public.material_assignments a on a.material_id = m.id
    where m.storage_path = name and a.student_id = auth.uid()
  )
);

create policy "teachers delete own material files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
