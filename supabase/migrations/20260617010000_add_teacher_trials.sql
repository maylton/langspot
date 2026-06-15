create table if not exists public.teacher_subscriptions (
  teacher_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','professional','owner')),
  status text not null default 'pending_confirmation' check (status in ('pending_confirmation','trialing','active','past_due','canceled','expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_subscriptions enable row level security;
create policy "teachers read own subscription" on public.teacher_subscriptions for select to authenticated using (teacher_id = auth.uid());

create or replace function public.teacher_has_access(target_teacher uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_subscriptions s
    where s.teacher_id = target_teacher
      and (
        s.status = 'active'
        or (s.status = 'trialing' and s.trial_ends_at > now())
      )
  );
$$;

revoke all on function public.teacher_has_access(uuid) from public;
grant execute on function public.teacher_has_access(uuid) to authenticated, service_role;

create or replace function public.ensure_teacher_subscription()
returns public.teacher_subscriptions
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result public.teacher_subscriptions;
  confirmed_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher') then raise exception 'Teacher account required'; end if;

  select email_confirmed_at into confirmed_at from auth.users where id = auth.uid();
  insert into public.teacher_subscriptions (teacher_id, plan, status)
  values (auth.uid(), 'trial', 'pending_confirmation')
  on conflict (teacher_id) do nothing;

  if confirmed_at is not null then
    update public.teacher_subscriptions
      set status = case when status = 'pending_confirmation' then 'trialing' else status end,
          trial_started_at = coalesce(trial_started_at, now()),
          trial_ends_at = coalesce(trial_ends_at, now() + interval '30 days'),
          updated_at = now()
    where teacher_id = auth.uid();
  end if;

  update public.teacher_subscriptions
    set status = 'expired', updated_at = now()
  where teacher_id = auth.uid() and status = 'trialing' and trial_ends_at <= now();

  select * into result from public.teacher_subscriptions where teacher_id = auth.uid();
  return result;
end;
$$;

grant execute on function public.ensure_teacher_subscription() to authenticated;

-- Existing owner keeps permanent access; all other existing teachers receive 30 days from migration.
insert into public.teacher_subscriptions (teacher_id, plan, status, trial_started_at, trial_ends_at)
select p.id,
       case when lower(coalesce(u.email,'')) = 'maylton.fernandes@gmail.com' then 'owner' else 'trial' end,
       case when lower(coalesce(u.email,'')) = 'maylton.fernandes@gmail.com' then 'active' else 'trialing' end,
       case when lower(coalesce(u.email,'')) = 'maylton.fernandes@gmail.com' then null else now() end,
       case when lower(coalesce(u.email,'')) = 'maylton.fernandes@gmail.com' then null else now() + interval '30 days' end
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'teacher'
on conflict (teacher_id) do nothing;

-- New teacher profiles start pending email confirmation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'role', 'student') = 'teacher' then
    insert into public.profiles (id, role, full_name, email)
    values (new.id, 'teacher', coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''));
    insert into public.teacher_subscriptions (teacher_id, plan, status)
    values (new.id, 'trial', 'pending_confirmation')
    on conflict (teacher_id) do nothing;
  end if;
  return new;
end;
$$;

-- Enforce paid/trial write access while preserving read-only access after expiration.
drop policy if exists "teachers manage student records" on public.student_records;
drop policy if exists "teachers read student records" on public.student_records;
drop policy if exists "teachers insert student records" on public.student_records;
drop policy if exists "teachers update student records" on public.student_records;
drop policy if exists "teachers delete student records" on public.student_records;
create policy "teachers read student records" on public.student_records for select using (teacher_id = auth.uid());
create policy "teachers insert student records" on public.student_records for insert with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers update student records" on public.student_records for update using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid())) with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers delete student records" on public.student_records for delete using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));

drop policy if exists "teachers manage lessons" on public.lessons;
drop policy if exists "teachers read lessons" on public.lessons;
drop policy if exists "teachers insert lessons" on public.lessons;
drop policy if exists "teachers update lessons" on public.lessons;
drop policy if exists "teachers delete lessons" on public.lessons;
create policy "teachers read lessons" on public.lessons for select using (teacher_id = auth.uid());
create policy "teachers insert lessons" on public.lessons for insert with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers update lessons" on public.lessons for update using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid())) with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers delete lessons" on public.lessons for delete using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));

drop policy if exists "teachers manage materials" on public.materials;
drop policy if exists "teachers read materials" on public.materials;
drop policy if exists "teachers insert materials" on public.materials;
drop policy if exists "teachers update materials" on public.materials;
drop policy if exists "teachers delete materials" on public.materials;
create policy "teachers read materials" on public.materials for select using (teacher_id = auth.uid());
create policy "teachers insert materials" on public.materials for insert with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers update materials" on public.materials for update using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid())) with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers delete materials" on public.materials for delete using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));

drop policy if exists "teachers manage assignments" on public.material_assignments;
drop policy if exists "teachers read material assignments" on public.material_assignments;
drop policy if exists "teachers insert material assignments" on public.material_assignments;
drop policy if exists "teachers delete material assignments" on public.material_assignments;
create policy "teachers read material assignments" on public.material_assignments for select using (exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid()));
create policy "teachers insert material assignments" on public.material_assignments for insert with check (public.teacher_has_access(auth.uid()) and exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid()));
create policy "teachers delete material assignments" on public.material_assignments for delete using (public.teacher_has_access(auth.uid()) and exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid()));

drop policy if exists "teachers manage own assignments" on public.assignments;
drop policy if exists "teachers read own assignments" on public.assignments;
drop policy if exists "teachers insert own assignments" on public.assignments;
drop policy if exists "teachers update own assignments" on public.assignments;
drop policy if exists "teachers delete own assignments" on public.assignments;
create policy "teachers read own assignments" on public.assignments for select to authenticated using (teacher_id = auth.uid());
create policy "teachers insert own assignments" on public.assignments for insert to authenticated with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers update own assignments" on public.assignments for update to authenticated using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid())) with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers delete own assignments" on public.assignments for delete to authenticated using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));

drop policy if exists "teachers manage own payments" on public.payments;
create policy "teachers read own payments" on public.payments for select to authenticated using (teacher_id = auth.uid());
create policy "teachers insert own payments" on public.payments for insert to authenticated with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers update own payments" on public.payments for update to authenticated using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid())) with check (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
create policy "teachers delete own payments" on public.payments for delete to authenticated using (teacher_id = auth.uid() and public.teacher_has_access(auth.uid()));
