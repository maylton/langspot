-- Minimal Supabase-compatible catalog used by the isolated assessment migration test.
create extension if not exists pgcrypto;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create schema auth;
create schema storage;
create schema private;
create table auth.users(id uuid primary key default gen_random_uuid());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create type public.user_role as enum ('teacher','student');
create table public.profiles(id uuid primary key references auth.users(id), role public.user_role not null, full_name text not null default '');
create table public.student_records(id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id), student_id uuid unique references public.profiles(id), level text not null default 'A1', skills jsonb not null default '{}');
create table public.question_bank(id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id));
create function public.teacher_has_access(target_teacher uuid default auth.uid()) returns boolean language sql stable security definer as $$ select exists(select 1 from public.profiles where id=target_teacher and role='teacher') $$;
create table storage.buckets(id text primary key, name text not null, public boolean not null default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets(id), name text not null, owner_id text, unique(bucket_id,name));
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(regexp_replace(name, '/[^/]*$', ''), '/') $$;
grant usage on schema auth, storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated, service_role;
grant select, update on public.profiles, public.student_records, public.question_bank to authenticated;

-- Notifications, as created by 20260619170000/20260619180000 (needed by assessment notification triggers).
create table public.notifications (
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
create function public.create_notification(
  target_user_id uuid, notification_kind text, notification_title text, notification_description text,
  notification_target text default 'Visão geral', notification_target_id uuid default null,
  notification_urgent boolean default false, notification_scheduled_for timestamptz default now(),
  notification_teacher_id uuid default null, notification_student_id uuid default null,
  notification_channels text[] default array['in_app']::text[], notification_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare notification_id uuid;
begin
  insert into public.notifications (user_id, teacher_id, student_id, kind, title, description, target, target_id, urgent, scheduled_for, delivery_channels, email_status, metadata)
  values (target_user_id, notification_teacher_id, notification_student_id, notification_kind, notification_title, coalesce(notification_description, ''),
    notification_target, notification_target_id, notification_urgent, coalesce(notification_scheduled_for, now()),
    coalesce(notification_channels, array['in_app']::text[]),
    case when 'email' = any(coalesce(notification_channels, array['in_app']::text[])) then 'pending' else 'skipped' end,
    coalesce(notification_metadata, '{}'::jsonb))
  returning id into notification_id;
  return notification_id;
end $$;
