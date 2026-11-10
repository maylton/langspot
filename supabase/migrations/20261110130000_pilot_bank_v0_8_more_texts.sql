-- Pilot Bank v0.8: two more Reading texts per level (six per level), see supabase/seed.sql and
-- docs/cefr/AUTHENTIC_TEXT_SOURCES.md. The bank validator expects 372 units / 54 tasklets / 24 Reading
-- items per level from v0.8 on (earlier versions keep their counts). The validator and the Level Check
-- generator default to 'pilot-0.8'; the generator is otherwise identical to 20261110120000.

create or replace function private.validate_cefr_pilot_bank(p_bank_version text default 'pilot-0.8')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_expected record;
  -- v0.4 added one authentic Reading tasklet per level; v0.8 added two more (six per level).
  v_legacy constant boolean := p_bank_version in ('pilot-0.1', 'pilot-0.2', 'pilot-0.3');
  v_four_texts constant boolean := p_bank_version in ('pilot-0.4', 'pilot-0.5', 'pilot-0.6', 'pilot-0.7');
  v_units constant integer := case when v_legacy then 300 when v_four_texts then 324 else 372 end;
  v_tasklets constant integer := case when v_legacy then 36 when v_four_texts then 42 else 54 end;
  v_reading_per_level constant integer := case when v_legacy then 12 when v_four_texts then 16 else 24 end;
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

create or replace function public.generate_assessment_from_preset(
  p_preset_id text,
  p_bank_version text default 'pilot-0.8',
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
