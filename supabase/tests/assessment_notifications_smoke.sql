-- Assessment notifications. Runs after level_check_ladder_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Notified quiz","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Part","skill":"grammar","weight":1,"questions":[{"weight":1,"required":true,"snapshot":{"id":"n1","type":"multiple_choice","prompt":"Pick A","options":["A","B"],"answer":"A"}}]}]}
$json$::jsonb) as notified_id \gset
select public.publish_assessment(:'notified_id');
reset role;

-- Assigning notifies the student, in-app and by e-mail, pointing to Avaliações.
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status,due_at)
values(:'notified_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available', '2026-12-01 15:00:00-03')
returning id as notified_assignment \gset
select public.assert_test((select count(*) = 1 and bool_and(kind = 'assessment' and title = 'Nova avaliação disponível' and target = 'Avaliações'
  and description = 'Seu professor atribuiu "Notified quiz". Prazo: 01/12/2026 às 15:00.' and 'email' = any(delivery_channels) and target_id = :'notified_assignment'::uuid)
  from public.notifications where user_id = '80000000-0000-0000-0000-000000000008' and target_id = :'notified_assignment'), 'Assigning must notify the student');

-- A future availability date schedules the notification for that moment.
delete from public.assessment_assignments where id = :'notified_assignment';
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status,available_from)
values(:'notified_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','assigned', now() + interval '3 days')
returning id as later_assignment \gset
select public.assert_test((select scheduled_for > now() + interval '2 days' from public.notifications where target_id = :'later_assignment'), 'Future availability must schedule the notification');
update public.assessment_assignments set available_from = null, status = 'available' where id = :'later_assignment';

-- Submitting notifies the teacher.
select id as nq from public.assessment_questions where assessment_id = :'notified_id' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.start_assessment_attempt(:'later_assignment','notify-device') as notified_attempt \gset
select public.save_assessment_response(:'notified_attempt', :'nq', '{"value":"A"}'::jsonb);
select public.submit_assessment_attempt(:'notified_attempt');
reset role;
select public.assert_test((select count(*) = 1 and bool_and(kind = 'assessment' and title = 'Avaliação enviada' and urgent and target = 'Avaliações')
  from public.notifications where user_id = '70000000-0000-0000-0000-000000000007' and target_id = :'notified_attempt'), 'Submitting must notify the teacher');

-- Live-only forms do not tell the student to start anything alone.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Live only","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Speaking","skill":"speaking","weight":1,"questions":[{"weight":1,"required":true,"snapshot":{"id":"lv","type":"speaking","prompt":"Talk","options":[],"answer":"","administration":"live","rubric":[{"key":"range","label":"Range","maxScore":5}]}}]}]}
$json$::jsonb) as live_only_id \gset
select public.publish_assessment(:'live_only_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'live_only_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as live_assignment \gset
select public.assert_test(not exists (select 1 from public.notifications where target_id = :'live_assignment'), 'Live-only forms must not notify the student');
select 'assessment notifications smoke test passed' as result;
