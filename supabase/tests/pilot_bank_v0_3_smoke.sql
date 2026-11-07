-- Current Pilot Bank (v0.5 = v0.3 fixes + authentic texts + revised Reading options) and Level Checks with Listening disabled. Runs after supabase/seed.sql.
\set ON_ERROR_STOP on
create or replace function public.expect_error(p_sql text, p_expected text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'Expected error containing "%" but the statement succeeded', p_expected;
exception when others then
  if position(p_expected in sqlerrm) = 0 then raise exception 'Expected error containing "%", got "%"', p_expected, sqlerrm; end if;
end $$;
grant execute on function public.expect_error(text,text) to authenticated;
select public.assert_test((select count(*) = 324 from public.question_bank where bank_version = 'pilot-0.5'), 'v0.5 must replace all units (324)');
select public.assert_test((select count(*) = 0 from public.question_bank where bank_version = 'pilot-0.2'), 'No v0.2 units may remain after the in-place upgrade');
select public.assert_test((select prompt = 'The new sports centre ___ by the mayor last year.' and answer = 'was opened' from public.question_bank where external_id = 'LU-B1-003'), 'LU-B1-003 double key was not fixed');
select public.assert_test((select response_constraints->>'label' = '20–35 words' from public.question_bank where external_id = 'W-A1-001'), 'A1 writing length was not adjusted');
select private.validate_cefr_pilot_bank('pilot-0.5');
select public.assert_test((select answer = 'Major drink companies agreed to remove soda from high schools.' and not (options::text ~* '\m(every|only|any kind)\M') from public.question_bank where external_id = 'R-B2-004-Q1'), 'v0.5 options must replace v0.4 options in place');
select public.assert_test((select count(*) = 6 and bool_and(source_license is not null and source_credit like 'Texto:%' and source_reference like '%Acesso em: 6 nov. 2026.') from public.question_bank_tasklets where external_id ~ '^R-(A1|A2|B1|B2|C1|C2)-004$'), 'Authentic texts must keep reference, licence and credit');
select public.assert_test((select count(*) = 4 from public.question_bank_tasklets where skill = 'reading' and level = 'B2'), 'Each level must have four Reading texts');
select public.assert_test((select private.cefr_a2_b1_item_snapshot(bank, tasklet)->>'sourceCredit' like '%CC BY 2.5%' from public.question_bank bank join public.question_bank_tasklets tasklet on tasklet.id = bank.tasklet_id where bank.external_id = 'R-B2-004-Q1'), 'Snapshots must carry the licence credit');
select public.assert_test((select private.cefr_a2_b1_item_snapshot(bank, tasklet) ? 'sourceCredit' from public.question_bank bank join public.question_bank_tasklets tasklet on tasklet.id = bank.tasklet_id where bank.external_id = 'R-B1-001-Q1') = false, 'LangSpot-authored texts carry no external credit');

set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', false);
select public.assert_test((select count(*) = 0 from public.question_bank where source_origin = 'cefr_pilot'), 'Students must not read the Pilot Bank answer key');
select public.assert_test((select count(*) = 0 from public.question_bank_tasklets), 'Students must not read Pilot Bank texts or Listening scripts');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);
select public.assert_test((select count(*) = 324 from public.question_bank where source_origin = 'cefr_pilot'), 'Teachers must keep reading the Pilot Bank');
reset role;
select public.assert_test(not (select enabled from public.assessment_feature_flags where key = 'listening'), 'Listening must start disabled');
select public.assert_test(not exists (select 1 from public.cefr_level_check_presets where objective_distribution ? 'listening'), 'Presets must not request Listening');
select public.assert_test(not exists (select 1 from public.cefr_level_check_presets where listening_distribution is null or preset_version <> '1.1' or form_version !~ '-1\.1$'), 'Presets must keep their Listening counts and move to version 1.1');

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);
select public.generate_assessment_from_preset('cefr-b1-level-check', 'pilot-0.5', 'v03-form') as b1_id \gset
select public.assert_test(public.generate_assessment_from_preset('cefr-b1-level-check', 'pilot-0.5', 'v03-form') = :'b1_id'::uuid, 'Generation must stay idempotent');
reset role;
select public.assert_test((select count(*) = 0 from public.assessment_questions where assessment_id = :'b1_id' and (question_snapshot->>'skill' = 'listening' or question_snapshot->>'type' = 'listening')), 'Generated Level Check must not contain Listening');
select public.assert_test((select count(*) = 16 from public.assessment_questions where assessment_id = :'b1_id' and question_snapshot->>'skill' = 'reading'), 'B1 Level Check must keep 16 Reading items');
select public.assert_test((select sum(draw_count) = 20 from public.assessment_sections where assessment_id = :'b1_id' and skill = 'language_use'), 'B1 Level Check must deliver 20 Language Use items');
select public.assert_test((select bool_and(question_snapshot->>'bankVersion' = 'pilot-0.5') from public.assessment_questions where assessment_id = :'b1_id'), 'Generated items must come from v0.3');
select public.assert_test((select array_agg(distinct split_part(title, ' — ', 1) order by split_part(title, ' — ', 1)) = array['PART 1', 'PART 2', 'PART 3', 'PART 4', 'PART 5', 'PART 6'] from public.assessment_sections where assessment_id = :'b1_id'), 'Parts must be numbered without the Listening gap');
select public.assert_test((select title like 'PART 2 — Language Use%' from public.assessment_sections where assessment_id = :'b1_id' and skill = 'language_use' limit 1), 'Language Use must be part 2');

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);
select public.publish_assessment(:'b1_id');

-- Any assessment with Listening is blocked while the flag is off.
select public.save_assessment_draft($json${
  "title":"Listening draft","description":"","type":"unit","assessmentMode":"fixed","navigationMode":"free","timeLimitMinutes":30,"maxAttempts":1,"showResults":"after_teacher_review",
  "sections":[{"title":"Listening","skill":"listening","weight":1,"questions":[
    {"weight":1,"required":true,"snapshot":{"id":"l","type":"listening","prompt":"Listen","options":["A","B"],"answer":"A","audioPath":"10000000-0000-0000-0000-000000000001/listening/v03.webm","maxPlays":2}}
  ]}]}
$json$::jsonb) as listening_id \gset
reset role;
insert into storage.objects(bucket_id, name, owner_id) values ('assessment-audio', '10000000-0000-0000-0000-000000000001/listening/v03.webm', '10000000-0000-0000-0000-000000000001');
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);
select public.expect_error(format('select public.publish_assessment(%L)', :'listening_id'), 'Listening is currently disabled');
reset role;
update public.assessment_feature_flags set enabled = true where key = 'listening';
set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', false);
select public.publish_assessment(:'listening_id');
reset role;
update public.assessment_feature_flags set enabled = false where key = 'listening';
select 'Pilot Bank v0.3 without Listening smoke test passed' as result;
