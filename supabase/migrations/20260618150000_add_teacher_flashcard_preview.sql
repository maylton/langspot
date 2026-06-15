-- Let a teacher inspect flashcards belonging to their own students.
-- Write permissions remain restricted to the student who owns the deck.

drop policy if exists "Teachers view student flashcard decks" on public.flashcard_decks;
create policy "Teachers view student flashcard decks"
on public.flashcard_decks for select
to authenticated
using (teacher_id = auth.uid());

drop policy if exists "Teachers view cards in student decks" on public.flashcards;
create policy "Teachers view cards in student decks"
on public.flashcards for select
to authenticated
using (exists (
  select 1
  from public.flashcard_decks decks
  where decks.id = flashcards.deck_id
    and decks.teacher_id = auth.uid()
));

drop policy if exists "Teachers view student flashcard reviews" on public.flashcard_reviews;
create policy "Teachers view student flashcard reviews"
on public.flashcard_reviews for select
to authenticated
using (exists (
  select 1
  from public.flashcards cards
  join public.flashcard_decks decks on decks.id = cards.deck_id
  where cards.id = flashcard_reviews.card_id
    and decks.teacher_id = auth.uid()
));
