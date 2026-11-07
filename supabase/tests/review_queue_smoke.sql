-- Review queue across assessments. Runs after live_assessment_smoke.sql (reuses its users).
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 0, 'Queue must start empty');

select public.save_assessment_draft($json${
  "title":"Queue check","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[
    {"title":"Objective","skill":"grammar","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"o","type":"multiple_choice","prompt":"Pick A","options":["A","B"],"answer":"A"}}
    ]},
    {"title":"Writing","skill":"writing","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"w","type":"writing","prompt":"Describe your town","options":[],"answer":"","rubric":[{"key":"task","label":"Task","maxScore":5}]}}
    ]},
    {"title":"Speaking","skill":"spoken_interaction","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"s","type":"speaking","prompt":"Plan a trip with me","options":[],"answer":"","administration":"live","rubric":[{"key":"interaction","label":"Interaction","maxScore":5}]}}
    ]}
  ]}
$json$::jsonb) as queue_assessment \gset
select public.publish_assessment(:'queue_assessment');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'queue_assessment','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as queue_assignment \gset
select id as objective_id from public.assessment_questions where assessment_id = :'queue_assessment' and question_snapshot->>'type' = 'multiple_choice' \gset
select id as writing_id from public.assessment_questions where assessment_id = :'queue_assessment' and question_snapshot->>'type' = 'writing' \gset
select id as speaking_id from public.assessment_questions where assessment_id = :'queue_assessment' and question_snapshot->>'type' = 'speaking' \gset

set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.start_assessment_attempt(:'queue_assignment','queue-device') as queue_attempt \gset
select public.save_assessment_response(:'queue_attempt',:'objective_id','{"value":"A"}'::jsonb);
select public.save_assessment_response(:'queue_attempt',:'writing_id','{"value":"My town is small."}'::jsonb);
select public.submit_assessment_attempt(:'queue_attempt');
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 0, 'Students must not see a review queue');

select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000009',false);
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 0, 'Other teachers must not see this queue');

select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 2, 'Writing and the live task must be queued');
select public.assert_test((select bool_and(item->>'studentName' = 'Live student' and item->>'assessmentTitle' = 'Queue check') from jsonb_array_elements(public.list_assessment_review_queue()->'items') item), 'Queue items must name the student and assessment');
select public.assert_test((select count(*) = 1 from jsonb_array_elements(public.list_assessment_review_queue()->'items') item where (item->>'live')::boolean and item->>'questionId' = :'speaking_id'), 'The live task must be flagged');
select public.assert_test((public.list_assessment_review_queue()->'items'->0->>'type') = 'writing', 'Items must follow delivery order');

select item->>'responseId' as writing_response from jsonb_array_elements(public.list_assessment_review_queue()->'items') item where item->>'type' = 'writing' \gset
select public.review_assessment_response(:'writing_response',0.8,'Good','{"task":4}'::jsonb);
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 1, 'Reviewed responses must leave the queue');
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'readyToFinalize') = 0, 'Attempt with a pending task is not ready');

select public.score_live_assessment_response(:'queue_attempt',:'speaking_id',0.6,'','{"interaction":3}'::jsonb,'',60);
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'items') = 0, 'Queue must be empty after live scoring');
select public.assert_test((public.list_assessment_review_queue()->'readyToFinalize'->0->>'attemptId') = :'queue_attempt', 'Fully scored attempt must be ready to finalize');
select public.finalize_assessment_review(:'queue_attempt');
select public.assert_test(jsonb_array_length(public.list_assessment_review_queue()->'readyToFinalize') = 0, 'Finalized attempts leave the queue');
reset role;
select 'review queue smoke test passed' as result;
