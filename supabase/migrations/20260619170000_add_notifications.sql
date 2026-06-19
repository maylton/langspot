create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('lesson', 'assignment', 'quiz', 'payment', 'cancellation', 'mission', 'system')),
  title text not null,
  description text not null default '',
  target text not null default 'Visão geral',
  target_id uuid,
  urgent boolean not null default false,
  scheduled_for timestamptz not null default now(),
  read_at timestamptz,
  delivery_channels text[] not null default array['in_app']::text[],
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_scheduled_idx on public.notifications(user_id, scheduled_for desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, read_at) where read_at is null;
create index if not exists notifications_email_pending_idx on public.notifications(email_status, scheduled_for) where email_status = 'pending' and 'email' = any(delivery_channels);

alter table public.notifications enable row level security;

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.create_notification(
  target_user_id uuid,
  notification_kind text,
  notification_title text,
  notification_description text,
  notification_target text default 'Visão geral',
  notification_target_id uuid default null,
  notification_urgent boolean default false,
  notification_scheduled_for timestamptz default now(),
  notification_teacher_id uuid default null,
  notification_student_id uuid default null,
  notification_channels text[] default array['in_app']::text[],
  notification_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (
    user_id,
    teacher_id,
    student_id,
    kind,
    title,
    description,
    target,
    target_id,
    urgent,
    scheduled_for,
    delivery_channels,
    metadata
  )
  values (
    target_user_id,
    notification_teacher_id,
    notification_student_id,
    notification_kind,
    notification_title,
    coalesce(notification_description, ''),
    notification_target,
    notification_target_id,
    notification_urgent,
    coalesce(notification_scheduled_for, now()),
    coalesce(notification_channels, array['in_app']::text[]),
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

create or replace function public.notify_lesson_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_name text;
  lesson_time text;
  reminder_time timestamptz;
begin
  select coalesce(full_name, 'Aluno') into student_name from public.profiles where id = new.student_id;
  lesson_time := to_char(new.starts_at at time zone 'America/Fortaleza', 'DD/MM/YYYY HH24:MI');
  reminder_time := greatest(now(), new.starts_at - interval '2 hours');

  if tg_op = 'INSERT' and new.status = 'scheduled' then
    perform public.create_notification(
      new.student_id,
      'lesson',
      'Aula agendada',
      'Sua aula "' || coalesce(new.topic, 'Aula') || '" está marcada para ' || lesson_time || '.',
      'Aulas',
      new.id,
      false,
      now(),
      new.teacher_id,
      new.student_id
    );

    perform public.create_notification(
      new.student_id,
      'lesson',
      'Lembrete de aula',
      'Você tem aula em breve: ' || coalesce(new.topic, 'Aula') || ' às ' || lesson_time || '.',
      'Aulas',
      new.id,
      true,
      reminder_time,
      new.teacher_id,
      new.student_id
    );

    perform public.create_notification(
      new.teacher_id,
      'lesson',
      'Lembrete de aula',
      student_name || ' tem aula em breve: ' || coalesce(new.topic, 'Aula') || ' às ' || lesson_time || '.',
      'Aulas',
      new.id,
      true,
      reminder_time,
      new.teacher_id,
      new.student_id
    );
  elsif tg_op = 'UPDATE' and old.starts_at is distinct from new.starts_at and new.status = 'scheduled' then
    perform public.create_notification(
      new.student_id,
      'lesson',
      'Aula remarcada',
      'Sua aula "' || coalesce(new.topic, 'Aula') || '" agora está marcada para ' || lesson_time || '.',
      'Aulas',
      new.id,
      true,
      now(),
      new.teacher_id,
      new.student_id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'completed' then
    perform public.create_notification(
      new.student_id,
      'lesson',
      'Aula concluída',
      'Seu professor registrou a aula "' || coalesce(new.topic, 'Aula') || '".',
      'Aulas',
      new.id,
      false,
      now(),
      new.teacher_id,
      new.student_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_lesson_changes on public.lessons;
create trigger notify_lesson_changes
after insert or update on public.lessons
for each row execute function public.notify_lesson_changes();

create or replace function public.notify_assignment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_name text;
  is_quiz boolean;
  label text;
  student_target text;
  teacher_target text;
begin
  select coalesce(full_name, 'Aluno') into student_name from public.profiles where id = new.student_id;
  is_quiz := coalesce(new.assignment_type, 'regular') = 'interactive';
  label := case when is_quiz then 'quiz' else 'tarefa' end;
  student_target := case when is_quiz then 'Quiz' else 'Tarefas' end;
  teacher_target := student_target;

  if tg_op = 'INSERT' then
    perform public.create_notification(
      new.student_id,
      case when is_quiz then 'quiz' else 'assignment' end,
      case when is_quiz then 'Novo quiz disponível' else 'Nova tarefa disponível' end,
      'Seu professor enviou "' || coalesce(new.title, label) || '". Prazo: ' || to_char(new.due_date, 'DD/MM/YYYY') || '.',
      student_target,
      new.id,
      false,
      now(),
      new.teacher_id,
      new.student_id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'submitted' then
    perform public.create_notification(
      new.teacher_id,
      case when is_quiz then 'quiz' else 'assignment' end,
      case when is_quiz then 'Quiz realizado' else 'Tarefa enviada' end,
      student_name || ' enviou "' || coalesce(new.title, label) || '".',
      teacher_target,
      new.id,
      true,
      now(),
      new.teacher_id,
      new.student_id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'reviewed' then
    perform public.create_notification(
      new.student_id,
      case when is_quiz then 'quiz' else 'assignment' end,
      case when is_quiz then 'Quiz corrigido' else 'Tarefa corrigida' end,
      'Seu professor deixou feedback em "' || coalesce(new.title, label) || '".',
      student_target,
      new.id,
      false,
      now(),
      new.teacher_id,
      new.student_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_assignment_changes on public.assignments;
create trigger notify_assignment_changes
after insert or update on public.assignments
for each row execute function public.notify_assignment_changes();

create or replace function public.notify_cancellation_request_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_name text;
begin
  select coalesce(full_name, 'Aluno') into student_name from public.profiles where id = new.student_id;

  if tg_op = 'INSERT' then
    perform public.create_notification(
      new.teacher_id,
      'cancellation',
      'Pedido de cancelamento',
      student_name || ' solicitou cancelamento de uma aula.',
      'Aulas',
      new.lesson_id,
      true,
      now(),
      new.teacher_id,
      new.student_id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status in ('approved', 'rejected') then
    perform public.create_notification(
      new.student_id,
      'cancellation',
      case when new.status = 'approved' then 'Cancelamento aprovado' else 'Cancelamento recusado' end,
      case when new.status = 'approved' then 'Seu professor aprovou a solicitação de cancelamento.' else 'Seu professor respondeu sua solicitação de cancelamento.' end,
      'Aulas',
      new.lesson_id,
      false,
      now(),
      new.teacher_id,
      new.student_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_cancellation_request_changes on public.cancellation_requests;
create trigger notify_cancellation_request_changes
after insert or update on public.cancellation_requests
for each row execute function public.notify_cancellation_request_changes();
