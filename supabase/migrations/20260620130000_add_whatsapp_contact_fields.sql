alter table public.profiles
  add column if not exists whatsapp_phone text not null default '';

grant update (whatsapp_phone) on public.profiles to authenticated;
