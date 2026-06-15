-- Teacher invitation links are a platform administration capability.
-- The owner subscription identifies the single platform administrator.
create or replace function public.is_platform_admin(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.teacher_subscriptions s on s.teacher_id = p.id
    where p.id = target_user
      and p.role = 'teacher'
      and s.plan = 'owner'
  );
$$;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated, service_role;

drop policy if exists "Teachers can view invitations" on public.teacher_invitations;
drop policy if exists "Teachers can create invitations" on public.teacher_invitations;
drop policy if exists "Platform admins can view invitations" on public.teacher_invitations;
drop policy if exists "Platform admins can create invitations" on public.teacher_invitations;
drop policy if exists "Platform admins can delete invitations" on public.teacher_invitations;

create policy "Platform admins can view invitations"
  on public.teacher_invitations for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

create policy "Platform admins can create invitations"
  on public.teacher_invitations for insert
  to authenticated
  with check (
    public.is_platform_admin(auth.uid())
    and created_by = auth.uid()
  );

create policy "Platform admins can delete invitations"
  on public.teacher_invitations for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
