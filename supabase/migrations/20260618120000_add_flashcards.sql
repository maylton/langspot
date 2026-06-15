create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null check (char_length(front) between 1 and 1000),
  back text not null check (char_length(back) between 1 and 2000),
  example text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.20),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_reviewed_at timestamptz,
  unique(card_id, user_id)
);

create index if not exists flashcard_decks_user_id_idx on public.flashcard_decks(user_id);
create index if not exists flashcards_deck_id_idx on public.flashcards(deck_id);
create index if not exists flashcard_reviews_user_due_idx on public.flashcard_reviews(user_id, due_at);

alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;

drop policy if exists "Students manage own flashcard decks" on public.flashcard_decks;
create policy "Students manage own flashcard decks"
on public.flashcard_decks for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Students manage cards in own decks" on public.flashcards;
create policy "Students manage cards in own decks"
on public.flashcards for all
to authenticated
using (exists (
  select 1 from public.flashcard_decks decks
  where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
))
with check (exists (
  select 1 from public.flashcard_decks decks
  where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
));

drop policy if exists "Students manage own flashcard reviews" on public.flashcard_reviews;
create policy "Students manage own flashcard reviews"
on public.flashcard_reviews for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.flashcards cards
    join public.flashcard_decks decks on decks.id = cards.deck_id
    where cards.id = flashcard_reviews.card_id and decks.user_id = auth.uid()
  )
);
