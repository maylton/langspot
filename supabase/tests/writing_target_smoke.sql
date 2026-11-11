-- Level Check Writing on the target task (floor task as a floor check) and speaking re-record limits. Runs after productive_evidence_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.generate_assessment_from_preset('cefr-b1-level-check', 'pilot-0.9', 'writing-target-form') as wt_id \gset
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'wt_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','grading') returning id as wt_assignment \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status,submitted_at) values(:'wt_assignment',:'wt_id','80000000-0000-0000-0000-000000000008','grading',now()) returning id as wt_attempt \gset
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,score,grading_status)
select :'wt_attempt', :'wt_id', question.id, '{"value":"x"}'::jsonb, 1, 1, 'auto_graded'
from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'wt_id' and section.skill in ('reading','language_use');
-- Productive tasks: the A2 floor writing task at A2 (3), everything else at B1 (5).
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,score,grading_status)
select :'wt_attempt', :'wt_id', question.id, '{"value":"answer"}'::jsonb, 1, .5, 'reviewed'
from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'wt_id' and section.skill in ('writing','spoken_production','spoken_interaction','mediation');
insert into public.assessment_rubric_scores(response_id,criterion_key,score,max_score)
select response.id, criterion->>'key', case when section.skill = 'writing' and section.tasklet_kind = 'floor' then 3 else 5 end, 11
from public.assessment_responses response join public.assessment_questions question on question.id = response.assessment_question_id
join public.assessment_sections section on section.id = question.section_id, jsonb_array_elements(question.question_snapshot->'rubric') criterion
where response.attempt_id = :'wt_attempt' and section.skill in ('writing','spoken_production','spoken_interaction','mediation');
select public.assert_test((select count(*) = 1 from public.assessment_sections where assessment_id = :'wt_id' and skill = 'writing' and tasklet_kind = 'floor'), 'The B1 check has one A2 floor writing task');

update public.assessment_attempts set status = 'completed' where id = :'wt_attempt';
select public.assert_test((select skill_results->'writing'->>'level' = 'B1' and overall_level = 'B1' and not (flags ? 'PRODUCTIVE_SKILLS_BELOW_TARGET') from public.assessment_cefr_profiles where attempt_id = :'wt_attempt'), 'A floor task at the floor level does not pull Writing below the target task');
select public.assert_test((select bool_and(value->>'level' = 'B1') from public.assessment_cefr_profiles, jsonb_each(skill_results->'writing'->'dimensions') where attempt_id = :'wt_attempt'), 'Writing dimensions come from the target task');

-- A floor task below the floor level caps Writing.
update public.assessment_rubric_scores rubric_score set score = 1
from public.assessment_responses response join public.assessment_questions question on question.id = response.assessment_question_id
join public.assessment_sections section on section.id = question.section_id
where rubric_score.response_id = response.id and response.attempt_id = :'wt_attempt' and section.skill = 'writing' and section.tasklet_kind = 'floor';
select private.build_cefr_profile(:'wt_attempt');
select public.assert_test((select skill_results->'writing'->>'level' = 'A1' from public.assessment_cefr_profiles where attempt_id = :'wt_attempt'), 'A failed floor task caps Writing');

-- Speaking: two deletions are allowed (three attempts), the third is refused; each is recorded.
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'wt_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as rec_assignment \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status) values(:'rec_assignment',:'wt_id','80000000-0000-0000-0000-000000000008','in_progress') returning id as rec_attempt \gset
select question.id as sp_q from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id where question.assessment_id = :'wt_id' and section.skill = 'spoken_production' limit 1 \gset
insert into public.assessment_attempt_questions(attempt_id,assessment_question_id,position) values(:'rec_attempt', :'sp_q', 0);
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.expect_error(format('select public.record_assessment_event(%L,%L,null,%L::jsonb)', :'rec_attempt', 'recording_discarded', '{"durationMs":1000}'), 'Discarded recording needs its question and duration');
select public.record_assessment_event(:'rec_attempt', 'recording_discarded', :'sp_q', '{"durationMs":30000,"pausedCount":1}'::jsonb);
select public.record_assessment_event(:'rec_attempt', 'recording_discarded', :'sp_q', '{"durationMs":45000}'::jsonb);
select public.expect_error(format('select public.record_assessment_event(%L,%L,%L,%L::jsonb)', :'rec_attempt', 'recording_discarded', :'sp_q', '{"durationMs":1000}'), 'Recording attempts exhausted');
reset role;
select public.assert_test((select count(*) = 2 and min((metadata->>'durationMs')::int) = 30000 and max((metadata->>'pausedCount')::int) = 1 from public.assessment_events where attempt_id = :'rec_attempt' and event_type = 'recording_discarded' and metadata->>'questionId' = :'sp_q'), 'Deleted recordings are recorded with duration and pauses');
select public.assert_test((select integrity_status = 'no_unusual_activity' from public.assessment_attempts where id = :'rec_attempt'), 'Re-recording is not an integrity signal');
select 'writing target smoke test passed' as result;
