-- Teacher report notes: ownership and student visibility. Runs after live_assessment_smoke.sql.
\set ON_ERROR_STOP on
select attempt.id as done_attempt, attempt.assessment_id as done_assessment from public.assessment_attempts attempt join public.assessments assessment on assessment.id = attempt.assessment_id where assessment.title = 'Mixed live check' and attempt.status = 'completed' \gset
select attempt.id as oral_attempt from public.assessment_attempts attempt join public.assessments assessment on assessment.id = attempt.assessment_id where assessment.title = 'Oral interview' \gset

set role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000009',false);
select public.expect_error(format('select public.save_assessment_report_note(%L,%L,%L)', :'done_attempt', 'x', 'y'), 'Assessment attempt not found');
select public.expect_error(format('select public.get_assessment_report_note(%L)', :'done_attempt'), 'Assessment report not found');

select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(public.get_assessment_report_note(:'done_attempt') is null, 'A report without a note must return null');
select public.save_assessment_report_note(:'done_attempt','  Great progress in interaction.  ','Practise linking words.');
select public.save_assessment_report_note(:'done_attempt','Great progress in interaction.','Practise linking words; record a 2-minute summary.');
select public.assert_test(public.get_assessment_report_note(:'done_attempt')->>'nextSteps' = 'Practise linking words; record a 2-minute summary.', 'Teacher must read the latest note');
select public.save_assessment_report_note(:'oral_attempt','Fluent and confident.','');

select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.assert_test(public.get_assessment_report_note(:'done_attempt')->>'summary' = 'Great progress in interaction.', 'Student must read the note of a reviewed result');
select public.assert_test(public.get_assessment_report_note(:'oral_attempt')->>'summary' = 'Fluent and confident.', 'Teacher-completed live attempts count as reviewed');
select public.expect_error(format('select public.save_assessment_report_note(%L,%L,%L)', :'done_attempt', 'x', 'y'), 'Assessment attempt not found');

-- Previous assessment for the report: the oral interview was completed after the mixed check.
select public.assert_test(public.get_previous_assessment_for_report(:'oral_attempt')->>'title' = 'Mixed live check', 'Previous assessment must be the mixed check');
select public.assert_test((public.get_previous_assessment_for_report(:'oral_attempt')->'skills'->>'writing')::numeric = 80, 'Previous writing percentage must be 1.6/2');
select public.assert_test(public.get_previous_assessment_for_report(:'done_attempt') is null, 'The first assessment has no previous one');
reset role;
update public.assessments set show_results = 'none' where id = :'done_assessment';
set role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000008',false);
select public.assert_test(public.get_assessment_report_note(:'done_attempt') is null, 'Hidden results must hide the note');
select public.assert_test(public.get_previous_assessment_for_report(:'oral_attempt') is null, 'Hidden results must not be used for comparison');
select set_config('request.jwt.claim.sub','70000000-0000-0000-0000-000000000007',false);
select public.assert_test(public.get_previous_assessment_for_report(:'oral_attempt')->>'title' = 'Mixed live check', 'Teacher still sees hidden results in comparison');
reset role;
update public.assessments set show_results = 'after_teacher_review' where id = :'done_assessment';
select public.assert_test((select count(*) = 2 from public.assessment_report_notes), 'Exactly two report notes expected');
select 'report notes smoke test passed' as result;
