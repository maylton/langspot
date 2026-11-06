-- Security: the shared CEFR Pilot Bank was readable by every authenticated user.
--
-- question_bank_system_authenticated_read exposed answer and answer_key of all 300 Pilot Bank
-- units to students, i.e. the answer key of every Level Check, through a plain
-- `select` on public.question_bank from the browser. question_bank_tasklets also exposed the
-- Listening scripts (the transcripts). Only teachers with active access need the bank: students
-- receive questions through load_assessment_attempt, which never includes answers.

drop policy question_bank_system_authenticated_read on public.question_bank;
create policy question_bank_system_teacher_read
on public.question_bank for select to authenticated
using (
  source_origin = 'cefr_pilot'
  and quality_status in ('approved_for_pilot', 'approved')
  and (select public.teacher_has_access((select auth.uid())))
);

drop policy question_bank_tasklets_authenticated_read on public.question_bank_tasklets;
create policy question_bank_tasklets_teacher_read
on public.question_bank_tasklets for select to authenticated
using (
  quality_status in ('approved_for_pilot', 'approved')
  and (select public.teacher_has_access((select auth.uid())))
);
