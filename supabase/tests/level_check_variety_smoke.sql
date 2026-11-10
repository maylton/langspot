-- Floor and ceiling texts vary between Level Check forms. Runs after assessment_notifications_smoke.sql.
\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
create temporary table variety_forms as
  select seed, public.generate_assessment_from_preset('cefr-a2-level-check', 'pilot-0.7', 'variety-' || seed) as assessment_id
  from generate_series(1, 12) as seed;
reset role;
select public.assert_test((
  select count(distinct q.question_snapshot->>'taskletId') >= 2
  from variety_forms f join public.assessment_questions q on q.assessment_id = f.assessment_id
  join public.assessment_sections s on s.id = q.section_id
  where s.skill = 'reading' and s.cefr_level = 'A1'), 'Different forms must not always use the same floor text');
select public.assert_test((
  select bool_and(texts = 4) from (
    select f.seed, count(distinct q.question_snapshot->>'taskletId') as texts
    from variety_forms f join public.assessment_questions q on q.assessment_id = f.assessment_id
    where q.question_snapshot->>'skill' = 'reading' group by f.seed) per_form), 'Each A2 form keeps one floor, two target and one ceiling text');
select 'level check variety smoke test passed' as result;
