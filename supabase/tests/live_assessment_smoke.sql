-- Live (teacher-administered) assessment parts: delivery, isolation, scoring and completion.
\set ON_ERROR_STOP on
insert into auth.users(id) values ('70000000-0000-0000-0000-000000000007'), ('80000000-0000-0000-0000-000000000008'), ('90000000-0000-0000-0000-000000000009');
insert into public.profiles(id,role,full_name) values ('70000000-0000-0000-0000-000000000007','teacher','Live teacher'), ('80000000-0000-0000-0000-000000000008','student','Live student'), ('90000000-0000-0000-0000-000000000009','teacher','Other live teacher');
insert into public.student_records(teacher_id,student_id,level) values ('70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','A2');
create or replace function public.assert_test(condition boolean, message text) returns void language plpgsql as $$ begin if not condition then raise exception '%',message; end if; end $$;
create or replace function public.expect_error(p_sql text, p_expected text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'Expected error containing "%" but the statement succeeded', p_expected;
exception when others then
  if position(p_expected in sqlerrm) = 0 then raise exception 'Expected error containing "%", got "%"', p_expected, sqlerrm; end if;
end $$;
grant execute on function public.assert_test(boolean,text) to authenticated;
grant execute on function public.expect_error(text,text) to authenticated;

set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);

-- Live administration is limited to speaking and mediation.
select public.save_assessment_draft($json${
  "title":"Invalid live","description":"","type":"custom","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Objective","skill":"grammar","weight":1,"questions":[
    {"weight":1,"required":true,"snapshot":{"id":"x","type":"multiple_choice","prompt":"Pick","options":["A","B"],"answer":"A","administration":"live"}}
  ]}]}
$json$::jsonb) as invalid_id \gset
select public.expect_error(format('select public.publish_assessment(%L)', :'invalid_id'), 'Only speaking and mediation');

-- Mixed form: one student-answered writing task and two live tasks.
select public.save_assessment_draft($json${
  "title":"Mixed live check","description":"Writing at home, speaking live","type":"progress","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[
    {"title":"Writing","skill":"writing","weight":1,"questions":[
      {"weight":2,"required":true,"snapshot":{"id":"w","type":"writing","prompt":"Write an email","options":[],"answer":"","rubric":[{"key":"task","label":"Task","maxScore":5}]}}
    ]},
    {"title":"Interaction","skill":"spoken_interaction","weight":1,"questions":[
      {"weight":4,"required":true,"snapshot":{"id":"si","type":"speaking","prompt":"Agree on two activities with the assessor","options":[],"answer":"","administration":"live","sourceMaterial":"Four activities","rubric":[{"key":"range","label":"Range","maxScore":5},{"key":"interaction","label":"Interaction","maxScore":5}]}}
    ]},
    {"title":"Mediation","skill":"mediation","weight":1,"questions":[
      {"weight":2,"required":true,"snapshot":{"id":"m","type":"mediation","prompt":"Explain the notice","options":[],"answer":"","administration":"live","sourceMaterial":"Homework Club notice","rubric":[{"key":"relevance","label":"Relevance","maxScore":5}]}}
    ]}
  ]}
$json$::jsonb) as mixed_id \gset
select public.publish_assessment(:'mixed_id');

-- Another teacher cannot open a live session for this assessment.
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000009',false);
select public.expect_error(format('select public.open_live_assessment_session(%L,%L)', :'mixed_id', '80000000-0000-0000-0000-000000000008'), 'Assessment is not available');

-- The teacher opens the live part before the student starts; the assignment is created on demand.
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.open_live_assessment_session(:'mixed_id','80000000-0000-0000-0000-000000000008') as live_attempt \gset
select public.assert_test(public.open_live_assessment_session(:'mixed_id','80000000-0000-0000-0000-000000000008') = :'live_attempt'::uuid, 'Reopening the live session must reuse the attempt');
select public.assert_test(jsonb_array_length(public.get_live_assessment_session(:'live_attempt')->'questions') = 2, 'Live session must list only live tasks');
select public.assert_test((public.get_live_assessment_session(:'live_attempt')->>'studentQuestionCount')::integer = 1, 'Live session must count the student part');
select (q->>'id') as si_id from jsonb_array_elements(public.get_live_assessment_session(:'live_attempt')->'questions') q where q->>'type' = 'speaking' \gset
select (q->>'id') as mediation_id from jsonb_array_elements(public.get_live_assessment_session(:'live_attempt')->'questions') q where q->>'type' = 'mediation' \gset

-- Rubric validation is shared with manual review.
select public.expect_error(format('select public.score_live_assessment_response(%L,%L,3,%L,%L::jsonb)', :'live_attempt', :'si_id', '', '{"range":4}'), 'Invalid rubric score');
select public.score_live_assessment_response(:'live_attempt',:'si_id',3.2,'Good turn-taking','{"range":4,"interaction":4}'::jsonb,'Hesitated on the budget',300);
select public.assert_test((public.get_live_assessment_session(:'live_attempt')->'questions'->0->>'gradingStatus') = 'reviewed', 'Live score must be stored as reviewed');

-- The student claims the teacher-opened attempt and never sees live tasks.
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select "assignmentId" as assignment_id, "liveQuestionCount" as live_count, "liveOnly" as live_only, "requiresMicrophone" as needs_mic from public.list_student_assessments() where "assessmentId" = :'mixed_id' \gset
select public.assert_test(:'live_count'::integer = 2 and not :'live_only'::boolean and not :'needs_mic'::boolean, 'Student list must flag the live part without asking for a microphone');
select public.assert_test(public.start_assessment_attempt(:'assignment_id','student-device') = :'live_attempt'::uuid, 'Student must claim the teacher-opened attempt');
select public.assert_test(public.start_assessment_attempt(:'assignment_id','student-device') = :'live_attempt'::uuid, 'Claimed attempt must resume on the same device');
select public.assert_test(public.start_assessment_attempt(:'assignment_id','another-device') is null, 'A second device must still be a session conflict');
select public.assert_test(jsonb_array_length(public.load_assessment_attempt(:'live_attempt')->'questions') = 1, 'Student payload must hide live tasks');
select public.assert_test((public.load_assessment_attempt(:'live_attempt')->'assessment'->>'liveQuestionCount')::integer = 2, 'Student payload must count live tasks');
select public.assert_test(not (public.load_assessment_attempt(:'live_attempt')->'answers' ? :'si_id'), 'Student payload must not expose live answers');
select public.expect_error(format('select public.save_assessment_response(%L,%L,%L::jsonb)', :'live_attempt', :'si_id', '{"value":"overwrite"}'), 'administered live');
select public.expect_error(format('select public.get_speaking_upload_target(%L,%L)', :'live_attempt', :'si_id'), 'Speaking question is not available');
select public.expect_error(format('select public.complete_live_assessment_session(%L)', :'live_attempt'), 'Live session not found');
reset role;
select id as writing_id from public.assessment_questions where assessment_id = :'mixed_id' and question_snapshot->>'type' = 'writing' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.save_assessment_response(:'live_attempt',:'writing_id','{"value":"Dear Ana, ..."}'::jsonb);
select public.submit_assessment_attempt(:'live_attempt');
reset role;
select public.assert_test((select status = 'grading' from public.assessment_attempts where id = :'live_attempt'), 'Mixed attempt must wait for review');
select public.assert_test((select score = 3.2 and grading_status = 'reviewed' and answer_payload->>'notes' = 'Hesitated on the budget' from public.assessment_responses where attempt_id = :'live_attempt' and assessment_question_id = :'si_id'), 'Submission must keep the live score');
select public.assert_test((select grading_status = 'manual_review' and score is null from public.assessment_responses where attempt_id = :'live_attempt' and assessment_question_id = :'mediation_id'), 'Unscored live task must wait for the teacher');

-- The teacher can still score the remaining live task after the student submits, then finalize.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.expect_error(format('select public.complete_live_assessment_session(%L)', :'live_attempt'), 'must submit');
select public.score_live_assessment_response(:'live_attempt',:'mediation_id',1.6,'Relevant points','{"relevance":4}'::jsonb,'',120);
reset role;
select id as writing_response from public.assessment_responses where attempt_id = :'live_attempt' and assessment_question_id = :'writing_id' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.review_assessment_response(:'writing_response',1.6,'Clear','{"task":4}'::jsonb);
select public.finalize_assessment_review(:'live_attempt');
reset role;
select public.assert_test((select status = 'completed' and raw_score = 6.4 from public.assessment_attempts where id = :'live_attempt'), 'Finalized mixed attempt must include live scores');
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.expect_error(format('select public.score_live_assessment_response(%L,%L,1,%L,%L::jsonb)', :'live_attempt', :'mediation_id', '', '{"relevance":2}'), 'can no longer be scored live');

-- Live-only form: the teacher runs and completes it without any student action.
select public.save_assessment_draft($json${
  "title":"Oral interview","description":"","type":"progress","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Production","skill":"spoken_production","weight":1,"questions":[
    {"weight":1,"required":true,"snapshot":{"id":"sp","type":"speaking","prompt":"Describe your week","options":[],"answer":"","administration":"live","rubric":[{"key":"fluency","label":"Fluency","maxScore":5}]}}
  ]}]}
$json$::jsonb) as oral_id \gset
select public.publish_assessment(:'oral_id');
select public.open_live_assessment_session(:'oral_id','80000000-0000-0000-0000-000000000008') as oral_attempt \gset
select (q->>'id') as oral_question from jsonb_array_elements(public.get_live_assessment_session(:'oral_attempt')->'questions') q \gset
select public.score_live_assessment_response(:'oral_attempt',:'oral_question',0.8,'Fluent','{"fluency":4}'::jsonb,'',90);
select public.complete_live_assessment_session(:'oral_attempt');
reset role;
select public.assert_test((select status = 'completed' and raw_score = 0.8 and reviewed_at is not null from public.assessment_attempts where id = :'oral_attempt'), 'Live-only attempt must complete as reviewed when every task is scored');
select public.assert_test((select assignment.status = 'completed' from public.assessment_assignments assignment join public.assessment_attempts attempt on attempt.assessment_assignment_id = assignment.id where attempt.id = :'oral_attempt'), 'Live-only assignment must complete');
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.assert_test((select "liveOnly" from public.list_student_assessments() where "assessmentId" = :'oral_id'), 'Student list must flag live-only assessments');
reset role;
select 'live assessment smoke test passed' as result;
