-- Assessment integrity v2.
--
-- * Level Checks vary per student: each Language Use section holds the whole level pool and
--   every attempt draws its own subset (draw_count); question order is shuffled per attempt.
-- * New client events: copy_detected, drop_detected, bulk_insert_detected (text inserted
--   without typing, e.g. autocomplete or browser extensions).
-- * get_assessment_integrity_signals: signals computed on the server, which the student cannot
--   suppress — comprehension parts finished faster than the text can be read, objective
--   answers given in under two seconds, and identical wrong answers shared with classmates.
-- As before, signals are evidence for the teacher's review, never an automatic penalty.

alter table public.assessment_events drop constraint assessment_events_event_type_check;
alter table public.assessment_events add constraint assessment_events_event_type_check check (event_type in (
  'assessment_started','question_opened','question_closed','answer_saved','audio_play_started','tab_blur','tab_focus','fullscreen_exit','paste_detected','network_disconnect','network_reconnect','resumed','submitted','session_conflict',
  'live_session_opened','live_response_scored','copy_detected','drop_detected','bulk_insert_detected'
));

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

create or replace function private.apply_level_check_pacing(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_levels constant text[] := array['A1','A2','B1','B2','C1','C2'];
begin
  update public.assessments set section_pacing = 'sections', time_limit_minutes = null where id = p_assessment_id;
  update public.assessment_sections section set time_limit_minutes = case section.skill
      when 'reading' then (array[6, 8, 10, 12, 15, 18])[array_position(v_levels, section.cefr_level)]
      when 'listening' then (array[6, 8, 10, 12, 15, 18])[array_position(v_levels, section.cefr_level)]
      when 'language_use' then ceil(coalesce(section.draw_count, (select count(*) from public.assessment_questions question where question.section_id = section.id))
        * (array[1, 1, 1, 1.5, 1.5, 1.5])[array_position(v_levels, section.cefr_level)])::integer
      when 'writing' then (array[15, 20, 30, 40, 45, 50])[array_position(v_levels, section.cefr_level)]
      when 'spoken_production' then 10
      when 'mediation' then 15
      else null end
  where section.assessment_id = p_assessment_id;
end;
$$;

create or replace function private.validate_cefr_level_check(p_assessment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_assessment public.assessments%rowtype; v_preset public.cefr_level_check_presets%rowtype;
begin
  select * into v_assessment from public.assessments where id=p_assessment_id;
  select * into v_preset from public.cefr_level_check_presets where id=v_assessment.preset_id;
  if v_preset.id is null or v_assessment.status <> 'draft' or v_assessment.type <> 'placement'
    or v_assessment.framework <> 'cefr' or v_assessment.assessment_mode <> 'fixed'
    or v_assessment.navigation_mode <> 'linear' or v_assessment.show_results <> 'after_teacher_review'
    or v_assessment.form_version <> v_preset.form_version
    or v_assessment.decision_rule_version <> v_preset.decision_rule_version
    or v_assessment.bank_version is null or v_assessment.selection_seed is null
  then raise exception 'Invalid CEFR Level Check metadata'; end if;

  if exists (
    select 1 from jsonb_each(v_preset.objective_distribution) skill
    cross join lateral jsonb_each_text(skill.value) level_count
    where (select coalesce(sum(least(coalesce(section.draw_count, pool.items), pool.items)), 0)
      from public.assessment_sections section
      cross join lateral (select count(*) items from public.assessment_questions question
        where question.section_id=section.id
          and question.question_snapshot->>'skill'=skill.key
          and question.question_snapshot->>'cefr'=level_count.key) pool
      where section.assessment_id=p_assessment_id and pool.items>0) <> level_count.value::integer
  ) then raise exception 'CEFR Level Check objective distribution is invalid'; end if;

  if (select count(*) from public.assessment_questions where assessment_id=p_assessment_id
      and question_snapshot->>'skill'='writing') <> 2
    or (select count(*) from public.assessment_questions where assessment_id=p_assessment_id
      and question_snapshot->>'skill'='spoken_production') <> 1
    or (select count(*) from public.assessment_questions where assessment_id=p_assessment_id
      and question_snapshot->>'skill'='spoken_interaction') <> 1
    or (select count(*) from public.assessment_questions where assessment_id=p_assessment_id
      and question_snapshot->>'skill'='mediation') <> 1
  then raise exception 'CEFR Level Check productive distribution is invalid'; end if;

  if exists (
    select 1 from public.assessment_questions question
    join public.question_bank bank on bank.id=question.question_bank_id
    where question.assessment_id=p_assessment_id and (
      bank.bank_version <> v_assessment.bank_version or bank.source_origin <> 'cefr_pilot'
      or bank.quality_status not in ('approved_for_pilot','approved')
      or question.question_snapshot->>'externalId' is distinct from bank.external_id)
  ) or (select count(*) from public.assessment_questions where assessment_id=p_assessment_id)
      <> (select count(distinct question_snapshot->>'externalId') from public.assessment_questions where assessment_id=p_assessment_id)
  then raise exception 'CEFR Level Check contains invalid or duplicate bank items'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id=p_assessment_id and question.question_snapshot->>'skill' in ('reading','listening')
    group by question.section_id,question.question_snapshot->>'taskletId' having count(*)<>4
  ) then raise exception 'CEFR Level Check tasklets must remain intact'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id=p_assessment_id and question.question_snapshot->>'skill' in ('reading','listening','language_use')
      and (jsonb_array_length(question.question_snapshot->'options')<>4
        or nullif(question.question_snapshot->>'answer','') is null
        or not (question.question_snapshot->'options' ? (question.question_snapshot->>'answer')))
  ) then raise exception 'CEFR Level Check objective answer is invalid'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id=p_assessment_id and question.question_snapshot->>'skill' in ('writing','spoken_production','spoken_interaction','mediation')
      and (question.question_snapshot ? 'answer' or jsonb_array_length(coalesce(question.question_snapshot->'rubric','[]'))=0)
  ) or exists (
    select 1 from public.assessment_questions question
    where question.assessment_id=p_assessment_id and question.question_snapshot->>'skill'='mediation'
      and nullif(trim(question.question_snapshot->>'sourceMaterial'),'') is null
  ) then raise exception 'CEFR Level Check productive evidence is invalid'; end if;
end;
$$;

create or replace function public.record_assessment_event(p_attempt_id uuid, p_event_type text, p_question_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_duration integer; v_clean_metadata jsonb := '{}'::jsonb;
begin
  if p_event_type not in ('question_opened', 'question_closed', 'tab_blur', 'tab_focus', 'fullscreen_exit', 'paste_detected', 'network_disconnect', 'network_reconnect', 'copy_detected', 'drop_detected', 'bulk_insert_detected') then raise exception 'Unsupported client event'; end if;
  if jsonb_typeof(p_metadata) <> 'object' or octet_length(p_metadata::text) > 2048 then raise exception 'Invalid event metadata'; end if;
  if p_event_type in ('question_closed', 'tab_focus') then
    if jsonb_typeof(p_metadata->'durationMs') <> 'number' then raise exception 'Event duration is required'; end if;
    v_duration := least(3600000, greatest(0, (p_metadata->>'durationMs')::integer));
    v_clean_metadata := jsonb_build_object('durationMs', v_duration);
  elsif p_event_type = 'paste_detected' then
    if jsonb_typeof(p_metadata->'pasteLength') <> 'number' then raise exception 'Paste length is required'; end if;
    v_clean_metadata := jsonb_build_object('pasteLength', least(1000000, greatest(0, (p_metadata->>'pasteLength')::integer)));
  elsif p_event_type in ('copy_detected', 'drop_detected', 'bulk_insert_detected') then
    if jsonb_typeof(p_metadata->'length') <> 'number' then raise exception 'Event length is required'; end if;
    v_clean_metadata := jsonb_build_object('length', least(1000000, greatest(0, (p_metadata->>'length')::integer)));
    if p_event_type = 'bulk_insert_detected' and jsonb_typeof(p_metadata->'inputType') = 'string' then
      v_clean_metadata := v_clean_metadata || jsonb_build_object('inputType', left(p_metadata->>'inputType', 40));
    end if;
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
      or (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'paste_detected') >= 3
      or (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type in ('bulk_insert_detected', 'drop_detected')) >= 2
      or (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'copy_detected') >= 5 then 'review_recommended'
    when exists (select 1 from public.assessment_events where attempt_id = p_attempt_id and event_type in ('tab_blur', 'paste_detected', 'fullscreen_exit', 'session_conflict', 'copy_detected', 'drop_detected', 'bulk_insert_detected')) then 'unusual_activity'
    else 'no_unusual_activity' end where id = p_attempt_id;
end;
$$;


-- Reading speed above this while also answering the items is not plausible comprehension.
create or replace function public.get_assessment_integrity_signals(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_max_wpm constant integer := 450;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.id = p_attempt_id and assignment.teacher_id = (select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if;
  return jsonb_build_object(
    'maxReadingWordsPerMinute', v_max_wpm,
    'rapidParts', coalesce((
      select jsonb_agg(jsonb_build_object('sectionId', part.id, 'title', part.title, 'words', part.words, 'seconds', part.seconds, 'wordsPerMinute', round(part.words * 60.0 / greatest(part.seconds, 1)), 'source', part.source) order by part.position)
      from (
        select section.id, section.title, section.position,
          (select coalesce(array_length(regexp_split_to_array(trim(max(question.question_snapshot->>'sourceMaterial')), '\s+'), 1), 0)
             from public.assessment_questions question where question.section_id = section.id) words,
          coalesce(
            (select extract(epoch from (stage.completed_at - stage.started_at))::integer from public.assessment_attempt_sections stage where stage.attempt_id = v_attempt.id and stage.section_id = section.id and stage.completed_at is not null),
            (select (sum(response.time_spent_ms) / 1000)::integer from public.assessment_responses response join public.assessment_questions question on question.id = response.assessment_question_id where response.attempt_id = v_attempt.id and question.section_id = section.id)
          ) seconds,
          case when exists (select 1 from public.assessment_attempt_sections stage where stage.attempt_id = v_attempt.id and stage.section_id = section.id and stage.completed_at is not null) then 'server' else 'client' end source
        from public.assessment_sections section
        where section.assessment_id = v_attempt.assessment_id and section.skill = 'reading'
          and exists (select 1 from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id = delivered.assessment_question_id where delivered.attempt_id = v_attempt.id and question.section_id = section.id)
      ) part
      where part.words >= 30 and part.seconds is not null and part.words * 60.0 / greatest(part.seconds, 1) > v_max_wpm
    ), '[]'::jsonb),
    'fastObjectiveAnswers', (
      select jsonb_build_object('count', count(*) filter (where response.time_spent_ms > 0 and response.time_spent_ms < 2000 and response.answer_payload ? 'value'), 'total', count(*))
      from public.assessment_responses response join public.assessment_questions question on question.id = response.assessment_question_id
      where response.attempt_id = v_attempt.id and question.question_snapshot->>'type' in ('multiple_choice','multiple_response','true_false','matching','ordering','fill_blank','short_answer','listening')
    ),
    'sharedWrongAnswers', coalesce((
      select jsonb_agg(jsonb_build_object('studentName', match.student_name, 'sharedWrong', match.shared_wrong, 'ownWrong', match.own_wrong) order by match.shared_wrong desc)
      from (
        select profile.full_name student_name, count(*) shared_wrong,
          (select count(*) from public.assessment_responses own where own.attempt_id = v_attempt.id and own.grading_status = 'auto_graded' and own.score = 0 and own.answer_payload->>'value' <> '') own_wrong
        from public.assessment_responses mine
        join public.assessment_responses theirs on theirs.assessment_question_id = mine.assessment_question_id and theirs.attempt_id <> mine.attempt_id
        join public.assessment_attempts other on other.id = theirs.attempt_id and other.student_id <> v_attempt.student_id and other.status in ('submitted', 'grading', 'completed')
        left join public.profiles profile on profile.id = other.student_id
        where mine.attempt_id = v_attempt.id and mine.grading_status = 'auto_graded' and mine.score = 0 and theirs.score = 0
          and mine.answer_payload->>'value' <> '' and mine.answer_payload->>'value' = theirs.answer_payload->>'value'
        group by other.id, profile.full_name
        order by count(*) desc
        limit 3
      ) match
      where match.shared_wrong >= 5 and match.shared_wrong >= 0.6 * match.own_wrong
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_assessment_integrity_signals(uuid) from public, anon;
grant execute on function public.get_assessment_integrity_signals(uuid) to authenticated;
