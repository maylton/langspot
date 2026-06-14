alter table public.profiles
add column if not exists must_change_password boolean not null default false;

create or replace function public.complete_initial_password_change()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set must_change_password = false
  where id = auth.uid() and role = 'student';
end;
$$;

revoke all on function public.complete_initial_password_change() from public;
grant execute on function public.complete_initial_password_change() to authenticated;
