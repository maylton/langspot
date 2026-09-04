-- End-to-end SQL assertions for security, multimodal grading and progress integration.
\set ON_ERROR_STOP on
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'), ('20000000-0000-0000-0000-000000000002'), ('30000000-0000-0000-0000-000000000003');
insert into public.profiles(id,role,full_name) values ('10000000-0000-0000-0000-000000000001','teacher','Teacher'), ('20000000-0000-0000-0000-000000000002','student','Student'), ('30000000-0000-0000-0000-000000000003','student','Other student');
insert into public.student_records(teacher_id,student_id,level) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','A1');
create function public.assert_test(condition boolean, message text) returns void language plpgsql as $$ begin if not condition then raise exception '%',message; end if; end $$;
grant execute on function public.assert_test(boolean,text) to authenticated;

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.save_assessment_draft($json${
  "title":"Multimodal placement","description":"Smoke","type":"placement","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Integrated","skill":"listening","weight":1,"questions":[
    {"weight":1,"required":true,"snapshot":{"id":"l","type":"listening","prompt":"Listen","options":["A","B"],"answer":"A","audioPath":"10000000-0000-0000-0000-000000000001/listening/source.webm","maxPlays":2,"transcript":"Secret transcript","transcriptVisibility":"after_submit"}},
    {"weight":1,"required":true,"snapshot":{"id":"w","type":"writing","prompt":"Write","options":[],"answer":"","rubric":[{"key":"grammar","label":"Grammar","maxScore":5}]}},
    {"weight":1,"required":true,"snapshot":{"id":"s","type":"speaking","prompt":"Speak","options":[],"answer":"","preparationSeconds":5,"recordingSeconds":30,"allowReview":true,"rubric":[{"key":"fluency","label":"Fluency","maxScore":5}]}}
  ]}]}
$json$::jsonb) as assessment_id \gset
insert into storage.objects(bucket_id,name,owner_id) values('assessment-audio','10000000-0000-0000-0000-000000000001/listening/source.webm','10000000-0000-0000-0000-000000000001');
select public.publish_assessment(:'assessment_id');
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'assessment_id','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','available') returning id as assignment_id \gset

select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.start_assessment_attempt(:'assignment_id','device-one') as attempt_id \gset
reset role;
select id as listening_id from public.assessment_questions where assessment_id=:'assessment_id' and question_snapshot->>'type'='listening' \gset
select id as writing_id from public.assessment_questions where assessment_id=:'assessment_id' and question_snapshot->>'type'='writing' \gset
select id as speaking_id from public.assessment_questions where assessment_id=:'assessment_id' and question_snapshot->>'type'='speaking' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);

select public.assert_test(public.load_assessment_attempt(:'attempt_id')::text not like '%Secret transcript%','Transcript leaked into active attempt');
select public.begin_assessment_audio_play(:'attempt_id',:'listening_id') as first_play \gset
select public.begin_assessment_audio_play(:'attempt_id',:'listening_id') as second_play \gset
select public.begin_assessment_audio_play(:'attempt_id',:'listening_id') as third_play \gset
select public.assert_test((:'first_play'::jsonb->>'allowed')::boolean and (:'second_play'::jsonb->>'allowed')::boolean and not (:'third_play'::jsonb->>'allowed')::boolean and (:'third_play'::jsonb->>'playCount')::int=2,'Play limit failed');
select public.save_assessment_response(:'attempt_id',:'listening_id','{"value":"A"}'::jsonb);
select public.save_assessment_response(:'attempt_id',:'writing_id','{"value":"A sufficiently long writing answer."}'::jsonb);
select public.get_speaking_upload_target(:'attempt_id',:'speaking_id','webm') as speaking_path \gset
insert into storage.objects(bucket_id,name,owner_id) values('assessment-audio',:'speaking_path','20000000-0000-0000-0000-000000000002');
select public.register_speaking_recording(:'attempt_id',:'speaking_id',:'speaking_path',12000);
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',false);
select public.assert_test((select count(*)=0 from storage.objects where bucket_id='assessment-audio'),'Another student accessed private assessment media');
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
select public.submit_assessment_attempt(:'attempt_id');
reset role;
select public.assert_test((select status='grading' from public.assessment_attempts where id=:'attempt_id'),'Manual review did not block completion');
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);

reset role;
select id as writing_response from public.assessment_responses where attempt_id=:'attempt_id' and assessment_question_id=:'writing_id' \gset
select id as speaking_response from public.assessment_responses where attempt_id=:'attempt_id' and assessment_question_id=:'speaking_id' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.review_assessment_response(:'writing_response',1,'Good','{"grammar":5}'::jsonb);
select public.review_assessment_response(:'speaking_response',0.8,'Clear','{"fluency":4}'::jsonb);
select public.finalize_assessment_review(:'attempt_id');
select public.confirm_assessment_level_update('20000000-0000-0000-0000-000000000002',:'attempt_id','B1');
select public.get_assessment_progress('20000000-0000-0000-0000-000000000002') as progress \gset
select public.assert_test(jsonb_array_length(:'progress'::jsonb->'history')=1 and :'progress'::jsonb->>'currentLevel'='B1','Progress integration failed');
reset role;
select public.assert_test(exists(select 1 from public.assessment_response_media where attempt_id=:'attempt_id' and retention_until > now()+interval '179 days'),'Retention metadata missing');
select 'assessment phases 10-13 smoke test passed' as result;
