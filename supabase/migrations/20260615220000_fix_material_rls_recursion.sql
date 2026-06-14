-- Prevent circular RLS evaluation between materials and material_assignments.
drop policy if exists "students read assigned materials" on public.materials;
drop policy if exists "teachers manage assignments" on public.material_assignments;

create or replace function public.is_material_owner(target_material_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.materials
    where id = target_material_id
      and teacher_id = auth.uid()
  );
$$;

create or replace function public.is_material_assigned_to_current_user(target_material_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.material_assignments
    where material_id = target_material_id
      and student_id = auth.uid()
  );
$$;

revoke all on function public.is_material_owner(uuid) from public;
revoke all on function public.is_material_assigned_to_current_user(uuid) from public;
grant execute on function public.is_material_owner(uuid) to authenticated;
grant execute on function public.is_material_assigned_to_current_user(uuid) to authenticated;

create policy "students read assigned materials"
on public.materials
for select
to authenticated
using (public.is_material_assigned_to_current_user(id));

create policy "teachers manage assignments"
on public.material_assignments
for all
to authenticated
using (public.is_material_owner(material_id))
with check (public.is_material_owner(material_id));
