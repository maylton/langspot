-- Assessment MVP workflows. These functions are intentionally narrow APIs around
-- operations that must be atomic or must not expose answer keys to students.

create or replace function public.get_assessment_draft(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_assessment public.assessments%rowtype;
begin
  select * into v_assessment
  from public.assessments
  where id = p_assessment_id and teacher_id = (select auth.uid()) and status = 'draft';
  if not found then raise exception 'Assessment draft not found'; end if;

  return jsonb_build_object(
    'id', v_assessment.id,
    'title', v_assessment.title,
    'description', v_assessment.description,
    'type', v_assessment.type,
    'assessmentMode', v_assessment.assessment_mode,
    'navigationMode', v_assessment.navigation_mode,
    'levelMin', v_assessment.level_min,
    'levelMax', v_assessment.level_max,
    'timeLimitMinutes', v_assessment.time_limit_minutes,
    'maxAttempts', v_assessment.max_attempts,
    'randomizeQuestions', v_assessment.randomize_questions,
    'randomizeOptions', v_assessment.randomize_options,
    'showResults', v_assessment.show_results,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', section.id,
        'title', section.title,
        'skill', section.skill,
        'instructions', section.instructions,
        'weight', section.weight,
        'questions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', question.id,
            'questionBankId', question.question_bank_id,
            'weight', question.weight,
            'required', question.required,
            'snapshot', question.question_snapshot
          ) order by question.position)
          from public.assessment_questions question
          where question.section_id = section.id
        ), '[]'::jsonb)
      ) order by section.position)
      from public.assessment_sections section
      where section.assessment_id = v_assessment.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.save_assessment_draft(p_draft jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_teacher_id uuid := (select auth.uid());
  v_assessment_id uuid;
  v_section jsonb;
  v_question jsonb;
  v_section_id uuid;
  v_section_position bigint;
  v_question_position bigint;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then
    raise exception 'Teacher access required';
  end if;
  if jsonb_typeof(p_draft) <> 'object' or nullif(trim(p_draft->>'title'), '') is null then
    raise exception 'Assessment title is required';
  end if;
  if coalesce(jsonb_typeof(p_draft->'sections'), 'null') <> 'array' then
    raise exception 'Assessment sections must be an array';
  end if;

  if nullif(p_draft->>'id', '') is null then
    insert into public.assessments (
      teacher_id, title, description, type, assessment_mode, navigation_mode,
      level_min, level_max, time_limit_minutes, max_attempts,
      randomize_questions, randomize_options, show_results
    ) values (
      v_teacher_id,
      trim(p_draft->>'title'),
      coalesce(p_draft->>'description', ''),
      coalesce(p_draft->>'type', 'custom'),
      coalesce(p_draft->>'assessmentMode', 'fixed'),
      coalesce(p_draft->>'navigationMode', 'free'),
      nullif(p_draft->>'levelMin', ''),
      nullif(p_draft->>'levelMax', ''),
      nullif(p_draft->>'timeLimitMinutes', '')::integer,
      greatest(coalesce((p_draft->>'maxAttempts')::integer, 1), 1),
      coalesce((p_draft->>'randomizeQuestions')::boolean, false),
      coalesce((p_draft->>'randomizeOptions')::boolean, false),
      coalesce(p_draft->>'showResults', 'after_teacher_review')
    ) returning id into v_assessment_id;
  else
    v_assessment_id := (p_draft->>'id')::uuid;
    update public.assessments set
      title = trim(p_draft->>'title'),
      description = coalesce(p_draft->>'description', ''),
      type = coalesce(p_draft->>'type', type),
      assessment_mode = coalesce(p_draft->>'assessmentMode', assessment_mode),
      navigation_mode = coalesce(p_draft->>'navigationMode', navigation_mode),
      level_min = nullif(p_draft->>'levelMin', ''),
      level_max = nullif(p_draft->>'levelMax', ''),
      time_limit_minutes = nullif(p_draft->>'timeLimitMinutes', '')::integer,
      max_attempts = greatest(coalesce((p_draft->>'maxAttempts')::integer, max_attempts), 1),
      randomize_questions = coalesce((p_draft->>'randomizeQuestions')::boolean, randomize_questions),
      randomize_options = coalesce((p_draft->>'randomizeOptions')::boolean, randomize_options),
      show_results = coalesce(p_draft->>'showResults', show_results)
    where id = v_assessment_id and teacher_id = v_teacher_id and status = 'draft';
    if not found then raise exception 'Assessment draft not found'; end if;
    delete from public.assessment_sections where assessment_id = v_assessment_id;
  end if;

  for v_section, v_section_position in
    select value, ordinality - 1 from jsonb_array_elements(p_draft->'sections') with ordinality
  loop
    if nullif(trim(v_section->>'title'), '') is null then raise exception 'Section title is required'; end if;
    insert into public.assessment_sections (assessment_id, title, skill, position, instructions, weight)
    values (
      v_assessment_id,
      trim(v_section->>'title'),
      coalesce(v_section->>'skill', 'grammar'),
      v_section_position,
      coalesce(v_section->>'instructions', ''),
      greatest(coalesce((v_section->>'weight')::numeric, 1), 0.0001)
    ) returning id into v_section_id;

    if coalesce(jsonb_typeof(v_section->'questions'), 'null') <> 'array' then
      raise exception 'Section questions must be an array';
    end if;
    for v_question, v_question_position in
      select value, ordinality - 1 from jsonb_array_elements(v_section->'questions') with ordinality
    loop
      if coalesce(jsonb_typeof(v_question->'snapshot'), 'null') <> 'object' then raise exception 'Question snapshot is required'; end if;
      if nullif(v_question->>'questionBankId', '') is not null and not exists (
        select 1 from public.question_bank bank
        where bank.id = (v_question->>'questionBankId')::uuid and bank.teacher_id = v_teacher_id
      ) then raise exception 'Question bank item not found'; end if;
      insert into public.assessment_questions (
        assessment_id, section_id, question_bank_id, position, weight, required, question_snapshot
      ) values (
        v_assessment_id,
        v_section_id,
        nullif(v_question->>'questionBankId', '')::uuid,
        v_question_position,
        greatest(coalesce((v_question->>'weight')::numeric, 1), 0.0001),
        coalesce((v_question->>'required')::boolean, true),
        v_question->'snapshot'
      );
    end loop;
  end loop;
  return v_assessment_id;
end;
$$;

create or replace function public.publish_assessment(p_assessment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_teacher_id uuid := (select auth.uid());
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  if not exists (
    select 1 from public.assessments
    where id = p_assessment_id and teacher_id = v_teacher_id and status = 'draft'
  ) then raise exception 'Assessment draft not found'; end if;
  if exists (
    select 1 from public.assessment_sections section
    where section.assessment_id = p_assessment_id
      and not exists (select 1 from public.assessment_questions question where question.section_id = section.id)
  ) or not exists (select 1 from public.assessment_sections where assessment_id = p_assessment_id) then
    raise exception 'Every assessment section must contain questions';
  end if;
  if exists (
    select 1 from public.assessment_questions
    where assessment_id = p_assessment_id
      and (nullif(trim(question_snapshot->>'prompt'), '') is null
        or nullif(trim(question_snapshot->>'answer'), '') is null
        or question_snapshot->>'type' not in ('multiple_choice', 'fill_blank', 'true_false', 'ordering'))
  ) then raise exception 'Assessment contains invalid questions'; end if;

  update public.assessments
  set status = 'published', published_at = now()
  where id = p_assessment_id and teacher_id = v_teacher_id and status = 'draft';
end;
$$;

create or replace function public.list_student_assessments()
returns table (
  "assignmentId" uuid,
  "assessmentId" uuid,
  title text,
  description text,
  "availableFrom" timestamptz,
  "dueAt" timestamptz,
  "attemptLimit" integer,
  status text,
  "activeAttemptId" uuid
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
      order by attempt.started_at desc limit 1)
  from public.assessment_assignments assignment
  join public.assessments assessment on assessment.id = assignment.assessment_id
  where assignment.student_id = (select auth.uid()) and assessment.status = 'published'
  order by assignment.due_at nulls last, assignment.created_at desc;
$$;

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
begin
  if v_student_id is null then raise exception 'Authentication required'; end if;
  select * into v_assignment from public.assessment_assignments
  where id = p_assignment_id and student_id = v_student_id for update;
  if not found then raise exception 'Assessment assignment not found'; end if;
  select * into v_assessment from public.assessments where id = v_assignment.assessment_id and status = 'published';
  if not found then raise exception 'Assessment is not available'; end if;
  if v_assignment.available_from is not null and v_assignment.available_from > now() then raise exception 'Assessment is not available yet'; end if;
  if v_assignment.due_at is not null and v_assignment.due_at <= now() then raise exception 'Assessment deadline has passed'; end if;

  select id into v_attempt_id from public.assessment_attempts
  where assessment_assignment_id = p_assignment_id and student_id = v_student_id and status = 'in_progress'
  order by started_at desc limit 1;
  if v_attempt_id is not null then return v_attempt_id; end if;
  if (select count(*) from public.assessment_attempts where assessment_assignment_id = p_assignment_id and student_id = v_student_id) >= v_assignment.attempt_limit then
    raise exception 'Attempt limit reached';
  end if;

  insert into public.assessment_attempts (
    assessment_assignment_id, assessment_id, student_id, expires_at, device_session_id
  ) values (
    v_assignment.id, v_assignment.assessment_id, v_student_id,
    case when v_assessment.time_limit_minutes is null then null else now() + make_interval(mins => v_assessment.time_limit_minutes) end,
    nullif(trim(p_device_session_id), '')
  ) returning id into v_attempt_id;
  update public.assessment_assignments set status = 'started' where id = v_assignment.id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt_id, 'assessment_started');
  return v_attempt_id;
end;
$$;

create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
  v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id, 'assignmentId', v_attempt.assessment_assignment_id,
      'status', v_attempt.status, 'startedAt', v_attempt.started_at,
      'expiresAt', v_attempt.expires_at, 'currentQuestionId', v_attempt.current_question_id
    ),
    'assessment', jsonb_build_object(
      'id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
      'navigationMode', v_assessment.navigation_mode
    ),
    'sections', coalesce((select jsonb_agg(jsonb_build_object(
      'id', section.id, 'title', section.title, 'instructions', section.instructions, 'position', section.position
    ) order by section.position) from public.assessment_sections section where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', question.id, 'sectionId', question.section_id,
      'type', question.question_snapshot->>'type', 'prompt', question.question_snapshot->>'prompt',
      'options', coalesce(question.question_snapshot->'options', '[]'::jsonb), 'required', question.required
    ) order by section.position, question.position)
      from public.assessment_questions question
      join public.assessment_sections section on section.id = question.section_id
      where question.assessment_id = v_assessment.id), '[]'::jsonb),
    'answers', coalesce((select jsonb_object_agg(response.assessment_question_id::text, response.answer_payload->>'value')
      from public.assessment_responses response where response.attempt_id = v_attempt.id), '{}'::jsonb)
  );
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
begin
  if jsonb_typeof(p_answer_payload) <> 'object' or jsonb_typeof(p_answer_payload->'value') <> 'string' then raise exception 'Invalid answer payload'; end if;
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress'
  for update;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= now() then raise exception 'Assessment time has expired'; end if;
  if not exists (select 1 from public.assessment_questions where id = p_question_id and assessment_id = v_attempt.assessment_id) then raise exception 'Question does not belong to this assessment'; end if;

  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at)
  values (v_attempt.id, v_attempt.assessment_id, p_question_id, p_answer_payload, now())
  on conflict (attempt_id, assessment_question_id) do update
    set answer_payload = excluded.answer_payload, answered_at = excluded.answered_at;
  update public.assessment_attempts set current_question_id = p_question_id where id = v_attempt.id;
  insert into public.assessment_events (attempt_id, event_type, metadata)
  values (v_attempt.id, 'answer_saved', jsonb_build_object('question_id', p_question_id));
end;
$$;

create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt public.assessment_attempts%rowtype;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress'
  for update;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  update public.assessment_attempts set status = 'submitted', submitted_at = now() where id = v_attempt.id;
  update public.assessment_assignments set status = 'submitted' where id = v_attempt.assessment_assignment_id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt.id, 'submitted');
end;
$$;

revoke all on function public.get_assessment_draft(uuid) from public, anon;
revoke all on function public.save_assessment_draft(jsonb) from public, anon;
revoke all on function public.publish_assessment(uuid) from public, anon;
revoke all on function public.list_student_assessments() from public, anon;
revoke all on function public.start_assessment_attempt(uuid, text) from public, anon;
revoke all on function public.load_assessment_attempt(uuid) from public, anon;
revoke all on function public.save_assessment_response(uuid, uuid, jsonb) from public, anon;
revoke all on function public.submit_assessment_attempt(uuid) from public, anon;

grant execute on function public.get_assessment_draft(uuid) to authenticated;
grant execute on function public.save_assessment_draft(jsonb) to authenticated;
grant execute on function public.publish_assessment(uuid) to authenticated;
grant execute on function public.list_student_assessments() to authenticated;
grant execute on function public.start_assessment_attempt(uuid, text) to authenticated;
grant execute on function public.load_assessment_attempt(uuid) to authenticated;
grant execute on function public.save_assessment_response(uuid, uuid, jsonb) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid) to authenticated;
