-- Deterministic preset, publication guard and form-specific decision-rule checks.
\set ON_ERROR_STOP on

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.create_cefr_a2_b1_placement_check() as placement_id \gset
select public.create_cefr_a2_b1_placement_check() as repeated_placement_id \gset
reset role;

select public.assert_test(:'placement_id'::uuid = :'repeated_placement_id'::uuid, 'A2-B1 preset creation is not idempotent');
select private.validate_cefr_level_check(:'placement_id');
select public.assert_test((select status = 'draft' and time_limit_minutes is null and randomize_options and not randomize_questions
  from public.assessments where id = :'placement_id'), 'A2-B1 preset metadata is invalid');
select public.assert_test((select preset_id='cefr-b1-level-check' and preset_version='1.0' and bank_version='pilot-0.2'
  and selection_seed='pilot-form-1' and form_version='CEFR-B1-CHECK-1.0'
  from public.assessments where id=:'placement_id'), 'B1 preset version metadata is missing');
select public.assert_test((select count(*) = 52 from public.assessment_questions where assessment_id = :'placement_id'
  and question_snapshot->>'skill' in ('reading','listening','language_use')), 'A2-B1 objective count is invalid');
select public.assert_test((select count(*) = 5 from public.assessment_questions where assessment_id = :'placement_id'
  and question_snapshot->>'skill' in ('writing','spoken_production','spoken_interaction','mediation')), 'A2-B1 productive count is invalid');
select public.assert_test((select array_agg(distinct question_snapshot->>'taskletId' order by question_snapshot->>'taskletId') =
  array['R-A2-002','R-B1-001','R-B1-002','R-B2-001'] from public.assessment_questions
  where assessment_id = :'placement_id' and question_snapshot->>'skill' = 'reading'), 'Unexpected Reading tasklet selection');
select public.assert_test((select array_agg(distinct question_snapshot->>'taskletId' order by question_snapshot->>'taskletId') =
  array['L-A2-002','L-B1-001','L-B1-002','L-B2-002'] from public.assessment_questions
  where assessment_id = :'placement_id' and question_snapshot->>'skill' = 'listening'), 'Unexpected Listening tasklet selection');
select public.assert_test((select count(*) = 16 from public.assessment_questions where assessment_id = :'placement_id'
  and question_snapshot->>'skill' = 'listening' and nullif(question_snapshot->>'audioPath','') is null
  and question_snapshot->>'transcriptVisibility' = 'after_submit'), 'Listening must await four audio files without exposing transcripts');
select public.assert_test((select question_snapshot->>'sourceMaterial' like '%Homework Club is open Monday to Thursday%'
  from public.assessment_questions where assessment_id = :'placement_id' and question_snapshot->>'externalId' = 'M-B1-002'), 'Mediation source material was not preserved');
select public.assert_test((select count(*) = 0 from public.assessment_questions where assessment_id = :'placement_id'
  and question_snapshot->>'skill' in ('writing','spoken_production','spoken_interaction','mediation')
  and (question_snapshot ? 'answer' or jsonb_array_length(question_snapshot->'rubric') = 0)), 'Productive tasks have objective answers or missing rubrics');

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$
declare v_assessment_id uuid;
begin
  select id into v_assessment_id from public.assessments where preset_id = 'cefr-b1-level-check' and teacher_id = auth.uid();
  perform public.publish_assessment(v_assessment_id);
  raise exception 'Listening publication guard did not run';
exception when others then
  if sqlerrm = 'Listening publication guard did not run' then raise; end if;
  if sqlerrm not like '%invalid questions%' then raise; end if;
end;
$$;
reset role;
select public.assert_test((select status = 'draft' from public.assessments where id = :'placement_id'), 'Blocked preset did not remain a draft');

set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.generate_assessment_from_preset('cefr-a1-level-check','pilot-0.2','pilot-form-1') as a1_id \gset
select public.generate_assessment_from_preset('cefr-a2-level-check','pilot-0.2','pilot-form-1') as a2_id \gset
select public.generate_assessment_from_preset('cefr-a2-level-check','pilot-0.2','pilot-form-1') as repeated_a2_id \gset
select public.generate_assessment_from_preset('cefr-b2-level-check','pilot-0.2','pilot-form-1') as b2_id \gset
select public.generate_assessment_from_preset('cefr-c1-level-check','pilot-0.2','pilot-form-1') as c1_id \gset
select public.generate_assessment_from_preset('cefr-c2-level-check','pilot-0.2','pilot-form-1') as c2_id \gset
reset role;
select public.assert_test(:'a2_id'::uuid=:'repeated_a2_id'::uuid,'Same preset, bank and seed did not produce the same form');
select private.validate_cefr_level_check(:'a1_id');
select private.validate_cefr_level_check(:'a2_id');
select private.validate_cefr_level_check(:'b2_id');
select private.validate_cefr_level_check(:'c1_id');
select private.validate_cefr_level_check(:'c2_id');
select public.assert_test((select count(*)=6 from public.assessments where preset_id is not null),'Six Level Check presets were not generated');
select public.assert_test((select count(*)=44 from public.assessment_questions where assessment_id=:'a1_id')
  and (select count(*)=44 from public.assessment_questions where assessment_id=:'c2_id'),'Edge Level Checks must contain 39 objective and 5 productive tasks');
select public.assert_test((select count(*)=57 from public.assessment_questions where assessment_id=:'a2_id')
  and (select count(*)=57 from public.assessment_questions where assessment_id=:'b2_id')
  and (select count(*)=57 from public.assessment_questions where assessment_id=:'c1_id'),'Middle Level Checks must contain 52 objective and 5 productive tasks');
select prompt as original_prompt from public.question_bank where external_id=(select question_snapshot->>'externalId' from public.assessment_questions where assessment_id=:'a2_id' order by position limit 1) \gset
update public.question_bank set prompt='Temporary snapshot immutability probe' where prompt=:'original_prompt';
select public.assert_test((select count(*)>0 from public.assessment_questions where assessment_id=:'a2_id' and question_snapshot->>'prompt'=:'original_prompt'),'Assessment snapshot changed with the bank item');
update public.question_bank set prompt=:'original_prompt' where prompt='Temporary snapshot immutability probe';

insert into public.assessment_assignments(assessment_id,teacher_id,student_id,status)
values(:'placement_id','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','submitted')
returning id as profile_assignment_id \gset
insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,submitted_at,status)
values(:'profile_assignment_id',:'placement_id','20000000-0000-0000-0000-000000000002',now(),'completed')
returning id as profile_attempt_id \gset
insert into public.assessment_cefr_profiles(
  attempt_id,assessment_id,student_id,overall_level,recommended_placement,confidence,
  skill_results,flags,manual_review_required,decision_rule_version,routing_rule_version,report_model_version
) values (
  :'profile_attempt_id',:'placement_id','20000000-0000-0000-0000-000000000002','B1','B1 consolidation','moderate',
  '{"reading":{"level":"B1"},"listening":{"level":"B1"},"language_use":{"level":"B1"},"writing":{"level":"A2"},"spoken_production":{"level":"B1"},"spoken_interaction":{"level":"A2"},"mediation":{"level":"B1"}}',
  '[]',false,'cefr-level-check-v1','cefr-routing-v1','cefr-profile-v1'
) returning id as profile_id \gset
select public.assert_test((select overall_level = 'A2+' and manual_review_required and confidence = 'low'
  and flags ? 'PRODUCTIVE_SKILLS_BELOW_TARGET' and flags ? 'HIGH_SKILL_VARIANCE'
  from public.assessment_cefr_profiles where id = :'profile_id'), 'Productive-skill safeguard did not cap the profile or request review');

select 'CEFR A2-B1 placement preset smoke test passed' as result;
