-- Live attempt monitor: the teacher follows an attempt while the student takes it.
--
-- * assessment_attempts.last_seen_at / viewing_question_id: presence reported by the runner
--   (on every question change and every ~20 s while the page is visible).
-- * public.report_assessment_presence: student-side heartbeat.
-- * public.list_active_teacher_attempts: in-progress attempts of the teacher's assignments.
-- * public.get_attempt_live_status: parts, progress, the question on screen and the student-facing
--   content of every delivered question (no answer keys), plus recent integrity events.

alter table public.assessment_attempts
  add column if not exists last_seen_at timestamptz,
  add column if not exists viewing_question_id uuid references public.assessment_questions(id) on delete set null;

create or replace function public.report_assessment_presence(p_attempt_id uuid, p_question_id uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_question_id is not null and not exists (
    select 1 from public.assessment_attempt_questions where attempt_id = p_attempt_id and assessment_question_id = p_question_id
  ) then raise exception 'Question does not belong to this attempt'; end if;
  update public.assessment_attempts set last_seen_at = now(), viewing_question_id = coalesce(p_question_id, viewing_question_id)
  where id = p_attempt_id and student_id = (select auth.uid()) and status = 'in_progress';
  if not found then raise exception 'Active assessment attempt not found'; end if;
end; $$;

-- Question on the student's screen: reported presence, else the last question opened, else the last answer saved.
create or replace function private.attempt_viewing_question(p_attempt_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select viewing_question_id from public.assessment_attempts where id = p_attempt_id),
    (select (metadata->>'questionId')::uuid from public.assessment_events
      where attempt_id = p_attempt_id and event_type = 'question_opened' and metadata ? 'questionId'
      order by occurred_at desc limit 1),
    (select current_question_id from public.assessment_attempts where id = p_attempt_id));
$$;

create or replace function private.attempt_last_activity(p_attempt_id uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select greatest(
    (select coalesce(last_seen_at, started_at) from public.assessment_attempts where id = p_attempt_id),
    (select max(occurred_at) from public.assessment_events where attempt_id = p_attempt_id),
    (select max(answered_at) from public.assessment_responses where attempt_id = p_attempt_id));
$$;

create or replace function public.list_active_teacher_attempts()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(row_data order by (row_data->>'lastActivityAt') desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'attemptId', attempt.id, 'assessmentId', attempt.assessment_id, 'assessmentTitle', assessment.title,
      'studentId', attempt.student_id, 'studentName', coalesce(profile.full_name, ''),
      'startedAt', attempt.started_at, 'expiresAt', attempt.expires_at, 'lastSeenAt', attempt.last_seen_at,
      'lastActivityAt', private.attempt_last_activity(attempt.id), 'integrityStatus', attempt.integrity_status,
      'delivered', counts.delivered, 'answered', counts.answered, 'liveTasks', counts.live_tasks,
      'currentSectionTitle', (select section.title from public.assessment_questions question
        join public.assessment_sections section on section.id = question.section_id
        where question.id = private.attempt_viewing_question(attempt.id))
    ) as row_data
    from public.assessment_attempts attempt
    join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
    join public.assessments assessment on assessment.id = attempt.assessment_id
    left join public.profiles profile on profile.id = attempt.student_id
    cross join lateral (
      select count(*) filter (where not private.assessment_question_is_live(question.question_snapshot)) as delivered,
        count(*) filter (where not private.assessment_question_is_live(question.question_snapshot)
          and nullif(response.answer_payload->>'value', '') is not null) as answered,
        count(*) filter (where private.assessment_question_is_live(question.question_snapshot)) as live_tasks
      from public.assessment_attempt_questions delivered
      join public.assessment_questions question on question.id = delivered.assessment_question_id
      left join public.assessment_responses response on response.attempt_id = attempt.id and response.assessment_question_id = question.id
      where delivered.attempt_id = attempt.id
    ) counts
    where assignment.teacher_id = (select auth.uid()) and attempt.status = 'in_progress'
  ) rows;
$$;

create or replace function public.get_attempt_live_status(p_attempt_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_viewing uuid;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  v_viewing := private.attempt_viewing_question(v_attempt.id);
  return jsonb_build_object(
    'attempt', jsonb_build_object('id', v_attempt.id, 'status', v_attempt.status, 'studentId', v_attempt.student_id,
      'studentName', coalesce((select full_name from public.profiles where id = v_attempt.student_id), ''),
      'startedAt', v_attempt.started_at, 'submittedAt', v_attempt.submitted_at, 'expiresAt', v_attempt.expires_at,
      'lastSeenAt', v_attempt.last_seen_at, 'lastActivityAt', private.attempt_last_activity(v_attempt.id),
      'integrityStatus', v_attempt.integrity_status, 'viewingQuestionId', v_viewing),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
      'sectionPacing', v_assessment.section_pacing = 'sections'),
    'sections', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', section.id, 'title', section.title, 'skill', section.skill, 'instructions', section.instructions, 'position', section.position,
        'timeLimitSeconds', section.time_limit_seconds, 'startedAt', pacing.started_at, 'expiresAt', pacing.expires_at,
        'completedAt', pacing.completed_at, 'completionReason', pacing.completion_reason)) order by section.position)
      from public.assessment_sections section
      left join public.assessment_attempt_sections pacing on pacing.attempt_id = v_attempt.id and pacing.section_id = section.id
      where section.assessment_id = v_assessment.id and exists (
        select 1 from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id
        where delivered.attempt_id = v_attempt.id and question.section_id = section.id)), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', question.id, 'sectionId', question.section_id, 'type', question.question_snapshot->>'type',
        'prompt', question.question_snapshot->>'prompt', 'options', delivered.presented_options,
        'sourceMaterial', question.question_snapshot->>'sourceMaterial', 'sourceCredit', question.question_snapshot->>'sourceCredit',
        'responseConstraints', question.question_snapshot->'responseConstraints',
        'preparationSeconds', (question.question_snapshot->>'preparationSeconds')::integer,
        'recordingSeconds', (question.question_snapshot->>'recordingSeconds')::integer,
        'taskType', question.question_snapshot->>'taskType', 'cefr', question.cefr_snapshot,
        'live', private.assessment_question_is_live(question.question_snapshot),
        'answered', nullif(response.answer_payload->>'value', '') is not null,
        'wordCount', case when question.question_snapshot->>'type' in ('writing', 'mediation') and nullif(trim(response.answer_payload->>'value'), '') is not null
          then coalesce(array_length(regexp_split_to_array(trim(response.answer_payload->>'value'), '\s+'), 1), 0) end,
        'timeSpentMs', response.time_spent_ms)) order by delivered.position)
      from public.assessment_attempt_questions delivered
      join public.assessment_questions question on question.id = delivered.assessment_question_id
      left join public.assessment_responses response on response.attempt_id = v_attempt.id and response.assessment_question_id = question.id
      where delivered.attempt_id = v_attempt.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('type', recent.event_type, 'occurredAt', recent.occurred_at, 'metadata', recent.metadata) order by recent.occurred_at desc)
      from (select event_type, occurred_at, metadata from public.assessment_events
        where attempt_id = v_attempt.id and event_type in ('tab_blur', 'tab_focus', 'fullscreen_exit', 'paste_detected', 'copy_detected', 'drop_detected',
          'bulk_insert_detected', 'network_disconnect', 'network_reconnect', 'session_conflict', 'resumed')
        order by occurred_at desc limit 20) recent), '[]'::jsonb));
end; $$;

revoke all on function public.report_assessment_presence(uuid, uuid) from public, anon;
revoke all on function public.list_active_teacher_attempts() from public, anon;
revoke all on function public.get_attempt_live_status(uuid) from public, anon;
revoke all on function private.attempt_viewing_question(uuid) from public, anon, authenticated;
revoke all on function private.attempt_last_activity(uuid) from public, anon, authenticated;
grant execute on function public.report_assessment_presence(uuid, uuid) to authenticated;
grant execute on function public.list_active_teacher_attempts() to authenticated;
grant execute on function public.get_attempt_live_status(uuid) to authenticated;
