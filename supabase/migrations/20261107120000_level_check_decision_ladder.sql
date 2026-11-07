-- Level Check decision rule v2: a ladder over floor / target / ceiling evidence.
--
-- v1 turned every section into a level (>= 75 % -> section level, >= 50 % -> one half-band below,
-- otherwise two below) and took the median per skill. In a Level Check that made the floor sections
-- pull results down (a perfect form still scored B1, never B1+) and counted a failed ceiling as
-- evidence of the target. v2 applies to Reading, Listening and Language Use of preset-based forms:
--   target >= 75 %                         -> target, or target+ when the ceiling is also >= 60 %
--   target 50-74 %                         -> one half-band below the target (e.g. A2+ for B1)
--   target < 50 %, floor >= 75 %           -> floor
--   target < 50 %, floor 50-74 %           -> one half-band below the floor
--   otherwise                              -> two half-bands below the floor (minimum A1)
-- Productive skills, the overall median and the preset boundaries are unchanged.

create or replace function private.level_check_band_level(
  p_floor text, p_target text, p_ceiling text,
  p_floor_ratio numeric, p_target_ratio numeric, p_ceiling_ratio numeric
) returns text language plpgsql immutable set search_path = '' as $$
declare
  v_levels constant text[] := array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'];
  v_target integer := array_position(v_levels, p_target);
  v_floor integer := array_position(v_levels, coalesce(p_floor, p_target));
  v_result integer;
begin
  if v_target is null or p_target_ratio is null then return null; end if;
  if p_target_ratio >= .75 then
    v_result := case when p_ceiling is not null and coalesce(p_ceiling_ratio, 0) >= .60 then v_target + 1 else v_target end;
  elsif p_target_ratio >= .50 then
    v_result := v_target - 1;
  elsif p_floor is not null and coalesce(p_floor_ratio, 0) >= .75 then
    v_result := v_floor;
  elsif p_floor is not null and coalesce(p_floor_ratio, 0) >= .50 then
    v_result := v_floor - 1;
  else
    v_result := v_floor - 2;
  end if;
  return v_levels[greatest(1, least(11, v_result))];
end $$;

create or replace function private.level_check_objective_level(p_attempt_id uuid, p_assessment_id uuid, p_skill text)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_preset public.cefr_level_check_presets%rowtype;
  v_floor numeric; v_target numeric; v_ceiling numeric;
begin
  select preset.* into v_preset from public.assessments assessment
    join public.cefr_level_check_presets preset on preset.id = assessment.preset_id
   where assessment.id = p_assessment_id;
  if not found then return null; end if;
  select
    sum(response.score) filter (where section.cefr_level = v_preset.floor_level) / nullif(sum(response.max_score) filter (where section.cefr_level = v_preset.floor_level), 0),
    sum(response.score) filter (where section.cefr_level = v_preset.target_level) / nullif(sum(response.max_score) filter (where section.cefr_level = v_preset.target_level), 0),
    sum(response.score) filter (where section.cefr_level = v_preset.ceiling_level) / nullif(sum(response.max_score) filter (where section.cefr_level = v_preset.ceiling_level), 0)
  into v_floor, v_target, v_ceiling
  from public.assessment_responses response
  join public.assessment_questions question on question.id = response.assessment_question_id
  join public.assessment_sections section on section.id = question.section_id
  where response.attempt_id = p_attempt_id and response.max_score > 0
    and (case when section.skill in ('grammar','vocabulary','use_of_english') then 'language_use' else section.skill end) = p_skill;
  return private.level_check_band_level(v_preset.floor_level, v_preset.target_level, v_preset.ceiling_level, v_floor, v_target, v_ceiling);
end $$;

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
      left join lateral (select coalesce(sum(response.score),0)/nullif(sum(response.max_score),0) ratio,count(*) evidence_count from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id where question.section_id=section.id) score on true
      left join lateral (select percentile_cont(.5) within group(order by rubric_score.score) level_ordinal from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id join public.assessment_rubric_scores rubric_score on rubric_score.response_id=response.id where question.section_id=section.id) rubric on true
      where section.assessment_id=v_assessment.id and (case when section.skill in ('grammar','vocabulary','use_of_english') then 'language_use' when section.skill='speaking' then 'spoken_production' else section.skill end)=v_skill
    ) evidence;
    -- Level Checks (cefr-level-check-v2): objective skills follow the floor/target/ceiling ladder.
    if v_assessment.preset_id is not null and v_skill in ('reading','listening','language_use') then
      v_level := coalesce(private.level_check_objective_level(p_attempt_id, v_assessment.id, v_skill), v_level);
    end if;
    if v_skill in ('writing','spoken_production','spoken_interaction','mediation') then
      select coalesce(jsonb_object_agg(criterion_key,jsonb_build_object('level',private.cefr_level_from_ordinal(level_ordinal::numeric),'evidence','teacher rubric')),'{}'::jsonb) into v_dimensions from (select rubric_score.criterion_key,percentile_cont(.5) within group(order by rubric_score.score) level_ordinal from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=p_attempt_id join public.assessment_rubric_scores rubric_score on rubric_score.response_id=response.id where section.assessment_id=v_assessment.id and (case when section.skill='speaking' then 'spoken_production' else section.skill end)=v_skill group by rubric_score.criterion_key) rubric_dimensions;
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

-- Record the new rule on presets and on the forms generated from them.
alter table public.cefr_level_check_presets alter column decision_rule_version set default 'cefr-level-check-v2';
update public.cefr_level_check_presets set decision_rule_version = 'cefr-level-check-v2' where decision_rule_version = 'cefr-level-check-v1';
update public.assessments set decision_rule_version = 'cefr-level-check-v2' where preset_id is not null and decision_rule_version = 'cefr-level-check-v1';

revoke all on function private.level_check_band_level(text,text,text,numeric,numeric,numeric) from public, anon, authenticated;
revoke all on function private.level_check_objective_level(uuid,uuid,text) from public, anon, authenticated;
revoke all on function private.build_cefr_profile(uuid) from public, anon, authenticated;
