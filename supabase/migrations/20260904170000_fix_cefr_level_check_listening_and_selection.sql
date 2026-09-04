-- Follow-up fixes for CEFR Level Checks:
-- 1) Listening play limits are shared across all questions in the same tasklet.
-- 2) Generic preset generation balances topic/subskill diversity with item difficulty.

create table public.assessment_listening_tasklet_plays (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  tasklet_key text not null,
  play_count integer not null default 0 check (play_count >= 0),
  last_played_at timestamptz,
  primary key (attempt_id, tasklet_key)
);

alter table public.assessment_listening_tasklet_plays enable row level security;
revoke all on table public.assessment_listening_tasklet_plays from anon, authenticated;
grant all on table public.assessment_listening_tasklet_plays to service_role;

create index assessment_listening_tasklet_plays_attempt_idx
  on public.assessment_listening_tasklet_plays (attempt_id, tasklet_key);

create or replace function public.begin_assessment_audio_play(
  p_attempt_id uuid,
  p_question_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text;
  v_tasklet_key text;
  v_max integer;
  v_count integer;
  v_allowed boolean := false;
begin
  select
    question.question_snapshot->>'audioPath',
    coalesce(nullif(question.question_snapshot->>'taskletId', ''), 'question:' || question.id::text),
    greatest(coalesce((question.question_snapshot->>'maxPlays')::integer, 1), 1)
  into v_path, v_tasklet_key, v_max
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  join public.assessment_attempt_questions delivered on delivered.attempt_id = attempt.id
  join public.assessment_questions question on question.id = delivered.assessment_question_id
  where attempt.id = p_attempt_id
    and assignment.student_id = (select auth.uid())
    and attempt.status = 'in_progress'
    and question.id = p_question_id
    and question.question_snapshot->>'type' = 'listening'
  for update of attempt;

  if v_path is null or v_tasklet_key is null then
    raise exception 'Listening question is not available';
  end if;

  insert into public.assessment_listening_tasklet_plays (
    attempt_id, tasklet_key, play_count, last_played_at
  ) values (
    p_attempt_id, v_tasklet_key, 0, null
  ) on conflict do nothing;

  update public.assessment_listening_tasklet_plays
  set play_count = play_count + 1,
      last_played_at = clock_timestamp()
  where attempt_id = p_attempt_id
    and tasklet_key = v_tasklet_key
    and play_count < v_max
  returning play_count into v_count;

  v_allowed := found;

  if v_allowed then
    insert into public.assessment_events(attempt_id, event_type, metadata)
    values (
      p_attempt_id,
      'audio_play_started',
      jsonb_build_object(
        'questionId', p_question_id,
        'taskletId', v_tasklet_key,
        'playCount', v_count,
        'maxPlays', v_max
      )
    );
  end if;

  if v_count is null then
    select play_count into v_count
    from public.assessment_listening_tasklet_plays
    where attempt_id = p_attempt_id and tasklet_key = v_tasklet_key;
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'playCount', coalesce(v_count, 0),
    'maxPlays', v_max,
    'audioPath', v_path,
    'taskletId', v_tasklet_key
  );
end;
$$;

revoke all on function public.begin_assessment_audio_play(uuid, uuid) from public, anon;
grant execute on function public.begin_assessment_audio_play(uuid, uuid) to authenticated;

-- Replace the generic preset generator with a difficulty-aware deterministic selector.
-- The curated B1 Pilot Form 1 remains unchanged.
create or replace function public.generate_assessment_from_preset(
  p_preset_id text,
  p_bank_version text default 'pilot-0.2',
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

  foreach v_skill in array array['reading', 'listening'] loop
    v_part := case v_skill when 'reading' then 1 else 2 end;

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
      'PART 3 — Language Use · ' || v_role || ' ' || v_level_count.level,
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
      'PART 4 — Writing · Task ' || v_task_index,
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
      'PART ' || case v_skill
        when 'spoken_production' then 5
        when 'spoken_interaction' then 6
        else 7
      end || ' — ' || initcap(replace(v_skill, '_', ' ')) || ' · Target ' || v_preset.target_level,
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

  perform private.validate_cefr_level_check(v_assessment_id);
  return v_assessment_id;
end;
$$;

create or replace function public.create_cefr_a2_b1_placement_check()
returns uuid
language sql
security definer
set search_path = ''
as $$
  select public.generate_assessment_from_preset(
    'cefr-b1-level-check',
    'pilot-0.2',
    'pilot-form-1'
  );
$$;

revoke all on function public.generate_assessment_from_preset(text, text, text),
  public.create_cefr_a2_b1_placement_check()
from public, anon;

grant execute on function public.generate_assessment_from_preset(text, text, text),
  public.create_cefr_a2_b1_placement_check()
to authenticated;
