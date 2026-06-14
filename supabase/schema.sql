create type public.user_role as enum ('teacher', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null default '',
  teacher_id uuid references public.profiles(id) on delete cascade,
  must_change_password boolean not null default false,
  email text not null default '',
  avatar_url text not null default '',
  school_name text not null default '',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint teacher_relationship check (
    (role = 'teacher' and teacher_id is null) or
    (role = 'student' and teacher_id is not null)
  )
);

create table public.student_records (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid unique references public.profiles(id) on delete cascade,
  level text not null default 'A1',
  goal text not null default '',
  notes text not null default '',
  skills jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,
  topic text not null,
  online_url text,
  status text not null default 'scheduled',
  notes text not null default '',
  homework text not null default '',
  attendance text check (attendance is null or attendance in ('presente', 'ausente', 'remarcada')),
  skill_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type text not null,
  level text not null default 'Todos',
  skill text not null,
  url text not null,
  description text not null default '',
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  material_source text not null default 'link' check (material_source in ('link', 'upload')),
  created_at timestamptz not null default now()
);

create table public.material_assignments (
  material_id uuid references public.materials(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (material_id, student_id)
);

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 5),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  teacher_response text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (lesson_id, student_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'role', 'student') = 'teacher' then
    insert into public.profiles (id, role, full_name)
    values (new.id, 'teacher', coalesce(new.raw_user_meta_data->>'full_name', ''));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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

alter table public.profiles enable row level security;
alter table public.student_records enable row level security;
alter table public.lessons enable row level security;
alter table public.materials enable row level security;
alter table public.material_assignments enable row level security;
alter table public.cancellation_requests enable row level security;

create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "teachers read their students" on public.profiles for select using (teacher_id = auth.uid());
create policy "users update own profile" on public.profiles for update using (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, email, avatar_url, school_name, onboarding_completed) on public.profiles to authenticated;

create policy "teachers manage student records" on public.student_records for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "students read own record" on public.student_records for select using (student_id = auth.uid());

create policy "teachers manage lessons" on public.lessons for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "students read own lessons" on public.lessons for select using (student_id = auth.uid());

create policy "teachers manage materials" on public.materials for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "students read assigned materials" on public.materials for select using (
  exists (select 1 from public.material_assignments a where a.material_id = id and a.student_id = auth.uid())
);
create policy "teachers manage assignments" on public.material_assignments for all using (
  exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid())
) with check (
  exists (select 1 from public.materials m where m.id = material_id and m.teacher_id = auth.uid())
);
create policy "students read own assignments" on public.material_assignments for select using (student_id = auth.uid());

create policy "students read own cancellation requests" on public.cancellation_requests for select using (student_id = auth.uid());
create policy "students request cancellation for own future lessons" on public.cancellation_requests for insert with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.lessons lesson
    where lesson.id = lesson_id
      and lesson.student_id = auth.uid()
      and lesson.teacher_id = teacher_id
      and lesson.starts_at > now()
      and lesson.status = 'scheduled'
  )
);
create policy "teachers read cancellation requests" on public.cancellation_requests for select using (teacher_id = auth.uid());
create policy "teachers update cancellation requests" on public.cancellation_requests for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid() and status in ('approved', 'rejected'));
revoke update on public.cancellation_requests from authenticated;
grant update (status, teacher_response, resolved_at) on public.cancellation_requests to authenticated;

-- Assignments module (added in 0.7.0)
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  title text not null,
  instructions text not null default '',
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'reviewed')),
  submission_text text not null default '',
  submitted_at timestamptz,
  feedback text not null default '',
  grade numeric check (grade is null or (grade >= 0 and grade <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assignments enable row level security;
create policy "teachers manage own assignments" on public.assignments for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "students read own assignments" on public.assignments for select to authenticated using (student_id = auth.uid());
create policy "students submit own assignments" on public.assignments for update to authenticated using (student_id = auth.uid() and status in ('pending', 'submitted')) with check (student_id = auth.uid() and status = 'submitted');
create or replace function public.protect_assignment_teacher_fields() returns trigger language plpgsql security definer set search_path = public as $$ begin if auth.uid() = old.student_id and auth.uid() <> old.teacher_id then if new.teacher_id is distinct from old.teacher_id or new.student_id is distinct from old.student_id or new.material_id is distinct from old.material_id or new.title is distinct from old.title or new.instructions is distinct from old.instructions or new.due_date is distinct from old.due_date or new.feedback is distinct from old.feedback or new.grade is distinct from old.grade or new.created_at is distinct from old.created_at then raise exception 'Students may only submit their own assignment response'; end if; end if; new.updated_at = now(); return new; end; $$;
create trigger protect_assignment_teacher_fields before update on public.assignments for each row execute function public.protect_assignment_teacher_fields();
