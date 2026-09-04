-- CEFR Placement Pilot Bank v0.2: preserve ranged listening durations and
-- validate the consolidated 300-unit inventory loaded by the versioned seed.

alter table public.question_bank_tasklets
  alter column genre drop not null,
  add column estimated_duration_min_seconds integer,
  add column estimated_duration_max_seconds integer,
  add column estimated_duration_label text;

update public.question_bank_tasklets
set estimated_duration_min_seconds = estimated_duration_seconds,
    estimated_duration_max_seconds = estimated_duration_seconds,
    estimated_duration_label = estimated_duration_seconds::text || ' seconds'
where skill = 'listening';

alter table public.question_bank_tasklets
  add constraint question_bank_tasklets_duration_range check (
    (skill = 'reading' and estimated_duration_min_seconds is null and estimated_duration_max_seconds is null)
    or (
      skill = 'listening'
      and estimated_duration_min_seconds > 0
      and estimated_duration_max_seconds >= estimated_duration_min_seconds
      and estimated_duration_seconds = estimated_duration_max_seconds
      and nullif(trim(estimated_duration_label), '') is not null
    )
  );

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
      estimated_duration_min_seconds, estimated_duration_max_seconds, estimated_duration_label,
      quality_status, psychometric_status, updated_at
    ) values (
      v_tasklet->>'externalId', v_tasklet->>'bankVersion', v_tasklet->>'skill', v_tasklet->>'level',
      v_tasklet->>'title', v_tasklet->>'topic', nullif(v_tasklet->>'genre', ''), v_tasklet->>'audience',
      v_tasklet->>'inputKind', v_tasklet->>'inputText', (v_tasklet->>'inputLength')::integer,
      nullif(v_tasklet->>'estimatedDurationSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationMinSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationMaxSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationLabel', ''),
      v_tasklet->>'qualityStatus', v_tasklet->>'psychometricStatus', now()
    )
    on conflict (external_id) do update set
      bank_version = excluded.bank_version, skill = excluded.skill, level = excluded.level,
      title = excluded.title, topic = excluded.topic, genre = excluded.genre, audience = excluded.audience,
      input_kind = excluded.input_kind, input_text = excluded.input_text, input_length = excluded.input_length,
      estimated_duration_seconds = excluded.estimated_duration_seconds,
      estimated_duration_min_seconds = excluded.estimated_duration_min_seconds,
      estimated_duration_max_seconds = excluded.estimated_duration_max_seconds,
      estimated_duration_label = excluded.estimated_duration_label,
      quality_status = excluded.quality_status, psychometric_status = excluded.psychometric_status,
      updated_at = now();
  end loop;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_tasklet_id := null;
    if nullif(v_item->>'taskletExternalId', '') is not null then
      select id into v_tasklet_id
      from public.question_bank_tasklets
      where external_id = v_item->>'taskletExternalId';
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
      coalesce(nullif(v_item->>'audience', ''), 'general'), v_tasklet_id,
      nullif(v_item->>'taskletPosition', '')::smallint, array[v_item->>'subskill'],
      nullif(v_item->>'primaryEvidence', ''),
      case when jsonb_typeof(v_item->'responseConstraints') = 'object' then v_item->'responseConstraints' end,
      case when jsonb_typeof(v_item->'rubric') = 'array' then v_item->'rubric' end,
      nullif(v_item->>'sourceMaterial', ''), v_item->>'qualityStatus',
      v_item->>'psychometricStatus', true, false
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

create or replace function private.validate_cefr_pilot_bank(p_bank_version text default 'pilot-0.2')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_expected record;
begin
  select count(*) into v_count
  from public.question_bank
  where bank_version = p_bank_version and source_origin = 'cefr_pilot';
  if v_count <> 300 then raise exception 'Expected 300 Pilot Bank units, found %', v_count; end if;

  select count(*) into v_count
  from public.question_bank_tasklets
  where bank_version = p_bank_version;
  if v_count <> 36 then raise exception 'Expected 36 Pilot Bank tasklets, found %', v_count; end if;

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

  if exists (
    select 1 from public.question_bank_tasklets
    where bank_version = p_bank_version and skill = 'listening'
      and (estimated_duration_min_seconds is null or estimated_duration_max_seconds is null
        or estimated_duration_min_seconds > estimated_duration_max_seconds)
  ) then raise exception 'Pilot Bank listening duration validation failed'; end if;

  for v_expected in
    select * from (values
      ('reading', 12), ('listening', 12), ('language_use', 15), ('writing', 3),
      ('spoken_production', 3), ('spoken_interaction', 3), ('mediation', 2)
    ) expected(skill, per_level)
  loop
    if exists (
      select 1 from (values ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) levels(level)
      where (select count(*) from public.question_bank item
        where item.bank_version = p_bank_version and item.source_origin = 'cefr_pilot'
          and item.skill = v_expected.skill and item.level = levels.level) <> v_expected.per_level
    ) then raise exception 'Pilot Bank count mismatch for skill %', v_expected.skill; end if;
  end loop;
end;
$$;

revoke all on function private.validate_cefr_pilot_bank(text) from public, anon, authenticated;
grant execute on function private.validate_cefr_pilot_bank(text) to service_role;
