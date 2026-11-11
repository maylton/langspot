-- Integrity v2: per-student Language Use draws, new client events and server-side signals.
-- Runs after section_pacing_smoke.sql (reuses users from assessment_smoke.sql and live_assessment_smoke.sql).
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.generate_assessment_from_preset('cefr-b1-level-check','pilot-0.10','variation-form') as check_id \gset
reset role;
select public.assert_test((select randomize_questions and randomize_options from public.assessments where id = :'check_id'), 'Level Checks must shuffle questions and options');
select public.assert_test((select array_agg(cefr_level || ':' || draw_count || '/' || (select count(*) from public.assessment_questions question where question.section_id = section.id) order by position) = array['A2:5/15', 'B1:10/15', 'B2:5/15'] from public.assessment_sections section where assessment_id = :'check_id' and skill = 'language_use'), 'Language Use sections must hold the level pool and draw from it');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.publish_assessment(:'check_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'check_id','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','available') returning id as assignment_a \gset
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'check_id','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','available') returning id as assignment_b \gset
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.start_assessment_attempt(:'assignment_a','integrity-a') as attempt_a \gset
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.start_assessment_attempt(:'assignment_b','integrity-b') as attempt_b \gset
reset role;
select public.assert_test((select count(*) = 20 from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id where delivered.attempt_id = :'attempt_a' and question.question_snapshot->>'skill' = 'language_use'), 'Each attempt must receive 20 Language Use items');
select public.assert_test((
  select array_agg(question.question_snapshot->>'externalId' order by question.question_snapshot->>'externalId') filter (where delivered.attempt_id = :'attempt_a')
    is distinct from array_agg(question.question_snapshot->>'externalId' order by question.question_snapshot->>'externalId') filter (where delivered.attempt_id = :'attempt_b')
  from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id
  where delivered.attempt_id in (:'attempt_a', :'attempt_b') and question.question_snapshot->>'skill' = 'language_use'
), 'Two students must receive different Language Use items');

-- A reading part finished in seconds is flagged from server timestamps.
select section.id as first_part from public.assessment_sections section where section.assessment_id = :'check_id' and section.skill = 'reading' order by position limit 1 \gset
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.start_assessment_section(:'attempt_a', :'first_part');
select public.complete_assessment_section(:'attempt_a', :'first_part');
select public.record_assessment_event(:'attempt_a', 'copy_detected', null, '{"length": 120}'::jsonb);
select public.expect_error(format('select public.record_assessment_event(%L, %L, null, %L::jsonb)', :'attempt_a', 'bulk_insert_detected', '{}'), 'Event length is required');
reset role;
select public.assert_test((select integrity_status = 'unusual_activity' from public.assessment_attempts where id = :'attempt_a'), 'Copying must mark unusual activity');
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.record_assessment_event(:'attempt_a', 'bulk_insert_detected', null, '{"length": 400, "inputType": "insertReplacementText"}'::jsonb);
select public.record_assessment_event(:'attempt_a', 'drop_detected', null, '{"length": 200}'::jsonb);
reset role;
select public.assert_test((select integrity_status = 'review_recommended' from public.assessment_attempts where id = :'attempt_a'), 'Two text insertions without typing must recommend review');
select public.assert_test((select metadata->>'inputType' = 'insertReplacementText' from public.assessment_events where attempt_id = :'attempt_a' and event_type = 'bulk_insert_detected'), 'Insertion type must be kept');
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.expect_error(format('select public.get_assessment_integrity_signals(%L)', :'attempt_a'), 'Assessment attempt not found');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.assert_test((public.get_assessment_integrity_signals(:'attempt_a')->'rapidParts'->0->>'source') = 'server', 'Rapid reading part must be flagged from server time');
select public.assert_test(jsonb_array_length(public.get_assessment_integrity_signals(:'attempt_b')->'rapidParts') = 0, 'Untouched attempt has no rapid parts');

-- Identical wrong answers between two students.
select public.save_assessment_draft($json${
  "title":"Shared answers","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Grammar","skill":"grammar","weight":1,"questions":[
    {"weight":1,"required":true,"snapshot":{"id":"s1","type":"multiple_choice","prompt":"One","options":["right","wrong"],"answer":"right"}},
    {"weight":1,"required":true,"snapshot":{"id":"s2","type":"multiple_choice","prompt":"Two","options":["right","wrong"],"answer":"right"}},
    {"weight":1,"required":true,"snapshot":{"id":"s3","type":"multiple_choice","prompt":"Three","options":["right","wrong"],"answer":"right"}},
    {"weight":1,"required":true,"snapshot":{"id":"s4","type":"multiple_choice","prompt":"Four","options":["right","wrong"],"answer":"right"}},
    {"weight":1,"required":true,"snapshot":{"id":"s5","type":"multiple_choice","prompt":"Five","options":["right","wrong"],"answer":"right"}},
    {"weight":1,"required":true,"snapshot":{"id":"s6","type":"multiple_choice","prompt":"Six","options":["right","wrong"],"answer":"right"}}
  ]}]}
$json$::jsonb) as shared_id \gset
select public.publish_assessment(:'shared_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'shared_id','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','available') returning id as shared_a \gset
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'shared_id','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','available') returning id as shared_b \gset
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.start_assessment_attempt(:'shared_a','shared-a') as shared_attempt_a \gset
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.start_assessment_attempt(:'shared_b','shared-b') as shared_attempt_b \gset
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.save_assessment_response(:'shared_attempt_a', (question->>'id')::uuid, '{"value":"wrong"}'::jsonb) from jsonb_array_elements(public.load_assessment_attempt(:'shared_attempt_a')->'questions') question;
select public.submit_assessment_attempt(:'shared_attempt_a');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.save_assessment_response(:'shared_attempt_b', (question->>'id')::uuid, '{"value":"wrong"}'::jsonb) from jsonb_array_elements(public.load_assessment_attempt(:'shared_attempt_b')->'questions') question;
select public.submit_assessment_attempt(:'shared_attempt_b');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.assert_test((public.get_assessment_integrity_signals(:'shared_attempt_a')->'sharedWrongAnswers'->0->>'sharedWrong')::integer = 6, 'Six identical wrong answers must be reported');
select public.assert_test((public.get_assessment_integrity_signals(:'shared_attempt_a')->'sharedWrongAnswers'->0->>'studentName') = 'Other student', 'The matching classmate must be named');
reset role;
select 'integrity v2 smoke test passed' as result;
