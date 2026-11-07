-- Pilot Bank v0.4: one authentic Reading text per CEFR level, with source attribution.
--
-- The texts are public domain or openly licensed (CC BY) and keep their ABNT reference,
-- licence, adaptation note and a short credit. Licences such as CC BY require the credit to
-- appear where the text is used, so it travels in the item snapshot and is shown to the
-- student under the text. The content itself is loaded by supabase/seed.sql (v0.4).

alter table public.question_bank_tasklets
  add column source_reference text,
  add column source_license text,
  add column source_credit text,
  add column source_adaptation text;

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
      quality_status, psychometric_status, source_reference, source_license, source_credit, source_adaptation, updated_at
    ) values (
      v_tasklet->>'externalId', v_tasklet->>'bankVersion', v_tasklet->>'skill', v_tasklet->>'level',
      v_tasklet->>'title', v_tasklet->>'topic', nullif(v_tasklet->>'genre', ''), v_tasklet->>'audience',
      v_tasklet->>'inputKind', v_tasklet->>'inputText', (v_tasklet->>'inputLength')::integer,
      nullif(v_tasklet->>'estimatedDurationSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationMinSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationMaxSeconds', '')::integer,
      nullif(v_tasklet->>'estimatedDurationLabel', ''),
      v_tasklet->>'qualityStatus', v_tasklet->>'psychometricStatus',
      nullif(v_tasklet->>'sourceReference', ''), nullif(v_tasklet->>'sourceLicense', ''), nullif(v_tasklet->>'sourceCredit', ''), nullif(v_tasklet->>'sourceAdaptation', ''), now()
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
      source_reference = excluded.source_reference, source_license = excluded.source_license,
      source_credit = excluded.source_credit, source_adaptation = excluded.source_adaptation,
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

create or replace function private.validate_cefr_pilot_bank(p_bank_version text default 'pilot-0.4')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_expected record;
  -- v0.4 added one authentic Reading tasklet per level.
  v_legacy constant boolean := p_bank_version in ('pilot-0.1', 'pilot-0.2', 'pilot-0.3');
  v_units constant integer := case when v_legacy then 300 else 324 end;
  v_tasklets constant integer := case when v_legacy then 36 else 42 end;
  v_reading_per_level constant integer := case when v_legacy then 12 else 16 end;
begin
  select count(*) into v_count
  from public.question_bank
  where bank_version = p_bank_version and source_origin = 'cefr_pilot';
  if v_count <> v_units then raise exception 'Expected % Pilot Bank units, found %', v_units, v_count; end if;

  select count(*) into v_count
  from public.question_bank_tasklets
  where bank_version = p_bank_version;
  if v_count <> v_tasklets then raise exception 'Expected % Pilot Bank tasklets, found %', v_tasklets, v_count; end if;

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

  if exists (
    select 1 from public.question_bank_tasklets
    where bank_version = p_bank_version and source_reference is not null
      and (source_license is null or source_credit is null or source_adaptation is null)
  ) then raise exception 'Pilot Bank external sources need licence, credit and adaptation'; end if;

  for v_expected in
    select * from (values
      ('reading', v_reading_per_level), ('listening', 12), ('language_use', 15), ('writing', 3),
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

create or replace function private.cefr_a2_b1_item_snapshot(
  p_item public.question_bank,
  p_tasklet public.question_bank_tasklets
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p_item.external_id,
    'externalId', p_item.external_id,
    'type', p_item.question_type,
    'prompt', p_item.prompt,
    'options', to_jsonb(p_item.options),
    'answer', p_item.answer,
    'answerKey', p_item.answer_key,
    'difficulty', p_item.difficulty,
    'cefr', p_item.level,
    'skill', p_item.skill,
    'subskill', p_item.subskill,
    'taskType', p_item.task_type,
    'topic', p_item.topic,
    'genre', p_item.genre,
    'audience', p_item.audience,
    'cognitiveProcesses', to_jsonb(p_item.cognitive_processes),
    'primaryEvidence', p_item.primary_evidence,
    'operationalDescriptor', p_item.operational_descriptor,
    'responseConstraints', p_item.response_constraints,
    'rubric', p_item.rubric,
    'sourceMaterial', case
      when p_item.skill = 'reading' then p_tasklet.input_text
      when p_item.skill = 'mediation' then p_item.source_material
    end,
    -- Attribution required by the licence of authentic texts, shown to the student under the text.
    'sourceCredit', case when p_item.skill in ('reading', 'listening') then p_tasklet.source_credit end,
    'sourceReference', case when p_item.skill in ('reading', 'listening') then p_tasklet.source_reference end,
    'qualityStatus', p_item.quality_status,
    'isPilot', p_item.is_pilot,
    'psychometricStatus', p_item.psychometric_status,
    'bankVersion', p_item.bank_version,
    'sourceOrigin', p_item.source_origin,
    'taskletId', p_tasklet.external_id,
    'taskletTitle', p_tasklet.title,
    'inputLength', p_tasklet.input_length,
    'estimatedDurationSeconds', p_tasklet.estimated_duration_seconds,
    'estimatedDurationMinSeconds', p_tasklet.estimated_duration_min_seconds,
    'estimatedDurationMaxSeconds', p_tasklet.estimated_duration_max_seconds,
    'estimatedDurationLabel', p_tasklet.estimated_duration_label,
    'transcript', case when p_item.skill = 'listening' then p_tasklet.input_text end,
    'transcriptVisibility', case when p_item.skill = 'listening' then 'after_submit' end,
    'maxPlays', case when p_item.skill = 'listening' then 2 end,
    'autoplay', case when p_item.skill = 'listening' then false end,
    'preparationSeconds', case when p_item.skill in ('spoken_production', 'spoken_interaction') then 30 end,
    'recordingSeconds', case
      when p_item.skill = 'spoken_production' then 120
      when p_item.skill = 'spoken_interaction' then 300
    end,
    'allowReview', case when p_item.skill in ('spoken_production', 'spoken_interaction') then false end
  ));
$$;

create or replace function public.generate_assessment_from_preset(
  p_preset_id text,
  p_bank_version text default 'pilot-0.4',
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
    -- randomize_questions: question order differs per attempt.
    null, 1, true, true, 'after_teacher_review',
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
    -- The section holds every approved item of the level; each attempt draws item_count of them.
    update public.assessment_sections set draw_count = least(v_level_count.item_count, coalesce(array_length(v_item_ids, 1), 0))
    where assessment_id = v_assessment_id and skill = 'language_use' and cefr_level = v_level_count.level;
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
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'sectionId',question.section_id,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt','options',delivered.presented_options,'required',question.required,'sourceMaterial',question.question_snapshot->>'sourceMaterial','sourceCredit',question.question_snapshot->>'sourceCredit','responseConstraints',question.question_snapshot->'responseConstraints','audioPath',question.question_snapshot->>'audioPath','maxPlays',(question.question_snapshot->>'maxPlays')::integer,'autoplay',(question.question_snapshot->>'autoplay')::boolean,'transcript',case when question.question_snapshot->>'transcriptVisibility'='always' then question.question_snapshot->>'transcript' end,'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'allowReview',(question.question_snapshot->>'allowReview')::boolean)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'[]'::jsonb),
    'answers',coalesce((select jsonb_object_agg(response.assessment_question_id::text,response.answer_payload->>'value') from public.assessment_responses response join public.assessment_questions question on question.id=response.assessment_question_id where response.attempt_id=v_attempt.id and not private.assessment_question_is_live(question.question_snapshot)),'{}'::jsonb));
end;
$$;

