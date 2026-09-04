-- Follow-up smoke tests for CEFR Level Check audit fixes.
\set ON_ERROR_STOP on

select id as placement_id
from public.assessments
where preset_id = 'cefr-b1-level-check'
  and bank_version = 'pilot-0.2'
  and selection_seed = 'pilot-form-1'
order by created_at
limit 1 \gset

select id as a2_id
from public.assessments
where preset_id = 'cefr-a2-level-check'
  and bank_version = 'pilot-0.2'
  and selection_seed = 'pilot-form-1'
order by created_at
limit 1 \gset

-- Authenticate as the teacher fixture without changing the database role.
select set_config('request.jwt.claim.' || 'sub', '10000000-0000-0000-0000-000000000001', false);
select public.generate_assessment_from_preset(
  'cefr-a2-level-check',
  'pilot-0.2',
  'audit-balanced-seed'
) as a2_alt_id \gset

select private.validate_cefr_level_check(:'a2_alt_id');
select public.assert_test(
  :'a2_id'::uuid <> :'a2_alt_id'::uuid,
  'Different Level Check seeds unexpectedly returned the same assessment'
);

select public.assert_test(
  exists (
    (select question_snapshot->>'externalId'
     from public.assessment_questions
     where assessment_id = :'a2_id'
     except
     select question_snapshot->>'externalId'
     from public.assessment_questions
     where assessment_id = :'a2_alt_id')
    union all
    (select question_snapshot->>'externalId'
     from public.assessment_questions
     where assessment_id = :'a2_alt_id'
     except
     select question_snapshot->>'externalId'
     from public.assessment_questions
     where assessment_id = :'a2_id')
  ),
  'Different Level Check seeds did not change any selected bank item'
);

select public.assert_test(
  not exists (
    select expected.skill
    from (values ('reading'), ('listening'), ('language_use')) expected(skill)
    where (
      select count(distinct bank.difficulty)
      from public.question_bank bank
      where bank.bank_version = 'pilot-0.2'
        and bank.source_origin = 'cefr_pilot'
        and bank.quality_status in ('approved_for_pilot', 'approved')
        and bank.skill = expected.skill
        and bank.level = 'A2'
    ) >= 2
    and (
      select count(distinct question.difficulty_snapshot)
      from public.assessment_questions question
      where question.assessment_id = :'a2_alt_id'
        and question.question_snapshot->>'skill' = expected.skill
        and question.question_snapshot->>'cefr' = 'A2'
    ) < 2
  ),
  'Difficulty-aware selection collapsed a target objective block to one difficulty'
);

-- Attach deterministic fake paths so the publication guard can be passed in this smoke test.
update public.assessment_questions question
set question_snapshot = jsonb_set(
  question.question_snapshot,
  '{audioPath}',
  to_jsonb(('test/' || question.question_snapshot->>'taskletId' || '.mp3')::text),
  true
)
where question.assessment_id = :'placement_id'
  and question.question_snapshot->>'skill' = 'listening';

select set_config('request.jwt.claim.' || 'sub', '10000000-0000-0000-0000-000000000001', false);
select public.publish_assessment(:'placement_id');

select public.assert_test(
  (select status = 'published' from public.assessments where id = :'placement_id'),
  'B1 pilot did not publish after all Listening tasklets received audio paths'
);

insert into public.assessment_assignments(
  assessment_id, teacher_id, student_id, status, attempt_limit
) values (
  :'placement_id',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  'assigned',
  1
) returning id as playback_assignment_id \gset

select set_config('request.jwt.claim.' || 'sub', '20000000-0000-0000-0000-000000000002', false);
select public.start_assessment_attempt(:'playback_assignment_id', 'tasklet-playback-smoke') as playback_attempt_id \gset

select id as listen_q1
from public.assessment_questions
where assessment_id = :'placement_id'
  and question_snapshot->>'externalId' = 'L-A2-002-Q1' \gset

select id as listen_q2
from public.assessment_questions
where assessment_id = :'placement_id'
  and question_snapshot->>'externalId' = 'L-A2-002-Q2' \gset

select id as listen_q3
from public.assessment_questions
where assessment_id = :'placement_id'
  and question_snapshot->>'externalId' = 'L-A2-002-Q3' \gset

select (public.begin_assessment_audio_play(:'playback_attempt_id', :'listen_q1')->>'allowed')::boolean as first_allowed \gset
select (public.begin_assessment_audio_play(:'playback_attempt_id', :'listen_q2')->>'allowed')::boolean as second_allowed \gset
select (public.begin_assessment_audio_play(:'playback_attempt_id', :'listen_q3')->>'allowed')::boolean as third_allowed \gset

select public.assert_test(:'first_allowed'::boolean, 'First tasklet play was unexpectedly blocked');
select public.assert_test(:'second_allowed'::boolean, 'Second tasklet play was unexpectedly blocked');
select public.assert_test(not :'third_allowed'::boolean, 'Third play of the same Listening tasklet was not blocked');

select public.assert_test(
  (select count(*) = 1
   from public.assessment_listening_tasklet_plays
   where attempt_id = :'playback_attempt_id'
     and tasklet_key = 'L-A2-002'),
  'Listening questions in one tasklet did not share a single play counter'
);

select public.assert_test(
  (select play_count = 2
   from public.assessment_listening_tasklet_plays
   where attempt_id = :'playback_attempt_id'
     and tasklet_key = 'L-A2-002'),
  'Shared Listening tasklet play count did not stop at maxPlays=2'
);

select 'CEFR Level Check follow-up smoke test passed' as result;
