-- Paced assessments: part order, per-part clocks, closed parts and submission. Runs after live_assessment_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.save_assessment_draft($json${
  "title":"Paced check","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[
    {"title":"Part one","skill":"grammar","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"g1","type":"multiple_choice","prompt":"Pick A","options":["A","B"],"answer":"A"}},
      {"weight":1,"required":true,"snapshot":{"id":"g2","type":"multiple_choice","prompt":"Pick B","options":["A","B"],"answer":"B"}}
    ]},
    {"title":"Part two","skill":"writing","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"w","type":"writing","prompt":"Write","options":[],"answer":"","rubric":[{"key":"task","label":"Task","maxScore":5}]}}
    ]},
    {"title":"Part three","skill":"grammar","weight":1,"questions":[
      {"weight":1,"required":true,"snapshot":{"id":"g3","type":"multiple_choice","prompt":"Pick A again","options":["A","B"],"answer":"A"}}
    ]}
  ]}
$json$::jsonb) as paced_id \gset
select public.save_assessment_pacing(:'paced_id', '{"sectionPacing":"sections","sections":[{"timeLimitMinutes":10},{"timeLimitMinutes":null},{"timeLimitMinutes":5}]}'::jsonb);
select public.assert_test(public.get_assessment_pacing(:'paced_id') = '{"sectionPacing":"sections","sections":[{"timeLimitMinutes":10},{"timeLimitMinutes":null},{"timeLimitMinutes":5}]}'::jsonb, 'Pacing settings must round-trip');
select public.expect_error(format('select public.save_assessment_pacing(%L,%L::jsonb)', :'paced_id', '{"sectionPacing":"sections","sections":[{"timeLimitMinutes":0}]}'), 'between 1 and 240');
select public.publish_assessment(:'paced_id');
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'paced_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as paced_assignment \gset
select id as part1 from public.assessment_sections where assessment_id = :'paced_id' and position = 0 \gset
select id as part2 from public.assessment_sections where assessment_id = :'paced_id' and position = 1 \gset
select id as part3 from public.assessment_sections where assessment_id = :'paced_id' and position = 2 \gset
select id as q1 from public.assessment_questions where section_id = :'part1' and question_snapshot->>'prompt' = 'Pick A' \gset
select id as q2 from public.assessment_questions where section_id = :'part1' and question_snapshot->>'prompt' = 'Pick B' \gset
select id as qw from public.assessment_questions where section_id = :'part2' \gset
select id as q3 from public.assessment_questions where section_id = :'part3' \gset

set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.start_assessment_attempt(:'paced_assignment','paced-device') as paced_attempt \gset
reset role;
select public.assert_test((select expires_at is null from public.assessment_attempts where id = :'paced_attempt'), 'Paced attempts have no global clock');
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.assert_test((public.load_assessment_attempt(:'paced_attempt')->'assessment'->>'sectionPacing')::boolean, 'Payload must flag the paced mode');
select public.expect_error(format('select public.save_assessment_response(%L,%L,%L::jsonb)', :'paced_attempt', :'q1', '{"value":"A"}'), 'Start this part before answering');
select public.expect_error(format('select public.start_assessment_section(%L,%L)', :'paced_attempt', :'part2'), 'Finish the previous parts first');

select public.start_assessment_section(:'paced_attempt', :'part1');
reset role;
select public.assert_test((select expires_at between now() + interval '9 minutes' and now() + interval '11 minutes' from public.assessment_attempt_sections where attempt_id = :'paced_attempt' and section_id = :'part1'), 'Part clock must start when the part opens');
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.assert_test((public.start_assessment_section(:'paced_attempt', :'part1')->>'startedAt') is not null, 'Reopening an open part must resume it');
select public.save_assessment_response(:'paced_attempt', :'q1', '{"value":"A"}'::jsonb);
select public.save_assessment_response(:'paced_attempt', :'q2', '{"value":"A"}'::jsonb);
select public.complete_assessment_section(:'paced_attempt', :'part1');
select public.expect_error(format('select public.save_assessment_response(%L,%L,%L::jsonb)', :'paced_attempt', :'q2', '{"value":"B"}'), 'This part is closed');
select public.expect_error(format('select public.start_assessment_section(%L,%L)', :'paced_attempt', :'part1'), 'This part is closed');
select public.expect_error(format('select public.submit_assessment_attempt(%L)', :'paced_attempt'), 'Complete every part before submitting');

-- The student stops here and comes back later: part two has no time limit.
select public.start_assessment_section(:'paced_attempt', :'part2');
reset role;
select public.assert_test((select expires_at is null from public.assessment_attempt_sections where attempt_id = :'paced_attempt' and section_id = :'part2'), 'Untimed part must have no clock');
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.save_assessment_response(:'paced_attempt', :'qw', '{"value":"My answer"}'::jsonb);
select public.complete_assessment_section(:'paced_attempt', :'part2');

select public.start_assessment_section(:'paced_attempt', :'part3');
reset role;
update public.assessment_attempt_sections set started_at = now() - interval '10 minutes', expires_at = now() - interval '1 second' where attempt_id = :'paced_attempt' and section_id = :'part3';
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.expect_error(format('select public.save_assessment_response(%L,%L,%L::jsonb)', :'paced_attempt', :'q3', '{"value":"A"}'), 'This part is closed');
select public.assert_test((select section->>'completionReason' = 'time_expired' from jsonb_array_elements(public.load_assessment_attempt(:'paced_attempt')->'sections') section where section->>'id' = :'part3'), 'Expired parts must close by time');
select public.submit_assessment_attempt(:'paced_attempt');
reset role;
select public.assert_test((select status = 'grading' from public.assessment_attempts where id = :'paced_attempt'), 'Paced attempt must be submitted for review');
select public.assert_test((select score = 1 from public.assessment_responses where attempt_id = :'paced_attempt' and assessment_question_id = :'q1') and (select score = 0 from public.assessment_responses where attempt_id = :'paced_attempt' and assessment_question_id = :'q2'), 'Answers saved before closing must be graded as saved');

-- Generated Level Checks are paced with default part times.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.generate_assessment_from_preset('cefr-b1-level-check', 'pilot-0.6', 'paced-form') as paced_check \gset
reset role;
select public.assert_test((select section_pacing = 'sections' and time_limit_minutes is null from public.assessments where id = :'paced_check'), 'Level Checks must be paced');
select public.assert_test((select bool_and(time_limit_minutes = case cefr_level when 'A2' then 8 when 'B1' then 10 else 12 end) from public.assessment_sections where assessment_id = :'paced_check' and skill = 'reading'), 'Reading parts need level-based times');
select public.assert_test((select array_agg(cefr_level || ':' || time_limit_minutes order by position) = array['A2:5', 'B1:10', 'B2:8'] from public.assessment_sections where assessment_id = :'paced_check' and skill = 'language_use'), 'Language Use gets 1 min per item up to B1 and 1.5 min from B2');
select public.assert_test((select time_limit_minutes = 20 from public.assessment_sections where assessment_id = :'paced_check' and skill = 'writing' and cefr_level = 'A2'), 'A2 writing part gets 20 minutes');
select 'section pacing smoke test passed' as result;
