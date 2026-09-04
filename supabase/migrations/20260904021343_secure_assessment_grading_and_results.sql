alter table public.assessment_attempts
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles(id) on delete set null;

create index assessment_attempts_reviewed_by_idx
  on public.assessment_attempts (reviewed_by)
  where reviewed_by is not null;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.normalize_assessment_answer(p_value text)
returns text
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select regexp_replace(lower(trim(coalesce(p_value, ''))), '\s+', ' ', 'g');
$$;

create or replace function private.assessment_answer_is_correct(p_type text, p_actual text, p_expected text)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog, private
as $$
  select case
    when p_type = 'ordering' then
      private.normalize_assessment_answer(replace(replace(replace(coalesce(p_actual, ''), chr(31), ' '), '/', ' '), ',', ' '))
      = private.normalize_assessment_answer(replace(replace(replace(coalesce(p_expected, ''), chr(31), ' '), '/', ' '), ',', ' '))
    else private.normalize_assessment_answer(p_actual) = private.normalize_assessment_answer(p_expected)
  end;
$$;

revoke all on function private.normalize_assessment_answer(text) from public, anon, authenticated;
revoke all on function private.assessment_answer_is_correct(text, text, text) from public, anon, authenticated;

create or replace function public.start_assessment_attempt(p_assignment_id uuid, p_device_session_id text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student_id uuid := (select auth.uid());
  v_assignment public.assessment_assignments%rowtype;
  v_assessment public.assessments%rowtype;
  v_attempt_id uuid;
  v_active_device text;
begin
  if v_student_id is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_device_session_id), '') is null then raise exception 'Device session is required'; end if;
  select * into v_assignment from public.assessment_assignments
  where id = p_assignment_id and student_id = v_student_id for update;
  if not found then raise exception 'Assessment assignment not found'; end if;
  select * into v_assessment from public.assessments where id = v_assignment.assessment_id and status = 'published';
  if not found then raise exception 'Assessment is not available'; end if;
  if v_assignment.available_from is not null and v_assignment.available_from > now() then raise exception 'Assessment is not available yet'; end if;
  if v_assignment.due_at is not null and v_assignment.due_at <= now() then raise exception 'Assessment deadline has passed'; end if;

  select id, device_session_id into v_attempt_id, v_active_device
  from public.assessment_attempts
  where assessment_assignment_id = p_assignment_id and student_id = v_student_id and status = 'in_progress'
  order by started_at desc limit 1;
  if v_attempt_id is not null then
    if v_active_device is distinct from nullif(trim(p_device_session_id), '') then raise exception 'Assessment is active on another device'; end if;
    return v_attempt_id;
  end if;
  if (select count(*) from public.assessment_attempts where assessment_assignment_id = p_assignment_id and student_id = v_student_id) >= v_assignment.attempt_limit then
    raise exception 'Attempt limit reached';
  end if;

  insert into public.assessment_attempts (assessment_assignment_id, assessment_id, student_id, expires_at, device_session_id)
  values (v_assignment.id, v_assignment.assessment_id, v_student_id,
    case
      when v_assessment.time_limit_minutes is null then v_assignment.due_at
      when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes)
      else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes))
    end,
    nullif(trim(p_device_session_id), ''))
  returning id into v_attempt_id;
  update public.assessment_assignments set status = 'started' where id = v_assignment.id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt_id, 'assessment_started');
  return v_attempt_id;
end;
$$;

create or replace function public.save_assessment_response(p_attempt_id uuid, p_question_id uuid, p_answer_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_due_at timestamptz;
begin
  if jsonb_typeof(p_answer_payload) <> 'object' or jsonb_typeof(p_answer_payload->'value') <> 'string' then
    raise exception 'Invalid answer payload';
  end if;
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id
    and assignment.student_id = (select auth.uid())
    and attempt.status = 'in_progress'
  for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  select due_at into v_due_at from public.assessment_assignments
  where id = v_attempt.assessment_assignment_id for key share;
  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now())
    or (v_due_at is not null and v_due_at <= now()) then
    raise exception 'Assessment time has expired';
  end if;
  if not exists (
    select 1 from public.assessment_questions
    where id = p_question_id and assessment_id = v_attempt.assessment_id
  ) then
    raise exception 'Question does not belong to this assessment';
  end if;

  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at)
  values (v_attempt.id, v_attempt.assessment_id, p_question_id, p_answer_payload, now())
  on conflict (attempt_id, assessment_question_id) do update
    set answer_payload = excluded.answer_payload, answered_at = excluded.answered_at;
  update public.assessment_attempts set current_question_id = p_question_id where id = v_attempt.id;
  insert into public.assessment_events (attempt_id, event_type, metadata)
  values (v_attempt.id, 'answer_saved', jsonb_build_object('question_id', p_question_id));
end;
$$;

-- Submission is idempotent. The server creates blank response rows, grades from
-- frozen snapshots, and ignores every score-like value from the browser.
create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_due_at timestamptz;
  v_has_manual boolean;
  v_raw_score numeric;
  v_scaled_score numeric;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid())
  for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if;
  select due_at into v_due_at from public.assessment_assignments
  where id = v_attempt.assessment_assignment_id for key share;
  if v_attempt.status in ('submitted', 'grading', 'completed') then return; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'Assessment attempt is not active'; end if;

  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now())
    or (v_due_at is not null and v_due_at <= now()) then
    update public.assessment_attempts set status = 'expired' where id = v_attempt.id;
    update public.assessment_assignments set status = 'expired' where id = v_attempt.assessment_assignment_id;
    return;
  end if;

  insert into public.assessment_responses (
    attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at
  )
  select v_attempt.id, v_attempt.assessment_id, question.id, '{}'::jsonb, null
  from public.assessment_questions question
  where question.assessment_id = v_attempt.assessment_id
  on conflict (attempt_id, assessment_question_id) do nothing;

  update public.assessment_responses response
  set
    max_score = question.weight,
    score = case
      when question.question_snapshot->>'type' in ('multiple_choice', 'fill_blank', 'true_false', 'ordering') then
        case when private.assessment_answer_is_correct(
          question.question_snapshot->>'type',
          response.answer_payload->>'value',
          question.question_snapshot->>'answer'
        ) then question.weight else 0 end
      else null
    end,
    grading_status = case
      when question.question_snapshot->>'type' in ('multiple_choice', 'fill_blank', 'true_false', 'ordering') then 'auto_graded'
      else 'manual_review'
    end
  from public.assessment_questions question
  where response.attempt_id = v_attempt.id
    and question.id = response.assessment_question_id;

  select exists (
    select 1 from public.assessment_responses
    where attempt_id = v_attempt.id and grading_status = 'manual_review'
  ) into v_has_manual;

  select coalesce(sum(score), 0) into v_raw_score
  from public.assessment_responses where attempt_id = v_attempt.id;

  select round(100 * sum(section_score * section_weight) / nullif(sum(section_weight), 0), 2)
  into v_scaled_score
  from (
    select section.id,
      section.weight as section_weight,
      coalesce(sum(response.score), 0) / nullif(sum(response.max_score), 0) as section_score
    from public.assessment_sections section
    join public.assessment_questions question on question.section_id = section.id
    join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id
    where section.assessment_id = v_attempt.assessment_id
    group by section.id, section.weight
  ) scores;

  update public.assessment_attempts
  set status = case when v_has_manual then 'grading' else 'completed' end,
      submitted_at = now(), raw_score = v_raw_score, scaled_score = coalesce(v_scaled_score, 0)
  where id = v_attempt.id;
  update public.assessment_assignments
  set status = case when v_has_manual then 'grading' else 'completed' end
  where id = v_attempt.assessment_assignment_id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt.id, 'submitted');
end;
$$;

drop function public.list_student_assessments();
create function public.list_student_assessments()
returns table (
  "assignmentId" uuid,
  "assessmentId" uuid,
  title text,
  description text,
  "availableFrom" timestamptz,
  "dueAt" timestamptz,
  "attemptLimit" integer,
  status text,
  "activeAttemptId" uuid,
  "latestAttemptId" uuid
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select assignment.id, assessment.id, assessment.title, assessment.description,
    assignment.available_from, assignment.due_at, assignment.attempt_limit, assignment.status,
    (select attempt.id from public.assessment_attempts attempt
      where attempt.assessment_assignment_id = assignment.id and attempt.student_id = (select auth.uid()) and attempt.status = 'in_progress'
      order by attempt.started_at desc limit 1),
    (select attempt.id from public.assessment_attempts attempt
      where attempt.assessment_assignment_id = assignment.id and attempt.student_id = (select auth.uid())
      order by attempt.started_at desc limit 1)
  from public.assessment_assignments assignment
  join public.assessments assessment on assessment.id = assignment.assessment_id
  where assignment.student_id = (select auth.uid()) and assessment.status = 'published'
  order by assignment.due_at nulls last, assignment.created_at desc;
$$;

create or replace function public.get_assessment_result(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_student_name text;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment result not found'; end if;
  select full_name into v_student_name from public.profiles where id = v_attempt.student_id;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id, 'studentId', v_attempt.student_id, 'studentName', v_student_name,
      'status', v_attempt.status, 'startedAt', v_attempt.started_at, 'submittedAt', v_attempt.submitted_at,
      'rawScore', v_attempt.raw_score, 'scaledScore', v_attempt.scaled_score,
      'estimatedCefr', v_attempt.estimated_cefr, 'integrityStatus', v_attempt.integrity_status,
      'reviewedAt', v_attempt.reviewed_at, 'scoringModelVersion', v_attempt.scoring_model_version
    ),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'type', v_assessment.type, 'version', v_assessment.version),
    'sections', coalesce((select jsonb_agg(jsonb_build_object(
      'id', section.id, 'title', section.title, 'skill', section.skill,
      'score', coalesce(scores.score, 0), 'maxScore', coalesce(scores.max_score, 0),
      'percentage', round(100 * coalesce(scores.score, 0) / nullif(scores.max_score, 0), 2)
    ) order by section.position)
      from public.assessment_sections section
      left join lateral (
        select sum(response.score) score, sum(response.max_score) max_score
        from public.assessment_questions question
        join public.assessment_responses response on response.assessment_question_id = question.id
        where question.section_id = section.id and response.attempt_id = v_attempt.id
      ) scores on true where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', question.id, 'sectionId', question.section_id, 'prompt', question.question_snapshot->>'prompt',
      'type', question.question_snapshot->>'type', 'options', question.question_snapshot->'options',
      'correctAnswer', question.question_snapshot->>'answer', 'explanation', question.question_snapshot->>'explanation',
      'answer', response.answer_payload->>'value', 'score', response.score, 'maxScore', response.max_score,
      'gradingStatus', response.grading_status, 'teacherFeedback', response.teacher_feedback,
      'responseId', response.id, 'timeSpentMs', response.time_spent_ms
    ) order by section.position, question.position)
      from public.assessment_questions question
      join public.assessment_sections section on section.id = question.section_id
      left join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id
      where question.assessment_id = v_assessment.id), '[]'::jsonb)
  );
end;
$$;

create or replace function public.review_assessment_response(p_response_id uuid, p_score numeric, p_feedback text default '')
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_response public.assessment_responses%rowtype;
begin
  select response.* into v_response
  from public.assessment_responses response
  join public.assessment_attempts attempt on attempt.id = response.attempt_id
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where response.id = p_response_id and assignment.teacher_id = (select auth.uid())
  for update of response;
  if not found then raise exception 'Assessment response not found'; end if;
  if p_score is null or p_score < 0 or p_score > v_response.max_score then raise exception 'Score is outside the allowed range'; end if;
  update public.assessment_responses
  set score = p_score, teacher_feedback = coalesce(p_feedback, ''), grading_status = 'reviewed'
  where id = p_response_id;
end;
$$;

create or replace function public.finalize_assessment_review(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_scaled_score numeric;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid())
  for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if;
  if exists (select 1 from public.assessment_responses where attempt_id = p_attempt_id and grading_status in ('pending', 'manual_review')) then
    raise exception 'All manual responses must be reviewed first';
  end if;

  select round(100 * sum(section_score * section_weight) / nullif(sum(section_weight), 0), 2)
  into v_scaled_score
  from (
    select section.id, section.weight section_weight,
      coalesce(sum(response.score), 0) / nullif(sum(response.max_score), 0) section_score
    from public.assessment_sections section
    join public.assessment_questions question on question.section_id = section.id
    join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = p_attempt_id
    where section.assessment_id = v_attempt.assessment_id
    group by section.id, section.weight
  ) scores;

  update public.assessment_attempts
  set status = 'completed', reviewed_at = now(), reviewed_by = (select auth.uid()),
      raw_score = (select coalesce(sum(score), 0) from public.assessment_responses where attempt_id = p_attempt_id),
      scaled_score = coalesce(v_scaled_score, 0)
  where id = p_attempt_id;
  update public.assessment_assignments set status = 'completed' where id = v_attempt.assessment_assignment_id;
end;
$$;

create or replace function public.get_student_assessment_result(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_visibility text;
  v_visible boolean;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid());
  if not found then raise exception 'Assessment result not found'; end if;
  select show_results into v_visibility from public.assessments where id = v_attempt.assessment_id;
  v_visible := v_attempt.status = 'completed'
    and v_visibility <> 'none'
    and (v_visibility <> 'after_teacher_review' or v_attempt.reviewed_at is not null);

  if not v_visible then
    return jsonb_build_object('visible', false, 'status', v_attempt.status);
  end if;
  if v_visibility = 'score_only' then
    return jsonb_build_object('visible', true, 'status', v_attempt.status, 'score', v_attempt.scaled_score);
  end if;
  if v_visibility = 'level_only' then
    return jsonb_build_object('visible', true, 'status', v_attempt.status, 'estimatedCefr', v_attempt.estimated_cefr);
  end if;
  return jsonb_build_object(
    'visible', true, 'status', v_attempt.status, 'score', v_attempt.scaled_score,
    'estimatedCefr', v_attempt.estimated_cefr,
    'sections', coalesce((select jsonb_agg(jsonb_build_object(
      'id', section.id, 'title', section.title,
      'score', coalesce(scores.score, 0), 'maxScore', coalesce(scores.max_score, 0),
      'percentage', round(100 * coalesce(scores.score, 0) / nullif(scores.max_score, 0), 2)
    ) order by section.position)
      from public.assessment_sections section
      left join lateral (
        select sum(response.score) score, sum(response.max_score) max_score
        from public.assessment_questions question
        join public.assessment_responses response on response.assessment_question_id = question.id
        where question.section_id = section.id and response.attempt_id = v_attempt.id
      ) scores on true where section.assessment_id = v_attempt.assessment_id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', question.id, 'prompt', question.question_snapshot->>'prompt',
      'answer', response.answer_payload->>'value', 'score', response.score,
      'maxScore', response.max_score, 'teacherFeedback', response.teacher_feedback
    ) order by section.position, question.position)
      from public.assessment_questions question
      join public.assessment_sections section on section.id = question.section_id
      join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id
      where question.assessment_id = v_attempt.assessment_id), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.submit_assessment_attempt(uuid) from public, anon;
revoke all on function public.save_assessment_response(uuid, uuid, jsonb) from public, anon;
revoke all on function public.start_assessment_attempt(uuid, text) from public, anon;
revoke all on function public.list_student_assessments() from public, anon;
revoke all on function public.get_assessment_result(uuid) from public, anon;
revoke all on function public.review_assessment_response(uuid, numeric, text) from public, anon;
revoke all on function public.finalize_assessment_review(uuid) from public, anon;
revoke all on function public.get_student_assessment_result(uuid) from public, anon;

grant execute on function public.submit_assessment_attempt(uuid) to authenticated;
grant execute on function public.save_assessment_response(uuid, uuid, jsonb) to authenticated;
grant execute on function public.start_assessment_attempt(uuid, text) to authenticated;
grant execute on function public.list_student_assessments() to authenticated;
grant execute on function public.get_assessment_result(uuid) to authenticated;
grant execute on function public.review_assessment_response(uuid, numeric, text) to authenticated;
grant execute on function public.finalize_assessment_review(uuid) to authenticated;
grant execute on function public.get_student_assessment_result(uuid) to authenticated;
