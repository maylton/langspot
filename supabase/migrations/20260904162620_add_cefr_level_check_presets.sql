-- Deterministic, teacher-owned A2-B1 placement form built from the shared
-- CEFR Placement Pilot Bank v0.2. The form intentionally remains a draft
-- until the four selected Listening tasklets receive audio files.

create table public.cefr_level_check_presets (
  id text primary key check (id ~ '^cefr-(a1|a2|b1|b2|c1|c2)-level-check$'),
  name text not null,
  purpose text not null,
  target_level text not null check (target_level in ('A1','A2','B1','B2','C1','C2')),
  floor_level text check (floor_level is null or floor_level in ('A1','A2','B1','B2','C1')),
  ceiling_level text check (ceiling_level is null or ceiling_level in ('A2','B1','B2','C1','C2')),
  form_version text not null unique,
  preset_version text not null default '1.0',
  decision_rule_version text not null default 'cefr-level-check-v1',
  report_model_version text not null default 'cefr-profile-v1',
  objective_distribution jsonb not null check (jsonb_typeof(objective_distribution) = 'object'),
  estimated_duration_min_minutes integer not null check (estimated_duration_min_minutes > 0),
  estimated_duration_max_minutes integer not null check (estimated_duration_max_minutes >= estimated_duration_min_minutes),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.cefr_level_check_presets (
  id,name,purpose,target_level,floor_level,ceiling_level,form_version,objective_distribution,
  estimated_duration_min_minutes,estimated_duration_max_minutes
) values
  ('cefr-a1-level-check','A1 Level Check','Verifica a consolidação de A1 com uma sondagem de A2.','A1',null,'A2','CEFR-A1-CHECK-1.0','{"reading":{"A1":8,"A2":4},"listening":{"A1":8,"A2":4},"language_use":{"A1":10,"A2":5}}',75,95),
  ('cefr-a2-level-check','A2 Level Check','Verifica a consolidação de A2 entre A1 e B1.','A2','A1','B1','CEFR-A2-CHECK-1.0','{"reading":{"A1":4,"A2":8,"B1":4},"listening":{"A1":4,"A2":8,"B1":4},"language_use":{"A1":5,"A2":10,"B1":5}}',100,125),
  ('cefr-b1-level-check','B1 Level Check','Verifica a consolidação de B1 entre A2 e B2.','B1','A2','B2','CEFR-B1-CHECK-1.0','{"reading":{"A2":4,"B1":8,"B2":4},"listening":{"A2":4,"B1":8,"B2":4},"language_use":{"A2":5,"B1":10,"B2":5}}',100,125),
  ('cefr-b2-level-check','B2 Level Check','Verifica a consolidação de B2 entre B1 e C1.','B2','B1','C1','CEFR-B2-CHECK-1.0','{"reading":{"B1":4,"B2":8,"C1":4},"listening":{"B1":4,"B2":8,"C1":4},"language_use":{"B1":5,"B2":10,"C1":5}}',105,135),
  ('cefr-c1-level-check','C1 Level Check','Verifica a consolidação de C1 entre B2 e C2.','C1','B2','C2','CEFR-C1-CHECK-1.0','{"reading":{"B2":4,"C1":8,"C2":4},"listening":{"B2":4,"C1":8,"C2":4},"language_use":{"B2":5,"C1":10,"C2":5}}',110,145),
  ('cefr-c2-level-check','C2 Level Check','Verifica a consolidação de C2 com confirmação de C1.','C2','C1',null,'CEFR-C2-CHECK-1.0','{"reading":{"C1":4,"C2":8},"listening":{"C1":4,"C2":8},"language_use":{"C1":5,"C2":10}}',90,120);

alter table public.assessments
  add column preset_id text references public.cefr_level_check_presets(id) on delete restrict,
  add column preset_version text,
  add column bank_version text,
  add column selection_seed text,
  add constraint assessments_preset_metadata_complete check (
    (preset_id is null and preset_version is null and bank_version is null and selection_seed is null)
    or (preset_id is not null and nullif(trim(preset_version),'') is not null
      and nullif(trim(bank_version),'') is not null and nullif(trim(selection_seed),'') is not null)
  );

create index assessments_teacher_preset_idx on public.assessments
  (teacher_id,preset_id,preset_version,bank_version,selection_seed,status)
  where preset_id is not null;

alter table public.cefr_level_check_presets enable row level security;
revoke all on table public.cefr_level_check_presets from anon, authenticated;
grant select on table public.cefr_level_check_presets to authenticated;
grant all on table public.cefr_level_check_presets to service_role;
create policy cefr_level_check_presets_read on public.cefr_level_check_presets
  for select to authenticated using (active);

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

create or replace function private.validate_cefr_a2_b1_placement(p_assessment_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_assessment public.assessments%rowtype;
begin
  select * into v_assessment from public.assessments where id = p_assessment_id;
  if not found
    or v_assessment.form_version <> 'CEFR-A2-B1-PLACEMENT-1.0'
    or v_assessment.type <> 'placement'
    or v_assessment.framework <> 'cefr'
    or v_assessment.assessment_mode <> 'fixed'
    or v_assessment.navigation_mode <> 'linear'
    or v_assessment.show_results <> 'after_teacher_review'
    or v_assessment.status <> 'draft'
  then raise exception 'Invalid A2-B1 placement form metadata'; end if;

  if (select count(*) from public.assessment_sections where assessment_id = p_assessment_id) <> 16
    or (select count(*) from public.assessment_questions where assessment_id = p_assessment_id) <> 57
  then raise exception 'A2-B1 placement form must contain 16 sections and 57 total tasks'; end if;

  if exists (
    select 1 from (values
      ('reading', 'A2', 4), ('reading', 'B1', 8), ('reading', 'B2', 4),
      ('listening', 'A2', 4), ('listening', 'B1', 8), ('listening', 'B2', 4),
      ('language_use', 'A2', 5), ('language_use', 'B1', 10), ('language_use', 'B2', 5),
      ('writing', 'A2', 1), ('writing', 'B1', 1),
      ('spoken_production', 'B1', 1), ('spoken_interaction', 'B1', 1), ('mediation', 'B1', 1)
    ) expected(skill, level, item_count)
    where (select count(*) from public.assessment_questions question
      where question.assessment_id = p_assessment_id
        and question.question_snapshot->>'skill' = expected.skill
        and question.question_snapshot->>'cefr' = expected.level) <> expected.item_count
  ) then raise exception 'A2-B1 placement skill/level distribution is invalid'; end if;

  if (select count(*) from public.assessment_questions question
      where question.assessment_id = p_assessment_id
        and question.question_snapshot->>'skill' in ('reading', 'listening', 'language_use')) <> 52
    or (select count(*) from public.assessment_questions question
      where question.assessment_id = p_assessment_id
        and question.question_snapshot->>'skill' in ('writing', 'spoken_production', 'spoken_interaction', 'mediation')) <> 5
  then raise exception 'A2-B1 placement objective/productive composition is invalid'; end if;

  if exists (
    select 1 from public.assessment_questions question
    left join public.question_bank bank on bank.id = question.question_bank_id
    where question.assessment_id = p_assessment_id
      and (bank.bank_version <> 'pilot-0.2' or bank.source_origin <> 'cefr_pilot'
        or bank.quality_status not in ('approved_for_pilot', 'approved')
        or question.question_snapshot->>'externalId' is distinct from bank.external_id)
  ) then raise exception 'A2-B1 placement contains an invalid Pilot Bank item'; end if;

  if (select count(distinct question.question_snapshot->>'externalId')
      from public.assessment_questions question where question.assessment_id = p_assessment_id) <> 57
  then raise exception 'A2-B1 placement contains duplicate stable IDs'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id = p_assessment_id
      and question.question_snapshot->>'skill' in ('reading', 'listening')
    group by question.section_id, question.question_snapshot->>'taskletId'
    having count(*) <> 4
  ) then raise exception 'A2-B1 placement tasklets must remain intact'; end if;

  if (select count(distinct question.question_snapshot->>'taskletId') from public.assessment_questions question
      where question.assessment_id = p_assessment_id and question.question_snapshot->>'skill' = 'reading') <> 4
    or (select count(distinct question.question_snapshot->>'taskletId') from public.assessment_questions question
      where question.assessment_id = p_assessment_id and question.question_snapshot->>'skill' = 'listening') <> 4
  then raise exception 'A2-B1 placement must use four Reading and four Listening tasklets'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id = p_assessment_id
      and question.question_snapshot->>'skill' in ('reading', 'listening', 'language_use')
      and (jsonb_array_length(question.question_snapshot->'options') <> 4
        or nullif(question.question_snapshot->>'answer', '') is null
        or not (question.question_snapshot->'options' ? (question.question_snapshot->>'answer')))
  ) then raise exception 'A2-B1 placement contains an invalid objective item'; end if;

  if exists (
    select 1 from public.assessment_questions question
    where question.assessment_id = p_assessment_id
      and question.question_snapshot->>'skill' in ('writing', 'spoken_production', 'spoken_interaction', 'mediation')
      and jsonb_array_length(coalesce(question.question_snapshot->'rubric', '[]'::jsonb)) = 0
  ) or exists (
    select 1 from public.assessment_questions question
    where question.assessment_id = p_assessment_id
      and question.question_snapshot->>'skill' = 'mediation'
      and nullif(trim(question.question_snapshot->>'sourceMaterial'), '') is null
  ) then raise exception 'A2-B1 placement productive evidence is incomplete'; end if;
end;
$$;

create or replace function public.create_cefr_a2_b1_placement_check()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := (select auth.uid());
  v_assessment_id uuid;
  v_section record;
  v_section_id uuid;
  v_selected_ids text[] := array[
    'R-A2-002-Q1','R-A2-002-Q2','R-A2-002-Q3','R-A2-002-Q4',
    'R-B1-001-Q1','R-B1-001-Q2','R-B1-001-Q3','R-B1-001-Q4',
    'R-B1-002-Q1','R-B1-002-Q2','R-B1-002-Q3','R-B1-002-Q4',
    'R-B2-001-Q1','R-B2-001-Q2','R-B2-001-Q3','R-B2-001-Q4',
    'L-A2-002-Q1','L-A2-002-Q2','L-A2-002-Q3','L-A2-002-Q4',
    'L-B1-001-Q1','L-B1-001-Q2','L-B1-001-Q3','L-B1-001-Q4',
    'L-B1-002-Q1','L-B1-002-Q2','L-B1-002-Q3','L-B1-002-Q4',
    'L-B2-002-Q1','L-B2-002-Q2','L-B2-002-Q3','L-B2-002-Q4',
    'LU-A2-004','LU-A2-005','LU-A2-006','LU-A2-008','LU-A2-009',
    'LU-B1-001','LU-B1-002','LU-B1-004','LU-B1-005','LU-B1-006','LU-B1-007','LU-B1-008','LU-B1-009','LU-B1-010','LU-B1-013',
    'LU-B2-001','LU-B2-003','LU-B2-006','LU-B2-007','LU-B2-009',
    'W-A2-001','W-B1-002','SP-B1-002','SI-B1-001','M-B1-002'
  ];
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then
    raise exception 'Teacher access required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_teacher_id::text || ':CEFR-A2-B1-PLACEMENT-1.0', 0));
  select id into v_assessment_id from public.assessments
  where teacher_id = v_teacher_id and form_version = 'CEFR-A2-B1-PLACEMENT-1.0' and status = 'draft'
  order by created_at limit 1;
  if found then return v_assessment_id; end if;

  if (select count(*) from public.question_bank
      where external_id = any(v_selected_ids) and bank_version = 'pilot-0.2'
        and source_origin = 'cefr_pilot' and quality_status in ('approved_for_pilot', 'approved')) <> 57
  then raise exception 'The approved CEFR Placement Pilot Bank v0.2 must be loaded before creating this preset'; end if;

  insert into public.assessments (
    teacher_id, title, description, type, status, assessment_mode, navigation_mode,
    level_min, level_max, time_limit_minutes, max_attempts, randomize_questions,
    randomize_options, show_results, scoring_model_version, framework, form_version,
    decision_rule_version, routing_rule_version, report_model_version
  ) values (
    v_teacher_id, 'CEFR Placement Check — A2 to B1',
    'Placement diagnóstico com A2 como floor, B1 como target e B2 como ceiling. Parte objetiva estimada em 50–65 minutos; tarefas produtivas requerem revisão do professor.',
    'placement', 'draft', 'fixed', 'linear', 'A2', 'B2', null, 1, false, true,
    'after_teacher_review', 'objective-v1', 'cefr', 'CEFR-A2-B1-PLACEMENT-1.0',
    'cefr-a2-b1-placement-v1', 'cefr-routing-v1', 'cefr-profile-v1'
  ) returning id into v_assessment_id;

  for v_section in
    select * from (values
      (0, 'PART 1 — Reading · Floor A2 · R-A2-002', 'reading', 'A2', 'floor', 'Reading floor: gist, detail, purpose and reference', array['R-A2-002-Q1','R-A2-002-Q2','R-A2-002-Q3','R-A2-002-Q4']),
      (1, 'PART 1 — Reading · Target B1 · R-B1-001', 'reading', 'B1', 'primary', 'Reading target: main idea, detail, inference and writer purpose', array['R-B1-001-Q1','R-B1-001-Q2','R-B1-001-Q3','R-B1-001-Q4']),
      (2, 'PART 1 — Reading · Target B1 · R-B1-002', 'reading', 'B1', 'primary', 'Reading target: main idea, detail, inference and text organisation', array['R-B1-002-Q1','R-B1-002-Q2','R-B1-002-Q3','R-B1-002-Q4']),
      (3, 'PART 1 — Reading · Ceiling B2 · R-B2-001', 'reading', 'B2', 'ceiling', 'Reading ceiling: stance, paragraph function, inference and implication', array['R-B2-001-Q1','R-B2-001-Q2','R-B2-001-Q3','R-B2-001-Q4']),
      (4, 'PART 2 — Listening · Floor A2 · L-A2-002', 'listening', 'A2', 'floor', 'Listening floor: gist, specific information and inference', array['L-A2-002-Q1','L-A2-002-Q2','L-A2-002-Q3','L-A2-002-Q4']),
      (5, 'PART 2 — Listening · Target B1 · L-B1-001', 'listening', 'B1', 'primary', 'Listening target: main points, detail, inference and intention', array['L-B1-001-Q1','L-B1-001-Q2','L-B1-001-Q3','L-B1-001-Q4']),
      (6, 'PART 2 — Listening · Target B1 · L-B1-002', 'listening', 'B1', 'primary', 'Listening target: main points, detail, inference, intention and attitude', array['L-B1-002-Q1','L-B1-002-Q2','L-B1-002-Q3','L-B1-002-Q4']),
      (7, 'PART 2 — Listening · Ceiling B2 · L-B2-002', 'listening', 'B2', 'ceiling', 'Listening ceiling: attitude, inference, detail and speaker intention', array['L-B2-002-Q1','L-B2-002-Q2','L-B2-002-Q3','L-B2-002-Q4']),
      (8, 'PART 3 — Language Use · Floor A2', 'language_use', 'A2', 'floor', 'Language Use floor: tense control, functional language, vocabulary and collocation', array['LU-A2-004','LU-A2-005','LU-A2-006','LU-A2-008','LU-A2-009']),
      (9, 'PART 3 — Language Use · Target B1', 'language_use', 'B1', 'primary', 'Language Use target: tense, clause structure, word formation, lexical choice, connectors and functional language', array['LU-B1-001','LU-B1-002','LU-B1-004','LU-B1-005','LU-B1-006','LU-B1-007','LU-B1-008','LU-B1-009','LU-B1-010','LU-B1-013']),
      (10, 'PART 3 — Language Use · Ceiling B2', 'language_use', 'B2', 'ceiling', 'Language Use ceiling: grammar, lexical precision, collocation, register and discourse markers', array['LU-B2-001','LU-B2-003','LU-B2-006','LU-B2-007','LU-B2-009']),
      (11, 'PART 4 — Writing · Task 1 · Floor A2', 'writing', 'A2', 'floor', 'Functional writing: task achievement, structure, word order, connectors, organisation and appropriacy', array['W-A2-001']),
      (12, 'PART 4 — Writing · Task 2 · Target B1', 'writing', 'B1', 'primary', 'Connected opinion writing with reasons and examples, including emerging B2 evidence', array['W-B1-002']),
      (13, 'PART 5 — Spoken Production · Target B1', 'spoken_production', 'B1', 'primary', 'Sustained comparison, explanation, justification and connected speech with emerging B2 evidence', array['SP-B1-002']),
      (14, 'PART 6 — Spoken Interaction · Target B1', 'spoken_interaction', 'B1', 'primary', 'Independent interaction, reacting, suggesting, negotiating and reaching a decision with B2 ceiling evidence', array['SI-B1-001']),
      (15, 'PART 7 — Mediation · Target B1', 'mediation', 'B1', 'primary', 'Selection, reformulation and organisation of relevant information for another person', array['M-B1-002'])
    ) definition(position, title, skill, level, tasklet_kind, construct, item_ids)
    order by position
  loop
    insert into public.assessment_sections (
      assessment_id, title, skill, position, instructions, adaptive, weight,
      draw_count, cefr_level, construct, tasklet_kind
    ) values (
      v_assessment_id, v_section.title, v_section.skill, v_section.position,
      case when v_section.skill = 'listening'
        then 'Ouça o áudio e responda com base no que você escutar. A transcrição não fica disponível durante a aplicação.'
        when v_section.skill in ('spoken_production', 'spoken_interaction')
        then 'Use o tempo de preparação e grave a resposta completa. Esta tarefa será revisada pelo professor.'
        when v_section.skill in ('writing', 'mediation')
        then 'Produza uma resposta completa dentro da extensão indicada. Esta tarefa será revisada pelo professor.'
        else 'Responda com base apenas no material apresentado.' end,
      false, 1, null, v_section.level, v_section.construct, v_section.tasklet_kind
    ) returning id into v_section_id;

    insert into public.assessment_questions (
      assessment_id, section_id, question_bank_id, position, weight, required,
      question_snapshot, difficulty_snapshot, cefr_snapshot
    )
    select v_assessment_id, v_section_id, bank.id, selected.ordinality - 1, 1, true,
      private.cefr_a2_b1_item_snapshot(bank, tasklet), bank.difficulty, bank.level
    from unnest(v_section.item_ids) with ordinality selected(external_id, ordinality)
    join public.question_bank bank on bank.external_id = selected.external_id
    left join public.question_bank_tasklets tasklet on tasklet.id = bank.tasklet_id
    order by selected.ordinality;
  end loop;

  perform private.validate_cefr_a2_b1_placement(v_assessment_id);
  return v_assessment_id;
end;
$$;

create or replace function private.enforce_cefr_a2_b1_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_levels constant text[] := array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'];
  v_overall integer;
  v_min integer;
  v_max integer;
  v_writing integer;
  v_interaction integer;
begin
  if new.decision_rule_version <> 'cefr-a2-b1-placement-v1' or new.overall_level is null then return new; end if;
  v_overall := array_position(v_levels, new.overall_level);
  select min(array_position(v_levels, value->>'level')), max(array_position(v_levels, value->>'level'))
    into v_min, v_max from jsonb_each(new.skill_results);
  v_writing := array_position(v_levels, new.skill_results->'writing'->>'level');
  v_interaction := array_position(v_levels, new.skill_results->'spoken_interaction'->>'level');

  -- This form can provide B2 evidence, but it is not broad enough to certify B2.
  v_overall := least(v_overall, array_position(v_levels, 'B1+'));
  if v_overall >= array_position(v_levels, 'B1')
    and (coalesce(v_writing, 0) < array_position(v_levels, 'B1')
      or coalesce(v_interaction, 0) < array_position(v_levels, 'B1'))
  then
    v_overall := least(v_overall, array_position(v_levels, 'A2+'));
    if not (new.flags ? 'PRODUCTIVE_SKILLS_BELOW_B1') then new.flags := new.flags || '"PRODUCTIVE_SKILLS_BELOW_B1"'::jsonb; end if;
    new.manual_review_required := true;
  end if;
  if v_max - v_min >= 2 then
    if not (new.flags ? 'HIGH_SKILL_VARIANCE') then new.flags := new.flags || '"HIGH_SKILL_VARIANCE"'::jsonb; end if;
    new.manual_review_required := true;
  end if;
  if new.manual_review_required then
    if not (new.flags ? 'MANUAL_REVIEW_REQUIRED') then new.flags := new.flags || '"MANUAL_REVIEW_REQUIRED"'::jsonb; end if;
    new.confidence := 'low';
  end if;
  new.overall_level := v_levels[v_overall];
  new.recommended_placement := case new.overall_level
    when 'A2' then 'A2 consolidation'
    when 'A2+' then 'A2 consolidation / approaching B1'
    when 'B1' then 'B1 consolidation'
    when 'B1+' then 'B1 consolidation / emerging B2'
    else new.overall_level || ' consolidation' end;
  return new;
end;
$$;

create trigger enforce_cefr_a2_b1_profile
before insert or update on public.assessment_cefr_profiles
for each row execute function private.enforce_cefr_a2_b1_profile();

revoke all on function private.cefr_a2_b1_item_snapshot(public.question_bank, public.question_bank_tasklets),
  private.validate_cefr_a2_b1_placement(uuid), private.enforce_cefr_a2_b1_profile()
from public, anon, authenticated;
revoke all on function public.create_cefr_a2_b1_placement_check() from public, anon;
grant execute on function public.create_cefr_a2_b1_placement_check() to authenticated;

alter function public.create_cefr_a2_b1_placement_check() rename to create_cefr_b1_pilot_form_internal;
revoke all on function public.create_cefr_b1_pilot_form_internal() from public, anon, authenticated;

create or replace function private.add_cefr_level_check_section(
  p_assessment_id uuid,
  p_title text,
  p_skill text,
  p_level text,
  p_tasklet_kind text,
  p_construct text,
  p_item_ids text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_section_id uuid;
begin
  if cardinality(p_item_ids) < 1 or exists (
    select 1 from unnest(p_item_ids) selected(external_id)
    left join public.question_bank bank on bank.external_id = selected.external_id
    where bank.id is null or bank.source_origin <> 'cefr_pilot'
      or bank.quality_status not in ('approved_for_pilot','approved')
  ) then raise exception 'Invalid Level Check item selection'; end if;

  insert into public.assessment_sections(
    assessment_id,title,skill,position,instructions,adaptive,weight,draw_count,
    cefr_level,construct,tasklet_kind
  ) values (
    p_assessment_id,p_title,p_skill,
    (select count(*) from public.assessment_sections where assessment_id = p_assessment_id),
    case when p_skill = 'listening' then 'Ouça o áudio e responda com base no que você escutar. A transcrição não fica disponível durante a aplicação.'
      when p_skill in ('spoken_production','spoken_interaction') then 'Use o tempo de preparação e grave a resposta completa. Esta tarefa será revisada pelo professor.'
      when p_skill in ('writing','mediation') then 'Produza uma resposta completa dentro da extensão indicada. Esta tarefa será revisada pelo professor.'
      else 'Responda com base apenas no material apresentado.' end,
    false,1,null,p_level,p_construct,p_tasklet_kind
  ) returning id into v_section_id;

  insert into public.assessment_questions(
    assessment_id,section_id,question_bank_id,position,weight,required,
    question_snapshot,difficulty_snapshot,cefr_snapshot
  )
  select p_assessment_id,v_section_id,bank.id,selected.ordinality-1,1,true,
    private.cefr_a2_b1_item_snapshot(bank,tasklet),bank.difficulty,bank.level
  from unnest(p_item_ids) with ordinality selected(external_id,ordinality)
  join public.question_bank bank on bank.external_id=selected.external_id
  left join public.question_bank_tasklets tasklet on tasklet.id=bank.tasklet_id
  order by selected.ordinality;
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
    where (select count(*) from public.assessment_questions question
      where question.assessment_id=p_assessment_id
        and question.question_snapshot->>'skill'=skill.key
        and question.question_snapshot->>'cefr'=level_count.key) <> level_count.value::integer
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
  v_tasklet public.question_bank_tasklets%rowtype;
  v_item public.question_bank%rowtype;
  v_item_ids text[];
  v_kind text;
  v_role text;
  v_part integer;
  v_writing_level text;
  v_writing_count integer;
  v_task_index integer := 0;
begin
  if v_teacher_id is null or not (select public.teacher_has_access(v_teacher_id)) then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_bank_version),'') is null or nullif(trim(p_selection_seed),'') is null
    or char_length(p_selection_seed)>100 then raise exception 'Invalid preset generation parameters'; end if;
  select * into v_preset from public.cefr_level_check_presets where id=p_preset_id and active;
  if not found then raise exception 'CEFR Level Check preset not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_teacher_id::text||':'||p_preset_id||':'||p_bank_version||':'||p_selection_seed,0));
  select id into v_assessment_id from public.assessments
  where teacher_id=v_teacher_id and preset_id=p_preset_id and preset_version=v_preset.preset_version
    and bank_version=p_bank_version and selection_seed=p_selection_seed and status='draft'
  order by created_at limit 1;
  if found then return v_assessment_id; end if;

  -- Preserve the hand-curated first B1 pilot form already approved in this migration.
  if p_preset_id='cefr-b1-level-check' and p_bank_version='pilot-0.2' and p_selection_seed='pilot-form-1' then
    v_assessment_id:=public.create_cefr_b1_pilot_form_internal();
    update public.assessments set title='CEFR B1 Level Check — Pilot Form 1',preset_id=v_preset.id,
      preset_version=v_preset.preset_version,bank_version=p_bank_version,selection_seed=p_selection_seed,
      form_version=v_preset.form_version,decision_rule_version=v_preset.decision_rule_version,
      report_model_version=v_preset.report_model_version
    where id=v_assessment_id;
    perform private.validate_cefr_level_check(v_assessment_id);
    return v_assessment_id;
  end if;

  insert into public.assessments(
    teacher_id,title,description,type,status,assessment_mode,navigation_mode,level_min,level_max,
    time_limit_minutes,max_attempts,randomize_questions,randomize_options,show_results,
    scoring_model_version,framework,form_version,decision_rule_version,routing_rule_version,
    report_model_version,preset_id,preset_version,bank_version,selection_seed
  ) values (
    v_teacher_id,'CEFR '||v_preset.target_level||' Level Check — '||case when p_selection_seed='pilot-form-1' then 'Pilot Form 1' else p_selection_seed end,
    v_preset.purpose||' Parte objetiva seguida por tarefas produtivas com revisão humana.',
    'placement','draft','fixed','linear',coalesce(v_preset.floor_level,v_preset.target_level),
    coalesce(v_preset.ceiling_level,v_preset.target_level),null,1,false,true,'after_teacher_review',
    'objective-v1','cefr',v_preset.form_version,v_preset.decision_rule_version,'cefr-routing-v1',
    v_preset.report_model_version,v_preset.id,v_preset.preset_version,p_bank_version,p_selection_seed
  ) returning id into v_assessment_id;

  foreach v_skill in array array['reading','listening'] loop
    v_part:=case v_skill when 'reading' then 1 else 2 end;
    for v_level_count in
      select key level,value::text::integer item_count
      from jsonb_each(v_preset.objective_distribution->v_skill)
      order by array_position(array['A1','A2','B1','B2','C1','C2'],key)
    loop
      v_kind:=case when v_level_count.level=v_preset.floor_level then 'floor'
        when v_level_count.level=v_preset.ceiling_level then 'ceiling' else 'primary' end;
      v_role:=case v_kind when 'floor' then 'Floor' when 'ceiling' then 'Ceiling' else 'Target' end;
      for v_tasklet in
        select ranked.* from (
          select tasklet.*,row_number() over(partition by tasklet.topic order by md5(p_selection_seed||':'||p_preset_id||':'||v_skill||':'||v_level_count.level||':'||tasklet.external_id)) diversity_rank
          from public.question_bank_tasklets tasklet
          where tasklet.bank_version=p_bank_version and tasklet.skill=v_skill and tasklet.level=v_level_count.level
            and tasklet.quality_status in ('approved_for_pilot','approved')
        ) ranked order by diversity_rank,md5(p_selection_seed||':'||p_preset_id||':'||v_skill||':'||v_level_count.level||':'||external_id)
        limit (v_level_count.item_count/4)
      loop
        select array_agg(external_id order by tasklet_position) into v_item_ids
        from public.question_bank where tasklet_id=v_tasklet.id and bank_version=p_bank_version
          and quality_status in ('approved_for_pilot','approved');
        perform private.add_cefr_level_check_section(v_assessment_id,
          'PART '||v_part||' — '||initcap(v_skill)||' · '||v_role||' '||v_level_count.level||' · '||v_tasklet.external_id,
          v_skill,v_level_count.level,v_kind,
          initcap(v_skill)||' '||lower(v_role)||': balanced comprehension evidence',v_item_ids);
      end loop;
    end loop;
  end loop;

  for v_level_count in
    select key level,value::text::integer item_count
    from jsonb_each(v_preset.objective_distribution->'language_use')
    order by array_position(array['A1','A2','B1','B2','C1','C2'],key)
  loop
    v_kind:=case when v_level_count.level=v_preset.floor_level then 'floor'
      when v_level_count.level=v_preset.ceiling_level then 'ceiling' else 'primary' end;
    v_role:=case v_kind when 'floor' then 'Floor' when 'ceiling' then 'Ceiling' else 'Target' end;
    select array_agg(external_id order by diversity_rank,selection_hash) into v_item_ids from (
      select * from (
        select bank.external_id,md5(p_selection_seed||':'||p_preset_id||':language_use:'||v_level_count.level||':'||bank.external_id) selection_hash,
          row_number() over(partition by bank.subskill order by md5(p_selection_seed||':'||p_preset_id||':language_use:'||v_level_count.level||':'||bank.external_id)) diversity_rank
        from public.question_bank bank where bank.bank_version=p_bank_version and bank.skill='language_use'
          and bank.level=v_level_count.level and bank.quality_status in ('approved_for_pilot','approved')
      ) ranked order by diversity_rank,selection_hash limit v_level_count.item_count
    ) selected;
    perform private.add_cefr_level_check_section(v_assessment_id,
      'PART 3 — Language Use · '||v_role||' '||v_level_count.level,'language_use',v_level_count.level,v_kind,
      'Language Use '||lower(v_role)||': grammar control, lexical choice, collocation, connectors, functional language and register',v_item_ids);
  end loop;

  foreach v_writing_level in array case when v_preset.floor_level is null
    then array[v_preset.target_level,v_preset.target_level]
    else array[v_preset.floor_level,v_preset.target_level] end
  loop
    v_task_index:=v_task_index+1;
    v_writing_count:=case when v_task_index=2 and v_preset.floor_level is null then 2 else 1 end;
    select * into v_item from public.question_bank bank where bank.bank_version=p_bank_version
      and bank.skill='writing' and bank.level=v_writing_level and bank.quality_status in ('approved_for_pilot','approved')
    order by md5(p_selection_seed||':'||p_preset_id||':writing:'||v_writing_level||':'||bank.external_id)
    offset (v_writing_count-1) limit 1;
    perform private.add_cefr_level_check_section(v_assessment_id,'PART 4 — Writing · Task '||v_task_index,
      'writing',v_writing_level,case when v_writing_level=v_preset.floor_level then 'floor' else 'primary' end,
      'Connected writing, task achievement, range, accuracy, organisation, cohesion and register',array[v_item.external_id]);
  end loop;

  for v_skill in select unnest(array['spoken_production','spoken_interaction','mediation']) loop
    select * into v_item from public.question_bank bank where bank.bank_version=p_bank_version
      and bank.skill=v_skill and bank.level=v_preset.target_level and bank.quality_status in ('approved_for_pilot','approved')
      and (v_skill<>'mediation' or nullif(trim(bank.source_material),'') is not null)
    order by md5(p_selection_seed||':'||p_preset_id||':'||v_skill||':'||bank.external_id) limit 1;
    perform private.add_cefr_level_check_section(v_assessment_id,
      'PART '||case v_skill when 'spoken_production' then 5 when 'spoken_interaction' then 6 else 7 end||' — '||initcap(replace(v_skill,'_',' '))||' · Target '||v_preset.target_level,
      v_skill,v_preset.target_level,'primary',
      case v_skill when 'spoken_production' then 'Sustained connected speech, explanation and justification'
        when 'spoken_interaction' then 'Independent interaction, response, negotiation and joint decision'
        else 'Selection, reformulation and organisation for another person' end,array[v_item.external_id]);
  end loop;

  perform private.validate_cefr_level_check(v_assessment_id);
  return v_assessment_id;
end;
$$;

drop trigger enforce_cefr_a2_b1_profile on public.assessment_cefr_profiles;
drop function private.enforce_cefr_a2_b1_profile();

create or replace function private.enforce_cefr_level_check_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_levels constant text[]:=array['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'];
  v_preset public.cefr_level_check_presets%rowtype; v_overall integer; v_floor integer; v_target integer; v_ceiling integer;
  v_min integer; v_max integer; v_writing integer; v_interaction integer;
begin
  select preset.* into v_preset from public.assessments assessment join public.cefr_level_check_presets preset on preset.id=assessment.preset_id where assessment.id=new.assessment_id;
  if not found or new.overall_level is null then return new; end if;
  v_overall:=array_position(v_levels,new.overall_level);
  v_floor:=array_position(v_levels,coalesce(v_preset.floor_level,v_preset.target_level));
  v_target:=array_position(v_levels,v_preset.target_level);
  v_ceiling:=least(11,v_target+1);
  select min(array_position(v_levels,value->>'level')),max(array_position(v_levels,value->>'level')) into v_min,v_max from jsonb_each(new.skill_results);
  v_writing:=array_position(v_levels,new.skill_results->'writing'->>'level');
  v_interaction:=array_position(v_levels,new.skill_results->'spoken_interaction'->>'level');
  v_overall:=greatest(v_floor,least(v_overall,v_ceiling));
  if v_overall>=v_target and (coalesce(v_writing,0)<v_target or coalesce(v_interaction,0)<v_target) then
    v_overall:=least(v_overall,greatest(v_floor,v_target-1));
    if not (coalesce(new.flags,'[]') ? 'PRODUCTIVE_SKILLS_BELOW_TARGET') then new.flags:=coalesce(new.flags,'[]')||'"PRODUCTIVE_SKILLS_BELOW_TARGET"'::jsonb; end if;
    new.manual_review_required:=true;
  end if;
  if v_max-v_min>=2 then
    if not (coalesce(new.flags,'[]') ? 'HIGH_SKILL_VARIANCE') then new.flags:=coalesce(new.flags,'[]')||'"HIGH_SKILL_VARIANCE"'::jsonb; end if;
    new.manual_review_required:=true;
  end if;
  if new.manual_review_required then
    if not (coalesce(new.flags,'[]') ? 'MANUAL_REVIEW_REQUIRED') then new.flags:=coalesce(new.flags,'[]')||'"MANUAL_REVIEW_REQUIRED"'::jsonb; end if;
    new.confidence:='low';
  end if;
  new.overall_level:=v_levels[v_overall];
  new.recommended_placement:=new.overall_level||case when v_overall=v_target-1 then ' approaching '||v_preset.target_level when v_overall=v_target+1 then ' consolidated / emerging next level' else ' consolidation' end;
  return new;
end; $$;
create trigger enforce_cefr_level_check_profile before insert or update on public.assessment_cefr_profiles
for each row execute function private.enforce_cefr_level_check_profile();

create or replace function public.create_cefr_a2_b1_placement_check()
returns uuid language sql security definer set search_path='' as $$
  select public.generate_assessment_from_preset('cefr-b1-level-check','pilot-0.2','pilot-form-1');
$$;

revoke all on function private.add_cefr_level_check_section(uuid,text,text,text,text,text,text[]),
  private.validate_cefr_level_check(uuid),private.enforce_cefr_level_check_profile(),
  public.create_cefr_b1_pilot_form_internal() from public,anon,authenticated;
revoke all on function public.generate_assessment_from_preset(text,text,text),public.create_cefr_a2_b1_placement_check() from public,anon;
grant execute on function public.generate_assessment_from_preset(text,text,text),public.create_cefr_a2_b1_placement_check() to authenticated;
