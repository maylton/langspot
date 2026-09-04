-- CEFR Pilot Bank v0.1: reusable system-owned tasklets and stable pedagogical item IDs.
-- This migration changes structure only. The versioned content is loaded by the
-- idempotent seed in supabase/seeds/cefr_pilot_bank_v0_1.sql.

create table public.question_bank_tasklets (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique check (external_id ~ '^[RL]-(A1|A2|B1|B2|C1|C2)-[0-9]{3}$'),
  bank_version text not null,
  skill text not null check (skill in ('reading', 'listening')),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  title text not null check (char_length(trim(title)) > 0),
  topic text not null,
  genre text not null,
  audience text not null check (audience in ('child', 'teen', 'adult', 'general', 'teen_adult')),
  input_kind text not null check (input_kind in ('text', 'audio_script')),
  input_text text not null check (char_length(trim(input_text)) > 0),
  input_length integer not null check (input_length > 0),
  estimated_duration_seconds integer check (estimated_duration_seconds is null or estimated_duration_seconds > 0),
  quality_status text not null check (quality_status in ('approved_for_pilot', 'pilot_data_collected', 'item_analysis', 'approved', 'needs_revision', 'retired')),
  psychometric_status text not null check (psychometric_status in ('uncalibrated', 'pilot_data_collected', 'under_analysis', 'calibrated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_bank_tasklets_input_kind check (
    (skill = 'reading' and input_kind = 'text' and estimated_duration_seconds is null)
    or (skill = 'listening' and input_kind = 'audio_script' and estimated_duration_seconds is not null)
  )
);

alter table public.question_bank
  alter column teacher_id drop not null,
  alter column answer drop not null,
  add column external_id text unique,
  add column bank_version text,
  add column source_origin text not null default 'teacher' check (source_origin in ('teacher', 'cefr_pilot')),
  add column tasklet_id uuid references public.question_bank_tasklets(id) on delete restrict,
  add column tasklet_position smallint check (tasklet_position is null or tasklet_position between 1 and 20),
  add column answer_key text check (answer_key is null or answer_key in ('A', 'B', 'C', 'D')),
  add column primary_evidence text,
  add column response_constraints jsonb check (response_constraints is null or jsonb_typeof(response_constraints) = 'object'),
  add column rubric jsonb check (rubric is null or jsonb_typeof(rubric) = 'array'),
  add column source_material text,
  add column psychometric_status text check (psychometric_status is null or psychometric_status in ('uncalibrated', 'pilot_data_collected', 'under_analysis', 'calibrated')),
  drop constraint question_bank_audience_check,
  add constraint question_bank_audience_check check (audience in ('child', 'teen', 'adult', 'general', 'teen_adult')),
  drop constraint question_bank_quality_status_check,
  add constraint question_bank_quality_status_check check (quality_status in ('draft', 'reviewed', 'approved_for_pilot', 'pilot_data_collected', 'item_analysis', 'approved', 'pilot', 'needs_revision', 'retired')),
  add constraint question_bank_origin_owner check (
    (source_origin = 'teacher' and teacher_id is not null)
    or (source_origin = 'cefr_pilot' and teacher_id is null and external_id is not null and bank_version is not null)
  ),
  add constraint question_bank_pilot_taxonomy check (
    source_origin <> 'cefr_pilot'
    or (
      external_id ~ '^((R|L)-(A1|A2|B1|B2|C1|C2)-[0-9]{3}-Q[1-4]|LU-(A1|A2|B1|B2|C1|C2)-[0-9]{3}|(W|SP|SI|M)-(A1|A2|B1|B2|C1|C2)-[0-9]{3})$'
      and subskill ~ '^[a-z0-9_]+$'
      and (
        (skill = 'reading' and question_type = 'multiple_choice' and difficulty between 1 and 5)
        or (skill = 'listening' and question_type = 'listening' and difficulty between 1 and 5)
        or (skill = 'language_use' and question_type = 'multiple_choice' and difficulty between 1 and 5)
        or (skill = 'writing' and question_type = 'writing' and difficulty is null)
        or (skill in ('spoken_production', 'spoken_interaction') and question_type = 'speaking' and difficulty is null)
        or (skill = 'mediation' and question_type = 'mediation' and difficulty is null)
      )
    )
  ),
  add constraint question_bank_tasklet_shape check (
    source_origin <> 'cefr_pilot'
    or (skill in ('reading', 'listening') and tasklet_id is not null and tasklet_position is not null)
    or (skill not in ('reading', 'listening') and tasklet_id is null and tasklet_position is null)
  ),
  add constraint question_bank_pilot_answer_shape check (
    source_origin <> 'cefr_pilot'
    or (
      skill in ('reading', 'listening', 'language_use')
      and array_length(options, 1) = 4
      and answer is not null
      and answer = any(options)
      and answer_key is not null
      and rubric is null
    )
    or (
      skill in ('writing', 'spoken_production', 'spoken_interaction', 'mediation')
      and cardinality(options) = 0
      and answer is null
      and answer_key is null
      and jsonb_array_length(rubric) > 0
    )
  );

create unique index question_bank_tasklet_position_idx on public.question_bank (tasklet_id, tasklet_position) where tasklet_id is not null;
create index question_bank_system_filter_idx on public.question_bank (source_origin, bank_version, skill, level, quality_status);
create index question_bank_tasklets_filter_idx on public.question_bank_tasklets (bank_version, skill, level, quality_status);

alter table public.question_bank_tasklets enable row level security;
revoke all on table public.question_bank_tasklets from anon, authenticated;
grant select on table public.question_bank_tasklets to authenticated;
grant all on table public.question_bank_tasklets to service_role;

create policy question_bank_tasklets_authenticated_read
on public.question_bank_tasklets for select to authenticated
using (quality_status in ('approved_for_pilot', 'approved'));

create policy question_bank_system_authenticated_read
on public.question_bank for select to authenticated
using (source_origin = 'cefr_pilot' and quality_status in ('approved_for_pilot', 'approved'));

create or replace function private.import_cefr_pilot_bank(p_tasklets jsonb, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tasklet jsonb;
  v_item jsonb;
  v_tasklet_id uuid;
begin
  if jsonb_typeof(p_tasklets) <> 'array' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Pilot Bank payloads must be arrays';
  end if;

  for v_tasklet in select value from jsonb_array_elements(p_tasklets) loop
    insert into public.question_bank_tasklets (
      external_id, bank_version, skill, level, title, topic, genre, audience,
      input_kind, input_text, input_length, estimated_duration_seconds,
      quality_status, psychometric_status, updated_at
    ) values (
      v_tasklet->>'externalId', v_tasklet->>'bankVersion', v_tasklet->>'skill', v_tasklet->>'level',
      v_tasklet->>'title', v_tasklet->>'topic', v_tasklet->>'genre', v_tasklet->>'audience',
      v_tasklet->>'inputKind', v_tasklet->>'inputText', (v_tasklet->>'inputLength')::integer,
      nullif(v_tasklet->>'estimatedDurationSeconds', '')::integer,
      v_tasklet->>'qualityStatus', v_tasklet->>'psychometricStatus', now()
    )
    on conflict (external_id) do update set
      bank_version = excluded.bank_version, skill = excluded.skill, level = excluded.level,
      title = excluded.title, topic = excluded.topic, genre = excluded.genre, audience = excluded.audience,
      input_kind = excluded.input_kind, input_text = excluded.input_text, input_length = excluded.input_length,
      estimated_duration_seconds = excluded.estimated_duration_seconds,
      quality_status = excluded.quality_status, psychometric_status = excluded.psychometric_status,
      updated_at = now();
  end loop;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_tasklet_id := null;
    if nullif(v_item->>'taskletExternalId', '') is not null then
      select id into v_tasklet_id from public.question_bank_tasklets where external_id = v_item->>'taskletExternalId';
      if v_tasklet_id is null then raise exception 'Tasklet not found for %', v_item->>'externalId'; end if;
    end if;

    insert into public.question_bank (
      teacher_id, external_id, bank_version, source_origin, level, category, question_type,
      prompt, options, answer, answer_key, explanation, skill, subskill, difficulty,
      task_type, topic, genre, audience, tasklet_id, tasklet_position, cognitive_processes,
      primary_evidence, response_constraints, rubric, source_material,
      quality_status, psychometric_status, is_pilot, restricted
    ) values (
      null, v_item->>'externalId', v_item->>'bankVersion', 'cefr_pilot', v_item->>'level',
      v_item->>'category', v_item->>'questionType', v_item->>'prompt',
      coalesce(array(select jsonb_array_elements_text(v_item->'options')), '{}'::text[]),
      nullif(v_item->>'answer', ''), nullif(v_item->>'answerKey', ''), null,
      v_item->>'skill', v_item->>'subskill', nullif(v_item->>'difficulty', '')::smallint,
      v_item->>'taskType', nullif(v_item->>'topic', ''), nullif(v_item->>'genre', ''),
      v_item->>'audience', v_tasklet_id, nullif(v_item->>'taskletPosition', '')::smallint,
      array[v_item->>'subskill'], nullif(v_item->>'primaryEvidence', ''),
      case when jsonb_typeof(v_item->'responseConstraints') = 'object' then v_item->'responseConstraints' end,
      case when jsonb_typeof(v_item->'rubric') = 'array' then v_item->'rubric' end,
      nullif(v_item->>'sourceMaterial', ''),
      v_item->>'qualityStatus', v_item->>'psychometricStatus', true, false
    )
    on conflict (external_id) do update set
      bank_version = excluded.bank_version, source_origin = excluded.source_origin,
      level = excluded.level, category = excluded.category, question_type = excluded.question_type,
      prompt = excluded.prompt, options = excluded.options, answer = excluded.answer,
      answer_key = excluded.answer_key, skill = excluded.skill, subskill = excluded.subskill,
      difficulty = excluded.difficulty, task_type = excluded.task_type, topic = excluded.topic,
      genre = excluded.genre, audience = excluded.audience, tasklet_id = excluded.tasklet_id,
      tasklet_position = excluded.tasklet_position, cognitive_processes = excluded.cognitive_processes,
      primary_evidence = excluded.primary_evidence, response_constraints = excluded.response_constraints,
      rubric = excluded.rubric, source_material = excluded.source_material,
      quality_status = excluded.quality_status, psychometric_status = excluded.psychometric_status,
      is_pilot = true, restricted = false;
  end loop;
end;
$$;

revoke all on function private.import_cefr_pilot_bank(jsonb, jsonb) from public, anon, authenticated;
grant execute on function private.import_cefr_pilot_bank(jsonb, jsonb) to service_role;

create or replace function private.validate_cefr_pilot_bank(p_bank_version text default 'pilot-0.1')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_count integer; v_expected record;
begin
  select count(*) into v_count from public.question_bank where bank_version = p_bank_version and source_origin = 'cefr_pilot';
  if v_count <> 198 then raise exception 'Expected 198 Pilot Bank units, found %', v_count; end if;
  select count(*) into v_count from public.question_bank_tasklets where bank_version = p_bank_version;
  if v_count <> 24 then raise exception 'Expected 24 Pilot Bank tasklets, found %', v_count; end if;
  if exists (
    select 1 from public.question_bank_tasklets tasklet
    left join public.question_bank item on item.tasklet_id = tasklet.id
    where tasklet.bank_version = p_bank_version
    group by tasklet.id having count(item.id) <> 4
  ) then raise exception 'Every Pilot Bank tasklet must contain exactly four items'; end if;
  if exists (
    select 1 from public.question_bank item
    join public.question_bank_tasklets tasklet on tasklet.id = item.tasklet_id
    where item.bank_version = p_bank_version and (item.skill <> tasklet.skill or item.level <> tasklet.level)
  ) then raise exception 'Pilot Bank tasklet skill/level association failed'; end if;
  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and (quality_status <> 'approved_for_pilot' or psychometric_status <> 'uncalibrated')
  ) then raise exception 'Pilot Bank status metadata is inconsistent'; end if;
  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and skill in ('reading', 'listening', 'language_use')
      and (cardinality(options) <> 4 or answer is null or not answer = any(options) or answer_key is null)
  ) then raise exception 'Pilot Bank objective answer validation failed'; end if;
  if exists (
    select 1 from public.question_bank item
    where item.bank_version = p_bank_version and item.source_origin = 'cefr_pilot'
      and item.skill in ('reading', 'listening', 'language_use')
      and (select count(distinct option) from unnest(item.options) option) <> 4
  ) then raise exception 'Pilot Bank alternatives must be complete and distinct'; end if;
  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and skill in ('writing', 'spoken_production', 'spoken_interaction', 'mediation')
      and (answer is not null or answer_key is not null or cardinality(options) <> 0 or jsonb_array_length(rubric) = 0)
  ) then raise exception 'Pilot Bank productive rubric validation failed'; end if;
  for v_expected in
    select * from (values
      ('reading', 8), ('listening', 8), ('language_use', 10), ('writing', 2),
      ('spoken_production', 2), ('spoken_interaction', 2), ('mediation', 1)
    ) expected(skill, per_level)
  loop
    if exists (
      select 1 from (values ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) levels(level)
      where (select count(*) from public.question_bank item where item.bank_version = p_bank_version and item.source_origin = 'cefr_pilot' and item.skill = v_expected.skill and item.level = levels.level) <> v_expected.per_level
    ) then raise exception 'Pilot Bank count mismatch for skill %', v_expected.skill; end if;
  end loop;
end;
$$;

revoke all on function private.validate_cefr_pilot_bank(text) from public, anon, authenticated;
grant execute on function private.validate_cefr_pilot_bank(text) to service_role;

-- Shared Pilot Bank rows can be snapshotted into a teacher-owned assessment.
-- The assessment itself remains isolated by its existing teacher ownership rules.
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
      if nullif(v_question->>'questionBankId', '') is not null and not exists (
        select 1 from public.question_bank bank
        where bank.id = (v_question->>'questionBankId')::uuid
          and (bank.teacher_id = v_teacher_id or (bank.source_origin = 'cefr_pilot' and bank.quality_status in ('approved_for_pilot', 'approved')))
      ) then raise exception 'Question bank item not found'; end if;
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

create or replace function private.validate_cefr_assessment_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='published' and old.status='draft' and new.framework='cefr' then
    if new.type not in ('placement','diagnostic','progress') then raise exception 'CEFR assessments must be placement, diagnostic or progress'; end if;
    if new.decision_rule_version='' or new.report_model_version='' then raise exception 'CEFR rule versions are required'; end if;
    if exists (select 1 from public.assessment_sections section where section.assessment_id=new.id and (section.cefr_level is null or nullif(trim(section.construct),'') is null)) then raise exception 'Every CEFR tasklet requires level and construct'; end if;
    if exists (select 1 from public.assessment_questions question where question.assessment_id=new.id and (question.question_snapshot->>'skill' is null or question.question_snapshot->>'subskill' is null or question.question_snapshot->>'taskType' is null or question.question_snapshot->>'cefr' is null)) then raise exception 'Every CEFR item requires skill, subskill, task type and level'; end if;
    if new.type='placement' and exists (select 1 from public.assessment_questions question where question.assessment_id=new.id and coalesce(question.question_snapshot->>'qualityStatus','draft') not in ('approved','approved_for_pilot')) then raise exception 'CEFR placement accepts approved or approved-for-pilot items only'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='reading') < 24 then raise exception 'Adaptive CEFR requires at least 4 approved Reading tasklets per level'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='listening') < 24 then raise exception 'Adaptive CEFR requires at least 4 approved Listening tasklets per level'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='language_use') < 120 then raise exception 'Adaptive CEFR requires at least 20 approved Language Use items per level'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if; select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  return jsonb_build_object('attempt',jsonb_build_object('id',v_attempt.id,'assignmentId',v_attempt.assessment_assignment_id,'status',v_attempt.status,'startedAt',v_attempt.started_at,'expiresAt',v_attempt.expires_at,'currentQuestionId',v_attempt.current_question_id),
    'assessment',jsonb_build_object('id',v_assessment.id,'title',v_assessment.title,'description',v_assessment.description,'navigationMode',v_assessment.navigation_mode,'assessmentMode',v_assessment.assessment_mode,'framework',v_assessment.framework,'adaptiveComplete',v_assessment.assessment_mode='adaptive' and v_attempt.current_question_id is null),
    'sections',coalesce((select jsonb_agg(jsonb_build_object('id',section.id,'title',section.title,'instructions',section.instructions,'position',section.position) order by section.position) from public.assessment_sections section where section.assessment_id=v_assessment.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'sectionId',question.section_id,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt','options',delivered.presented_options,'required',question.required,'sourceMaterial',question.question_snapshot->>'sourceMaterial','responseConstraints',question.question_snapshot->'responseConstraints','audioPath',question.question_snapshot->>'audioPath','maxPlays',(question.question_snapshot->>'maxPlays')::integer,'autoplay',(question.question_snapshot->>'autoplay')::boolean,'transcript',case when question.question_snapshot->>'transcriptVisibility'='always' then question.question_snapshot->>'transcript' end,'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'allowReview',(question.question_snapshot->>'allowReview')::boolean)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id),'[]'::jsonb),
    'answers',coalesce((select jsonb_object_agg(response.assessment_question_id::text,response.answer_payload->>'value') from public.assessment_responses response where response.attempt_id=v_attempt.id),'{}'::jsonb));
end;
$$;
