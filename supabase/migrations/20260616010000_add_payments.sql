create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  amount numeric(10,2) not null check (amount > 0),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "teachers manage own payments" on public.payments;
create policy "teachers manage own payments"
on public.payments for all to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "students read own payments" on public.payments;
create policy "students read own payments"
on public.payments for select to authenticated
using (student_id = auth.uid());

create index if not exists payments_teacher_due_idx on public.payments (teacher_id, due_date);
create index if not exists payments_student_idx on public.payments (student_id);
