-- Paced assessments: the student completes the assessment part by part.
--
-- * assessments.section_pacing = 'sections' turns every section that has student questions
--   into a part ("etapa"). Parts are taken in order; each may have its own time limit
--   (assessment_sections.time_limit_minutes), and its clock runs only while it is open.
-- * Between parts the student can stop and come back later: answers are saved as they are
--   given and the attempt has no global clock (only the assignment deadline).
-- * A completed or expired part is closed: its answers and recordings can no longer change.
-- * The attempt can be submitted only after every part is finished.
-- * Level Checks generated from presets are paced with editable default times per part.

alter table public.assessments add column section_pacing text not null default 'none' check (section_pacing in ('none', 'sections'));
alter table public.assessment_sections add column time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes between 1 and 240);

create table public.assessment_attempt_sections (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  section_id uuid not null references public.assessment_sections(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  completed_at timestamptz,
  completion_reason text check (completion_reason in ('student', 'time_expired', 'submitted')),
  primary key (attempt_id, section_id),
  constraint assessment_attempt_sections_completion check ((completed_at is null) = (completion_reason is null))
);
alter table public.assessment_attempt_sections enable row level security;
revoke all on table public.assessment_attempt_sections from anon, authenticated;
grant all on table public.assessment_attempt_sections to service_role;

create or replace function private.attempt_section_pacing(p_attempt_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select assessment.section_pacing = 'sections' and assessment.assessment_mode = 'fixed'
    from public.assessment_attempts attempt join public.assessments assessment on assessment.id = attempt.assessment_id
    where attempt.id = p_attempt_id), false);
$$;

-- Parts the student takes: sections with at least one delivered question that is not live.
create or replace function private.attempt_student_sections(p_attempt_id uuid)
returns table (section_id uuid, part_position integer) language sql stable security definer set search_path = '' as $$
  select section.id, (row_number() over (order by section.position))::integer
  from public.assessment_sections section
  where exists (
    select 1 from public.assessment_attempt_questions delivered
    join public.assessment_questions question on question.id = delivered.assessment_question_id
    where delivered.attempt_id = p_attempt_id and question.section_id = section.id
      and not private.assessment_question_is_live(question.question_snapshot)
  )
  order by section.position;
$$;

create or replace function private.close_expired_attempt_sections(p_attempt_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.assessment_attempt_sections
  set completed_at = expires_at, completion_reason = 'time_expired'
  where attempt_id = p_attempt_id and completed_at is null and expires_at is not null and expires_at <= now();
$$;

create or replace function private.require_open_attempt_section(p_attempt_id uuid, p_question_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_stage public.assessment_attempt_sections%rowtype;
begin
  if not private.attempt_section_pacing(p_attempt_id) then return; end if;
  perform private.close_expired_attempt_sections(p_attempt_id);
  select stage.* into v_stage from public.assessment_attempt_sections stage
  join public.assessment_questions question on question.section_id = stage.section_id
  where stage.attempt_id = p_attempt_id and question.id = p_question_id;
  if not found then raise exception 'Start this part before answering'; end if;
  if v_stage.completed_at is not null then raise exception 'This part is closed'; end if;
end;
$$;

revoke all on function private.attempt_section_pacing(uuid), private.attempt_student_sections(uuid), private.close_expired_attempt_sections(uuid), private.require_open_attempt_section(uuid, uuid) from public, anon, authenticated;

create or replace function public.start_assessment_section(p_attempt_id uuid, p_section_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_stage public.assessment_attempt_sections%rowtype; v_position integer; v_limit integer;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  if not private.attempt_section_pacing(p_attempt_id) then raise exception 'This assessment is not divided into parts'; end if;
  if v_attempt.expires_at is not null and v_attempt.expires_at <= now() then raise exception 'Assessment time has expired'; end if;
  perform private.close_expired_attempt_sections(p_attempt_id);
  select part_position into v_position from private.attempt_student_sections(p_attempt_id) where section_id = p_section_id;
  if v_position is null then raise exception 'Part not found in this attempt'; end if;
  if exists (
    select 1 from private.attempt_student_sections(p_attempt_id) earlier
    where earlier.part_position < v_position and not exists (
      select 1 from public.assessment_attempt_sections done where done.attempt_id = p_attempt_id and done.section_id = earlier.section_id and done.completed_at is not null)
  ) then raise exception 'Finish the previous parts first'; end if;
  select * into v_stage from public.assessment_attempt_sections where attempt_id = p_attempt_id and section_id = p_section_id;
  if found and v_stage.completed_at is not null then raise exception 'This part is closed'; end if;
  if not found then
    select time_limit_minutes into v_limit from public.assessment_sections where id = p_section_id;
    insert into public.assessment_attempt_sections (attempt_id, section_id, expires_at)
    values (p_attempt_id, p_section_id, case
      when v_limit is null then v_attempt.expires_at
      when v_attempt.expires_at is null then now() + make_interval(mins => v_limit)
      else least(v_attempt.expires_at, now() + make_interval(mins => v_limit)) end)
    returning * into v_stage;
    update public.assessment_attempts set current_section_id = p_section_id where id = p_attempt_id;
  end if;
  return jsonb_strip_nulls(jsonb_build_object('sectionId', v_stage.section_id, 'startedAt', v_stage.started_at, 'expiresAt', v_stage.expires_at));
end;
$$;

create or replace function public.complete_assessment_section(p_attempt_id uuid, p_section_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
    where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress') then
    raise exception 'Active assessment attempt not found';
  end if;
  perform private.close_expired_attempt_sections(p_attempt_id);
  update public.assessment_attempt_sections set completed_at = now(), completion_reason = 'student'
  where attempt_id = p_attempt_id and section_id = p_section_id and completed_at is null;
  if not found and not exists (select 1 from public.assessment_attempt_sections where attempt_id = p_attempt_id and section_id = p_section_id) then
    raise exception 'Start this part before finishing it';
  end if;
end;
$$;

-- Builder: pacing settings travel with the draft, like the CEFR metadata.
create or replace function public.save_assessment_pacing(p_assessment_id uuid, p_draft jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_section jsonb; v_position bigint; v_limit integer;
begin
  update public.assessments set section_pacing = case when p_draft->>'sectionPacing' = 'sections' then 'sections' else 'none' end
  where id = p_assessment_id and teacher_id = (select auth.uid()) and status = 'draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  for v_section, v_position in select value, ordinality - 1 from jsonb_array_elements(coalesce(p_draft->'sections', '[]'::jsonb)) with ordinality loop
    v_limit := nullif(v_section->>'timeLimitMinutes', '')::integer;
    if v_limit is not null and v_limit not between 1 and 240 then raise exception 'Part time must be between 1 and 240 minutes'; end if;
    update public.assessment_sections set time_limit_minutes = v_limit where assessment_id = p_assessment_id and position = v_position;
  end loop;
end;
$$;

create or replace function public.get_assessment_pacing(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_pacing text;
begin
  select section_pacing into v_pacing from public.assessments where id = p_assessment_id and teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment not found'; end if;
  return jsonb_build_object('sectionPacing', v_pacing,
    'sections', coalesce((select jsonb_agg(jsonb_build_object('timeLimitMinutes', time_limit_minutes) order by position) from public.assessment_sections where assessment_id = p_assessment_id), '[]'::jsonb));
end;
$$;

-- Default part times for generated Level Checks (the teacher can edit them in the draft).
create or replace function private.apply_level_check_pacing(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_levels constant text[] := array['A1','A2','B1','B2','C1','C2'];
begin
  update public.assessments set section_pacing = 'sections', time_limit_minutes = null where id = p_assessment_id;
  update public.assessment_sections section set time_limit_minutes = case section.skill
      when 'reading' then (array[6, 8, 10, 12, 15, 18])[array_position(v_levels, section.cefr_level)]
      when 'listening' then (array[6, 8, 10, 12, 15, 18])[array_position(v_levels, section.cefr_level)]
      when 'language_use' then ceil((select count(*) from public.assessment_questions question where question.section_id = section.id)
        * (array[1, 1, 1, 1.5, 1.5, 1.5])[array_position(v_levels, section.cefr_level)])::integer
      when 'writing' then (array[15, 20, 30, 40, 45, 50])[array_position(v_levels, section.cefr_level)]
      when 'spoken_production' then 10
      when 'mediation' then 15
      else null end
  where section.assessment_id = p_assessment_id;
end;
$$;
revoke all on function private.apply_level_check_pacing(uuid) from public, anon, authenticated;

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
    if v_active_device is null then
      -- Opened by the teacher for a live part: the student's timer starts now.
      update public.assessment_attempts set device_session_id = trim(p_device_session_id),
        expires_at = case when v_assessment.time_limit_minutes is null or v_assessment.section_pacing = 'sections' then v_assignment.due_at when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes) else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes)) end
      where id = v_attempt_id;
      insert into public.assessment_events (attempt_id, event_type, metadata) values (v_attempt_id, 'resumed', jsonb_build_object('claimedTeacherAttempt', true));
      return v_attempt_id;
    end if;
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
    case when v_assessment.time_limit_minutes is null or v_assessment.section_pacing = 'sections' then v_assignment.due_at when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes) else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes)) end,
    trim(p_device_session_id), v_assessment.scoring_model_version) returning id, randomization_seed into v_attempt_id, v_seed;

  if v_assessment.assessment_mode = 'fixed' then
    v_first_question := private.deliver_fixed_assessment_questions(v_attempt_id, v_assessment.id, v_seed);
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

-- No longer stable: reading the attempt closes parts whose time is over.
create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  perform private.close_expired_attempt_sections(p_attempt_id);
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if; select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  return jsonb_build_object('attempt',jsonb_build_object('id',v_attempt.id,'assignmentId',v_attempt.assessment_assignment_id,'status',v_attempt.status,'startedAt',v_attempt.started_at,'expiresAt',v_attempt.expires_at,'currentQuestionId',v_attempt.current_question_id),
    'assessment',jsonb_build_object('id',v_assessment.id,'title',v_assessment.title,'description',v_assessment.description,'navigationMode',v_assessment.navigation_mode,'assessmentMode',v_assessment.assessment_mode,'framework',v_assessment.framework,'adaptiveComplete',v_assessment.assessment_mode='adaptive' and v_attempt.current_question_id is null,'sectionPacing',private.attempt_section_pacing(v_attempt.id),
      'liveQuestionCount',(select count(*) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and private.assessment_question_is_live(question.question_snapshot))),
    'sections',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',section.id,'title',section.title,'instructions',section.instructions,'position',section.position,'timeLimitMinutes',section.time_limit_minutes,'startedAt',stage.started_at,'expiresAt',stage.expires_at,'completedAt',stage.completed_at,'completionReason',stage.completion_reason)) order by section.position) from public.assessment_sections section left join public.assessment_attempt_sections stage on stage.attempt_id=v_attempt.id and stage.section_id=section.id where section.assessment_id=v_assessment.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'sectionId',question.section_id,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt','options',delivered.presented_options,'required',question.required,'sourceMaterial',question.question_snapshot->>'sourceMaterial','responseConstraints',question.question_snapshot->'responseConstraints','audioPath',question.question_snapshot->>'audioPath','maxPlays',(question.question_snapshot->>'maxPlays')::integer,'autoplay',(question.question_snapshot->>'autoplay')::boolean,'transcript',case when question.question_snapshot->>'transcriptVisibility'='always' then question.question_snapshot->>'transcript' end,'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'allowReview',(question.question_snapshot->>'allowReview')::boolean)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'[]'::jsonb),
    'answers',coalesce((select jsonb_object_agg(response.assessment_question_id::text,response.answer_payload->>'value') from public.assessment_responses response join public.assessment_questions question on question.id=response.assessment_question_id where response.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'{}'::jsonb));
end;
$$;

create or replace function public.save_assessment_response(p_attempt_id uuid,p_question_id uuid,p_answer_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_type text; v_live boolean;
begin
  if jsonb_typeof(p_answer_payload)<>'object' or jsonb_typeof(p_answer_payload->'value')<>'string' or octet_length(p_answer_payload->>'value')>200000 then raise exception 'Invalid answer payload'; end if;
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid()) and attempt.status='in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if; select due_at into v_due_at from public.assessment_assignments where id=v_attempt.assessment_assignment_id for key share;
  if (v_attempt.expires_at is not null and v_attempt.expires_at<=now()) or (v_due_at is not null and v_due_at<=now()) then raise exception 'Assessment time has expired'; end if;
  select question.question_snapshot->>'type',private.assessment_question_is_live(question.question_snapshot) into v_type,v_live from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=p_attempt_id and question.id=p_question_id;
  if v_type is null then raise exception 'Question does not belong to this attempt'; end if;
  if v_live then raise exception 'This task is administered live by the teacher'; end if;
  perform private.require_open_attempt_section(p_attempt_id, p_question_id);
  if v_type in ('writing','mediation') and char_length(p_answer_payload->>'value')>50000 then raise exception 'Productive response is too long'; end if;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,answered_at) values(v_attempt.id,v_attempt.assessment_id,p_question_id,p_answer_payload,now()) on conflict(attempt_id,assessment_question_id) do update set answer_payload=excluded.answer_payload,answered_at=excluded.answered_at;
  update public.assessment_attempts set current_question_id=p_question_id,current_section_id=(select section_id from public.assessment_questions where id=p_question_id) where id=v_attempt.id;
  insert into public.assessment_events(attempt_id,event_type,metadata) values(v_attempt.id,'answer_saved',jsonb_build_object('question_id',p_question_id));
end; $$;

create or replace function public.register_speaking_recording(p_attempt_id uuid, p_question_id uuid, p_storage_path text, p_duration_ms integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_expected_prefix text; v_response_id uuid; v_teacher_id uuid;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'speaking' and not private.assessment_question_is_live(question.question_snapshot) for update of attempt;
  if v_attempt.id is null then raise exception 'Invalid speaking media path'; end if;
  perform private.require_open_attempt_section(p_attempt_id, p_question_id);
  select teacher_id into v_teacher_id from public.assessment_assignments where id = v_attempt.assessment_assignment_id;
  v_expected_prefix := v_teacher_id::text || '/' || v_attempt.student_id::text || '/' || v_attempt.id::text || '/' || p_question_id::text || '.';
  if p_storage_path not in (v_expected_prefix || 'webm', v_expected_prefix || 'm4a', v_expected_prefix || 'mp4', v_expected_prefix || 'ogg') then raise exception 'Invalid speaking media path'; end if;
  if p_duration_ms not between 1 and 900000 then raise exception 'Invalid recording duration'; end if;
  if not exists (select 1 from storage.objects where bucket_id = 'assessment-audio' and name = p_storage_path) then raise exception 'Recording upload was not found'; end if;
  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at) values (p_attempt_id, v_attempt.assessment_id, p_question_id, jsonb_build_object('value', p_storage_path), now())
  on conflict (attempt_id, assessment_question_id) do update set answer_payload = excluded.answer_payload, answered_at = excluded.answered_at returning id into v_response_id;
  insert into public.assessment_response_media (response_id, attempt_id, assessment_question_id, storage_path, duration_ms) values (v_response_id, p_attempt_id, p_question_id, p_storage_path, p_duration_ms)
  on conflict (response_id) do update set storage_path = excluded.storage_path, duration_ms = excluded.duration_ms, retention_until = now() + interval '180 days', deleted_at = null;
end;
$$;

create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid()) for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if; if v_attempt.status in ('submitted','grading','completed') then return; end if; if v_attempt.status<>'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  select due_at into v_due_at from public.assessment_assignments where id=v_attempt.assessment_assignment_id; if (v_attempt.expires_at is not null and v_attempt.expires_at<=now()) or (v_due_at is not null and v_due_at<=now()) then update public.assessment_attempts set status='expired' where id=v_attempt.id; update public.assessment_assignments set status='expired' where id=v_attempt.assessment_assignment_id; return; end if;
  if private.attempt_section_pacing(v_attempt.id) then
    perform private.close_expired_attempt_sections(v_attempt.id);
    update public.assessment_attempt_sections set completed_at=now(),completion_reason='submitted' where attempt_id=v_attempt.id and completed_at is null;
    if exists(select 1 from private.attempt_student_sections(v_attempt.id) stage where not exists(select 1 from public.assessment_attempt_sections done where done.attempt_id=v_attempt.id and done.section_id=stage.section_id and done.completed_at is not null)) then
      raise exception 'Complete every part before submitting';
    end if;
  end if;
  perform private.grade_submitted_assessment_attempt(v_attempt.id);
end; $$;

create or replace function public.generate_assessment_from_preset(
  p_preset_id text,
  p_bank_version text default 'pilot-0.3',
  p_selection_seed text default 'pilot-form-1'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := (select auth.uid());
  v_preset public.cefr_level_check_presets%rowtype;
  v_assessment_id uuid;
  v_skill text;
  v_level_count record;
  v_tasklet record;
  v_item public.question_bank%rowtype;
  v_item_ids text[];
  v_kind text;
  v_role text;
  v_part integer;
  -- Parts are numbered by the skills the preset actually contains (Listening may be disabled).
  v_comprehension_parts integer;
  v_writing_level text;
  v_writing_count integer;
  v_task_index integer := 0;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then
    raise exception 'Teacher access required';
  end if;

  if nullif(trim(p_bank_version), '') is null
    or nullif(trim(p_selection_seed), '') is null
    or char_length(p_selection_seed) > 100
  then
    raise exception 'Invalid preset generation parameters';
  end if;

  select * into v_preset
  from public.cefr_level_check_presets
  where id = p_preset_id and active;

  if not found then
    raise exception 'CEFR Level Check preset not found';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_teacher_id::text || ':' || p_preset_id || ':' || p_bank_version || ':' || p_selection_seed,
      0
    )
  );

  select id into v_assessment_id
  from public.assessments
  where teacher_id = v_teacher_id
    and preset_id = p_preset_id
    and preset_version = v_preset.preset_version
    and bank_version = p_bank_version
    and selection_seed = p_selection_seed
    and status = 'draft'
  order by created_at
  limit 1;

  if found then
    return v_assessment_id;
  end if;

  -- Preserve the hand-curated first B1 pilot form.
  if p_preset_id = 'cefr-b1-level-check'
    and p_bank_version = 'pilot-0.2'
    and p_selection_seed = 'pilot-form-1'
  then
    v_assessment_id := public.create_cefr_b1_pilot_form_internal();
    update public.assessments
    set title = 'CEFR B1 Level Check — Pilot Form 1',
        preset_id = v_preset.id,
        preset_version = v_preset.preset_version,
        bank_version = p_bank_version,
        selection_seed = p_selection_seed,
        form_version = v_preset.form_version,
        decision_rule_version = v_preset.decision_rule_version,
        report_model_version = v_preset.report_model_version
    where id = v_assessment_id;

    perform private.validate_cefr_level_check(v_assessment_id);
    return v_assessment_id;
  end if;

  insert into public.assessments (
    teacher_id, title, description, type, status, assessment_mode, navigation_mode,
    level_min, level_max, time_limit_minutes, max_attempts, randomize_questions,
    randomize_options, show_results, scoring_model_version, framework, form_version,
    decision_rule_version, routing_rule_version, report_model_version,
    preset_id, preset_version, bank_version, selection_seed
  ) values (
    v_teacher_id,
    'CEFR ' || v_preset.target_level || ' Level Check — ' ||
      case when p_selection_seed = 'pilot-form-1' then 'Pilot Form 1' else p_selection_seed end,
    v_preset.purpose || ' Parte objetiva seguida por tarefas produtivas com revisão humana.',
    'placement', 'draft', 'fixed', 'linear',
    coalesce(v_preset.floor_level, v_preset.target_level),
    coalesce(v_preset.ceiling_level, v_preset.target_level),
    null, 1, false, true, 'after_teacher_review',
    'objective-v1', 'cefr', v_preset.form_version,
    v_preset.decision_rule_version, 'cefr-routing-v1',
    v_preset.report_model_version, v_preset.id, v_preset.preset_version,
    p_bank_version, p_selection_seed
  ) returning id into v_assessment_id;

  v_comprehension_parts := (select count(*) from unnest(array['reading', 'listening']) skill where v_preset.objective_distribution ? skill);
  foreach v_skill in array array['reading', 'listening'] loop
    continue when not v_preset.objective_distribution ? v_skill;
    v_part := case when v_skill = 'listening' and v_preset.objective_distribution ? 'reading' then 2 else 1 end;

    for v_level_count in
      select key level, value::text::integer item_count
      from jsonb_each(v_preset.objective_distribution->v_skill)
      order by array_position(array['A1','A2','B1','B2','C1','C2'], key)
    loop
      v_kind := case
        when v_level_count.level = v_preset.floor_level then 'floor'
        when v_level_count.level = v_preset.ceiling_level then 'ceiling'
        else 'primary'
      end;
      v_role := case v_kind when 'floor' then 'Floor' when 'ceiling' then 'Ceiling' else 'Target' end;

      -- Prefer distinct topics and distinct average-difficulty buckets before the seeded tiebreaker.
      for v_tasklet in
        select ranked.*
        from (
          select candidate.*,
            row_number() over (
              partition by candidate.topic
              order by candidate.selection_hash
            ) as topic_rank,
            row_number() over (
              partition by candidate.difficulty_bucket
              order by candidate.selection_hash
            ) as difficulty_rank
          from (
            select tasklet.*,
              stats.avg_difficulty,
              case
                when stats.avg_difficulty < 2.5 then 'low'
                when stats.avg_difficulty > 3.5 then 'high'
                else 'mid'
              end as difficulty_bucket,
              md5(
                p_selection_seed || ':' || p_preset_id || ':' || v_skill || ':' ||
                v_level_count.level || ':' || tasklet.external_id
              ) as selection_hash
            from public.question_bank_tasklets tasklet
            cross join lateral (
              select avg(coalesce(bank.difficulty, 3)::numeric) as avg_difficulty
              from public.question_bank bank
              where bank.tasklet_id = tasklet.id
                and bank.bank_version = p_bank_version
                and bank.quality_status in ('approved_for_pilot', 'approved')
            ) stats
            where tasklet.bank_version = p_bank_version
              and tasklet.skill = v_skill
              and tasklet.level = v_level_count.level
              and tasklet.quality_status in ('approved_for_pilot', 'approved')
          ) candidate
        ) ranked
        order by
          greatest(ranked.topic_rank, ranked.difficulty_rank),
          ranked.topic_rank + ranked.difficulty_rank,
          abs(ranked.avg_difficulty - 3),
          ranked.selection_hash
        limit (v_level_count.item_count / 4)
      loop
        select array_agg(external_id order by tasklet_position)
        into v_item_ids
        from public.question_bank
        where tasklet_id = v_tasklet.id
          and bank_version = p_bank_version
          and quality_status in ('approved_for_pilot', 'approved');

        perform private.add_cefr_level_check_section(
          v_assessment_id,
          'PART ' || v_part || ' — ' || initcap(v_skill) || ' · ' || v_role || ' ' ||
            v_level_count.level || ' · ' || v_tasklet.external_id,
          v_skill,
          v_level_count.level,
          v_kind,
          initcap(v_skill) || ' ' || lower(v_role) ||
            ': balanced comprehension evidence across topic and difficulty',
          v_item_ids
        );
      end loop;
    end loop;
  end loop;

  for v_level_count in
    select key level, value::text::integer item_count
    from jsonb_each(v_preset.objective_distribution->'language_use')
    order by array_position(array['A1','A2','B1','B2','C1','C2'], key)
  loop
    v_kind := case
      when v_level_count.level = v_preset.floor_level then 'floor'
      when v_level_count.level = v_preset.ceiling_level then 'ceiling'
      else 'primary'
    end;
    v_role := case v_kind when 'floor' then 'Floor' when 'ceiling' then 'Ceiling' else 'Target' end;

    select array_agg(external_id order by selection_rank, rank_sum, selection_hash)
    into v_item_ids
    from (
      select ranked.*,
        greatest(ranked.subskill_rank, ranked.difficulty_rank) as selection_rank,
        ranked.subskill_rank + ranked.difficulty_rank as rank_sum
      from (
        select bank.external_id,
          md5(
            p_selection_seed || ':' || p_preset_id || ':language_use:' ||
            v_level_count.level || ':' || bank.external_id
          ) as selection_hash,
          row_number() over (
            partition by bank.subskill
            order by md5(
              p_selection_seed || ':' || p_preset_id || ':language_use:' ||
              v_level_count.level || ':' || bank.external_id
            )
          ) as subskill_rank,
          row_number() over (
            partition by bank.difficulty
            order by md5(
              p_selection_seed || ':' || p_preset_id || ':language_use:' ||
              v_level_count.level || ':' || bank.external_id
            )
          ) as difficulty_rank
        from public.question_bank bank
        where bank.bank_version = p_bank_version
          and bank.skill = 'language_use'
          and bank.level = v_level_count.level
          and bank.quality_status in ('approved_for_pilot', 'approved')
      ) ranked
      order by
        greatest(ranked.subskill_rank, ranked.difficulty_rank),
        ranked.subskill_rank + ranked.difficulty_rank,
        ranked.selection_hash
      limit v_level_count.item_count
    ) selected;

    perform private.add_cefr_level_check_section(
      v_assessment_id,
      'PART ' || (v_comprehension_parts + 1) || ' — Language Use · ' || v_role || ' ' || v_level_count.level,
      'language_use',
      v_level_count.level,
      v_kind,
      'Language Use ' || lower(v_role) ||
        ': grammar control, lexical choice, collocation, connectors, functional language, register and difficulty spread',
      v_item_ids
    );
  end loop;

  foreach v_writing_level in array case
    when v_preset.floor_level is null
      then array[v_preset.target_level, v_preset.target_level]
    else array[v_preset.floor_level, v_preset.target_level]
  end
  loop
    v_task_index := v_task_index + 1;
    v_writing_count := case
      when v_task_index = 2 and v_preset.floor_level is null then 2
      else 1
    end;

    select * into v_item
    from public.question_bank bank
    where bank.bank_version = p_bank_version
      and bank.skill = 'writing'
      and bank.level = v_writing_level
      and bank.quality_status in ('approved_for_pilot', 'approved')
    order by md5(
      p_selection_seed || ':' || p_preset_id || ':writing:' ||
      v_writing_level || ':' || bank.external_id
    )
    offset (v_writing_count - 1)
    limit 1;

    perform private.add_cefr_level_check_section(
      v_assessment_id,
      'PART ' || (v_comprehension_parts + 2) || ' — Writing · Task ' || v_task_index,
      'writing',
      v_writing_level,
      case when v_writing_level = v_preset.floor_level then 'floor' else 'primary' end,
      'Connected writing, task achievement, range, accuracy, organisation, cohesion and register',
      array[v_item.external_id]
    );
  end loop;

  for v_skill in
    select unnest(array['spoken_production', 'spoken_interaction', 'mediation'])
  loop
    select * into v_item
    from public.question_bank bank
    where bank.bank_version = p_bank_version
      and bank.skill = v_skill
      and bank.level = v_preset.target_level
      and bank.quality_status in ('approved_for_pilot', 'approved')
      and (v_skill <> 'mediation' or nullif(trim(bank.source_material), '') is not null)
    order by md5(
      p_selection_seed || ':' || p_preset_id || ':' || v_skill || ':' || bank.external_id
    )
    limit 1;

    perform private.add_cefr_level_check_section(
      v_assessment_id,
      'PART ' || (v_comprehension_parts + case v_skill
        when 'spoken_production' then 3
        when 'spoken_interaction' then 4
        else 5
      end) || ' — ' || initcap(replace(v_skill, '_', ' ')) || ' · Target ' || v_preset.target_level,
      v_skill,
      v_preset.target_level,
      'primary',
      case v_skill
        when 'spoken_production' then 'Sustained connected speech, explanation and justification'
        when 'spoken_interaction' then 'Independent interaction, response, negotiation and joint decision'
        else 'Selection, reformulation and organisation for another person'
      end,
      array[v_item.external_id]
    );
  end loop;

  perform private.apply_level_check_pacing(v_assessment_id);
  perform private.validate_cefr_level_check(v_assessment_id);
  return v_assessment_id;
end;
$$;


revoke all on function public.start_assessment_section(uuid, uuid), public.complete_assessment_section(uuid, uuid), public.save_assessment_pacing(uuid, jsonb), public.get_assessment_pacing(uuid) from public, anon;
grant execute on function public.start_assessment_section(uuid, uuid), public.complete_assessment_section(uuid, uuid), public.save_assessment_pacing(uuid, jsonb), public.get_assessment_pacing(uuid) to authenticated;
