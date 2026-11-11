-- Productive parts without evidence, excluded responses and ability_to_cefr(null). Runs after student_item_exposure_smoke.sql.
\set ON_ERROR_STOP on
select public.assert_test(private.ability_to_cefr(null) is null, 'No adaptive ability means no estimated level');
select public.assert_test(private.ability_to_cefr(5) = 'B1', 'Adaptive levels are unchanged');
select public.assert_test(private.cefr_level_from_ordinal(null) is null and private.cefr_level_from_ordinal(5) = 'B1', 'No evidence means no level on the ordinal scale');

set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.generate_assessment_from_preset('cefr-b1-level-check', 'pilot-0.10', 'evidence-form') as evidence_id \gset
reset role;
insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status) values(:'evidence_id','70000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000008','grading') returning id as evidence_assignment \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,status,submitted_at) values(:'evidence_assignment',:'evidence_id','80000000-0000-0000-0000-000000000008','grading',now()) returning id as evidence_attempt \gset
-- Objective parts fully correct.
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,score,grading_status)
select :'evidence_attempt', :'evidence_id', question.id, '{"value":"x"}'::jsonb, 1, 1, 'auto_graded'
from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'evidence_id' and section.skill in ('reading','language_use');
-- Writing: answered and rated B1 (ordinal 5) on every criterion.
select question.id as writing_q from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'evidence_id' and section.skill = 'writing' order by section.position limit 1 \gset
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,score,grading_status)
values(:'evidence_attempt', :'evidence_id', :'writing_q', '{"value":"A short article."}'::jsonb, 1, .5, 'reviewed') returning id as writing_r \gset
insert into public.assessment_rubric_scores(response_id,criterion_key,score,max_score)
select :'writing_r', criterion->>'key', 5, 11 from public.assessment_questions question, jsonb_array_elements(question.question_snapshot->'rubric') criterion where question.id = :'writing_q';
-- Spoken Production: the recording was never saved.
select question.id as sp_q from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
where question.assessment_id = :'evidence_id' and section.skill = 'spoken_production' limit 1 \gset
insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,max_score,grading_status)
values(:'evidence_attempt', :'evidence_id', :'sp_q', '{}'::jsonb, 1, 'manual_review') returning id as sp_r \gset

set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.expect_error(format('select public.exclude_assessment_response(%L,%L)', :'writing_r', 'lost'), 'Only responses without an answer can be excluded');
select public.expect_error(format('select public.exclude_assessment_response(%L,%L)', :'sp_r', ' '), 'A reason is required');
select public.exclude_assessment_response(:'sp_r', 'Gravação não salva por falha da plataforma.');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.expect_error(format('select public.exclude_assessment_response(%L,%L)', :'sp_r', 'x'), 'Assessment response not found');
reset role;
select public.assert_test((select grading_status = 'reviewed' and max_score is null and score is null and (answer_payload->>'excluded')::boolean from public.assessment_responses where id = :'sp_r'), 'Excluded responses are reviewed with no weight');

update public.assessment_attempts set status = 'completed' where id = :'evidence_attempt';
select public.assert_test((select skill_results ? 'writing' and skill_results->'writing'->>'level' = 'B1' from public.assessment_cefr_profiles where attempt_id = :'evidence_attempt'), 'A rated productive part gives its rubric level');
select public.assert_test((select not (skill_results ? 'spoken_production') and not (skill_results ? 'mediation') and not (skill_results ? 'spoken_interaction') from public.assessment_cefr_profiles where attempt_id = :'evidence_attempt'), 'Productive parts without evidence give no level');
select public.assert_test((select skill_results->'reading'->>'level' = 'B1+' from public.assessment_cefr_profiles where attempt_id = :'evidence_attempt'), 'Objective skills still follow the ladder');
select 'productive evidence smoke test passed' as result;
