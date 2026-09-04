select public.assert_test((select count(*) = 300 from public.question_bank where bank_version = 'pilot-0.2'), 'Pilot Bank unit count failed');
select public.assert_test((select count(*) = 36 from public.question_bank_tasklets where bank_version = 'pilot-0.2'), 'Pilot Bank tasklet count failed');
select public.assert_test((select count(distinct external_id) = 300 from public.question_bank where bank_version = 'pilot-0.2'), 'Pilot Bank IDs are duplicated');
select public.assert_test((select count(*) = count(distinct (tasklet_id, prompt, options)) from public.question_bank where bank_version = 'pilot-0.2'), 'Exact Pilot Bank content is duplicated');
select public.assert_test((select external_id = 'R-B1-003-Q3' from public.question_bank where external_id = 'R-B1-003-Q3'), 'Expanded stable item ID missing');
select public.assert_test((select answer_key = 'C' and answer = any(options) from public.question_bank where external_id = 'R-B1-003-Q3'), 'Expanded stable item answer failed');
select public.assert_test(not exists(select 1 from public.question_bank where bank_version = 'pilot-0.2' and skill in ('reading','listening','language_use') and (cardinality(options) <> 4 or answer is null or not answer = any(options))), 'Objective item shape failed');
select public.assert_test(not exists(select 1 from public.question_bank where bank_version = 'pilot-0.2' and skill in ('writing','spoken_production','spoken_interaction','mediation') and (answer is not null or cardinality(options) <> 0 or jsonb_array_length(rubric) = 0)), 'Productive task shape failed');
select public.assert_test(not exists(select 1 from public.question_bank where bank_version = 'pilot-0.2' and quality_status <> 'approved_for_pilot'), 'Pilot approval status failed');
select public.assert_test((select count(*) = 4 from public.question_bank item join public.question_bank_tasklets tasklet on tasklet.id=item.tasklet_id where tasklet.external_id='L-C2-003'), 'Expanded listening tasklet relationship failed');
select public.assert_test((select estimated_duration_min_seconds = 25 and estimated_duration_max_seconds = 30 from public.question_bank_tasklets where external_id='L-A1-003'), 'Listening duration range failed');
select public.assert_test((select input_text ilike '%productive dissent is responsive%' from public.question_bank_tasklets where external_id='L-C2-003'), 'Expanded listening transcript failed');
select public.assert_test((select not rubric @> '[{"key":"interaction"}]'::jsonb from public.question_bank where external_id='SP-C2-003'), 'Spoken Production rubric must exclude Interaction');
select public.assert_test((select rubric @> '[{"key":"interaction"}]'::jsonb from public.question_bank where external_id='SI-C2-003'), 'Spoken Interaction rubric must include Interaction');
select public.assert_test((select source_material like '%Regulator%' from public.question_bank where external_id='M-C2-002'), 'Expanded mediation source material failed');
select private.validate_cefr_pilot_bank('pilot-0.2');

select id as pilot_item_id from public.question_bank where external_id='R-B1-003-Q3' \gset
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select public.assert_test((select count(*) = 300 from public.question_bank where bank_version='pilot-0.2'), 'Authenticated teachers cannot read shared Pilot Bank');
select public.save_assessment_draft(jsonb_build_object(
  'title','Pilot bank usage',
  'sections',jsonb_build_array(jsonb_build_object(
    'title','Reading','skill','reading','questions',jsonb_build_array(jsonb_build_object(
      'questionBankId',:'pilot_item_id','snapshot',jsonb_build_object('id','R-B1-003-Q3','type','multiple_choice','prompt','Snapshot','options',jsonb_build_array('A','B'),'answer','A')
    ))
  ))
)) as pilot_assessment_id \gset
reset role;
select public.assert_test(exists(select 1 from public.assessment_questions where assessment_id=:'pilot_assessment_id' and question_bank_id=:'pilot_item_id'), 'Shared Pilot Bank item could not be snapshotted into an assessment');
select 'CEFR Placement Pilot Bank v0.2 smoke test passed' as result;
