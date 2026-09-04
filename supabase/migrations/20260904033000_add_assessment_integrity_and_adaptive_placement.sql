-- Integrity evidence, deterministic delivery, pools, and rule-based adaptive placement.

alter table public.assessments
  add column adaptive_initial_ability numeric(5, 3) not null default 5 check (adaptive_initial_ability between 1 and 10),
  add column adaptive_min_items integer not null default 4 check (adaptive_min_items > 0),
  add column adaptive_max_items integer not null default 10 check (adaptive_max_items > 0),
  add column adaptive_confidence_threshold numeric(4, 3) not null default 0.65 check (adaptive_confidence_threshold between 0.1 and 0.95),
  add constraint assessments_adaptive_item_range check (adaptive_max_items >= adaptive_min_items);

alter table public.assessment_sections
  add column draw_count integer check (draw_count is null or draw_count > 0);

alter table public.assessment_events drop constraint assessment_events_event_type_check;
alter table public.assessment_events add constraint assessment_events_event_type_check check (event_type in (
  'assessment_started', 'question_opened', 'question_closed', 'answer_saved',
  'tab_blur', 'tab_focus', 'fullscreen_exit', 'paste_detected',
  'network_disconnect', 'network_reconnect', 'resumed', 'submitted', 'session_conflict'
));

create table public.assessment_attempt_questions (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  assessment_question_id uuid not null references public.assessment_questions(id) on delete cascade,
  position integer not null check (position >= 0),
  presented_options jsonb not null default '[]'::jsonb check (jsonb_typeof(presented_options) = 'array'),
  selected_at timestamptz not null default now(),
  primary key (attempt_id, assessment_question_id),
  unique (attempt_id, position)
);

create table public.assessment_adaptive_state (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  section_id uuid not null references public.assessment_sections(id) on delete cascade,
  skill text not null check (skill in ('grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking', 'use_of_english')),
  ability numeric(5, 3) not null check (ability between 1 and 10),
  confidence numeric(4, 3) not null default 0 check (confidence between 0 and 1),
  items_answered integer not null default 0 check (items_answered >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  last_difficulty numeric(5, 3),
  recent_abilities numeric[] not null default '{}',
  estimated_cefr text not null default 'B1' check (estimated_cefr in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  stopped boolean not null default false,
  model_version text not null default 'adaptive-rule-v1',
  updated_at timestamptz not null default now(),
  primary key (attempt_id, section_id)
);

create index assessment_attempt_questions_question_idx on public.assessment_attempt_questions (assessment_question_id);
create index assessment_adaptive_state_section_idx on public.assessment_adaptive_state (section_id);
create index assessment_adaptive_state_attempt_active_idx on public.assessment_adaptive_state (attempt_id, stopped);

alter table public.assessment_attempt_questions enable row level security;
alter table public.assessment_adaptive_state enable row level security;
revoke all on table public.assessment_attempt_questions, public.assessment_adaptive_state from anon, authenticated;
grant all on table public.assessment_attempt_questions, public.assessment_adaptive_state to service_role;

create or replace function private.shuffle_assessment_options(p_options jsonb, p_seed text)
returns jsonb language sql immutable security invoker set search_path = pg_catalog as $$
  select coalesce(jsonb_agg(item.value order by md5(p_seed || ':' || item.ordinality::text)), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_options, '[]'::jsonb)) with ordinality item(value, ordinality);
$$;

create or replace function private.ability_to_cefr(p_ability numeric)
returns text language sql immutable security invoker set search_path = pg_catalog as $$
  select case when p_ability < 2 then 'A1' when p_ability < 3.5 then 'A2'
    when p_ability < 5.25 then 'B1' when p_ability < 7 then 'B2'
    when p_ability < 8.75 then 'C1' else 'C2' end;
$$;

revoke all on function private.shuffle_assessment_options(jsonb, text) from public, anon, authenticated;
revoke all on function private.ability_to_cefr(numeric) from public, anon, authenticated;

create or replace function public.get_assessment_draft(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_assessment public.assessments%rowtype;
begin
  select * into v_assessment from public.assessments
  where id = p_assessment_id and teacher_id = (select auth.uid()) and status = 'draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  return jsonb_build_object(
    'id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
    'type', v_assessment.type, 'assessmentMode', v_assessment.assessment_mode,
    'navigationMode', v_assessment.navigation_mode, 'levelMin', v_assessment.level_min,
    'levelMax', v_assessment.level_max, 'timeLimitMinutes', v_assessment.time_limit_minutes,
    'maxAttempts', v_assessment.max_attempts, 'randomizeQuestions', v_assessment.randomize_questions,
    'randomizeOptions', v_assessment.randomize_options, 'showResults', v_assessment.show_results,
    'adaptiveInitialAbility', v_assessment.adaptive_initial_ability,
    'adaptiveMinItems', v_assessment.adaptive_min_items, 'adaptiveMaxItems', v_assessment.adaptive_max_items,
    'adaptiveConfidenceThreshold', v_assessment.adaptive_confidence_threshold,
    'sections', coalesce((select jsonb_agg(jsonb_build_object(
      'id', section.id, 'title', section.title, 'skill', section.skill,
      'instructions', section.instructions, 'weight', section.weight, 'drawCount', section.draw_count,
      'questions', coalesce((select jsonb_agg(jsonb_build_object(
        'id', question.id, 'questionBankId', question.question_bank_id, 'weight', question.weight,
        'required', question.required, 'snapshot', question.question_snapshot
      ) order by question.position) from public.assessment_questions question where question.section_id = section.id), '[]'::jsonb)
    ) order by section.position) from public.assessment_sections section where section.assessment_id = v_assessment.id), '[]'::jsonb)
  );
end;
$$;

create or replace function public.save_assessment_draft(p_draft jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_teacher_id uuid := (select auth.uid()); v_assessment_id uuid; v_section jsonb; v_question jsonb;
  v_section_id uuid; v_section_position bigint; v_question_position bigint;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  if jsonb_typeof(p_draft) <> 'object' or nullif(trim(p_draft->>'title'), '') is null then raise exception 'Assessment title is required'; end if;
  if coalesce(jsonb_typeof(p_draft->'sections'), 'null') <> 'array' then raise exception 'Assessment sections must be an array'; end if;
  if coalesce((p_draft->>'adaptiveMaxItems')::integer, 10) < coalesce((p_draft->>'adaptiveMinItems')::integer, 4) then raise exception 'Invalid adaptive item range'; end if;

  if nullif(p_draft->>'id', '') is null then
    insert into public.assessments (teacher_id, title, description, type, assessment_mode, navigation_mode,
      level_min, level_max, time_limit_minutes, max_attempts, randomize_questions, randomize_options, show_results,
      adaptive_initial_ability, adaptive_min_items, adaptive_max_items, adaptive_confidence_threshold,
      scoring_model_version)
    values (v_teacher_id, trim(p_draft->>'title'), coalesce(p_draft->>'description', ''), coalesce(p_draft->>'type', 'custom'),
      coalesce(p_draft->>'assessmentMode', 'fixed'), case when p_draft->>'assessmentMode' = 'adaptive' then 'linear' else coalesce(p_draft->>'navigationMode', 'free') end,
      nullif(p_draft->>'levelMin', ''), nullif(p_draft->>'levelMax', ''), nullif(p_draft->>'timeLimitMinutes', '')::integer,
      greatest(coalesce((p_draft->>'maxAttempts')::integer, 1), 1), coalesce((p_draft->>'randomizeQuestions')::boolean, false),
      coalesce((p_draft->>'randomizeOptions')::boolean, false), case when p_draft->>'assessmentMode' = 'adaptive' then 'after_teacher_review' else coalesce(p_draft->>'showResults', 'after_teacher_review') end,
      coalesce((p_draft->>'adaptiveInitialAbility')::numeric, 5), coalesce((p_draft->>'adaptiveMinItems')::integer, 4),
      coalesce((p_draft->>'adaptiveMaxItems')::integer, 10), coalesce((p_draft->>'adaptiveConfidenceThreshold')::numeric, .65),
      case when p_draft->>'assessmentMode' = 'adaptive' then 'adaptive-rule-v1' else 'objective-v1' end)
    returning id into v_assessment_id;
  else
    v_assessment_id := (p_draft->>'id')::uuid;
    update public.assessments set title = trim(p_draft->>'title'), description = coalesce(p_draft->>'description', ''),
      type = coalesce(p_draft->>'type', type), assessment_mode = coalesce(p_draft->>'assessmentMode', assessment_mode),
      navigation_mode = case when p_draft->>'assessmentMode' = 'adaptive' then 'linear' else coalesce(p_draft->>'navigationMode', navigation_mode) end,
      level_min = nullif(p_draft->>'levelMin', ''), level_max = nullif(p_draft->>'levelMax', ''),
      time_limit_minutes = nullif(p_draft->>'timeLimitMinutes', '')::integer,
      max_attempts = greatest(coalesce((p_draft->>'maxAttempts')::integer, max_attempts), 1),
      randomize_questions = coalesce((p_draft->>'randomizeQuestions')::boolean, randomize_questions),
      randomize_options = coalesce((p_draft->>'randomizeOptions')::boolean, randomize_options),
      show_results = case when p_draft->>'assessmentMode' = 'adaptive' then 'after_teacher_review' else coalesce(p_draft->>'showResults', show_results) end,
      adaptive_initial_ability = coalesce((p_draft->>'adaptiveInitialAbility')::numeric, adaptive_initial_ability),
      adaptive_min_items = coalesce((p_draft->>'adaptiveMinItems')::integer, adaptive_min_items),
      adaptive_max_items = coalesce((p_draft->>'adaptiveMaxItems')::integer, adaptive_max_items),
      adaptive_confidence_threshold = coalesce((p_draft->>'adaptiveConfidenceThreshold')::numeric, adaptive_confidence_threshold),
      scoring_model_version = case when p_draft->>'assessmentMode' = 'adaptive' then 'adaptive-rule-v1' else 'objective-v1' end
    where id = v_assessment_id and teacher_id = v_teacher_id and status = 'draft';
    if not found then raise exception 'Assessment draft not found'; end if;
    delete from public.assessment_sections where assessment_id = v_assessment_id;
  end if;

  for v_section, v_section_position in select value, ordinality - 1 from jsonb_array_elements(p_draft->'sections') with ordinality loop
    if nullif(trim(v_section->>'title'), '') is null then raise exception 'Section title is required'; end if;
    insert into public.assessment_sections (assessment_id, title, skill, position, instructions, weight, draw_count, adaptive)
    values (v_assessment_id, trim(v_section->>'title'), coalesce(v_section->>'skill', 'grammar'), v_section_position,
      coalesce(v_section->>'instructions', ''), greatest(coalesce((v_section->>'weight')::numeric, 1), .0001),
      nullif(v_section->>'drawCount', '')::integer, coalesce(p_draft->>'assessmentMode', 'fixed') = 'adaptive')
    returning id into v_section_id;
    if coalesce(jsonb_typeof(v_section->'questions'), 'null') <> 'array' then raise exception 'Section questions must be an array'; end if;
    if nullif(v_section->>'drawCount', '') is not null and (v_section->>'drawCount')::integer > jsonb_array_length(v_section->'questions') then raise exception 'Pool draw count exceeds available questions'; end if;
    for v_question, v_question_position in select value, ordinality - 1 from jsonb_array_elements(v_section->'questions') with ordinality loop
      if coalesce(jsonb_typeof(v_question->'snapshot'), 'null') <> 'object' then raise exception 'Question snapshot is required'; end if;
      if nullif(v_question->>'questionBankId', '') is not null and not exists (select 1 from public.question_bank bank where bank.id = (v_question->>'questionBankId')::uuid and bank.teacher_id = v_teacher_id) then raise exception 'Question bank item not found'; end if;
      insert into public.assessment_questions (assessment_id, section_id, question_bank_id, position, weight, required,
        question_snapshot, difficulty_snapshot, cefr_snapshot)
      values (v_assessment_id, v_section_id, nullif(v_question->>'questionBankId', '')::uuid, v_question_position,
        greatest(coalesce((v_question->>'weight')::numeric, 1), .0001), coalesce((v_question->>'required')::boolean, true),
        v_question->'snapshot', coalesce((v_question->'snapshot'->>'difficulty')::integer, 5),
        coalesce(nullif(v_question->'snapshot'->>'cefr', ''), 'B1'));
    end loop;
  end loop;
  return v_assessment_id;
end;
$$;

create or replace function public.publish_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_teacher_id uuid := (select auth.uid()); v_assessment public.assessments%rowtype;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  select * into v_assessment from public.assessments where id = p_assessment_id and teacher_id = v_teacher_id and status = 'draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  if not exists (select 1 from public.assessment_sections where assessment_id = p_assessment_id)
    or exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and not exists (select 1 from public.assessment_questions question where question.section_id = section.id)) then
    raise exception 'Every assessment section must contain questions';
  end if;
  if exists (select 1 from public.assessment_questions where assessment_id = p_assessment_id and
    (nullif(trim(question_snapshot->>'prompt'), '') is null or nullif(trim(question_snapshot->>'answer'), '') is null or question_snapshot->>'type' not in ('multiple_choice', 'fill_blank', 'true_false', 'ordering'))) then
    raise exception 'Assessment contains invalid questions';
  end if;
  if exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and section.draw_count is not null and section.draw_count > (select count(*) from public.assessment_questions question where question.section_id = section.id)) then
    raise exception 'Pool draw count exceeds available questions';
  end if;
  if v_assessment.assessment_mode = 'adaptive' and exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and
    ((select count(*) from public.assessment_questions question where question.section_id = section.id) < v_assessment.adaptive_min_items
      or exists (select 1 from public.assessment_questions question where question.section_id = section.id and (question.difficulty_snapshot is null or question.cefr_snapshot is null)))) then
    raise exception 'Adaptive sections require enough calibrated questions';
  end if;
  update public.assessments set status = 'published', published_at = now() where id = p_assessment_id and teacher_id = v_teacher_id and status = 'draft';
end;
$$;

create or replace function public.start_assessment_attempt(p_assignment_id uuid, p_device_session_id text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_student_id uuid := (select auth.uid()); v_assignment public.assessment_assignments%rowtype;
  v_assessment public.assessments%rowtype; v_attempt_id uuid; v_active_device text; v_first_question uuid; v_seed text;
begin
  if v_student_id is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_device_session_id), '') is null then raise exception 'Device session is required'; end if;
  select * into v_assignment from public.assessment_assignments where id = p_assignment_id and student_id = v_student_id for update;
  if not found then raise exception 'Assessment assignment not found'; end if;
  select * into v_assessment from public.assessments where id = v_assignment.assessment_id and status = 'published';
  if not found then raise exception 'Assessment is not available'; end if;
  if v_assignment.available_from is not null and v_assignment.available_from > now() then raise exception 'Assessment is not available yet'; end if;
  if v_assignment.due_at is not null and v_assignment.due_at <= now() then raise exception 'Assessment deadline has passed'; end if;
  select id, device_session_id into v_attempt_id, v_active_device from public.assessment_attempts
  where assessment_assignment_id = p_assignment_id and student_id = v_student_id and status = 'in_progress'
  order by started_at desc limit 1;
  if v_attempt_id is not null then
    if v_active_device is distinct from trim(p_device_session_id) then
      insert into public.assessment_events (attempt_id, event_type) values (v_attempt_id, 'session_conflict');
      update public.assessment_attempts set integrity_status = 'unusual_activity' where id = v_attempt_id;
      return null;
    end if;
    insert into public.assessment_events (attempt_id, event_type) values (v_attempt_id, 'resumed');
    return v_attempt_id;
  end if;
  if (select count(*) from public.assessment_attempts where assessment_assignment_id = p_assignment_id and student_id = v_student_id) >= v_assignment.attempt_limit then raise exception 'Attempt limit reached'; end if;
  insert into public.assessment_attempts (assessment_assignment_id, assessment_id, student_id, expires_at, device_session_id, scoring_model_version)
  values (v_assignment.id, v_assignment.assessment_id, v_student_id,
    case when v_assessment.time_limit_minutes is null then v_assignment.due_at when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes) else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes)) end,
    trim(p_device_session_id), v_assessment.scoring_model_version) returning id, randomization_seed into v_attempt_id, v_seed;

  if v_assessment.assessment_mode = 'fixed' then
    insert into public.assessment_attempt_questions (attempt_id, assessment_question_id, position, presented_options)
    select v_attempt_id, chosen.id, row_number() over (order by chosen.section_position, chosen.delivery_order) - 1,
      case when v_assessment.randomize_options then private.shuffle_assessment_options(chosen.question_snapshot->'options', v_seed || ':' || chosen.id::text) else coalesce(chosen.question_snapshot->'options', '[]'::jsonb) end
    from (select ranked.*, case when v_assessment.randomize_questions then md5(v_seed || ':' || ranked.id::text) else lpad(ranked.question_position::text, 10, '0') end delivery_order
      from (select question.*, section.position section_position, question.position question_position, section.draw_count,
        row_number() over (partition by section.id order by case when v_assessment.randomize_questions then md5(v_seed || ':' || question.id::text) else lpad(question.position::text, 10, '0') end) pool_rank,
        count(*) over (partition by section.id) pool_size
        from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
        where question.assessment_id = v_assessment.id) ranked
      where ranked.pool_rank <= coalesce(ranked.draw_count, ranked.pool_size)) chosen;
    select assessment_question_id into v_first_question from public.assessment_attempt_questions where attempt_id = v_attempt_id order by position limit 1;
  else
    insert into public.assessment_adaptive_state (attempt_id, section_id, skill, ability, estimated_cefr)
    select v_attempt_id, section.id, section.skill, v_assessment.adaptive_initial_ability, private.ability_to_cefr(v_assessment.adaptive_initial_ability)
    from public.assessment_sections section where section.assessment_id = v_assessment.id;
    select question.id into v_first_question from public.assessment_questions question
    join public.assessment_sections section on section.id = question.section_id
    where question.assessment_id = v_assessment.id order by section.position, abs(coalesce(question.difficulty_snapshot, 5) - v_assessment.adaptive_initial_ability), md5(v_seed || ':' || question.id::text) limit 1;
    if v_first_question is not null then
      insert into public.assessment_attempt_questions values (v_attempt_id, v_first_question, 0,
        case when v_assessment.randomize_options then private.shuffle_assessment_options((select question_snapshot->'options' from public.assessment_questions where id = v_first_question), v_seed || ':' || v_first_question::text) else coalesce((select question_snapshot->'options' from public.assessment_questions where id = v_first_question), '[]'::jsonb) end, now());
    end if;
  end if;
  update public.assessment_attempts set current_question_id = v_first_question, current_section_id = (select section_id from public.assessment_questions where id = v_first_question) where id = v_attempt_id;
  update public.assessment_assignments set status = 'started' where id = v_assignment.id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt_id, 'assessment_started');
  return v_attempt_id;
end;
$$;

create or replace function public.save_assessment_response(p_attempt_id uuid, p_question_id uuid, p_answer_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz;
begin
  if jsonb_typeof(p_answer_payload) <> 'object' or jsonb_typeof(p_answer_payload->'value') <> 'string' then raise exception 'Invalid answer payload'; end if;
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  select due_at into v_due_at from public.assessment_assignments where id = v_attempt.assessment_assignment_id for key share;
  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now()) or (v_due_at is not null and v_due_at <= now()) then raise exception 'Assessment time has expired'; end if;
  if not exists (select 1 from public.assessment_attempt_questions where attempt_id = p_attempt_id and assessment_question_id = p_question_id) then raise exception 'Question does not belong to this attempt'; end if;
  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at)
  values (v_attempt.id, v_attempt.assessment_id, p_question_id, p_answer_payload, now())
  on conflict (attempt_id, assessment_question_id) do update set answer_payload = excluded.answer_payload, answered_at = excluded.answered_at;
  update public.assessment_attempts set current_question_id = p_question_id, current_section_id = (select section_id from public.assessment_questions where id = p_question_id) where id = v_attempt.id;
  insert into public.assessment_events (attempt_id, event_type, metadata) values (v_attempt.id, 'answer_saved', jsonb_build_object('question_id', p_question_id));
end;
$$;

create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  return jsonb_build_object(
    'attempt', jsonb_build_object('id', v_attempt.id, 'assignmentId', v_attempt.assessment_assignment_id, 'status', v_attempt.status, 'startedAt', v_attempt.started_at, 'expiresAt', v_attempt.expires_at, 'currentQuestionId', v_attempt.current_question_id),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description,
      'navigationMode', v_assessment.navigation_mode, 'assessmentMode', v_assessment.assessment_mode,
      'adaptiveComplete', v_assessment.assessment_mode = 'adaptive' and v_attempt.current_question_id is null),
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', section.id, 'title', section.title, 'instructions', section.instructions, 'position', section.position) order by section.position) from public.assessment_sections section where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', question.id, 'sectionId', question.section_id,
      'type', question.question_snapshot->>'type', 'prompt', question.question_snapshot->>'prompt',
      'options', delivered.presented_options, 'required', question.required) order by delivered.position)
      from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id
      where delivered.attempt_id = v_attempt.id), '[]'::jsonb),
    'answers', coalesce((select jsonb_object_agg(response.assessment_question_id::text, response.answer_payload->>'value') from public.assessment_responses response where response.attempt_id = v_attempt.id), '{}'::jsonb));
end;
$$;

create or replace function public.record_assessment_event(p_attempt_id uuid, p_event_type text, p_question_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_duration integer; v_clean_metadata jsonb := '{}'::jsonb;
begin
  if p_event_type not in ('question_opened', 'question_closed', 'tab_blur', 'tab_focus', 'fullscreen_exit', 'paste_detected', 'network_disconnect', 'network_reconnect') then raise exception 'Unsupported client event'; end if;
  if jsonb_typeof(p_metadata) <> 'object' or octet_length(p_metadata::text) > 2048 then raise exception 'Invalid event metadata'; end if;
  if p_event_type in ('question_closed', 'tab_focus') then
    if jsonb_typeof(p_metadata->'durationMs') <> 'number' then raise exception 'Event duration is required'; end if;
    v_duration := least(3600000, greatest(0, (p_metadata->>'durationMs')::integer));
    v_clean_metadata := jsonb_build_object('durationMs', v_duration);
  elsif p_event_type = 'paste_detected' then
    if jsonb_typeof(p_metadata->'pasteLength') <> 'number' then raise exception 'Paste length is required'; end if;
    v_clean_metadata := jsonb_build_object('pasteLength', least(1000000, greatest(0, (p_metadata->>'pasteLength')::integer)));
  end if;
  if not exists (select 1 from public.assessment_attempts where id = p_attempt_id and student_id = (select auth.uid()) and status = 'in_progress') then raise exception 'Active assessment attempt not found'; end if;
  if p_question_id is not null and not exists (select 1 from public.assessment_attempt_questions where attempt_id = p_attempt_id and assessment_question_id = p_question_id) then raise exception 'Question does not belong to this attempt'; end if;
  insert into public.assessment_events (attempt_id, event_type, metadata) values (p_attempt_id, p_event_type,
    v_clean_metadata || case when p_question_id is null then '{}'::jsonb else jsonb_build_object('questionId', p_question_id) end);
  if p_event_type = 'question_closed' and p_question_id is not null then
    insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, time_spent_ms)
    select p_attempt_id, attempt.assessment_id, p_question_id, '{}'::jsonb, v_duration
    from public.assessment_attempts attempt where attempt.id = p_attempt_id
    on conflict (attempt_id, assessment_question_id) do update
      set time_spent_ms = public.assessment_responses.time_spent_ms + excluded.time_spent_ms;
  end if;
  update public.assessment_attempts set integrity_status = case
    when (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'session_conflict') >= 2
      or (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'tab_blur') >= 6
      or (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'paste_detected') >= 3 then 'review_recommended'
    when exists (select 1 from public.assessment_events where attempt_id = p_attempt_id and event_type in ('tab_blur', 'paste_detected', 'fullscreen_exit', 'session_conflict')) then 'unusual_activity'
    else 'no_unusual_activity' end where id = p_attempt_id;
end;
$$;

create or replace function public.advance_adaptive_attempt(p_attempt_id uuid, p_question_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_question public.assessment_questions%rowtype;
  v_response public.assessment_responses%rowtype; v_state public.assessment_adaptive_state%rowtype;
  v_correct boolean; v_adjustment numeric; v_next uuid; v_next_section uuid; v_position integer; v_stop boolean;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id and assessment_mode = 'adaptive';
  if not found or v_attempt.current_question_id is distinct from p_question_id then raise exception 'Adaptive question is not current'; end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= now() then raise exception 'Assessment time has expired'; end if;
  select * into v_question from public.assessment_questions where id = p_question_id and assessment_id = v_attempt.assessment_id;
  select * into v_response from public.assessment_responses where attempt_id = p_attempt_id and assessment_question_id = p_question_id for update;
  if not found or nullif(v_response.answer_payload->>'value', '') is null then raise exception 'Answer must be saved before advancing'; end if;
  if v_response.grading_status <> 'pending' then return jsonb_build_object('complete', v_attempt.current_question_id is null, 'nextQuestionId', v_attempt.current_question_id); end if;
  v_correct := private.assessment_answer_is_correct(v_question.question_snapshot->>'type', v_response.answer_payload->>'value', v_question.question_snapshot->>'answer');
  update public.assessment_responses set score = case when v_correct then v_question.weight else 0 end, max_score = v_question.weight, grading_status = 'auto_graded' where id = v_response.id;
  select * into v_state from public.assessment_adaptive_state where attempt_id = p_attempt_id and section_id = v_question.section_id for update;
  v_adjustment := case when v_correct then .65 + greatest(0, coalesce(v_question.difficulty_snapshot, 5) - v_state.ability) * .18 else -(.65 + greatest(0, v_state.ability - coalesce(v_question.difficulty_snapshot, 5)) * .18) end;
  v_state.ability := least(10, greatest(1, v_state.ability + v_adjustment));
  v_state.items_answered := v_state.items_answered + 1; v_state.correct_count := v_state.correct_count + case when v_correct then 1 else 0 end;
  v_state.incorrect_count := v_state.incorrect_count + case when v_correct then 0 else 1 end; v_state.confidence := least(.95, v_state.items_answered::numeric / 8);
  v_state.recent_abilities := (v_state.recent_abilities || v_state.ability)[greatest(1, array_length(v_state.recent_abilities || v_state.ability, 1) - 3):];
  v_stop := v_state.items_answered >= v_assessment.adaptive_max_items or (v_state.items_answered >= v_assessment.adaptive_min_items and v_state.confidence >= v_assessment.adaptive_confidence_threshold and array_length(v_state.recent_abilities, 1) >= 3 and (select max(value) - min(value) from unnest(v_state.recent_abilities) value) <= .75);
  update public.assessment_adaptive_state set ability = v_state.ability, confidence = v_state.confidence, items_answered = v_state.items_answered,
    correct_count = v_state.correct_count, incorrect_count = v_state.incorrect_count, last_difficulty = v_question.difficulty_snapshot,
    recent_abilities = v_state.recent_abilities, estimated_cefr = private.ability_to_cefr(v_state.ability), stopped = v_stop, updated_at = now()
  where attempt_id = p_attempt_id and section_id = v_question.section_id;

  if not v_stop then
    select question.id into v_next from public.assessment_questions question where question.section_id = v_question.section_id
      and not exists (select 1 from public.assessment_attempt_questions used where used.attempt_id = p_attempt_id and used.assessment_question_id = question.id)
      order by abs(coalesce(question.difficulty_snapshot, 5) - v_state.ability), md5(v_attempt.randomization_seed || ':' || question.id::text) limit 1;
  end if;
  if v_next is null then
    update public.assessment_adaptive_state set stopped = true where attempt_id = p_attempt_id and section_id = v_question.section_id;
    select state.section_id into v_next_section from public.assessment_adaptive_state state join public.assessment_sections section on section.id = state.section_id
      where state.attempt_id = p_attempt_id and not state.stopped order by section.position limit 1;
    if v_next_section is not null then
      select question.id into v_next from public.assessment_questions question join public.assessment_adaptive_state state on state.section_id = question.section_id and state.attempt_id = p_attempt_id
      where question.section_id = v_next_section and not exists (select 1 from public.assessment_attempt_questions used where used.attempt_id = p_attempt_id and used.assessment_question_id = question.id)
      order by abs(coalesce(question.difficulty_snapshot, 5) - state.ability), md5(v_attempt.randomization_seed || ':' || question.id::text) limit 1;
    end if;
  end if;
  if v_next is not null then
    select coalesce(max(position), -1) + 1 into v_position from public.assessment_attempt_questions where attempt_id = p_attempt_id;
    insert into public.assessment_attempt_questions (attempt_id, assessment_question_id, position, presented_options)
    select p_attempt_id, question.id, v_position, case when v_assessment.randomize_options then private.shuffle_assessment_options(question.question_snapshot->'options', v_attempt.randomization_seed || ':' || question.id::text) else coalesce(question.question_snapshot->'options', '[]'::jsonb) end
    from public.assessment_questions question where question.id = v_next;
  end if;
  update public.assessment_attempts set current_question_id = v_next, current_section_id = (select section_id from public.assessment_questions where id = v_next) where id = p_attempt_id;
  return jsonb_build_object('complete', v_next is null, 'nextQuestionId', v_next);
end;
$$;

-- Grade only questions actually delivered to the attempt; this is essential for pools and adaptive tests.
create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_has_manual boolean; v_raw_score numeric; v_scaled_score numeric; v_cefr text;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if;
  select due_at into v_due_at from public.assessment_assignments where id = v_attempt.assessment_assignment_id for key share;
  if v_attempt.status in ('submitted', 'grading', 'completed') then return; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now()) or (v_due_at is not null and v_due_at <= now()) then
    update public.assessment_attempts set status = 'expired' where id = v_attempt.id; update public.assessment_assignments set status = 'expired' where id = v_attempt.assessment_assignment_id; return;
  end if;
  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at)
  select v_attempt.id, v_attempt.assessment_id, delivered.assessment_question_id, '{}'::jsonb, null from public.assessment_attempt_questions delivered where delivered.attempt_id = v_attempt.id
  on conflict (attempt_id, assessment_question_id) do nothing;
  update public.assessment_responses response set max_score = question.weight,
    score = case when question.question_snapshot->>'type' in ('multiple_choice', 'fill_blank', 'true_false', 'ordering') then case when private.assessment_answer_is_correct(question.question_snapshot->>'type', response.answer_payload->>'value', question.question_snapshot->>'answer') then question.weight else 0 end else null end,
    grading_status = case when question.question_snapshot->>'type' in ('multiple_choice', 'fill_blank', 'true_false', 'ordering') then 'auto_graded' else 'manual_review' end
  from public.assessment_questions question join public.assessment_attempt_questions delivered on delivered.assessment_question_id = question.id and delivered.attempt_id = v_attempt.id
  where response.attempt_id = v_attempt.id and question.id = response.assessment_question_id;
  select exists(select 1 from public.assessment_responses where attempt_id = v_attempt.id and grading_status = 'manual_review') into v_has_manual;
  select coalesce(sum(score), 0) into v_raw_score from public.assessment_responses where attempt_id = v_attempt.id;
  select round(100 * sum(section_score * section_weight) / nullif(sum(section_weight), 0), 2) into v_scaled_score from (
    select section.id, section.weight section_weight, coalesce(sum(response.score), 0) / nullif(sum(response.max_score), 0) section_score
    from public.assessment_sections section join public.assessment_questions question on question.section_id = section.id
    join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id
    where section.assessment_id = v_attempt.assessment_id group by section.id, section.weight) scores;
  select private.ability_to_cefr((percentile_cont(.5) within group (order by ability))::numeric) into v_cefr from public.assessment_adaptive_state where attempt_id = v_attempt.id and items_answered > 0;
  update public.assessment_attempts set status = case when v_has_manual then 'grading' else 'completed' end, submitted_at = now(), raw_score = v_raw_score,
    scaled_score = coalesce(v_scaled_score, 0), estimated_cefr = v_cefr where id = v_attempt.id;
  update public.assessment_assignments set status = case when v_has_manual then 'grading' else 'completed' end where id = v_attempt.assessment_assignment_id;
  insert into public.assessment_events (attempt_id, event_type) values (v_attempt.id, 'submitted');
end;
$$;

create or replace function public.get_assessment_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_student_name text;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment result not found'; end if;
  select full_name into v_student_name from public.profiles where id = v_attempt.student_id; select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  return jsonb_build_object(
    'attempt', jsonb_build_object('id', v_attempt.id, 'studentId', v_attempt.student_id, 'studentName', v_student_name, 'status', v_attempt.status,
      'startedAt', v_attempt.started_at, 'submittedAt', v_attempt.submitted_at, 'rawScore', v_attempt.raw_score, 'scaledScore', v_attempt.scaled_score,
      'estimatedCefr', v_attempt.estimated_cefr, 'integrityStatus', v_attempt.integrity_status, 'reviewedAt', v_attempt.reviewed_at, 'scoringModelVersion', v_attempt.scoring_model_version),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'type', v_assessment.type, 'version', v_assessment.version),
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', section.id, 'title', section.title, 'skill', section.skill, 'score', coalesce(scores.score, 0), 'maxScore', coalesce(scores.max_score, 0), 'percentage', round(100 * coalesce(scores.score, 0) / nullif(scores.max_score, 0), 2)) order by section.position)
      from public.assessment_sections section left join lateral (select sum(response.score) score, sum(response.max_score) max_score from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id = question.id where question.section_id = section.id and response.attempt_id = v_attempt.id) scores on true where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', question.id, 'sectionId', question.section_id, 'prompt', question.question_snapshot->>'prompt', 'type', question.question_snapshot->>'type', 'options', delivered.presented_options,
      'correctAnswer', question.question_snapshot->>'answer', 'explanation', question.question_snapshot->>'explanation', 'answer', response.answer_payload->>'value', 'score', response.score, 'maxScore', response.max_score,
      'gradingStatus', response.grading_status, 'teacherFeedback', response.teacher_feedback, 'responseId', response.id, 'timeSpentMs', response.time_spent_ms) order by delivered.position)
      from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id left join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id where delivered.attempt_id = v_attempt.id), '[]'::jsonb),
    'integrity', jsonb_build_object('status', v_attempt.integrity_status,
      'windowExits', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'tab_blur'),
      'timeOutsideMs', coalesce((select sum(coalesce((metadata->>'durationMs')::integer, 0)) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'tab_focus'), 0),
      'pasteEvents', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'paste_detected'),
      'sessionConflicts', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'session_conflict'),
      'events', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', event_type, 'occurredAt', occurred_at, 'metadata', metadata) order by occurred_at) from public.assessment_events where attempt_id = v_attempt.id and event_type not in ('answer_saved')), '[]'::jsonb)),
    'adaptiveSkills', coalesce((select jsonb_agg(jsonb_build_object('sectionId', section_id, 'skill', skill, 'ability', ability, 'cefr', estimated_cefr, 'confidence', confidence, 'itemsAnswered', items_answered) order by skill, section_id) from public.assessment_adaptive_state where attempt_id = v_attempt.id), '[]'::jsonb));
end;
$$;

revoke all on function public.get_assessment_draft(uuid) from public, anon;
revoke all on function public.save_assessment_draft(jsonb) from public, anon;
revoke all on function public.publish_assessment(uuid) from public, anon;
revoke all on function public.start_assessment_attempt(uuid, text) from public, anon;
revoke all on function public.load_assessment_attempt(uuid) from public, anon;
revoke all on function public.save_assessment_response(uuid, uuid, jsonb) from public, anon;
revoke all on function public.record_assessment_event(uuid, text, uuid, jsonb) from public, anon;
revoke all on function public.advance_adaptive_attempt(uuid, uuid) from public, anon;
revoke all on function public.submit_assessment_attempt(uuid) from public, anon;
revoke all on function public.get_assessment_result(uuid) from public, anon;
grant execute on function public.get_assessment_draft(uuid) to authenticated;
grant execute on function public.save_assessment_draft(jsonb) to authenticated;
grant execute on function public.publish_assessment(uuid) to authenticated;
grant execute on function public.start_assessment_attempt(uuid, text) to authenticated;
grant execute on function public.load_assessment_attempt(uuid) to authenticated;
grant execute on function public.save_assessment_response(uuid, uuid, jsonb) to authenticated;
grant execute on function public.record_assessment_event(uuid, text, uuid, jsonb) to authenticated;
grant execute on function public.advance_adaptive_attempt(uuid, uuid) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid) to authenticated;
grant execute on function public.get_assessment_result(uuid) to authenticated;
