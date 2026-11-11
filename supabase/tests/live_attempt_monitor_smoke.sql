-- Live attempt monitor: presence, the teacher's active list and the live status. Runs after level_check_variety_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Monitored check","description":"Do your best.","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[
    {"title":"Part one","skill":"reading","weight":1,"instructions":"Read and choose.","questions":[
      {"weight":1,"required":true,"snapshot":{"id":"m1","type":"multiple_choice","prompt":"Pick the secret","options":["Secret key","Other"],"answer":"Secret key","sourceMaterial":"A short text.","sourceCredit":"Public domain."}},
      {"weight":1,"required":true,"snapshot":{"id":"m2","type":"multiple_choice","prompt":"Pick B","options":["A","B"],"answer":"B"}}
    ]},
    {"title":"Part two","skill":"writing","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"mw","type":"writing","prompt":"Write an email.","options":[],"answer":"","responseConstraints":{"label":"100–120 words"},"rubric":[{"key":"task","label":"Task","maxScore":5}]}}
    ]},
    {"title":"Part three","skill":"speaking","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"ml","type":"speaking","prompt":"Talk with the examiner.","options":[],"answer":"","administration":"live","rubric":[{"key":"range","label":"Range","maxScore":5}]}}
    ]}
  ]}
$json$::jsonb) as monitored_id \gset
select public.publish_assessment(:'monitored_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'monitored_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as monitored_assignment \gset
select id as mq1 from public.assessment_questions where assessment_id = :'monitored_id' and question_snapshot->>'id' = 'm1' \gset
select id as mq2 from public.assessment_questions where assessment_id = :'monitored_id' and question_snapshot->>'id' = 'm2' \gset
select id as mqw from public.assessment_questions where assessment_id = :'monitored_id' and question_snapshot->>'id' = 'mw' \gset

set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.start_assessment_attempt(:'monitored_assignment','monitor-device') as monitored_attempt \gset
select public.save_assessment_response(:'monitored_attempt', :'mq1', '{"value":"Secret key"}'::jsonb);
select public.save_assessment_response(:'monitored_attempt', :'mqw', '{"value":"Dear Alex, I think you should try running."}'::jsonb);
select public.record_assessment_event(:'monitored_attempt', 'question_opened', :'mq1');
-- Before any heartbeat, the last question opened is what the student sees.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test((public.get_attempt_live_status(:'monitored_attempt')->'attempt'->>'viewingQuestionId')::uuid = :'mq1'::uuid, 'Without presence, the last opened question is shown');
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.report_assessment_presence(:'monitored_attempt', :'mq2');
reset role;
select public.assert_test((select last_seen_at is not null and viewing_question_id = :'mq2'::uuid from public.assessment_attempts where id = :'monitored_attempt'), 'Presence must be stored');

-- Another user cannot report presence, and a foreign question is rejected.
set role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.expect_error(format('select public.report_assessment_presence(%L)', :'monitored_attempt'), 'Active assessment attempt not found');
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.expect_error(format('select public.report_assessment_presence(%L,%L)', :'monitored_attempt', gen_random_uuid()), 'Question does not belong to this attempt');

-- The teacher sees the attempt in the active list with progress over the student's own questions.
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.list_active_teacher_attempts() as active_list \gset
select public.assert_test((select count(*) = 1 from jsonb_array_elements(:'active_list'::jsonb) item
  where item->>'attemptId' = :'monitored_attempt' and (item->>'delivered')::int = 3 and (item->>'answered')::int = 2 and (item->>'liveTasks')::int = 1
    and item->>'studentName' <> '' and item->>'currentSectionTitle' = 'Part one' and item->>'assessmentTitle' = 'Monitored check'), 'Active list must show progress and the current part');

select public.get_attempt_live_status(:'monitored_attempt') as live_status \gset
select public.assert_test((:'live_status'::jsonb->'attempt'->>'viewingQuestionId')::uuid = :'mq2'::uuid, 'Presence decides the question on screen');
select public.assert_test(jsonb_array_length(:'live_status'::jsonb->'sections') = 3 and jsonb_array_length(:'live_status'::jsonb->'questions') = 4, 'All delivered parts and questions are listed');
select public.assert_test((select bool_and(not (question ? 'answer') and not (question ? 'correctAnswer') and not (question ? 'explanation'))
  from jsonb_array_elements(:'live_status'::jsonb->'questions') question), 'Answer keys never leave the server');
select public.assert_test((select question->>'sourceMaterial' = 'A short text.' and question->>'sourceCredit' = 'Public domain.' and (question->>'answered')::boolean
  from jsonb_array_elements(:'live_status'::jsonb->'questions') question where (question->>'id')::uuid = :'mq1'::uuid), 'Student-facing text and progress are returned');
select public.assert_test((select (question->>'wordCount')::int = 8 and question->'responseConstraints'->>'label' = '100–120 words'
  from jsonb_array_elements(:'live_status'::jsonb->'questions') question where (question->>'id')::uuid = :'mqw'::uuid), 'Written tasks report the word count');
select public.assert_test((select (question->>'live')::boolean and question->>'prompt' = 'Talk with the examiner.'
  from jsonb_array_elements(:'live_status'::jsonb->'questions') question where question->>'type' = 'speaking'), 'Live tasks are shown to the teacher');
select public.assert_test((select section->>'instructions' = 'Read and choose.' from jsonb_array_elements(:'live_status'::jsonb->'sections') section where section->>'title' = 'Part one'), 'Part instructions are returned');

-- Other teachers see nothing.
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.expect_error(format('select public.get_attempt_live_status(%L)', :'monitored_attempt'), 'Assessment attempt not found');
select public.assert_test(not exists (select 1 from jsonb_array_elements(public.list_active_teacher_attempts()) item where item->>'attemptId' = :'monitored_attempt'), 'Other teachers must not list the attempt');

-- Submitted attempts leave the active list.
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.submit_assessment_attempt(:'monitored_attempt');
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(not exists (select 1 from jsonb_array_elements(public.list_active_teacher_attempts()) item where item->>'attemptId' = :'monitored_attempt'), 'Submitted attempts leave the active list');
reset role;
select 'live attempt monitor smoke test passed' as result;
