-- Review queue: every response waiting for the teacher, across all assessments, oldest
-- submission first, plus attempts whose responses are all scored but not yet finalized.

create or replace function public.list_assessment_review_queue()
returns jsonb language sql security definer set search_path = '' stable as $$
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(item order by submitted_at nulls last, attempt_id, position)
      from (
        select attempt.submitted_at, attempt.id attempt_id, delivered.position,
          jsonb_build_object(
            'responseId', response.id,
            'attemptId', attempt.id,
            'attemptStatus', attempt.status,
            'assessmentId', assessment.id,
            'assessmentTitle', assessment.title,
            'studentId', attempt.student_id,
            'studentName', profile.full_name,
            'questionId', question.id,
            'prompt', question.question_snapshot->>'prompt',
            'type', question.question_snapshot->>'type',
            'skill', section.skill,
            'cefr', question.question_snapshot->>'cefr',
            'live', private.assessment_question_is_live(question.question_snapshot),
            'taskType', question.question_snapshot->>'taskType',
            'primaryEvidence', question.question_snapshot->>'primaryEvidence',
            'operationalDescriptor', question.question_snapshot->>'operationalDescriptor',
            'responseConstraints', question.question_snapshot->'responseConstraints',
            'sourceMaterial', question.question_snapshot->>'sourceMaterial',
            'submittedAt', attempt.submitted_at
          ) item
        from public.assessment_responses response
        join public.assessment_attempts attempt on attempt.id = response.attempt_id
        join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
        join public.assessments assessment on assessment.id = attempt.assessment_id
        join public.assessment_questions question on question.id = response.assessment_question_id
        join public.assessment_sections section on section.id = question.section_id
        join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id and delivered.assessment_question_id = question.id
        left join public.profiles profile on profile.id = attempt.student_id
        where assignment.teacher_id = (select auth.uid())
          and attempt.status in ('submitted', 'grading')
          and response.grading_status in ('pending', 'manual_review')
      ) queue
    ), '[]'::jsonb),
    'readyToFinalize', coalesce((
      select jsonb_agg(jsonb_build_object('attemptId', attempt.id, 'assessmentId', assessment.id, 'assessmentTitle', assessment.title, 'studentId', attempt.student_id, 'studentName', profile.full_name, 'submittedAt', attempt.submitted_at) order by attempt.submitted_at)
      from public.assessment_attempts attempt
      join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
      join public.assessments assessment on assessment.id = attempt.assessment_id
      left join public.profiles profile on profile.id = attempt.student_id
      where assignment.teacher_id = (select auth.uid())
        and attempt.status = 'grading'
        and not exists (select 1 from public.assessment_responses response where response.attempt_id = attempt.id and response.grading_status in ('pending', 'manual_review'))
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.list_assessment_review_queue() from public, anon;
grant execute on function public.list_assessment_review_queue() to authenticated;
