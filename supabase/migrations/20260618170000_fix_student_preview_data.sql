-- Ensure teachers can preview the real profile and all flashcard data of their own students.

drop policy if exists "Teachers view profiles of their students" on public.profiles;
create policy "Teachers view profiles of their students"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or teacher_id = auth.uid()
  or exists (
    select 1
    from public.student_records sr
    where sr.student_id = profiles.id
      and sr.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers view student flashcard decks" on public.flashcard_decks;
create policy "Teachers view student flashcard decks"
on public.flashcard_decks for select
to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1
    from public.student_records sr
    where sr.student_id = flashcard_decks.user_id
      and sr.teacher_id = auth.uid()
  )
);

drop policy if exists "Teachers view cards in student decks" on public.flashcards;
create policy "Teachers view cards in student decks"
on public.flashcards for select
to authenticated
using (exists (
  select 1
  from public.flashcard_decks decks
  join public.student_records sr on sr.student_id = decks.user_id
  where decks.id = flashcards.deck_id
    and sr.teacher_id = auth.uid()
));

drop policy if exists "Teachers view student flashcard reviews" on public.flashcard_reviews;
create policy "Teachers view student flashcard reviews"
on public.flashcard_reviews for select
to authenticated
using (exists (
  select 1
  from public.flashcards cards
  join public.flashcard_decks decks on decks.id = cards.deck_id
  join public.student_records sr on sr.student_id = decks.user_id
  where cards.id = flashcard_reviews.card_id
    and sr.teacher_id = auth.uid()
));
