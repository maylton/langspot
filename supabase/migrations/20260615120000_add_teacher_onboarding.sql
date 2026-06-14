alter table public.profiles
  add column if not exists email text not null default '',
  add column if not exists avatar_url text not null default '',
  add column if not exists school_name text not null default '',
  add column if not exists onboarding_completed boolean not null default false;

revoke update on public.profiles from authenticated;
grant update (full_name, email, avatar_url, school_name, onboarding_completed) on public.profiles to authenticated;
