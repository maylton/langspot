-- Teachers delete their own assessments; results cascade and other teachers cannot delete them. Runs after section_pacing_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Disposable draft","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Part","skill":"grammar","weight":1,"questions":[{"weight":1,"required":true,"snapshot":{"id":"d1","type":"multiple_choice","prompt":"Pick A","options":["A","B"],"answer":"A"}}]}]}
$json$::jsonb) as draft_id \gset
select public.assert_test(public.get_assessment_deletion_impact(:'draft_id') = '{"assignments":0,"inProgressStudents":0,"submittedStudents":0}'::jsonb, 'A draft has nothing to lose');
select public.delete_assessment(:'draft_id');
reset role;
select public.assert_test(not exists (select 1 from public.assessments where id = :'draft_id') and not exists (select 1 from public.assessment_sections where assessment_id = :'draft_id'), 'Draft and its parts must be deleted');

set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Published to delete","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Part","skill":"grammar","weight":1,"questions":[{"weight":1,"required":true,"snapshot":{"id":"p1","type":"multiple_choice","prompt":"Pick A","options":["A","B"],"answer":"A"}}]}]}
$json$::jsonb) as published_id \gset
select public.publish_assessment(:'published_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'published_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as assignment_id \gset
select id as question_id from public.assessment_questions where assessment_id = :'published_id' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.start_assessment_attempt(:'assignment_id','delete-device') as attempt_id \gset
select public.save_assessment_response(:'attempt_id', :'question_id', '{"value":"A"}'::jsonb);
select public.expect_error(format('select public.delete_assessment(%L)', :'published_id'), 'Teacher access required');
select public.submit_assessment_attempt(:'attempt_id');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.expect_error(format('select public.delete_assessment(%L)', :'published_id'), 'Assessment not found');
select public.expect_error(format('select public.get_assessment_deletion_impact(%L)', :'published_id'), 'Assessment not found');

select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(public.get_assessment_deletion_impact(:'published_id') = '{"assignments":1,"inProgressStudents":0,"submittedStudents":1}'::jsonb, 'Impact must count the submitted student');
select public.delete_assessment(:'published_id');
reset role;
select public.assert_test(not exists (select 1 from public.assessments where id = :'published_id'), 'Published assessment must be deleted');
select public.assert_test(not exists (select 1 from public.assessment_attempts where id = :'attempt_id') and not exists (select 1 from public.assessment_responses where attempt_id = :'attempt_id') and not exists (select 1 from public.assessment_assignments where id = :'assignment_id'), 'Assignments, attempts and responses must cascade');
select 'assessment deletion smoke test passed' as result;
