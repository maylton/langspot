-- Listening, Writing and Speaking: private media, atomic play limits, rubrics and retention.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assessment-audio', 'assessment-audio', false, 26214400, array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table public.assessment_listening_plays (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  assessment_question_id uuid not null references public.assessment_questions(id) on delete cascade,
  play_count integer not null default 0 check (play_count >= 0),
  last_played_at timestamptz,
  primary key (attempt_id, assessment_question_id)
);

alter table public.assessment_events drop constraint assessment_events_event_type_check;
alter table public.assessment_events add constraint assessment_events_event_type_check check (event_type in (
  'assessment_started','question_opened','question_closed','answer_saved','audio_play_started','tab_blur','tab_focus','fullscreen_exit','paste_detected','network_disconnect','network_reconnect','resumed','submitted','session_conflict'
));

create table public.assessment_response_media (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.assessment_responses(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  assessment_question_id uuid not null references public.assessment_questions(id) on delete cascade,
  storage_path text not null unique,
  duration_ms integer not null check (duration_ms between 1 and 900000),
  created_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '180 days'),
  deleted_at timestamptz
);

create table public.assessment_rubric_scores (
  response_id uuid not null references public.assessment_responses(id) on delete cascade,
  criterion_key text not null,
  score numeric(6,2) not null check (score >= 0),
  max_score numeric(6,2) not null check (max_score > 0),
  primary key (response_id, criterion_key)
);

create index assessment_response_media_retention_idx on public.assessment_response_media (retention_until) where deleted_at is null;
alter table public.assessment_listening_plays enable row level security;
alter table public.assessment_response_media enable row level security;
alter table public.assessment_rubric_scores enable row level security;
revoke all on table public.assessment_listening_plays, public.assessment_response_media, public.assessment_rubric_scores from anon, authenticated;
grant all on table public.assessment_listening_plays, public.assessment_response_media, public.assessment_rubric_scores to service_role;

create or replace function private.can_access_assessment_audio(p_path text, p_write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when (string_to_array(p_path, '/'))[1] = (select auth.uid())::text
      then (select public.teacher_has_access((select auth.uid())))
    when p_write then
      (string_to_array(p_path, '/'))[2] = (select auth.uid())::text
      and exists (select 1 from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
        join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
        where attempt.id::text = (string_to_array(p_path, '/'))[3] and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress'
          and question.question_snapshot->>'type' = 'speaking'
          and p_path in (assignment.teacher_id::text || '/' || assignment.student_id::text || '/' || attempt.id::text || '/' || question.id::text || '.webm', assignment.teacher_id::text || '/' || assignment.student_id::text || '/' || attempt.id::text || '/' || question.id::text || '.m4a', assignment.teacher_id::text || '/' || assignment.student_id::text || '/' || attempt.id::text || '/' || question.id::text || '.mp4', assignment.teacher_id::text || '/' || assignment.student_id::text || '/' || attempt.id::text || '/' || question.id::text || '.ogg'))
    else exists (
      select 1 from public.assessment_attempts attempt
      join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
      left join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id
      left join public.assessment_questions question on question.id = delivered.assessment_question_id
      left join public.assessment_response_media media on media.attempt_id = attempt.id
      where assignment.student_id = (select auth.uid()) and (
        (attempt.status = 'in_progress' and question.question_snapshot->>'audioPath' = p_path)
        or media.storage_path = p_path))
  end;
$$;
revoke all on function private.can_access_assessment_audio(text, boolean) from public, anon;
grant execute on function private.can_access_assessment_audio(text, boolean) to authenticated;

create policy assessment_audio_select on storage.objects for select to authenticated
using (bucket_id = 'assessment-audio' and private.can_access_assessment_audio(name, false));
create policy assessment_audio_insert on storage.objects for insert to authenticated
with check (bucket_id = 'assessment-audio' and private.can_access_assessment_audio(name, true));
create policy assessment_audio_teacher_delete on storage.objects for delete to authenticated
using (bucket_id = 'assessment-audio' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.teacher_has_access((select auth.uid()))));

create or replace function public.publish_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_teacher_id uuid := (select auth.uid()); v_assessment public.assessments%rowtype;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  select * into v_assessment from public.assessments where id = p_assessment_id and teacher_id = v_teacher_id and status = 'draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  if not exists (select 1 from public.assessment_sections where assessment_id = p_assessment_id)
    or exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and not exists (select 1 from public.assessment_questions question where question.section_id = section.id)) then raise exception 'Every assessment section must contain questions'; end if;
  if exists (select 1 from public.assessment_questions where assessment_id = p_assessment_id and (nullif(trim(question_snapshot->>'prompt'), '') is null
    or question_snapshot->>'type' not in ('multiple_choice', 'fill_blank', 'true_false', 'ordering', 'listening', 'writing', 'speaking')
    or (question_snapshot->>'type' not in ('writing', 'speaking') and nullif(trim(question_snapshot->>'answer'), '') is null)
    or (question_snapshot->>'type' = 'listening' and (nullif(question_snapshot->>'audioPath', '') is null or coalesce((question_snapshot->>'maxPlays')::integer, 0) < 1))
    or (question_snapshot->>'type' in ('writing', 'speaking') and jsonb_array_length(coalesce(question_snapshot->'rubric', '[]'::jsonb)) = 0))) then raise exception 'Assessment contains invalid questions'; end if;
  if exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and section.draw_count is not null and section.draw_count > (select count(*) from public.assessment_questions question where question.section_id = section.id)) then raise exception 'Pool draw count exceeds available questions'; end if;
  if v_assessment.assessment_mode = 'adaptive' and exists (select 1 from public.assessment_sections section where section.assessment_id = p_assessment_id and ((select count(*) from public.assessment_questions question where question.section_id=section.id) < v_assessment.adaptive_min_items or exists(select 1 from public.assessment_questions question where question.section_id=section.id and (question.difficulty_snapshot is null or question.cefr_snapshot is null)))) then raise exception 'Adaptive sections require enough calibrated questions'; end if;
  if v_assessment.assessment_mode = 'adaptive' and exists (select 1 from public.assessment_questions where assessment_id = p_assessment_id and question_snapshot->>'type' in ('writing', 'speaking')) then raise exception 'Adaptive assessments do not support manual questions'; end if;
  update public.assessments set status = 'published', published_at = now() where id = p_assessment_id;
end;
$$;

create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if;
  select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  return jsonb_build_object(
    'attempt', jsonb_build_object('id', v_attempt.id, 'assignmentId', v_attempt.assessment_assignment_id, 'status', v_attempt.status, 'startedAt', v_attempt.started_at, 'expiresAt', v_attempt.expires_at, 'currentQuestionId', v_attempt.current_question_id),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'description', v_assessment.description, 'navigationMode', v_assessment.navigation_mode, 'assessmentMode', v_assessment.assessment_mode, 'adaptiveComplete', v_assessment.assessment_mode = 'adaptive' and v_attempt.current_question_id is null),
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', section.id, 'title', section.title, 'instructions', section.instructions, 'position', section.position) order by section.position) from public.assessment_sections section where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', question.id, 'sectionId', question.section_id, 'type', question.question_snapshot->>'type', 'prompt', question.question_snapshot->>'prompt', 'options', delivered.presented_options, 'required', question.required,
      'audioPath', question.question_snapshot->>'audioPath', 'maxPlays', (question.question_snapshot->>'maxPlays')::integer, 'autoplay', (question.question_snapshot->>'autoplay')::boolean,
      'transcript', case when question.question_snapshot->>'transcriptVisibility' = 'always' then question.question_snapshot->>'transcript' end,
      'preparationSeconds', (question.question_snapshot->>'preparationSeconds')::integer, 'recordingSeconds', (question.question_snapshot->>'recordingSeconds')::integer, 'allowReview', (question.question_snapshot->>'allowReview')::boolean)) order by delivered.position)
      from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id where delivered.attempt_id = v_attempt.id), '[]'::jsonb),
    'answers', coalesce((select jsonb_object_agg(response.assessment_question_id::text, response.answer_payload->>'value') from public.assessment_responses response where response.attempt_id = v_attempt.id), '{}'::jsonb));
end;
$$;

create or replace function public.save_assessment_response(p_attempt_id uuid, p_question_id uuid, p_answer_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_type text;
begin
  if jsonb_typeof(p_answer_payload) <> 'object' or jsonb_typeof(p_answer_payload->'value') <> 'string' or octet_length(p_answer_payload->>'value') > 200000 then raise exception 'Invalid answer payload'; end if;
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if;
  select due_at into v_due_at from public.assessment_assignments where id = v_attempt.assessment_assignment_id for key share;
  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now()) or (v_due_at is not null and v_due_at <= now()) then raise exception 'Assessment time has expired'; end if;
  select question.question_snapshot->>'type' into v_type from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id where delivered.attempt_id = p_attempt_id and question.id = p_question_id;
  if v_type is null then raise exception 'Question does not belong to this attempt'; end if;
  if v_type = 'writing' and char_length(p_answer_payload->>'value') > 50000 then raise exception 'Writing response is too long'; end if;
  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload, answered_at) values (v_attempt.id, v_attempt.assessment_id, p_question_id, p_answer_payload, now())
  on conflict (attempt_id, assessment_question_id) do update set answer_payload = excluded.answer_payload, answered_at = excluded.answered_at;
  update public.assessment_attempts set current_question_id = p_question_id, current_section_id = (select section_id from public.assessment_questions where id = p_question_id) where id = v_attempt.id;
  insert into public.assessment_events (attempt_id, event_type, metadata) values (v_attempt.id, 'answer_saved', jsonb_build_object('question_id', p_question_id));
end;
$$;

create or replace function public.begin_assessment_audio_play(p_attempt_id uuid, p_question_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_path text; v_max integer; v_count integer; v_allowed boolean := false;
begin
  select question.question_snapshot->>'audioPath', greatest(coalesce((question.question_snapshot->>'maxPlays')::integer, 1), 1)
  into v_path, v_max from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'listening' for update of attempt;
  if v_path is null then raise exception 'Listening question is not available'; end if;
  insert into public.assessment_listening_plays (attempt_id, assessment_question_id, play_count, last_played_at) values (p_attempt_id, p_question_id, 0, null) on conflict do nothing;
  update public.assessment_listening_plays set play_count = play_count + 1, last_played_at = clock_timestamp() where attempt_id = p_attempt_id and assessment_question_id = p_question_id and play_count < v_max returning play_count into v_count;
  v_allowed := found;
  if v_allowed then insert into public.assessment_events(attempt_id,event_type,metadata) values(p_attempt_id,'audio_play_started',jsonb_build_object('questionId',p_question_id,'playCount',v_count,'maxPlays',v_max)); end if;
  if v_count is null then select play_count into v_count from public.assessment_listening_plays where attempt_id = p_attempt_id and assessment_question_id = p_question_id; end if;
  return jsonb_build_object('allowed', v_allowed, 'playCount', v_count, 'maxPlays', v_max, 'audioPath', v_path);
end;
$$;

create or replace function public.get_speaking_upload_target(p_attempt_id uuid, p_question_id uuid, p_extension text default 'webm')
returns text language plpgsql security definer set search_path = '' stable as $$
declare v_teacher uuid; v_student uuid := (select auth.uid());
begin
  if p_extension not in ('webm', 'm4a', 'mp4', 'ogg') then raise exception 'Unsupported recording format'; end if;
  select assignment.teacher_id into v_teacher from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id and assignment.student_id = v_student and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'speaking';
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
  where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) and attempt.status = 'in_progress' and question.id = p_question_id and question.question_snapshot->>'type' = 'speaking' for update of attempt;
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

create or replace function public.review_assessment_response(p_response_id uuid, p_score numeric, p_feedback text default '', p_rubric_scores jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_response public.assessment_responses%rowtype; v_rubric jsonb; v_item jsonb; v_seen integer := 0;
begin
  select response.* into v_response from public.assessment_responses response join public.assessment_attempts attempt on attempt.id = response.attempt_id join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where response.id = p_response_id and assignment.teacher_id = (select auth.uid()) for update of response;
  if not found then raise exception 'Assessment response not found'; end if;
  select question_snapshot->'rubric' into v_rubric from public.assessment_questions where id = v_response.assessment_question_id;
  if p_score is null or p_score < 0 or p_score > v_response.max_score then raise exception 'Score is outside the allowed range'; end if;
  if jsonb_array_length(coalesce(v_rubric, '[]'::jsonb)) > 0 then
    if jsonb_typeof(p_rubric_scores) <> 'object' then raise exception 'Rubric scores are required'; end if;
    delete from public.assessment_rubric_scores where response_id = p_response_id;
    for v_item in select value from jsonb_array_elements(v_rubric) loop
      if not (p_rubric_scores ? (v_item->>'key')) or (p_rubric_scores->>(v_item->>'key'))::numeric < 0 or (p_rubric_scores->>(v_item->>'key'))::numeric > (v_item->>'maxScore')::numeric then raise exception 'Invalid rubric score'; end if;
      insert into public.assessment_rubric_scores values (p_response_id, v_item->>'key', (p_rubric_scores->>(v_item->>'key'))::numeric, (v_item->>'maxScore')::numeric); v_seen := v_seen + 1;
    end loop;
    if v_seen <> (select count(*) from jsonb_object_keys(p_rubric_scores)) then raise exception 'Unexpected rubric criterion'; end if;
  end if;
  update public.assessment_responses set score = p_score, teacher_feedback = left(coalesce(p_feedback, ''), 10000), grading_status = 'reviewed' where id = p_response_id;
end;
$$;

create or replace function public.get_assessment_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_student_name text;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment result not found'; end if;
  select full_name into v_student_name from public.profiles where id = v_attempt.student_id; select * into v_assessment from public.assessments where id = v_attempt.assessment_id;
  return jsonb_build_object('attempt', jsonb_build_object('id', v_attempt.id, 'studentId', v_attempt.student_id, 'studentName', v_student_name, 'status', v_attempt.status, 'startedAt', v_attempt.started_at, 'submittedAt', v_attempt.submitted_at, 'rawScore', v_attempt.raw_score, 'scaledScore', v_attempt.scaled_score, 'estimatedCefr', v_attempt.estimated_cefr, 'integrityStatus', v_attempt.integrity_status, 'reviewedAt', v_attempt.reviewed_at, 'scoringModelVersion', v_attempt.scoring_model_version),
    'assessment', jsonb_build_object('id', v_assessment.id, 'title', v_assessment.title, 'type', v_assessment.type, 'version', v_assessment.version),
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', section.id, 'title', section.title, 'skill', section.skill, 'score', coalesce(scores.score, 0), 'maxScore', coalesce(scores.max_score, 0), 'percentage', round(100 * coalesce(scores.score, 0) / nullif(scores.max_score, 0), 2)) order by section.position) from public.assessment_sections section left join lateral (select sum(response.score) score, sum(response.max_score) max_score from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id = question.id where question.section_id = section.id and response.attempt_id = v_attempt.id) scores on true where section.assessment_id = v_assessment.id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', question.id, 'sectionId', question.section_id, 'prompt', question.question_snapshot->>'prompt', 'type', question.question_snapshot->>'type', 'options', delivered.presented_options, 'correctAnswer', question.question_snapshot->>'answer', 'explanation', question.question_snapshot->>'explanation', 'answer', response.answer_payload->>'value', 'score', response.score, 'maxScore', response.max_score, 'gradingStatus', response.grading_status, 'teacherFeedback', response.teacher_feedback, 'responseId', response.id, 'timeSpentMs', response.time_spent_ms, 'transcript', question.question_snapshot->>'transcript', 'mediaPath', media.storage_path, 'rubric', question.question_snapshot->'rubric', 'rubricScores', coalesce((select jsonb_object_agg(criterion_key, score) from public.assessment_rubric_scores where response_id = response.id), '{}'::jsonb)) order by delivered.position)
      from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id left join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_attempt.id left join public.assessment_response_media media on media.response_id = response.id where delivered.attempt_id = v_attempt.id), '[]'::jsonb),
    'integrity', jsonb_build_object('status', v_attempt.integrity_status, 'windowExits', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'tab_blur'), 'timeOutsideMs', coalesce((select sum(coalesce((metadata->>'durationMs')::integer, 0)) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'tab_focus'), 0), 'pasteEvents', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'paste_detected'), 'sessionConflicts', (select count(*) from public.assessment_events where attempt_id = v_attempt.id and event_type = 'session_conflict'), 'events', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', event_type, 'occurredAt', occurred_at, 'metadata', metadata) order by occurred_at) from public.assessment_events where attempt_id = v_attempt.id and event_type <> 'answer_saved'), '[]'::jsonb)),
    'adaptiveSkills', coalesce((select jsonb_agg(jsonb_build_object('sectionId', section_id, 'skill', skill, 'ability', ability, 'cefr', estimated_cefr, 'confidence', confidence, 'itemsAnswered', items_answered)) from public.assessment_adaptive_state where attempt_id = v_attempt.id), '[]'::jsonb));
end;
$$;

create or replace function private.list_expired_assessment_media(p_limit integer default 1000)
returns table(bucket_id text, storage_path text) language sql security definer set search_path = '' as $$
  update public.assessment_response_media set deleted_at = now()
  where id in (select id from public.assessment_response_media where retention_until <= now() and deleted_at is null order by retention_until limit greatest(1, least(p_limit, 5000)))
  returning 'assessment-audio'::text, assessment_response_media.storage_path;
$$;
comment on function private.list_expired_assessment_media(integer) is 'Marks expired speaking media for deletion. Invoke from a trusted scheduled cleanup, delete returned Storage objects, and retain the tombstones.';
revoke all on function private.list_expired_assessment_media(integer) from public, anon, authenticated;
grant execute on function private.list_expired_assessment_media(integer) to service_role;

-- Listening is objectively graded; Writing and Speaking remain blocked in grading until teacher review.
create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_has_manual boolean; v_raw_score numeric; v_scaled_score numeric; v_cefr text;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id where attempt.id = p_attempt_id and assignment.student_id = (select auth.uid()) for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if; if v_attempt.status in ('submitted', 'grading', 'completed') then return; end if; if v_attempt.status <> 'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  select due_at into v_due_at from public.assessment_assignments where id = v_attempt.assessment_assignment_id;
  if (v_attempt.expires_at is not null and v_attempt.expires_at <= now()) or (v_due_at is not null and v_due_at <= now()) then update public.assessment_attempts set status = 'expired' where id = v_attempt.id; update public.assessment_assignments set status = 'expired' where id = v_attempt.assessment_assignment_id; return; end if;
  insert into public.assessment_responses (attempt_id, assessment_id, assessment_question_id, answer_payload) select v_attempt.id, v_attempt.assessment_id, assessment_question_id, '{}'::jsonb from public.assessment_attempt_questions where attempt_id = v_attempt.id on conflict do nothing;
  update public.assessment_responses response set max_score = question.weight, score = case when question.question_snapshot->>'type' in ('multiple_choice','fill_blank','true_false','ordering','listening') then case when private.assessment_answer_is_correct(case when question.question_snapshot->>'type'='listening' then 'multiple_choice' else question.question_snapshot->>'type' end, response.answer_payload->>'value', question.question_snapshot->>'answer') then question.weight else 0 end else null end, grading_status = case when question.question_snapshot->>'type' in ('multiple_choice','fill_blank','true_false','ordering','listening') then 'auto_graded' else 'manual_review' end from public.assessment_questions question join public.assessment_attempt_questions delivered on delivered.assessment_question_id = question.id and delivered.attempt_id = v_attempt.id where response.attempt_id = v_attempt.id and response.assessment_question_id = question.id;
  select exists(select 1 from public.assessment_responses where attempt_id=v_attempt.id and grading_status='manual_review') into v_has_manual; select coalesce(sum(score),0) into v_raw_score from public.assessment_responses where attempt_id=v_attempt.id;
  select round(100*sum(section_score*section_weight)/nullif(sum(section_weight),0),2) into v_scaled_score from (select section.id,section.weight section_weight,coalesce(sum(response.score),0)/nullif(sum(response.max_score),0) section_score from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=v_attempt.id where section.assessment_id=v_attempt.assessment_id group by section.id,section.weight) scores;
  select private.ability_to_cefr((percentile_cont(.5) within group(order by ability))::numeric) into v_cefr from public.assessment_adaptive_state where attempt_id=v_attempt.id and items_answered>0;
  update public.assessment_attempts set status=case when v_has_manual then 'grading' else 'completed' end,submitted_at=now(),raw_score=v_raw_score,scaled_score=coalesce(v_scaled_score,0),estimated_cefr=v_cefr where id=v_attempt.id;
  update public.assessment_assignments set status=case when v_has_manual then 'grading' else 'completed' end where id=v_attempt.assessment_assignment_id; insert into public.assessment_events(attempt_id,event_type) values(v_attempt.id,'submitted');
end;
$$;

create or replace function public.get_student_assessment_result(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_visibility text; v_visible boolean;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid());
  if not found then raise exception 'Assessment result not found'; end if;
  select show_results into v_visibility from public.assessments where id=v_attempt.assessment_id;
  v_visible := v_attempt.status='completed' and v_visibility<>'none' and (v_visibility<>'after_teacher_review' or v_attempt.reviewed_at is not null);
  if not v_visible then return jsonb_build_object('visible',false,'status',v_attempt.status); end if;
  if v_visibility='score_only' then return jsonb_build_object('visible',true,'status',v_attempt.status,'score',v_attempt.scaled_score); end if;
  if v_visibility='level_only' then return jsonb_build_object('visible',true,'status',v_attempt.status,'estimatedCefr',v_attempt.estimated_cefr); end if;
  return jsonb_build_object('visible',true,'status',v_attempt.status,'score',v_attempt.scaled_score,'estimatedCefr',v_attempt.estimated_cefr,
    'sections',coalesce((select jsonb_agg(jsonb_build_object('id',section.id,'title',section.title,'skill',section.skill,'score',coalesce(scores.score,0),'maxScore',coalesce(scores.max_score,0),'percentage',round(100*coalesce(scores.score,0)/nullif(scores.max_score,0),2)) order by section.position) from public.assessment_sections section left join lateral (select sum(response.score) score,sum(response.max_score) max_score from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id where question.section_id=section.id and response.attempt_id=v_attempt.id) scores on true where section.assessment_id=v_attempt.assessment_id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'prompt',question.question_snapshot->>'prompt','type',question.question_snapshot->>'type','answer',case when question.question_snapshot->>'type'='speaking' then null else response.answer_payload->>'value' end,'score',response.score,'maxScore',response.max_score,'teacherFeedback',response.teacher_feedback,'transcript',case when question.question_snapshot->>'transcriptVisibility' in ('after_submit','always') then question.question_snapshot->>'transcript' end)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=v_attempt.id where delivered.attempt_id=v_attempt.id),'[]'::jsonb));
end;
$$;

revoke all on function public.begin_assessment_audio_play(uuid, uuid) from public, anon;
revoke all on function public.get_speaking_upload_target(uuid, uuid, text) from public, anon;
revoke all on function public.register_speaking_recording(uuid, uuid, text, integer) from public, anon;
revoke all on function public.review_assessment_response(uuid, numeric, text, jsonb) from public, anon;
revoke all on function public.get_student_assessment_result(uuid) from public, anon;
grant execute on function public.begin_assessment_audio_play(uuid, uuid) to authenticated;
grant execute on function public.get_speaking_upload_target(uuid, uuid, text) to authenticated;
grant execute on function public.register_speaking_recording(uuid, uuid, text, integer) to authenticated;
grant execute on function public.review_assessment_response(uuid, numeric, text, jsonb) to authenticated;
grant execute on function public.get_student_assessment_result(uuid) to authenticated;
