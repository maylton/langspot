-- Create teacher_invitations table for managing invitation links
create table if not exists public.teacher_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  token text not null unique,
  expires_at timestamp with time zone not null,
  created_by uuid not null references public.profiles(id),
  used boolean not null default false,
  used_by uuid references public.profiles(id),
  used_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists unique_pending_teacher_invitation
  on public.teacher_invitations (lower(email))
  where used = false;

create index if not exists idx_teacher_invitations_token on public.teacher_invitations(token);
create index if not exists idx_teacher_invitations_email on public.teacher_invitations(email);
create index if not exists idx_teacher_invitations_expires_at on public.teacher_invitations(expires_at);

alter table public.teacher_invitations enable row level security;

create policy "Teachers can view invitations"
  on public.teacher_invitations for select
  using (created_by = auth.uid());

create policy "Teachers can create invitations"
  on public.teacher_invitations for insert
  with check (created_by = auth.uid());
