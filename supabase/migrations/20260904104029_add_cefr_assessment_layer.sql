-- CEFR is an additive specialization of the generic assessment engine.
-- All initial cut scores remain a PROVISIONAL INTERNAL STANDARD.

alter table public.assessments
  add column framework text not null default 'none' check (framework in ('none','cefr')),
  add column form_version text not null default 'GENERIC-1.0',
  add column decision_rule_version text not null default 'objective-v1',
  add column routing_rule_version text not null default 'none',
  add column report_model_version text not null default 'standard-report-v1';

alter table public.assessments drop constraint assessments_level_min_check, drop constraint assessments_level_max_check, drop constraint assessments_level_range;
alter table public.assessments
  add constraint assessments_level_min_check check (level_min is null or level_min in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  add constraint assessments_level_max_check check (level_max is null or level_max in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  add constraint assessments_level_range check (level_min is null or level_max is null or array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],level_min)<=array_position(array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'],level_max));

alter table public.assessment_questions drop constraint assessment_questions_cefr_snapshot_check;
alter table public.assessment_questions add constraint assessment_questions_cefr_snapshot_check check (cefr_snapshot is null or cefr_snapshot in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'));
alter table public.assessment_attempts drop constraint assessment_attempts_estimated_cefr_check;
alter table public.assessment_attempts add constraint assessment_attempts_estimated_cefr_check check (estimated_cefr is null or estimated_cefr in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'));

alter table public.assessment_sections
  drop constraint assessment_sections_skill_check,
  add constraint assessment_sections_skill_check check (skill in ('grammar','vocabulary','reading','listening','writing','speaking','spoken_production','spoken_interaction','mediation','language_use','use_of_english')),
  add column cefr_level text check (cefr_level is null or cefr_level in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  add column construct text not null default '',
  add column tasklet_kind text check (tasklet_kind is null or tasklet_kind in ('screening','primary','confirmation','floor','ceiling')),
  add column confirmation_for_section_id uuid references public.assessment_sections(id) on delete set null;

alter table public.assessment_adaptive_state
  drop constraint assessment_adaptive_state_skill_check,
  drop constraint assessment_adaptive_state_estimated_cefr_check,
  add constraint assessment_adaptive_state_skill_check check (skill in ('grammar','vocabulary','reading','listening','writing','speaking','spoken_production','spoken_interaction','mediation','language_use','use_of_english')),
  add constraint assessment_adaptive_state_estimated_cefr_check check (estimated_cefr in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'));

alter table public.question_bank
  add column if not exists level text not null default 'A1',
  add column if not exists category text not null default 'Grammar',
  add column if not exists question_type text not null default 'multiple_choice',
  add column if not exists prompt text not null default '',
  add column if not exists options text[] not null default '{}',
  add column if not exists answer text not null default '',
  add column if not exists explanation text,
  add column if not exists created_at timestamptz not null default now(),
  drop constraint if exists question_bank_level_check,
  drop constraint if exists question_bank_category_check,
  drop constraint if exists question_bank_question_type_check,
  add constraint question_bank_level_check check (level in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  add constraint question_bank_category_check check (category in ('Grammar','Vocabulary','Reading','Listening','Writing','Speaking','Mediation','Language Use')),
  add constraint question_bank_question_type_check check (question_type in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening','writing','speaking','mediation')),
  add column skill text check (skill is null or skill in ('reading','listening','writing','spoken_production','spoken_interaction','mediation','language_use')),
  add column subskill text,
  add column difficulty smallint check (difficulty is null or difficulty between 1 and 10),
  add column task_type text,
  add column topic text,
  add column genre text,
  add column input_length integer check (input_length is null or input_length >= 0),
  add column estimated_time_seconds integer check (estimated_time_seconds is null or estimated_time_seconds > 0),
  add column cognitive_processes text[] not null default '{}',
  add column audience text not null default 'general' check (audience in ('child','teen','adult','general')),
  add column operational_descriptor text,
  add column quality_status text not null default 'draft' check (quality_status in ('draft','reviewed','approved','pilot','needs_revision','retired')),
  add column is_pilot boolean not null default false,
  add column restricted boolean not null default false,
  add column usage_count integer not null default 0 check (usage_count >= 0),
  add column last_used_at timestamptz,
  add column exposure_rate numeric(6,5) check (exposure_rate is null or exposure_rate between 0 and 1);

create index question_bank_cefr_filter_idx on public.question_bank (teacher_id, skill, level, quality_status, difficulty);
create index question_bank_exposure_idx on public.question_bank (teacher_id, restricted, usage_count, last_used_at);

create table public.cefr_descriptors (
  id text primary key,
  level text not null check (level in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  skill text not null check (skill in ('reading','listening','writing','spoken_production','spoken_interaction','mediation','language_use')),
  descriptor text not null,
  operational_descriptor text not null,
  descriptor_category text not null,
  source text not null default 'CEFR Companion Volume 2020',
  version text not null default '2020',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.question_cefr_descriptors (
  question_id uuid not null references public.question_bank(id) on delete cascade,
  descriptor_id text not null references public.cefr_descriptors(id) on delete restrict,
  primary key (question_id, descriptor_id)
);

create table public.assessment_cefr_profiles (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.assessment_attempts(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  overall_level text check (overall_level is null or overall_level in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2')),
  recommended_placement text,
  confidence text not null check (confidence in ('low','moderate','high')),
  skill_results jsonb not null default '{}' check (jsonb_typeof(skill_results) = 'object'),
  strengths jsonb not null default '[]' check (jsonb_typeof(strengths) = 'array'),
  development_priorities jsonb not null default '[]' check (jsonb_typeof(development_priorities) = 'array'),
  flags jsonb not null default '[]' check (jsonb_typeof(flags) = 'array'),
  manual_review_required boolean not null default false,
  decision_rule_version text not null,
  routing_rule_version text not null,
  report_model_version text not null,
  provisional_standard boolean not null default true check (provisional_standard),
  generated_at timestamptz not null default now()
);

create table public.assessment_cefr_overrides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.assessment_cefr_profiles(id) on delete cascade,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  field_path text not null,
  previous_value jsonb,
  new_value jsonb not null,
  reason text not null check (char_length(trim(reason)) >= 10),
  created_at timestamptz not null default now()
);

create table public.student_cefr_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  profile_id uuid not null references public.assessment_cefr_profiles(id) on delete cascade,
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  source text not null check (source in ('automatic','teacher_override')),
  created_at timestamptz not null default now()
);

create table public.assessment_cefr_adaptive_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  skill text not null,
  session_state text not null check (session_state in ('created','screening','routing','confirming','productive_assessment','completed','manual_review','finalized')),
  previous_level text,
  tasklet_id uuid references public.assessment_sections(id) on delete set null,
  score integer,
  item_count integer,
  decision text not null,
  next_level text,
  rule_version text not null,
  created_at timestamptz not null default now()
);

create index assessment_cefr_profiles_student_idx on public.assessment_cefr_profiles (student_id, generated_at desc);
create index student_cefr_snapshots_history_idx on public.student_cefr_profile_snapshots (student_id, created_at desc);
create index assessment_cefr_adaptive_events_attempt_idx on public.assessment_cefr_adaptive_events (attempt_id, created_at);

create or replace function private.log_cefr_adaptive_transition()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_framework text;
begin
  select assessment.framework into v_framework from public.assessment_attempts attempt join public.assessments assessment on assessment.id=attempt.assessment_id where attempt.id=new.attempt_id;
  if v_framework='cefr' and (new.items_answered<>old.items_answered or new.estimated_cefr<>old.estimated_cefr or new.stopped<>old.stopped) then
    insert into public.assessment_cefr_adaptive_events(attempt_id,skill,session_state,previous_level,tasklet_id,score,item_count,decision,next_level,rule_version)
    values(new.attempt_id,new.skill,case when new.stopped then 'completed' when new.estimated_cefr=old.estimated_cefr then 'confirming' else 'routing' end,old.estimated_cefr,new.section_id,new.correct_count-old.correct_count,new.items_answered-old.items_answered,case when new.stopped then 'complete' when new.estimated_cefr=old.estimated_cefr then 'confirm' when array_position(array['A1','A2','B1','B2','C1','C2'],new.estimated_cefr)>array_position(array['A1','A2','B1','B2','C1','C2'],old.estimated_cefr) then 'move_up' else 'move_down' end,new.estimated_cefr,'cefr-routing-v1');
  end if;
  return new;
end; $$;
create trigger log_cefr_adaptive_transition after update on public.assessment_adaptive_state for each row execute function private.log_cefr_adaptive_transition();

alter table public.cefr_descriptors enable row level security;
alter table public.question_cefr_descriptors enable row level security;
alter table public.assessment_cefr_profiles enable row level security;
alter table public.assessment_cefr_overrides enable row level security;
alter table public.student_cefr_profile_snapshots enable row level security;
alter table public.assessment_cefr_adaptive_events enable row level security;
revoke all on table public.cefr_descriptors, public.question_cefr_descriptors, public.assessment_cefr_profiles, public.assessment_cefr_overrides, public.student_cefr_profile_snapshots, public.assessment_cefr_adaptive_events from anon, authenticated;
grant select on table public.cefr_descriptors to authenticated;
grant all on table public.cefr_descriptors, public.question_cefr_descriptors, public.assessment_cefr_profiles, public.assessment_cefr_overrides, public.student_cefr_profile_snapshots, public.assessment_cefr_adaptive_events to service_role;

create policy cefr_descriptors_read on public.cefr_descriptors for select to authenticated using (is_active);
create policy question_cefr_descriptors_teacher_read on public.question_cefr_descriptors for select to authenticated using (exists (select 1 from public.question_bank question where question.id=question_id and question.teacher_id=(select auth.uid())));
create policy cefr_profiles_participant_read on public.assessment_cefr_profiles for select to authenticated using (student_id=(select auth.uid()) or exists (select 1 from public.assessments assessment where assessment.id=assessment_id and assessment.teacher_id=(select auth.uid())));
create policy cefr_overrides_participant_read on public.assessment_cefr_overrides for select to authenticated using (exists (select 1 from public.assessment_cefr_profiles profile join public.assessments assessment on assessment.id=profile.assessment_id where profile.id=profile_id and (profile.student_id=(select auth.uid()) or assessment.teacher_id=(select auth.uid()))));
create policy cefr_snapshots_participant_read on public.student_cefr_profile_snapshots for select to authenticated using (student_id=(select auth.uid()) or exists (select 1 from public.assessment_attempts attempt join public.assessments assessment on assessment.id=attempt.assessment_id where attempt.id=attempt_id and assessment.teacher_id=(select auth.uid())));

create or replace function public.save_assessment_cefr_metadata(p_assessment_id uuid, p_metadata jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_section jsonb; v_position bigint;
begin
  update public.assessments set
    framework=coalesce(p_metadata->>'framework','none'),
    form_version=coalesce(nullif(trim(p_metadata->>'formVersion'),''),case when p_metadata->>'framework'='cefr' then 'CEFR-PLACEMENT-FIXED-1.0' else 'GENERIC-1.0' end),
    decision_rule_version=coalesce(nullif(trim(p_metadata->>'decisionRuleVersion'),''),case when p_metadata->>'framework'='cefr' then 'cefr-decision-v1' else 'objective-v1' end),
    routing_rule_version=coalesce(nullif(trim(p_metadata->>'routingRuleVersion'),''),case when p_metadata->>'framework'='cefr' then 'cefr-routing-v1' else 'none' end),
    report_model_version=coalesce(nullif(trim(p_metadata->>'reportModelVersion'),''),case when p_metadata->>'framework'='cefr' then 'cefr-profile-v1' else 'standard-report-v1' end)
  where id=p_assessment_id and teacher_id=(select auth.uid()) and status='draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  for v_section, v_position in select value, ordinality-1 from jsonb_array_elements(coalesce(p_metadata->'sections','[]'::jsonb)) with ordinality loop
    update public.assessment_sections set cefr_level=nullif(v_section->>'cefrLevel',''), construct=coalesce(v_section->>'construct',''), tasklet_kind=nullif(v_section->>'taskletKind','')
    where assessment_id=p_assessment_id and position=v_position;
  end loop;
end; $$;

create or replace function public.get_assessment_cefr_metadata(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_assessment public.assessments%rowtype;
begin
  select * into v_assessment from public.assessments where id=p_assessment_id and teacher_id=(select auth.uid());
  if not found then raise exception 'Assessment not found'; end if;
  return jsonb_build_object('framework',v_assessment.framework,'formVersion',v_assessment.form_version,'decisionRuleVersion',v_assessment.decision_rule_version,'routingRuleVersion',v_assessment.routing_rule_version,'reportModelVersion',v_assessment.report_model_version,
    'sections',coalesce((select jsonb_agg(jsonb_build_object('cefrLevel',cefr_level,'construct',construct,'taskletKind',tasklet_kind,'confirmationForSectionId',confirmation_for_section_id) order by position) from public.assessment_sections where assessment_id=p_assessment_id),'[]'::jsonb));
end; $$;

create or replace function private.validate_cefr_assessment_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status='published' and old.status='draft' and new.framework='cefr' then
    if new.type not in ('placement','diagnostic','progress') then raise exception 'CEFR assessments must be placement, diagnostic or progress'; end if;
    if new.decision_rule_version='' or new.report_model_version='' then raise exception 'CEFR rule versions are required'; end if;
    if exists (select 1 from public.assessment_sections section where section.assessment_id=new.id and (section.cefr_level is null or nullif(trim(section.construct),'') is null)) then raise exception 'Every CEFR tasklet requires level and construct'; end if;
    if exists (select 1 from public.assessment_questions question where question.assessment_id=new.id and (question.question_snapshot->>'skill' is null or question.question_snapshot->>'subskill' is null or question.question_snapshot->>'taskType' is null or question.question_snapshot->>'cefr' is null)) then raise exception 'Every CEFR item requires skill, subskill, task type and level'; end if;
    if new.type='placement' and exists (select 1 from public.assessment_questions question where question.assessment_id=new.id and coalesce(question.question_snapshot->>'qualityStatus','draft') <> 'approved') then raise exception 'CEFR placement accepts approved items only'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='reading') < 24 then raise exception 'Adaptive CEFR requires at least 4 approved Reading tasklets per level'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='listening') < 24 then raise exception 'Adaptive CEFR requires at least 4 approved Listening tasklets per level'; end if;
    if new.assessment_mode='adaptive' and (select count(*) from public.question_bank where teacher_id=new.teacher_id and quality_status='approved' and skill='language_use') < 120 then raise exception 'Adaptive CEFR requires at least 20 approved Language Use items per level'; end if;
  end if;
  return new;
end; $$;
create trigger validate_cefr_assessment_publish before update of status on public.assessments for each row execute function private.validate_cefr_assessment_publish();

create or replace function private.cefr_level_from_ordinal(p_value numeric)
returns text language sql immutable security invoker set search_path='' as $$
  select (array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'])[greatest(1,least(11,round(p_value)::integer))];
$$;

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

create or replace function private.create_cefr_profile_on_completion()
returns trigger language plpgsql security definer set search_path='' as $$ begin if new.status='completed' and old.status is distinct from 'completed' then perform private.build_cefr_profile(new.id); end if; return new; end; $$;
create trigger create_cefr_profile_on_completion after update of status on public.assessment_attempts for each row execute function private.create_cefr_profile_on_completion();

create or replace function public.get_attempt_cefr_profile(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare v_profile public.assessment_cefr_profiles%rowtype; v_teacher uuid; v_override jsonb; v_visibility text; v_reviewed_at timestamptz; v_status text; v_actor uuid := (select auth.uid());
begin
  select profile.* into v_profile from public.assessment_cefr_profiles profile where profile.attempt_id=p_attempt_id;
  if not found then return null; end if;
  select teacher_id,show_results into v_teacher,v_visibility from public.assessments where id=v_profile.assessment_id;
  if v_actor not in (v_profile.student_id,v_teacher) then raise exception 'CEFR profile not found'; end if;
  if v_actor=v_profile.student_id then
    select status,reviewed_at into v_status,v_reviewed_at from public.assessment_attempts where id=p_attempt_id;
    if v_status<>'completed' or v_visibility='none' or (v_visibility='after_teacher_review' and v_reviewed_at is null) then return null; end if;
  end if;
  select jsonb_object_agg(field_path,new_value) into v_override from (select distinct on(field_path) field_path,new_value from public.assessment_cefr_overrides where profile_id=v_profile.id order by field_path,created_at desc) latest;
  return jsonb_build_object('overallLevel',coalesce(v_override->>'overallLevel',v_profile.overall_level),'recommendedPlacement',v_profile.recommended_placement,'confidence',v_profile.confidence,'skills',v_profile.skill_results,'strengths',v_profile.strengths,'developmentPriorities',v_profile.development_priorities,'flags',v_profile.flags,'manualReviewRequired',v_profile.manual_review_required,'decisionRuleVersion',v_profile.decision_rule_version,'routingRuleVersion',v_profile.routing_rule_version,'reportModelVersion',v_profile.report_model_version,'provisionalStandard',true,'disclaimer','Estimativa LangSpot alinhada ao CEFR. Não constitui certificação oficial.');
end; $$;

create or replace function public.override_assessment_cefr_level(p_attempt_id uuid,p_level text,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
declare v_profile public.assessment_cefr_profiles%rowtype;
begin
  if p_level not in ('A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2') then raise exception 'Invalid CEFR level'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 10 then raise exception 'Override reason must contain at least 10 characters'; end if;
  select profile.* into v_profile from public.assessment_cefr_profiles profile join public.assessments assessment on assessment.id=profile.assessment_id where profile.attempt_id=p_attempt_id and assessment.teacher_id=(select auth.uid());
  if not found then raise exception 'CEFR profile not found'; end if;
  insert into public.assessment_cefr_overrides(profile_id,changed_by,field_path,previous_value,new_value,reason) values(v_profile.id,(select auth.uid()),'overallLevel',to_jsonb(v_profile.overall_level),to_jsonb(p_level),trim(p_reason));
  insert into public.student_cefr_profile_snapshots(student_id,attempt_id,profile_id,profile,source) values(v_profile.student_id,p_attempt_id,v_profile.id,(select public.get_attempt_cefr_profile(p_attempt_id)),'teacher_override');
end; $$;

create or replace function public.get_cefr_item_analytics(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
begin
  if not exists(select 1 from public.assessments where id=p_assessment_id and teacher_id=(select auth.uid())) then raise exception 'Assessment not found'; end if;
  return jsonb_build_object('calibrationStatus','insufficient_data','minimumCalibrationResponses',100,
    'items',coalesce((select jsonb_agg(jsonb_build_object('questionId',question.id,'prompt',question.question_snapshot->>'prompt','skill',question.question_snapshot->>'skill','cefr',question.cefr_snapshot,'responses',stats.responses,'facility',stats.facility,'averageTimeMs',stats.average_time,'discrimination',case when stats.responses>=100 then stats.discrimination end,'reliabilityStatus',case when stats.responses>=100 then 'exploratory' else 'insufficient_data' end)) from public.assessment_questions question join lateral (select count(*) responses,round(avg(case when response.score=response.max_score then 1 else 0 end)::numeric,3) facility,round(avg(response.time_spent_ms)) average_time,corr(response.score,attempt.scaled_score) discrimination from public.assessment_responses response join public.assessment_attempts attempt on attempt.id=response.attempt_id where response.assessment_question_id=question.id and attempt.status='completed') stats on true where question.assessment_id=p_assessment_id),'[]'::jsonb));
end; $$;

revoke all on function public.save_assessment_cefr_metadata(uuid,jsonb), public.get_assessment_cefr_metadata(uuid), public.get_attempt_cefr_profile(uuid), public.override_assessment_cefr_level(uuid,text,text), public.get_cefr_item_analytics(uuid) from public,anon;
grant execute on function public.save_assessment_cefr_metadata(uuid,jsonb), public.get_assessment_cefr_metadata(uuid), public.get_attempt_cefr_profile(uuid), public.override_assessment_cefr_level(uuid,text,text), public.get_cefr_item_analytics(uuid) to authenticated;
revoke all on function private.validate_cefr_assessment_publish(), private.cefr_level_from_ordinal(numeric), private.build_cefr_profile(uuid), private.create_cefr_profile_on_completion(), private.log_cefr_adaptive_transition() from public,anon,authenticated;

drop function public.list_student_assessments();
create function public.list_student_assessments()
returns table("assignmentId" uuid,"assessmentId" uuid,title text,description text,"availableFrom" timestamptz,"dueAt" timestamptz,"attemptLimit" integer,status text,"activeAttemptId" uuid,"latestAttemptId" uuid,framework text,"requiresAudio" boolean,"requiresMicrophone" boolean)
language sql security definer set search_path='' stable as $$
  select assignment.id,assessment.id,assessment.title,assessment.description,assignment.available_from,assignment.due_at,assignment.attempt_limit,assignment.status,
    (select attempt.id from public.assessment_attempts attempt where attempt.assessment_assignment_id=assignment.id and attempt.student_id=(select auth.uid()) and attempt.status='in_progress' order by attempt.started_at desc limit 1),
    (select attempt.id from public.assessment_attempts attempt where attempt.assessment_assignment_id=assignment.id and attempt.student_id=(select auth.uid()) order by attempt.started_at desc limit 1),assessment.framework,
    exists(select 1 from public.assessment_questions question where question.assessment_id=assessment.id and question.question_snapshot->>'type' in ('listening','speaking')),
    exists(select 1 from public.assessment_questions question where question.assessment_id=assessment.id and question.question_snapshot->>'type'='speaking')
  from public.assessment_assignments assignment join public.assessments assessment on assessment.id=assignment.assessment_id where assignment.student_id=(select auth.uid()) and assessment.status='published' order by assignment.due_at nulls last,assignment.created_at desc;
$$;
revoke all on function public.list_student_assessments() from public,anon;
grant execute on function public.list_student_assessments() to authenticated;

create or replace function private.assessment_answer_is_correct(p_type text,p_actual text,p_expected text)
returns boolean language sql immutable security invoker set search_path=pg_catalog,private as $$
  select case
    when p_type='ordering' then private.normalize_assessment_answer(replace(replace(replace(coalesce(p_actual,''),chr(31),' '),'/',' '),',',' '))=private.normalize_assessment_answer(replace(replace(replace(coalesce(p_expected,''),chr(31),' '),'/',' '),',',' '))
    when p_type in ('multiple_response','matching') then
      (select string_agg(private.normalize_assessment_answer(value),'|' order by private.normalize_assessment_answer(value)) from regexp_split_to_table(coalesce(p_actual,''),chr(31)) value)
      = (select string_agg(private.normalize_assessment_answer(value),'|' order by private.normalize_assessment_answer(value)) from regexp_split_to_table(coalesce(p_expected,''),chr(31)) value)
    else private.normalize_assessment_answer(p_actual)=private.normalize_assessment_answer(p_expected) end;
$$;
revoke all on function private.assessment_answer_is_correct(text,text,text) from public,anon,authenticated;

create or replace function public.publish_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_teacher_id uuid := (select auth.uid()); v_assessment public.assessments%rowtype;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  select * into v_assessment from public.assessments where id=p_assessment_id and teacher_id=v_teacher_id and status='draft';
  if not found then raise exception 'Assessment draft not found'; end if;
  if not exists(select 1 from public.assessment_sections where assessment_id=p_assessment_id) or exists(select 1 from public.assessment_sections section where section.assessment_id=p_assessment_id and not exists(select 1 from public.assessment_questions question where question.section_id=section.id)) then raise exception 'Every assessment section must contain questions'; end if;
  if exists(select 1 from public.assessment_questions where assessment_id=p_assessment_id and (nullif(trim(question_snapshot->>'prompt'),'') is null or question_snapshot->>'type' not in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening','writing','speaking','mediation') or (question_snapshot->>'type' not in ('writing','speaking','mediation') and nullif(trim(question_snapshot->>'answer'),'') is null) or (question_snapshot->>'type'='listening' and (nullif(question_snapshot->>'audioPath','') is null or coalesce((question_snapshot->>'maxPlays')::integer,0)<1)) or (question_snapshot->>'type' in ('writing','speaking','mediation') and jsonb_array_length(coalesce(question_snapshot->'rubric','[]'::jsonb))=0) or (question_snapshot->>'type'='mediation' and nullif(trim(question_snapshot->>'sourceMaterial'),'') is null))) then raise exception 'Assessment contains invalid questions'; end if;
  if exists(select 1 from public.assessment_sections section where section.assessment_id=p_assessment_id and section.draw_count is not null and section.draw_count>(select count(*) from public.assessment_questions question where question.section_id=section.id)) then raise exception 'Pool draw count exceeds available questions'; end if;
  if v_assessment.assessment_mode='adaptive' and exists(select 1 from public.assessment_sections section where section.assessment_id=p_assessment_id and ((select count(*) from public.assessment_questions question where question.section_id=section.id)<v_assessment.adaptive_min_items or exists(select 1 from public.assessment_questions question where question.section_id=section.id and (question.difficulty_snapshot is null or question.cefr_snapshot is null)))) then raise exception 'Adaptive sections require enough calibrated questions'; end if;
  if v_assessment.assessment_mode='adaptive' and exists(select 1 from public.assessment_questions where assessment_id=p_assessment_id and question_snapshot->>'type' in ('writing','speaking','mediation')) then raise exception 'Productive tasks must follow the adaptive objective routing in a fixed PROFILE form'; end if;
  update public.assessments set status='published',published_at=now() where id=p_assessment_id;
end; $$;

create or replace function public.load_assessment_attempt(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare v_attempt public.assessment_attempts%rowtype; v_assessment public.assessments%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid());
  if not found then raise exception 'Assessment attempt not found'; end if; select * into v_assessment from public.assessments where id=v_attempt.assessment_id;
  return jsonb_build_object('attempt',jsonb_build_object('id',v_attempt.id,'assignmentId',v_attempt.assessment_assignment_id,'status',v_attempt.status,'startedAt',v_attempt.started_at,'expiresAt',v_attempt.expires_at,'currentQuestionId',v_attempt.current_question_id),
    'assessment',jsonb_build_object('id',v_assessment.id,'title',v_assessment.title,'description',v_assessment.description,'navigationMode',v_assessment.navigation_mode,'assessmentMode',v_assessment.assessment_mode,'framework',v_assessment.framework,'adaptiveComplete',v_assessment.assessment_mode='adaptive' and v_attempt.current_question_id is null),
    'sections',coalesce((select jsonb_agg(jsonb_build_object('id',section.id,'title',section.title,'instructions',section.instructions,'position',section.position) order by section.position) from public.assessment_sections section where section.assessment_id=v_assessment.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',question.id,'sectionId',question.section_id,'type',question.question_snapshot->>'type','prompt',question.question_snapshot->>'prompt','options',delivered.presented_options,'required',question.required,'sourceMaterial',question.question_snapshot->>'sourceMaterial','audioPath',question.question_snapshot->>'audioPath','maxPlays',(question.question_snapshot->>'maxPlays')::integer,'autoplay',(question.question_snapshot->>'autoplay')::boolean,'transcript',case when question.question_snapshot->>'transcriptVisibility'='always' then question.question_snapshot->>'transcript' end,'preparationSeconds',(question.question_snapshot->>'preparationSeconds')::integer,'recordingSeconds',(question.question_snapshot->>'recordingSeconds')::integer,'allowReview',(question.question_snapshot->>'allowReview')::boolean)) order by delivered.position) from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=v_attempt.id),'[]'::jsonb),
    'answers',coalesce((select jsonb_object_agg(response.assessment_question_id::text,response.answer_payload->>'value') from public.assessment_responses response where response.attempt_id=v_attempt.id),'{}'::jsonb));
end; $$;

create or replace function public.save_assessment_response(p_attempt_id uuid,p_question_id uuid,p_answer_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_type text;
begin
  if jsonb_typeof(p_answer_payload)<>'object' or jsonb_typeof(p_answer_payload->'value')<>'string' or octet_length(p_answer_payload->>'value')>200000 then raise exception 'Invalid answer payload'; end if;
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid()) and attempt.status='in_progress' for update of attempt;
  if not found then raise exception 'Active assessment attempt not found'; end if; select due_at into v_due_at from public.assessment_assignments where id=v_attempt.assessment_assignment_id for key share;
  if (v_attempt.expires_at is not null and v_attempt.expires_at<=now()) or (v_due_at is not null and v_due_at<=now()) then raise exception 'Assessment time has expired'; end if;
  select question.question_snapshot->>'type' into v_type from public.assessment_attempt_questions delivered join public.assessment_questions question on question.id=delivered.assessment_question_id where delivered.attempt_id=p_attempt_id and question.id=p_question_id;
  if v_type is null then raise exception 'Question does not belong to this attempt'; end if; if v_type in ('writing','mediation') and char_length(p_answer_payload->>'value')>50000 then raise exception 'Productive response is too long'; end if;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload,answered_at) values(v_attempt.id,v_attempt.assessment_id,p_question_id,p_answer_payload,now()) on conflict(attempt_id,assessment_question_id) do update set answer_payload=excluded.answer_payload,answered_at=excluded.answered_at;
  update public.assessment_attempts set current_question_id=p_question_id,current_section_id=(select section_id from public.assessment_questions where id=p_question_id) where id=v_attempt.id;
  insert into public.assessment_events(attempt_id,event_type,metadata) values(v_attempt.id,'answer_saved',jsonb_build_object('question_id',p_question_id));
end; $$;

create or replace function public.submit_assessment_attempt(p_attempt_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_attempt public.assessment_attempts%rowtype; v_due_at timestamptz; v_has_manual boolean; v_raw_score numeric; v_scaled_score numeric; v_cefr text;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id where attempt.id=p_attempt_id and assignment.student_id=(select auth.uid()) for update of attempt;
  if not found then raise exception 'Assessment attempt not found'; end if; if v_attempt.status in ('submitted','grading','completed') then return; end if; if v_attempt.status<>'in_progress' then raise exception 'Assessment attempt is not active'; end if;
  select due_at into v_due_at from public.assessment_assignments where id=v_attempt.assessment_assignment_id; if (v_attempt.expires_at is not null and v_attempt.expires_at<=now()) or (v_due_at is not null and v_due_at<=now()) then update public.assessment_attempts set status='expired' where id=v_attempt.id; update public.assessment_assignments set status='expired' where id=v_attempt.assessment_assignment_id; return; end if;
  insert into public.assessment_responses(attempt_id,assessment_id,assessment_question_id,answer_payload) select v_attempt.id,v_attempt.assessment_id,assessment_question_id,'{}'::jsonb from public.assessment_attempt_questions where attempt_id=v_attempt.id on conflict do nothing;
  update public.assessment_responses response set max_score=question.weight,score=case when question.question_snapshot->>'type' in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening') then case when private.assessment_answer_is_correct(case when question.question_snapshot->>'type'='listening' then 'multiple_choice' else question.question_snapshot->>'type' end,response.answer_payload->>'value',question.question_snapshot->>'answer') then question.weight else 0 end else null end,grading_status=case when question.question_snapshot->>'type' in ('multiple_choice','multiple_response','fill_blank','short_answer','true_false','matching','ordering','listening') then 'auto_graded' else 'manual_review' end from public.assessment_questions question join public.assessment_attempt_questions delivered on delivered.assessment_question_id=question.id and delivered.attempt_id=v_attempt.id where response.attempt_id=v_attempt.id and response.assessment_question_id=question.id;
  select exists(select 1 from public.assessment_responses where attempt_id=v_attempt.id and grading_status='manual_review') into v_has_manual; select coalesce(sum(score),0) into v_raw_score from public.assessment_responses where attempt_id=v_attempt.id;
  select round(100*sum(section_score*section_weight)/nullif(sum(section_weight),0),2) into v_scaled_score from (select section.id,section.weight section_weight,coalesce(sum(response.score),0)/nullif(sum(response.max_score),0) section_score from public.assessment_sections section join public.assessment_questions question on question.section_id=section.id join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=v_attempt.id where section.assessment_id=v_attempt.assessment_id group by section.id,section.weight) scores;
  select private.ability_to_cefr((percentile_cont(.5) within group(order by ability))::numeric) into v_cefr from public.assessment_adaptive_state where attempt_id=v_attempt.id and items_answered>0;
  update public.assessment_attempts set status=case when v_has_manual then 'grading' else 'completed' end,submitted_at=now(),raw_score=v_raw_score,scaled_score=coalesce(v_scaled_score,0),estimated_cefr=v_cefr where id=v_attempt.id;
  update public.assessment_assignments set status=case when v_has_manual then 'grading' else 'completed' end where id=v_attempt.assessment_assignment_id; insert into public.assessment_events(attempt_id,event_type) values(v_attempt.id,'submitted');
end; $$;
