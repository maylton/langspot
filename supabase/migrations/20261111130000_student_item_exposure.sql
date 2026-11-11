-- Avoid texts and items a student has already seen.
--
-- * private.student_seen_items: bank items (externalId, or the bank row) and texts (taskletId)
--   delivered to the student in earlier attempts.
-- * Level Check generation can target a student (p_student_id): unseen texts and productive tasks
--   come first; seen ones are used only when the bank has nothing else. The form records
--   generated_for_student_id and is titled with the student's name.
-- * Pooled sections (Language Use) draw unseen items first at attempt start.
-- * public.list_student_seen_items / public.get_assessment_student_exposure: markers for the
--   preview and the assignment form.
-- * The generator's bank version now defaults to private.current_pilot_bank_version(), so a new
--   bank version only changes that function.

alter table public.assessments
  add column if not exists generated_for_student_id uuid references public.profiles(id) on delete set null;

create or replace function private.current_pilot_bank_version()
returns text language sql immutable set search_path = '' as $$ select 'pilot-0.8'::text $$;

create or replace function private.question_item_key(p_snapshot jsonb, p_bank_id uuid)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(p_snapshot->>'externalId', ''), p_bank_id::text);
$$;

create or replace function private.student_seen_items(p_student_id uuid, p_exclude_attempt_id uuid default null)
returns table (item_key text, tasklet_key text, skill text, seen_at timestamptz, assessment_id uuid, assessment_title text)
language sql stable security definer set search_path = '' as $$
  select distinct on (private.question_item_key(question.question_snapshot, question.question_bank_id))
    private.question_item_key(question.question_snapshot, question.question_bank_id),
    nullif(question.question_snapshot->>'taskletId', ''),
    coalesce(question.question_snapshot->>'skill', section.skill),
    delivered.selected_at, assessment.id, assessment.title
  from public.assessment_attempts attempt
  join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id
  join public.assessment_questions question on question.id = delivered.assessment_question_id
  join public.assessment_sections section on section.id = question.section_id
  join public.assessments assessment on assessment.id = attempt.assessment_id
  where attempt.student_id = p_student_id
    and attempt.id is distinct from p_exclude_attempt_id
    and private.question_item_key(question.question_snapshot, question.question_bank_id) is not null
  order by private.question_item_key(question.question_snapshot, question.question_bank_id), delivered.selected_at desc;
$$;

-- Same draw as 20261106130000, but in pooled sections the student's unseen items come first.
create or replace function private.deliver_fixed_assessment_questions(p_attempt_id uuid, p_assessment_id uuid, p_seed text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_assessment public.assessments%rowtype; v_first_question uuid; v_student uuid; v_seen text[];
begin
  select * into v_assessment from public.assessments where id = p_assessment_id;
  select student_id into v_student from public.assessment_attempts where id = p_attempt_id;
  select coalesce(array_agg(item_key), '{}') into v_seen from private.student_seen_items(v_student, p_attempt_id);
  insert into public.assessment_attempt_questions (attempt_id, assessment_question_id, position, presented_options)
  select p_attempt_id, chosen.id, row_number() over (order by chosen.section_position, chosen.delivery_order) - 1,
    case when v_assessment.randomize_options then private.shuffle_assessment_options(chosen.question_snapshot->'options', p_seed || ':' || chosen.id::text) else coalesce(chosen.question_snapshot->'options', '[]'::jsonb) end
  from (select ranked.*, case when v_assessment.randomize_questions then md5(p_seed || ':' || ranked.id::text) else lpad(ranked.question_position::text, 10, '0') end delivery_order
    from (select question.*, section.position section_position, question.position question_position, section.draw_count,
      row_number() over (partition by section.id order by
        private.question_item_key(question.question_snapshot, question.question_bank_id) = any(v_seen),
        case when v_assessment.randomize_questions then md5(p_seed || ':' || question.id::text) else lpad(question.position::text, 10, '0') end) pool_rank,
      count(*) over (partition by section.id) pool_size
      from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
      where question.assessment_id = v_assessment.id) ranked
    where ranked.pool_rank <= coalesce(ranked.draw_count, ranked.pool_size)) chosen;
  select assessment_question_id into v_first_question from public.assessment_attempt_questions where attempt_id = p_attempt_id order by position limit 1;
  return v_first_question;
end;
$$;

drop function if exists public.generate_assessment_from_preset(text, text, text);

create or replace function public.generate_assessment_from_preset(
  p_preset_id text,
  p_bank_version text default null,
  p_selection_seed text default 'pilot-form-1',
  p_student_id uuid default null
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
  -- Items and texts the student has already seen in earlier attempts (empty without a student).
  v_seen_items text[] := '{}';
  v_seen_tasklets text[] := '{}';
  v_student_name text;
begin
  p_bank_version := coalesce(p_bank_version, private.current_pilot_bank_version());
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then
    raise exception 'Teacher access required';
  end if;

  if nullif(trim(p_bank_version), '') is null
    or nullif(trim(p_selection_seed), '') is null
    or char_length(p_selection_seed) > 100
  then
    raise exception 'Invalid preset generation parameters';
  end if;

  if p_student_id is not null then
    if not exists (select 1 from public.student_records where student_id = p_student_id and teacher_id = v_teacher_id) then
      raise exception 'Student not found';
    end if;
    select full_name into v_student_name from public.profiles where id = p_student_id;
    select coalesce(array_agg(distinct seen.item_key), '{}'), coalesce(array_agg(distinct seen.tasklet_key) filter (where seen.tasklet_key is not null), '{}')
    into v_seen_items, v_seen_tasklets
    from private.student_seen_items(p_student_id) seen;
  end if;

  select * into v_preset
  from public.cefr_level_check_presets
  where id = p_preset_id and active;

  if not found then
    raise exception 'CEFR Level Check preset not found';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_teacher_id::text || ':' || p_preset_id || ':' || p_bank_version || ':' || p_selection_seed || ':' || coalesce(p_student_id::text, ''),
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
    and generated_for_student_id is not distinct from p_student_id
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
    and p_student_id is null
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
    preset_id, preset_version, bank_version, selection_seed, generated_for_student_id
  ) values (
    v_teacher_id,
    'CEFR ' || v_preset.target_level || ' Level Check — ' ||
      case when v_student_name is not null then v_student_name
        when p_selection_seed = 'pilot-form-1' then 'Pilot Form 1' else p_selection_seed end,
    v_preset.purpose || ' Parte objetiva seguida por tarefas produtivas com revisão humana.',
    'placement', 'draft', 'fixed', 'linear',
    coalesce(v_preset.floor_level, v_preset.target_level),
    coalesce(v_preset.ceiling_level, v_preset.target_level),
    -- randomize_questions: question order differs per attempt.
    null, 1, true, true, 'after_teacher_review',
    'objective-v1', 'cefr', v_preset.form_version,
    v_preset.decision_rule_version, 'cefr-routing-v1',
    v_preset.report_model_version, v_preset.id, v_preset.preset_version,
    p_bank_version, p_selection_seed, p_student_id
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
          ranked.external_id = any(v_seen_tasklets),
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
    order by bank.external_id = any(v_seen_items), md5(
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
    order by bank.external_id = any(v_seen_items), md5(
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

-- Seen bank items of one of the teacher's students (markers in the preview).
create or replace function public.list_student_seen_items(p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.student_records where student_id = p_student_id and teacher_id = (select auth.uid())) then
    raise exception 'Student not found';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('itemKey', seen.item_key, 'taskletKey', seen.tasklet_key, 'skill', seen.skill,
      'seenAt', seen.seen_at, 'assessmentTitle', seen.assessment_title) order by seen.seen_at desc)
    from private.student_seen_items(p_student_id) seen), '[]'::jsonb);
end; $$;

-- Overlap between an assessment and what the student has seen (assignment form).
-- fixed: questions every attempt delivers; pools: sections drawn per attempt, which prefer unseen items.
create or replace function public.get_assessment_student_exposure(p_assessment_id uuid, p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_teacher uuid := (select auth.uid());
begin
  if not exists (select 1 from public.assessments where id = p_assessment_id and teacher_id = v_teacher) then
    raise exception 'Assessment not found';
  end if;
  if not exists (select 1 from public.student_records where student_id = p_student_id and teacher_id = v_teacher) then
    raise exception 'Student not found';
  end if;
  return (
    with seen as (select * from private.student_seen_items(p_student_id)),
    questions as (
      select question.id, section.id section_id, section.title section_title, section.skill, section.position,
        section.draw_count, count(*) over (partition by section.id) pool_size,
        private.question_item_key(question.question_snapshot, question.question_bank_id) item_key,
        nullif(question.question_snapshot->>'taskletId', '') tasklet_key,
        question.question_snapshot->>'taskletTitle' tasklet_title
      from public.assessment_questions question join public.assessment_sections section on section.id = question.section_id
      where question.assessment_id = p_assessment_id
    )
    select jsonb_build_object(
      'fixed', coalesce((select jsonb_agg(jsonb_build_object('sectionTitle', q.section_title, 'skill', q.skill, 'itemKey', q.item_key,
          'taskletKey', q.tasklet_key, 'taskletTitle', q.tasklet_title, 'seenAt', s.seen_at, 'assessmentTitle', s.assessment_title)
          order by q.position, q.item_key)
        from questions q join seen s on s.item_key = q.item_key
        where q.draw_count is null or q.draw_count >= q.pool_size), '[]'::jsonb),
      'pools', coalesce((select jsonb_agg(jsonb_build_object('sectionTitle', pool.section_title, 'skill', pool.skill, 'poolSize', pool.pool_size,
          'drawCount', pool.draw_count, 'unseen', pool.unseen) order by pool.position)
        from (select q.section_id, q.section_title, q.skill, q.position, q.pool_size, q.draw_count,
            count(*) filter (where not exists (select 1 from seen s where s.item_key = q.item_key)) unseen
          from questions q where q.draw_count is not null and q.draw_count < q.pool_size
          group by q.section_id, q.section_title, q.skill, q.position, q.pool_size, q.draw_count) pool), '[]'::jsonb)
    ));
end; $$;

revoke all on function private.current_pilot_bank_version() from public, anon, authenticated;
revoke all on function private.question_item_key(jsonb, uuid) from public, anon, authenticated;
revoke all on function private.student_seen_items(uuid, uuid) from public, anon, authenticated;
revoke all on function private.deliver_fixed_assessment_questions(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.generate_assessment_from_preset(text, text, text, uuid) from public, anon;
revoke all on function public.list_student_seen_items(uuid) from public, anon;
revoke all on function public.get_assessment_student_exposure(uuid, uuid) from public, anon;
grant execute on function public.generate_assessment_from_preset(text, text, text, uuid) to authenticated;
grant execute on function public.list_student_seen_items(uuid) to authenticated;
grant execute on function public.get_assessment_student_exposure(uuid, uuid) to authenticated;
