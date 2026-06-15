-- Ensure every teacher has a subscription row and activate the 30-day trial
-- as soon as the email is confirmed. This avoids relying only on the frontend RPC.

create or replace function public.activate_teacher_trial_for_user(target_user uuid)
returns public.teacher_subscriptions
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result public.teacher_subscriptions;
  confirmed_at timestamptz;
begin
  select u.email_confirmed_at
    into confirmed_at
  from auth.users u
  where u.id = target_user;

  if not exists (
    select 1 from public.profiles p
    where p.id = target_user and p.role = 'teacher'
  ) then
    return null;
  end if;

  insert into public.teacher_subscriptions (teacher_id, plan, status)
  values (target_user, 'trial', 'pending_confirmation')
  on conflict (teacher_id) do nothing;

  if confirmed_at is not null then
    update public.teacher_subscriptions
       set status = case
                      when status = 'pending_confirmation' then 'trialing'
                      else status
                    end,
           trial_started_at = case
                                when status = 'pending_confirmation' then coalesce(trial_started_at, now())
                                else trial_started_at
                              end,
           trial_ends_at = case
                             when status = 'pending_confirmation' then coalesce(trial_ends_at, now() + interval '30 days')
                             else trial_ends_at
                           end,
           updated_at = now()
     where teacher_id = target_user;
  end if;

  update public.teacher_subscriptions
     set status = 'expired', updated_at = now()
   where teacher_id = target_user
     and status = 'trialing'
     and trial_ends_at <= now();

  select * into result
  from public.teacher_subscriptions
  where teacher_id = target_user;

  return result;
end;
$$;

revoke all on function public.activate_teacher_trial_for_user(uuid) from public;
grant execute on function public.activate_teacher_trial_for_user(uuid) to service_role;

create or replace function public.ensure_teacher_subscription()
returns public.teacher_subscriptions
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result public.teacher_subscriptions;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  ) then
    raise exception 'Teacher account required';
  end if;

  result := public.activate_teacher_trial_for_user(auth.uid());
  return result;
end;
$$;

grant execute on function public.ensure_teacher_subscription() to authenticated;

-- Triggered when Supabase confirms a user's email.
create or replace function public.handle_teacher_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.activate_teacher_trial_for_user(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_teacher_email_confirmed on auth.users;
create trigger on_teacher_email_confirmed
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_teacher_email_confirmation();

-- Backfill confirmed teacher accounts that were created after the previous migration
-- or whose frontend RPC failed silently.
insert into public.teacher_subscriptions (teacher_id, plan, status)
select p.id, 'trial', 'pending_confirmation'
from public.profiles p
where p.role = 'teacher'
on conflict (teacher_id) do nothing;

update public.teacher_subscriptions s
   set status = 'trialing',
       trial_started_at = coalesce(s.trial_started_at, now()),
       trial_ends_at = coalesce(s.trial_ends_at, now() + interval '30 days'),
       updated_at = now()
  from auth.users u, public.profiles p
 where s.teacher_id = u.id
   and p.id = u.id
   and p.role = 'teacher'
   and u.email_confirmed_at is not null
   and s.status = 'pending_confirmation';
