-- Fixes found while grading a Level Check whose Spoken Production recording was never saved.
--
-- * private.build_cefr_profile: a productive part with no answer and no rubric rating no longer
--   produces a level. Before, it fell through to the objective percentage rule and became
--   "task level minus two" (an unsent B1 recording counted as A2 Spoken Production).
-- * private.ability_to_cefr(null) returned C2, so every fixed-form attempt (no adaptive state)
--   was stored with estimated_cefr = C2 on submission. It now returns null, and stored values
--   from attempts without adaptive state are cleared.
-- * public.exclude_assessment_response: the teacher marks a productive response with no answer
--   (e.g. a lost recording) as excluded, so it does not block finalising nor count as zero.
-- build_cefr_profile is otherwise identical to 20261107120000.

create or replace function private.ability_to_cefr(p_ability numeric)
returns text language sql immutable security invoker set search_path = pg_catalog as $$
  select case when p_ability is null then null when p_ability < 2 then 'A1' when p_ability < 3.5 then 'A2'
    when p_ability < 5.25 then 'B1' when p_ability < 7 then 'B2'
    when p_ability < 8.75 then 'C1' else 'C2' end;
$$;

update public.assessment_attempts attempt set estimated_cefr = null
where attempt.estimated_cefr is not null
  and not exists (select 1 from public.assessment_adaptive_state state where state.attempt_id = attempt.id and state.items_answered > 0);

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

create or replace function public.exclude_assessment_response(p_response_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_response public.assessment_responses%rowtype; v_type text;
begin
  select response.* into v_response from public.assessment_responses response
  join public.assessment_attempts attempt on attempt.id = response.attempt_id
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where response.id = p_response_id and assignment.teacher_id = (select auth.uid()) for update of response;
  if not found then raise exception 'Assessment response not found'; end if;
  select question_snapshot->>'type' into v_type from public.assessment_questions where id = v_response.assessment_question_id;
  if v_type not in ('writing', 'speaking', 'mediation') then raise exception 'Only productive tasks can be excluded'; end if;
  if nullif(v_response.answer_payload->>'value', '') is not null then raise exception 'Only responses without an answer can be excluded'; end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null then raise exception 'A reason is required'; end if;
  delete from public.assessment_rubric_scores where response_id = p_response_id;
  update public.assessment_responses
  set score = 0, max_score = 0, grading_status = 'reviewed', teacher_feedback = left(trim(p_reason), 2000),
      answer_payload = answer_payload || jsonb_build_object('excluded', true, 'excludedReason', left(trim(p_reason), 2000), 'excludedAt', now())
  where id = p_response_id;
end; $$;

revoke all on function private.ability_to_cefr(numeric) from public, anon, authenticated;
revoke all on function public.exclude_assessment_response(uuid, text) from public, anon;
grant execute on function public.exclude_assessment_response(uuid, text) to authenticated;
