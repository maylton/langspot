-- 1. Level Check Writing is rated on the target-level task. The floor task (e.g. the A2 task of a B1
--    check) only checks the floor: it lowers Writing when it falls below the floor level and is ignored
--    otherwise. Before, both tasks were averaged, so a short A2 story pulled a B1 article down to A2+,
--    and Writing below target capped the overall level one step below the target.
--    Completed Level Check profiles are rebuilt with the new rule (teacher overrides are kept).
-- 2. Speaking recordings: the student may delete a recording and record again, up to three attempts.
--    Each deletion is recorded as a 'recording_discarded' event (duration, pauses), which the teacher
--    sees while grading; a third deletion is refused.
-- build_cefr_profile is otherwise identical to 20261111140000; record_assessment_event to 20261106190000.

create or replace function private.level_check_writing_level(p_attempt_id uuid, p_assessment_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  with rated as (
    select section.id, section.tasklet_kind, section.cefr_level,
      percentile_cont(.5) within group (order by rubric_score.score) ordinal
    from public.assessment_sections section
    join public.assessment_questions question on question.section_id = section.id
    join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = p_attempt_id
    join public.assessment_rubric_scores rubric_score on rubric_score.response_id = response.id
    where section.assessment_id = p_assessment_id and section.skill = 'writing'
    group by section.id, section.tasklet_kind, section.cefr_level
  ), target as (
    select percentile_cont(.5) within group (order by ordinal) ordinal from rated where tasklet_kind <> 'floor'
  ), floor_check as (
    select min(ordinal) ordinal, min(array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'], cefr_level)) floor_position
    from rated where tasklet_kind = 'floor'
  )
  select private.cefr_level_from_ordinal(case
      when target.ordinal is null then null
      when floor_check.ordinal is not null and floor_check.ordinal < floor_check.floor_position then least(target.ordinal, floor_check.ordinal)
      else target.ordinal end::numeric)
  from target, floor_check;
$$;

alter table public.assessment_events drop constraint assessment_events_event_type_check;
alter table public.assessment_events add constraint assessment_events_event_type_check check (event_type in (
  'assessment_started','question_opened','question_closed','answer_saved','audio_play_started','tab_blur','tab_focus','fullscreen_exit','paste_detected','network_disconnect','network_reconnect','resumed','submitted','session_conflict',
  'live_session_opened','live_response_scored','copy_detected','drop_detected','bulk_insert_detected','recording_discarded'
));

create or replace function private.build_cefr_profile(p_attempt_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype; v_profile_id uuid; v_skills jsonb := '{}'::jsonb; v_dimensions jsonb; v_strengths jsonb := '[]'::jsonb; v_priorities jsonb := '[]'::jsonb; v_skill text; v_level text; v_confidence text; v_overall text; v_ord numeric; v_min numeric; v_max numeric; v_flags jsonb := '[]'::jsonb; v_manual boolean := false;
begin
  select * into v_attempt from public.assessment_attempts where id=p_attempt_id;
  select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  if v_assessment.framework <> 'cefr' or v_attempt.status <> 'completed' then return null; end if;
  for v_skill in select distinct case when skill in ('grammar','vocabulary','use_of_english') then 'language_use' when skill='speaking' then 'spoken_production' else skill end from public.assessment_sections where assessment_id=v_assessment.id loop
    select private.cefr_level_from_ordinal((percentile_cont(.5) within group(order by level_ordinal))::numeric), case when count(*) >= 2 and bool_and(evidence_count >= 4) then 'high' when count(*) >= 1 then 'moderate' else 'low' end
    into v_level,v_confidence from (
      select case
        when section.skill in ('writing','speaking','spoken_production','spoken_interaction','mediation') and rubric.level_ordinal is not null then rubric.level_ordinal
        when score.ratio >= .75 then array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],section.cefr_level)
        when score.ratio >= .50 then greatest(1,array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],section.cefr_level)-1)
        else greatest(1,array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],section.cefr_level)-2) end level_ordinal,
        score.evidence_count
      from public.assessment_sections section
      left join lateral (select coalesce(sum(response.score),0)/nullif(sum(response.max_score),0) ratio,count(*) evidence_count,count(*) filter (where nullif(response.answer_payload->>'value','') is not null) answered_count from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id where question.section_id=section.id) score on true
      left join lateral (select percentile_cont(.5) within group(order by rubric_score.score) level_ordinal from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id join public.assessment_rubric_scores rubric_score on rubric_score.response_id=response.id where question.section_id=section.id) rubric on true
      where section.assessment_id=v_assessment.id and (case when section.skill in ('grammar','vocabulary','use_of_english') then 'language_use' when section.skill='speaking' then 'spoken_production' else section.skill end)=v_skill
        -- A productive part without a rubric rating and without any answer carries no evidence.
        and not (section.skill in ('writing','speaking','spoken_production','spoken_interaction','mediation') and rubric.level_ordinal is null and coalesce(score.answered_count,0)=0)
    ) evidence;
    -- Level Checks (cefr-level-check-v2): objective skills follow the floor/target/ceiling ladder.
    if v_assessment.preset_id is not null and v_skill in ('reading','listening','language_use') then
      v_level := coalesce(private.level_check_objective_level(p_attempt_id, v_assessment.id, v_skill), v_level);
    end if;
    -- Level Checks: Writing is rated on the target task; the floor task only checks the floor.
    if v_assessment.preset_id is not null and v_skill = 'writing' then
      v_level := coalesce(private.level_check_writing_level(p_attempt_id, v_assessment.id), v_level);
    end if;
    if v_skill in ('writing','spoken_production','spoken_interaction','mediation') then
      select coalesce(jsonb_object_agg(criterion_key,jsonb_build_object('level',private.cefr_level_from_ordinal(level_ordinal::numeric),'evidence','teacher rubric')),'{}'::jsonb) into v_dimensions from (select rubric_score.criterion_key,percentile_cont(.5) within group(order by rubric_score.score) level_ordinal from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id join public.assessment_rubric_scores rubric_score on rubric_score.response_id=response.id where section.assessment_id=v_assessment.id and (case when section.skill='speaking' then 'spoken_production' else section.skill end)=v_skill and not (v_assessment.preset_id is not null and section.skill='writing' and section.tasklet_kind='floor' and exists (select 1 from public.assessment_sections target where target.assessment_id=v_assessment.id and target.skill='writing' and target.tasklet_kind<>'floor')) group by rubric_score.criterion_key) rubric_dimensions;
    else
      select coalesce(jsonb_object_agg(subskill,jsonb_build_object('level',level,'evidence',correct_count||'/'||item_count||' objective items')),'{}'::jsonb) into v_dimensions from (select coalesce(question.question_snapshot->>'subskill','unspecified') subskill,private.cefr_level_from_ordinal((case when avg(case when response.score=response.max_score then 1 else 0 end)>=.75 then array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],max(section.cefr_level)) when avg(case when response.score=response.max_score then 1 else 0 end)>=.5 then greatest(1,array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],max(section.cefr_level))-1) else greatest(1,array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],max(section.cefr_level))-2) end)::numeric) level,count(*) item_count,count(*) filter(where response.score=response.max_score) correct_count from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id where section.assessment_id=v_assessment.id and (case when section.skill in ('grammar','vocabulary','use_of_english') then 'language_use' else section.skill end)=v_skill group by question.question_snapshot->>'subskill') objective_dimensions;
    end if;
    if v_level is not null then v_skills := v_skills || jsonb_build_object(v_skill,jsonb_build_object('level',v_level,'confidence',v_confidence,'dimensions',v_dimensions)); end if;
  end loop;
  select percentile_cont(.5) within group(order by array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')),
    min(array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')),
    max(array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')) into v_ord,v_min,v_max from jsonb_each(v_skills);
  if v_ord is null then v_flags:=v_flags||'"LOW_ITEM_CONFIDENCE"'::jsonb; v_manual:=true; else
    if v_max-v_min >= 4 then v_flags:=v_flags||'"HIGH_SKILL_VARIANCE"'::jsonb; v_manual:=true; end if;
    select min(array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')) into v_min from jsonb_each(v_skills) where key in ('writing','spoken_production','spoken_interaction','mediation');
    if v_ord >= 7 and v_min is not null and v_min < 5 then v_ord:=least(v_ord,5); v_flags:=v_flags||'"PRODUCTIVE_SKILLS_BELOW_OVERALL"'::jsonb; v_manual:=true; end if;
    if v_ord >= 9 and v_min is not null and v_min < 7 then v_ord:=least(v_ord,7); v_flags:=v_flags||'"PRODUCTIVE_SKILLS_BELOW_OVERALL"'::jsonb; v_manual:=true; end if;
    v_overall:=private.cefr_level_from_ordinal(v_ord);
  end if;
  if exists(select 1 from public.assessment_events event where event.attempt_id=p_attempt_id and event.event_type in ('session_conflict','network_disconnect') and not exists(select 1 from public.assessment_events recovery where recovery.attempt_id=p_attempt_id and recovery.occurred_at>event.occurred_at and recovery.event_type in ('network_reconnect','resumed'))) then v_flags:=v_flags||'"TECHNICAL_INTERRUPTION"'::jsonb; v_manual:=true; end if;
  if v_manual then v_flags:=v_flags||'"MANUAL_REVIEW_REQUIRED"'::jsonb; end if;
  if v_overall is not null then
    select coalesce(jsonb_agg(key),'[]'::jsonb) into v_strengths from jsonb_each(v_skills) where array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')>round(v_ord);
    select coalesce(jsonb_agg(priority),'[]'::jsonb) into v_priorities from (select key priority from jsonb_each(v_skills) where array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],value->>'level')<round(v_ord) union all select skill.key||'.'||dimension.key from jsonb_each(v_skills) skill cross join lateral jsonb_each(skill.value->'dimensions') dimension where array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],dimension.value->>'level')<array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],skill.value->>'level') limit 4) priorities;
  end if;
  insert into public.assessment_cefr_profiles(attempt_id,assessment_id,student_id,overall_level,recommended_placement,confidence,skill_results,strengths,development_priorities,flags,manual_review_required,decision_rule_version,routing_rule_version,report_model_version)
  values(p_attempt_id,v_assessment.id,v_attempt.student_id,v_overall,case when v_overall is null then null else v_overall||' consolidation' end,case when v_manual then 'low' else 'moderate' end,v_skills,v_strengths,v_priorities,v_flags,v_manual,v_assessment.decision_rule_version,v_assessment.routing_rule_version,v_assessment.report_model_version)
  on conflict(attempt_id) do update set overall_level=excluded.overall_level,recommended_placement=excluded.recommended_placement,confidence=excluded.confidence,skill_results=excluded.skill_results,strengths=excluded.strengths,development_priorities=excluded.development_priorities,flags=excluded.flags,manual_review_required=excluded.manual_review_required,generated_at=now() returning id into v_profile_id;
  insert into public.student_cefr_profile_snapshots(student_id,attempt_id,profile_id,profile,source) select v_attempt.student_id,p_attempt_id,v_profile_id,jsonb_build_object('overallLevel',overall_level,'recommendedPlacement',recommended_placement,'confidence',confidence,'skills',skill_results,'strengths',strengths,'developmentPriorities',development_priorities,'flags',flags,'manualReviewRequired',manual_review_required,'decisionRuleVersion',decision_rule_version,'routingRuleVersion',routing_rule_version,'reportModelVersion',report_model_version,'provisionalStandard',true,'disclaimer','Estimativa LangSpot alinhada ao CEFR. Não constitui certificação oficial.'),'automatic' from public.assessment_cefr_profiles where id=v_profile_id;
  return v_profile_id;
end; $$;

create or replace function public.record_assessment_event(p_attempt_id uuid, p_event_type text, p_question_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_duration integer; v_clean_metadata jsonb := '{}'::jsonb;
begin
  if p_event_type not in ('question_opened', 'question_closed', 'tab_blur', 'tab_focus', 'fullscreen_exit', 'paste_detected', 'network_disconnect', 'network_reconnect', 'copy_detected', 'drop_detected', 'bulk_insert_detected', 'recording_discarded') then raise exception 'Unsupported client event'; end if;
  if jsonb_typeof(p_metadata) <> 'object' or octet_length(p_metadata::text) > 2048 then raise exception 'Invalid event metadata'; end if;
  if p_event_type in ('question_closed', 'tab_focus') then
    if jsonb_typeof(p_metadata->'durationMs') <> 'number' then raise exception 'Event duration is required'; end if;
    v_duration := least(3600000, greatest(0, (p_metadata->>'durationMs')::integer));
    v_clean_metadata := jsonb_build_object('durationMs', v_duration);
  elsif p_event_type = 'recording_discarded' then
    -- A speaking recording the student deleted to record again (at most two, so three attempts).
    if p_question_id is null or jsonb_typeof(p_metadata->'durationMs') <> 'number' then raise exception 'Discarded recording needs its question and duration'; end if;
    if (select count(*) from public.assessment_events where attempt_id = p_attempt_id and event_type = 'recording_discarded' and metadata->>'questionId' = p_question_id::text) >= 2 then
      raise exception 'Recording attempts exhausted';
    end if;
    v_clean_metadata := jsonb_build_object('durationMs', least(3600000, greatest(0, (p_metadata->>'durationMs')::integer)),
      'pausedCount', least(1000, greatest(0, coalesce((p_metadata->>'pausedCount')::integer, 0))));
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

revoke all on function private.level_check_writing_level(uuid, uuid) from public, anon, authenticated;

-- Rebuild completed Level Check profiles with the Writing rule.
select private.build_cefr_profile(profile.attempt_id)
from public.assessment_cefr_profiles profile
join public.assessments assessment on assessment.id = profile.assessment_id
where assessment.preset_id is not null;
