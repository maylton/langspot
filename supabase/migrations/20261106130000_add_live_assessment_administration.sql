-- Live (teacher-administered) assessment parts.
--
-- A question whose snapshot has "administration": "live" is conducted by the teacher
-- during a lesson or call instead of being answered by the student in the runner.
-- This is mainly for Spoken Interaction tasks that need an assessor, but any speaking
-- or mediation task may be administered live.
--
-- * Live questions are delivered with the attempt as usual, but they are hidden from
--   the student payload and student writes to them are rejected.
-- * The teacher can open a live session for an assessment and student at any time.
--   If no attempt exists yet, the teacher creates one with device_session_id = null;
--   the student's first start_assessment_attempt claims it instead of reporting a
--   session conflict.
-- * Live scores go through review_assessment_response, so rubric validation is the
--   same as for asynchronous manual review. Submission no longer resets responses that
--   were already scored live.
-- * Assessments made only of live questions are completed by the teacher.

create or replace function private.assessment_question_is_live(p_snapshot jsonb)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select coalesce(p_snapshot->>'administration', 'student') = 'live';
$$;
revoke all on function private.assessment_question_is_live(jsonb) from public, anon, authenticated;

alter table public.assessment_events drop constraint assessment_events_event_type_check;
alter table public.assessment_events add constraint assessment_events_event_type_check check (event_type in (
  'assessment_started','question_opened','question_closed','answer_saved','audio_play_started','tab_blur','tab_focus','fullscreen_exit','paste_detected','network_disconnect','network_reconnect','resumed','submitted','session_conflict',
  'live_session_opened','live_response_scored'
));

-- Publishing rules for live questions.
create or replace function private.validate_live_assessment_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if exists (select 1 from public.assessment_questions question where question.assessment_id = new.id and private.assessment_question_is_live(question.question_snapshot) and question.question_snapshot->>'type' not in ('speaking', 'mediation')) then
      raise exception 'Only speaking and mediation tasks can be administered live';
    end if;
    if new.assessment_mode = 'adaptive' and exists (select 1 from public.assessment_questions question where question.assessment_id = new.id and private.assessment_question_is_live(question.question_snapshot)) then
      raise exception 'Live tasks are only available in fixed assessments';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_live_assessment_publish() from public, anon, authenticated;
create trigger validate_live_assessment_publish before update of status on public.assessments for each row execute function private.validate_live_assessment_publish();

-- Fixed-form delivery, shared by student and teacher attempt creation.
create or replace function private.deliver_fixed_assessment_questions(p_attempt_id uuid, p_assessment_id uuid, p_seed text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_assessment public.assessments%rowtype; v_first_question uuid;
begin
  select * into v_assessment from public.assessments where id = p_assessment_id;
  insert into public.assessment_attempt_questions (attempt_id, assessment_question_id, position, presented_options)
  select p_attempt_id, chosen.id, row_number() over (order by chosen.section_position, chosen.delivery_order) - 1,
    case when v_assessment.randomize_options then private.shuffle_assessment_options(chosen.question_snapshot->'options', p_seed || ':' || chosen.id::text) else coalesce(chosen.question_snapshot->'options', '[]'::jsonb) end
  from (select ranked.*, case when v_assessment.randomize_questions then md5(p_seed || ':' || ranked.id::text) else lpad(ranked.question_position::text, 10, '0') end delivery_order
    from (select question.*, section.position section_position, question.position question_position, section.draw_count,
      row_number() over (partition by section.id order by case when v_assessment.randomize_questions then md5(p_seed || ':' || question.id::text) else lpad(question.position::text, 10, '0') end) pool_rank,
      count(*) over (partition by section.id) pool_size
      from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
      where question.assessment_id = v_assessment.id) ranked
    where ranked.pool_rank <= coalesce(ranked.draw_count, ranked.pool_size)) chosen;
  select assessment_question_id into v_first_question from public.assessment_attempt_questions where attempt_id = p_attempt_id order by position limit 1;
  return v_first_question;
end;
$$;
revoke all on function private.deliver_fixed_assessment_questions(uuid, uuid, text) from public, anon, authenticated;

-- Student start: same behaviour as before, plus claiming a teacher-opened attempt.
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
        expires_at = case when v_assessment.time_limit_minutes is null then v_assignment.due_at when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes) else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes)) end
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
    case when v_assessment.time_limit_minutes is null then v_assignment.due_at when v_assignment.due_at is null then now() + make_interval(mins => v_assessment.time_limit_minutes) else least(v_assignment.due_at, now() + make_interval(mins => v_assessment.time_limit_minutes)) end,
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

-- Student payload without live questions.
create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if; select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  return jsonb_build_object('attempt',jsonb_build_object('id',v_attempt.id,'assignmentId',v_attempt.assessment_assignment_id,'status',v_attempt.status,'startedAt',v_attempt.started_at,'expiresAt',v_attempt.expires_at,'currentQuestionId',v_attempt.current_question_id),
    'assessment',jsonb_build_object('id',v_assessment.id,'title',v_assessment.title,'description',v_assessment.description,'navigationMode',v_assessment.navigation_mode,'assessmentMode',v_assessment.assessment_mode,'framework',v_assessment.framework,'adaptiveComplete',v_assessment.assessment_mode='adaptive' and v_attempt.current_question_id is null,
      'liveQuestionCount',(select count(*) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and private.assessment_question_is_live(question.question_snapshot))),
    'sections',coalesce((select jsonb_agg(jsonb_build_object('id',section.id,'title',section.title,'instructions',section.instructions,'position',section.position) order by section.position) from public.assessment_sections section where section.assessment_id=v_assessment.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'sectionId',question.section_id,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt','options',delivered.presented_options,'required',question.required,'sourceMaterial',question.question_snapshot->>'sourceMaterial','responseConstraints',question.question_snapshot->'responseConstraints','audioPath',question.question_snapshot->>'audioPath','maxPlays',(question.question_snapshot->>'maxPlays')::integer,'autoplay',(question.question_snapshot->>'autoplay')::boolean,'transcript',case when question.question_snapshot->>'transcriptVisibility'='always' then question.question_snapshot->>'transcript' end,'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'allowReview',(question.question_snapshot->>'allowReview')::boolean)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'[]'::jsonb),
    'answers',coalesce((select jsonb_object_agg(response.assessment_question_id::text,response.answer_payload->>'value') from public.assessment_responses response join public.assessment_questions question on question.id=response.assessment_question_id where response.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'{}'::jsonb));
end;
$$;

-- Student writes cannot target live questions.
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
  if v_type in ('writing','mediation') and char_length(p_answer_payload->>'value')>50000 then raise exception 'Productive response is too long'; end if;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,answered_at) values(v_attempt.id,v_attempt.assessment_id,p_question_id,p_answer_payload,now()) on conflict(attempt_id,assessment_question_id) do update set answer_payload=excluded.answer_payload,answered_at=excluded.answered_at;
  update public.assessment_attempts set current_question_id=p_question_id,current_section_id=(select section_id from public.assessment_questions where id=p_question_id) where id=v_attempt.id;
  insert into public.assessment_events(attempt_id,event_type,metadata) values(v_attempt.id,'answer_saved',jsonb_build_object('question_id',p_question_id));
end; $$;

create or replace function public.get_speaking_upload_target(p_attempt_id uuid, p_question_id uuid, p_extension text default 'webm')
returns text language plpgsql security definer set search_path = '' stable as $$
declare v_teacher uuid; v_student uuid := (select auth.uid());
begin
  if p_extension not in ('webm', 'm4a', 'mp4', 'ogg') then raise exception 'Unsupported recording format'; end if;
  select assignment.teacher_id into v_teacher from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id and assignment.student_id = v_student and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'speaking' and not private.assessment_question_is_live(question.question_snapshot);
  if v_teacher is null then raise exception 'Speaking question is not available'; end if;
  return v_teacher::text || '/' || v_student::text || '/' || p_attempt_id::text || '/' || p_question_id::text || '.' || p_extension;
end;
$$;

create or replace function public.register_speaking_recording(p_attempt_id uuid, p_question_id uuid, p_storage_path text, p_duration_ms integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_expected_prefix text; v_response_id uuid; v_teacher_id uuid;
begin
  select attempt.* into v_attempt
  from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'speaking' and not private.assessment_question_is_live(question.question_snapshot) for update of attempt;
  if v_attempt.id is null then raise exception 'Invalid speaking media path'; end if;
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

-- Grading on submission, shared by the student submit and the teacher's live completion.
create or replace function private.grade_submitted_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_has_manual boolean; v_raw_score numeric; v_scaled_score numeric; v_cefr text;
begin
  select * into v_attempt from public.assessment_attempts where id=p_attempt_id;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload) select v_attempt.id,v_attempt.assessment_id,assessment_question_id,'{}'::jsonb from public.assessment_attempt_questions where attempt_id=v_attempt.id on conflict do nothing;
  update public.assessment_responses response set max_score=question.weight,score=case when question.question_snapshot->>'type' in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening') then case when private.assessment_answer_is_correct(case when question.question_snapshot->>'type'='listening' then 'multiple_choice' else question.question_snapshot->>'type' end,response.answer_payload->>'value',question.question_snapshot->>'answer') then question.weight else 0 end else null end,grading_status=case when question.question_snapshot->>'type' in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening') then 'auto_graded' else 'manual_review' end
  from public.assessment_questions question join public.assessment_attempt_questions delivered on delivered.assessment_question_id=question.id and delivered.attempt_id=v_attempt.id
  where response.attempt_id=v_attempt.id and response.assessment_question_id=question.id
    and not (private.assessment_question_is_live(question.question_snapshot) and response.grading_status='reviewed');
  select exists(select 1 from public.assessment_responses where attempt_id=v_attempt.id and grading_status='manual_review') into v_has_manual; select coalesce(sum(score),0) into v_raw_score from public.assessment_responses where attempt_id=v_attempt.id;
  select round(100*sum(section_score*section_weight)/nullif(sum(section_weight),0),2) into v_scaled_score from (select section.id,section.weight section_weight,coalesce(sum(response.score),0)/nullif(sum(response.max_score),0) section_score from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=v_attempt.id where section.assessment_id=v_attempt.assessment_id group by section.id,section.weight) scores;
  select private.ability_to_cefr((percentile_cont(.5) within group(order by ability))::numeric) into v_cefr from public.assessment_adaptive_state where attempt_id=v_attempt.id and items_answered>0;
  update public.assessment_attempts set status=case when v_has_manual then 'grading' else 'completed' end,submitted_at=now(),raw_score=v_raw_score,scaled_score=coalesce(v_scaled_score,0),estimated_cefr=v_cefr where id=v_attempt.id;
  update public.assessment_assignments set status=case when v_has_manual then 'grading' else 'completed' end where id=v_attempt.assessment_assignment_id; insert into public.assessment_events(attempt_id,event_type) values(v_attempt.id,'submitted');
end; $$;
revoke all on function private.grade_submitted_assessment_attempt(uuid) from public, anon, authenticated;

create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid()) for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if; if v_attempt.status in ('submitted','grading','completed') then return; end if; if v_attempt.status<>'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  select due_at into v_due_at from public.assessment_assignments where id=v_attempt.assessment_assignment_id; if (v_attempt.expires_at is not null and v_attempt.expires_at<=now()) or (v_due_at is not null and v_due_at<=now()) then update public.assessment_attempts set status='expired' where id=v_attempt.id; update public.assessment_assignments set status='expired' where id=v_attempt.assessment_assignment_id; return; end if;
  perform private.grade_submitted_assessment_attempt(v_attempt.id);
end; $$;

-- Student list: flag assessments with live parts.
drop function public.list_student_assessments();
create function public.list_student_assessments()
returns table("assignmentId" uuid,"assessmentId" uuid,title text,description text,"availableFrom" timestamptz,"dueAt" timestamptz,"attemptLimit" integer,status text,"activeAttemptId" uuid,"latestAttemptId" uuid,framework text,"requiresAudio" boolean,"requiresMicrophone" boolean,"liveQuestionCount" integer,"liveOnly" boolean)
language sql security definer set search_path='' stable as $$
  select assignment.id,assessment.id,assessment.title,assessment.description,assignment.available_from,assignment.due_at,assignment.attempt_limit,assignment.status,
    (select attempt.id from public.assessment_attempts attempt where attempt.assessment_assignment_id=assignment.id and attempt.student_id=(select auth.uid()) and attempt.status='in_progress' order by attempt.started_at desc limit 1),
    (select attempt.id from public.assessment_attempts attempt where attempt.assessment_assignment_id=assignment.id and attempt.student_id=(select auth.uid()) order by attempt.started_at desc limit 1),assessment.framework,
    exists(select 1 from public.assessment_questions question where question.assessment_id=assessment.id and not private.assessment_question_is_live(question.question_snapshot) and question.question_snapshot->>'type' in ('listening','speaking')),
    exists(select 1 from public.assessment_questions question where question.assessment_id=assessment.id and not private.assessment_question_is_live(question.question_snapshot) and question.question_snapshot->>'type'='speaking'),
    (select count(*)::integer from public.assessment_questions question where question.assessment_id=assessment.id and private.assessment_question_is_live(question.question_snapshot)),
    not exists(select 1 from public.assessment_questions question where question.assessment_id=assessment.id and not private.assessment_question_is_live(question.question_snapshot))
  from public.assessment_assignments assignment join public.assessments assessment on assessment.id=assignment.assessment_id where assignment.student_id=(select auth.uid()) and assessment.status='published' order by assignment.due_at nulls last,assignment.created_at desc;
$$;

-- Teacher: open (or reuse) the attempt that holds the live part.
create or replace function public.open_live_assessment_session(p_assessment_id uuid, p_student_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_teacher uuid := (select auth.uid()); v_assessment public.assessments%rowtype; v_assignment public.assessment_assignments%rowtype; v_attempt public.assessment_attempts%rowtype; v_attempt_id uuid; v_seed text; v_first_question uuid;
begin
  if v_teacher is null or not (select public.teacher_has_access(v_teacher)) then raise exception 'Teacher access required'; end if;
  select * into v_assessment from public.assessments where id=p_assessment_id and teacher_id=v_teacher and status='published';
  if not found then raise exception 'Assessment is not available'; end if;
  if v_assessment.assessment_mode<>'fixed' then raise exception 'Live tasks are only available in fixed assessments'; end if;
  if not exists(select 1 from public.assessment_questions question where question.assessment_id=v_assessment.id and private.assessment_question_is_live(question.question_snapshot)) then raise exception 'This assessment has no live tasks'; end if;
  if not exists(select 1 from public.student_records where student_id=p_student_id and teacher_id=v_teacher) then raise exception 'Student not found'; end if;

  select * into v_assignment from public.assessment_assignments where assessment_id=v_assessment.id and student_id=p_student_id and teacher_id=v_teacher order by created_at desc limit 1 for update;
  if not found then
    insert into public.assessment_assignments(assessment_id,teacher_id,student_id,attempt_limit,status) values(v_assessment.id,v_teacher,p_student_id,greatest(1,v_assessment.max_attempts),'available') returning * into v_assignment;
  end if;

  select * into v_attempt from public.assessment_attempts where assessment_assignment_id=v_assignment.id order by started_at desc limit 1 for update;
  if found and v_attempt.status in ('in_progress','submitted','grading') then
    insert into public.assessment_events(attempt_id,event_type) values(v_attempt.id,'live_session_opened');
    return v_attempt.id;
  end if;

  if v_assignment.due_at is not null and v_assignment.due_at<=now() then raise exception 'Assessment deadline has passed'; end if;
  if (select count(*) from public.assessment_attempts where assessment_assignment_id=v_assignment.id) >= v_assignment.attempt_limit then raise exception 'Attempt limit reached'; end if;
  -- device_session_id stays null until the student claims the attempt; the time limit starts then.
  insert into public.assessment_attempts(assessment_assignment_id,assessment_id,student_id,expires_at,device_session_id,scoring_model_version)
  values(v_assignment.id,v_assessment.id,p_student_id,v_assignment.due_at,null,v_assessment.scoring_model_version) returning id,randomization_seed into v_attempt_id,v_seed;
  v_first_question := private.deliver_fixed_assessment_questions(v_attempt_id,v_assessment.id,v_seed);
  update public.assessment_attempts set current_question_id=v_first_question,current_section_id=(select section_id from public.assessment_questions where id=v_first_question) where id=v_attempt_id;
  update public.assessment_assignments set status='started' where id=v_assignment.id;
  insert into public.assessment_events(attempt_id,event_type,metadata) values(v_attempt_id,'assessment_started',jsonb_build_object('openedBy','teacher')),(v_attempt_id,'live_session_opened','{}'::jsonb);
  return v_attempt_id;
end; $$;

create or replace function public.get_live_assessment_session(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.teacher_id=(select auth.uid());
  if not found then raise exception 'Live session not found'; end if;
  select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  return jsonb_build_object(
    'attempt',jsonb_build_object('id',v_attempt.id,'status',v_attempt.status,'studentId',v_attempt.student_id,'studentName',(select full_name from public.profiles where id=v_attempt.student_id),'startedAt',v_attempt.started_at,'submittedAt',v_attempt.submitted_at,'studentStarted',v_attempt.device_session_id is not null),
    'assessment',jsonb_build_object('id',v_assessment.id,'title',v_assessment.title,'framework',v_assessment.framework),
    'studentQuestionCount',(select count(*) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',question.id,'sectionTitle',section.title,'skill',section.skill,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt',
      'sourceMaterial',question.question_snapshot->>'sourceMaterial','taskType',question.question_snapshot->>'taskType','topic',question.question_snapshot->>'topic','cefr',question.question_snapshot->>'cefr',
      'primaryEvidence',question.question_snapshot->>'primaryEvidence','operationalDescriptor',question.question_snapshot->>'operationalDescriptor','estimatedDurationLabel',question.question_snapshot->>'estimatedDurationLabel',
      'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'responseConstraints',question.question_snapshot->'responseConstraints',
      'rubric',question.question_snapshot->'rubric','maxScore',question.weight,
      'responseId',response.id,'score',response.score,'gradingStatus',response.grading_status,'teacherFeedback',response.teacher_feedback,
      'notes',response.answer_payload->>'notes','durationSeconds',(response.answer_payload->>'durationSeconds')::integer,
      'rubricScores',(select jsonb_object_agg(criterion_key,score) from public.assessment_rubric_scores where response_id=response.id)
    )) order by delivered.position)
    from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id join public.assessment_sections section on section.id=question.section_id
    left join public.assessment_responses response on response.attempt_id=v_attempt.id and response.assessment_question_id=question.id
    where delivered.attempt_id=v_attempt.id and private.assessment_question_is_live(question.question_snapshot)),'[]'::jsonb));
end; $$;

create or replace function public.score_live_assessment_response(p_attempt_id uuid, p_question_id uuid, p_score numeric, p_feedback text default '', p_rubric_scores jsonb default '{}'::jsonb, p_notes text default '', p_duration_seconds integer default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_weight numeric; v_response_id uuid;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.teacher_id=(select auth.uid()) for update of attempt;
  if not found then raise exception 'Live session not found'; end if;
  if v_attempt.status not in ('in_progress','submitted','grading') then raise exception 'This attempt can no longer be scored live'; end if;
  select question.weight into v_weight from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=p_attempt_id and question.id=p_question_id and private.assessment_question_is_live(question.question_snapshot);
  if v_weight is null then raise exception 'Live task not found in this attempt'; end if;
  if p_duration_seconds is not null and p_duration_seconds not between 0 and 7200 then raise exception 'Invalid live task duration'; end if;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,answered_at,max_score,grading_status)
  values(p_attempt_id,v_attempt.assessment_id,p_question_id,jsonb_strip_nulls(jsonb_build_object('value','live','mode','live','notes',left(coalesce(p_notes,''),10000),'durationSeconds',p_duration_seconds,'administeredAt',now())),now(),v_weight,'manual_review')
  on conflict(attempt_id,assessment_question_id) do update set answer_payload=excluded.answer_payload,answered_at=excluded.answered_at,max_score=excluded.max_score,grading_status='manual_review'
  returning id into v_response_id;
  -- Same rubric validation as asynchronous manual review.
  perform public.review_assessment_response(v_response_id,p_score,p_feedback,coalesce(p_rubric_scores,'{}'::jsonb));
  insert into public.assessment_events(attempt_id,event_type,metadata) values(p_attempt_id,'live_response_scored',jsonb_build_object('question_id',p_question_id,'score',p_score));
end; $$;

-- Teacher completion for attempts with no student part.
create or replace function public.complete_live_assessment_session(p_attempt_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.teacher_id=(select auth.uid()) for update of attempt;
  if not found then raise exception 'Live session not found'; end if;
  if v_attempt.status in ('submitted','grading','completed') then return; end if;
  if v_attempt.status<>'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  if exists(select 1 from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=p_attempt_id and not private.assessment_question_is_live(question.question_snapshot)) then
    raise exception 'The student must submit their part of this assessment';
  end if;
  perform private.grade_submitted_assessment_attempt(p_attempt_id);
end; $$;

revoke all on function public.open_live_assessment_session(uuid, uuid) from public, anon;
revoke all on function public.get_live_assessment_session(uuid) from public, anon;
revoke all on function public.score_live_assessment_response(uuid, uuid, numeric, text, jsonb, text, integer) from public, anon;
revoke all on function public.complete_live_assessment_session(uuid) from public, anon;
revoke all on function public.list_student_assessments() from public, anon;
grant execute on function public.open_live_assessment_session(uuid, uuid) to authenticated;
grant execute on function public.get_live_assessment_session(uuid) to authenticated;
grant execute on function public.score_live_assessment_response(uuid, uuid, numeric, text, jsonb, text, integer) to authenticated;
grant execute on function public.complete_live_assessment_session(uuid) to authenticated;
grant execute on function public.list_student_assessments() to authenticated;
