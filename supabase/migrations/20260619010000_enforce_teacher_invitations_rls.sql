-- Invitation tokens and teacher emails must never be exposed through the public API.
alter table public.teacher_invitations enable row level security;
alter table public.teacher_invitations force row level security;

revoke all on table public.teacher_invitations from anon;
revoke all on table public.teacher_invitations from authenticated;

-- Authenticated access remains constrained by the platform-admin RLS policies.
grant select, delete on table public.teacher_invitations to authenticated;
