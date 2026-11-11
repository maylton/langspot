-- Texts and items a student has already seen. Runs after live_attempt_monitor_smoke.sql.
\set ON_ERROR_STOP on
-- Form A (no student): the student takes it and sees every Reading text and five Language Use items per level.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.generate_assessment_from_preset('cefr-a2-level-check', null, 'exposure-a') as form_a \gset
reset role;
select public.assert_test((select bank_version = 'pilot-0.8' and generated_for_student_id is null from public.assessments where id = :'form_a'), 'A null bank version uses the current pilot bank');
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'form_a','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','completed') returning id as assignment_a \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status,submitted_at) values(:'assignment_a',:'form_a','80000000-0000-0000-0000-000000000008','completed',now()) returning id as attempt_a \gset
insert into public.assessment_attempt_questions(attempt_id,assessment_question_id,position)
select :'attempt_a', chosen.id, (row_number() over (order by chosen.id)) - 1 from (
  select question.id, section.skill, row_number() over (partition by section.id order by question.position) as rank
  from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
  where question.assessment_id = :'form_a') chosen
where chosen.skill <> 'language_use' or chosen.rank <= 5;

-- Seen items are listed for the student's teacher only.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(jsonb_array_length(public.list_student_seen_items('80000000-0000-0000-0000-000000000008')) >= 16, 'Seen items must be listed for the teacher');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.expect_error(format('select public.list_student_seen_items(%L)', '80000000-0000-0000-0000-000000000008'), 'Student not found');
select public.expect_error(format('select public.generate_assessment_from_preset(%L,null,%L,%L)', 'cefr-a2-level-check', 'other-teacher', '80000000-0000-0000-0000-000000000008'), 'Student not found');

-- Exposure of form A for the same student: every fixed question is a repeat; pools still have unseen items.
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.get_assessment_student_exposure(:'form_a', '80000000-0000-0000-0000-000000000008') as exposure_a \gset
select public.assert_test((select count(*) from jsonb_array_elements(:'exposure_a'::jsonb->'fixed') item where item->>'skill' = 'reading') = 16, 'All 16 Reading questions of form A are repeats');
select public.assert_test((select bool_and((pool->>'unseen')::int = (pool->>'poolSize')::int - 5) from jsonb_array_elements(:'exposure_a'::jsonb->'pools') pool), 'Pools report unseen items');

-- Form B generated for the student avoids every text and productive task already seen.
select public.generate_assessment_from_preset('cefr-a2-level-check', null, 'exposure-b', '80000000-0000-0000-0000-000000000008') as form_b \gset
select public.assert_test(public.generate_assessment_from_preset('cefr-a2-level-check', null, 'exposure-b', '80000000-0000-0000-0000-000000000008') = :'form_b'::uuid, 'Same student and seed reuse the draft');
select public.assert_test(public.generate_assessment_from_preset('cefr-a2-level-check', null, 'exposure-b') <> :'form_b'::uuid, 'A form without student is a different draft');
reset role;
select public.assert_test((select generated_for_student_id = '80000000-0000-0000-0000-000000000008' and title like 'CEFR A2 Level Check — %' and title not like '%exposure-b%' from public.assessments where id = :'form_b'), 'Form B records the student and is titled with the name');
select public.assert_test(not exists (
  select 1 from public.assessment_questions b join public.assessment_sections section on section.id = b.section_id
  where b.assessment_id = :'form_b' and section.skill <> 'language_use'
    and exists (select 1 from public.assessment_questions a where a.assessment_id = :'form_a' and a.question_snapshot->>'externalId' = b.question_snapshot->>'externalId')),
  'Form B must not repeat texts or productive tasks of form A');
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(jsonb_array_length(public.get_assessment_student_exposure(:'form_b', '80000000-0000-0000-0000-000000000008')->'fixed') = 0, 'Form B has no fixed repeats');
reset role;

-- At attempt start, pooled Language Use draws unseen items first.
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'form_b','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as assignment_b \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status) values(:'assignment_b',:'form_b','80000000-0000-0000-0000-000000000008','in_progress') returning id as attempt_b, randomization_seed as seed_b \gset
select private.deliver_fixed_assessment_questions(:'attempt_b', :'form_b', :'seed_b');
select public.assert_test((select count(*) > 0 from public.assessment_attempt_questions d join public.assessment_questions q on q.id = d.assessment_question_id
  join public.assessment_sections s on s.id = q.section_id where d.attempt_id = :'attempt_b' and s.skill = 'language_use'), 'Language Use items are delivered');
select public.assert_test(not exists (
  select 1 from public.assessment_attempt_questions d join public.assessment_questions q on q.id = d.assessment_question_id
  join public.assessment_sections s on s.id = q.section_id
  where d.attempt_id = :'attempt_b' and s.skill = 'language_use'
    and q.question_snapshot->>'externalId' in (select item_key from private.student_seen_items('80000000-0000-0000-0000-000000000008', :'attempt_b'))),
  'The draw must prefer Language Use items the student has not seen');
select 'student item exposure smoke test passed' as result;
