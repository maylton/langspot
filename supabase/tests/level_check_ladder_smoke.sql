-- Level Check decision rule v2 (floor / target / ceiling ladder). Runs after assessment_deletion_smoke.sql.
\set ON_ERROR_STOP on
-- The ladder itself.
select public.assert_test(private.level_check_band_level('A2','B1','B2',1,.875,.5) = 'B1', 'Secure target with a weak ceiling is the target');
select public.assert_test(private.level_check_band_level('A2','B1','B2',1,1,.6) = 'B1+', 'Secure target and ceiling >= 60 % is target+');
select public.assert_test(private.level_check_band_level('A2','B1','B2',1,.6,0) = 'A2+', 'Partial target is one half-band below the target');
select public.assert_test(private.level_check_band_level('A2','B1','B2',.8,.3,0) = 'A2', 'Failed target falls back to a secure floor');
select public.assert_test(private.level_check_band_level('A2','B1','B2',.6,.3,0) = 'A1+', 'Partial floor is one half-band below the floor');
select public.assert_test(private.level_check_band_level('A2','B1','B2',.2,.1,0) = 'A1', 'Failed floor is two half-bands below the floor');
select public.assert_test(private.level_check_band_level(null,'A1','A2',null,.8,.7) = 'A1+', 'A1 form without a floor still reaches A1+');
select public.assert_test(private.level_check_band_level('C1','C2',null,1,1,null) = 'C2', 'C2 form without a ceiling stops at C2');
select public.assert_test(private.level_check_band_level('A2','B1','B2',1,1,1) = 'B1+', 'A perfect form is target+, never the ceiling level');

-- End to end: a completed B1 Level Check like the teacher's mock attempt.
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.generate_assessment_from_preset('cefr-b1-level-check', null, 'ladder-form') as ladder_id \gset
reset role;
select public.assert_test((select decision_rule_version = 'cefr-level-check-v2' from public.assessments where id = :'ladder_id'), 'New Level Checks must record rule v2');
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'ladder_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','available') returning id as ladder_assignment \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status) values(:'ladder_assignment',:'ladder_id','80000000-0000-0000-0000-000000000008','in_progress') returning id as ladder_attempt \gset
-- Floor and target fully correct; Reading ceiling 50 %, Language Use ceiling 60 %.
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,score,grading_status)
select :'ladder_attempt', :'ladder_id', question.id, '{}'::jsonb, 1,
  case when section.cefr_level <> 'B2' then 1
       when row_number() over (partition by section.skill order by question.position, question.id) <= ceil(count(*) over (partition by section.skill) * case section.skill when 'reading' then .5 else .6 end) then 1
       else 0 end,
  'auto_graded'
from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'ladder_id' and section.skill in ('reading','language_use');
update public.assessment_attempts set status = 'completed', submitted_at = now() where id = :'ladder_attempt';
select public.assert_test((select skill_results->'reading'->>'level' = 'B1' from public.assessment_cefr_profiles where attempt_id = :'ladder_attempt'), 'Reading 100/88/50 must be B1');
select public.assert_test((select skill_results->'language_use'->>'level' = 'B1+' from public.assessment_cefr_profiles where attempt_id = :'ladder_attempt'), 'Language Use 100/100/60 must be B1+');
select public.assert_test((select decision_rule_version = 'cefr-level-check-v2' from public.assessment_cefr_profiles where attempt_id = :'ladder_attempt'), 'Profiles must record rule v2');
select 'level check ladder smoke test passed' as result;
