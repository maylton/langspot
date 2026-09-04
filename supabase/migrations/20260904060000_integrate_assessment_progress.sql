-- Longitudinal assessment history and explicit CEFR level confirmation.

create table public.assessment_level_updates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  previous_level text not null,
  confirmed_level text not null check (confirmed_level in ('A1','A2','B1','B2','C1','C2')),
  created_at timestamptz not null default now(),
  unique (attempt_id)
);
alter table public.assessment_level_updates enable row level security;
revoke all on table public.assessment_level_updates from anon, authenticated;
grant all on table public.assessment_level_updates to service_role;
grant select on table public.assessment_level_updates to authenticated;
create policy assessment_level_updates_teacher_read on public.assessment_level_updates for select to authenticated using (teacher_id = (select auth.uid()));
create policy assessment_level_updates_student_read on public.assessment_level_updates for select to authenticated using (student_id = (select auth.uid()));

create or replace function private.sync_completed_assessment_progress()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_skills jsonb;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select coalesce(jsonb_object_agg(skill_name, percentage), '{}'::jsonb) into v_skills from (
      select initcap(replace(section.skill, '_', ' ')) skill_name,
        round(100 * coalesce(sum(response.score), 0) / nullif(sum(response.max_score), 0), 0) percentage
      from public.assessment_sections section join public.assessment_questions question on question.section_id = section.id
      join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = new.id
      where section.assessment_id = new.assessment_id group by section.skill) values_by_skill;
    update public.student_records set skills = coalesce(skills, '{}'::jsonb) || v_skills where student_id = new.student_id;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_completed_assessment_progress() from public, anon, authenticated;
create trigger sync_completed_assessment_progress after update of status on public.assessment_attempts for each row execute function private.sync_completed_assessment_progress();

create or replace function public.get_assessment_progress(p_student_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_actor uuid := (select auth.uid()); v_student uuid := coalesce(p_student_id, (select auth.uid())); v_teacher uuid;
begin
  select teacher_id into v_teacher from public.student_records where student_id = v_student;
  if v_actor is null or (v_actor <> v_student and v_actor <> v_teacher) then raise exception 'Assessment progress not found'; end if;
  return jsonb_build_object(
    'studentId', v_student,
    'currentLevel', (select level from public.student_records where student_id = v_student),
    'history', coalesce((select jsonb_agg(jsonb_build_object('attemptId', attempt.id, 'assessmentId', assessment.id, 'title', assessment.title, 'type', assessment.type, 'version', assessment.version, 'completedAt', coalesce(attempt.reviewed_at, attempt.submitted_at), 'score', attempt.scaled_score, 'estimatedCefr', attempt.estimated_cefr, 'skills', coalesce((select jsonb_object_agg(section.skill, round(100 * scores.score / nullif(scores.max_score, 0), 2)) from public.assessment_sections section join lateral (select coalesce(sum(response.score),0) score, coalesce(sum(response.max_score),0) max_score from public.assessment_questions question join public.assessment_responses response on response.assessment_question_id=question.id and response.attempt_id=attempt.id where question.section_id=section.id) scores on true where section.assessment_id=assessment.id), '{}'::jsonb)) order by coalesce(attempt.reviewed_at,attempt.submitted_at))
      from public.assessment_attempts attempt join public.assessments assessment on assessment.id=attempt.assessment_id where attempt.student_id=v_student and attempt.status='completed'), '[]'::jsonb),
    'levelUpdates', coalesce((select jsonb_agg(jsonb_build_object('attemptId',attempt_id,'previousLevel',previous_level,'confirmedLevel',confirmed_level,'createdAt',created_at) order by created_at) from public.assessment_level_updates where student_id=v_student), '[]'::jsonb));
end;
$$;

create or replace function public.confirm_assessment_level_update(p_student_id uuid, p_attempt_id uuid, p_level text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_teacher uuid := (select auth.uid()); v_previous text;
begin
  if p_level not in ('A1','A2','B1','B2','C1','C2') then raise exception 'Invalid CEFR level'; end if;
  select level into v_previous from public.student_records where student_id=p_student_id and teacher_id=v_teacher for update;
  if not found or not exists (select 1 from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id=attempt.assessment_assignment_id join public.assessments assessment on assessment.id=attempt.assessment_id where attempt.id=p_attempt_id and attempt.student_id=p_student_id and assignment.teacher_id=v_teacher and attempt.status='completed' and assessment.type='placement') then raise exception 'Completed placement attempt not found'; end if;
  insert into public.assessment_level_updates(teacher_id,student_id,attempt_id,previous_level,confirmed_level) values(v_teacher,p_student_id,p_attempt_id,v_previous,p_level);
  update public.student_records set level=p_level where student_id=p_student_id and teacher_id=v_teacher;
end;
$$;
revoke all on function public.get_assessment_progress(uuid) from public, anon;
revoke all on function public.confirm_assessment_level_update(uuid,uuid,text) from public, anon;
grant execute on function public.get_assessment_progress(uuid) to authenticated;
grant execute on function public.confirm_assessment_level_update(uuid,uuid,text) to authenticated;
