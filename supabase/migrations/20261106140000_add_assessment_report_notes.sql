-- Teacher-written summary and next steps attached to a student's assessment report.
-- Students read the note only when the attempt's result is visible to them, using the
-- same rule as get_student_assessment_result.

create table public.assessment_report_notes (
  attempt_id uuid primary key references public.assessment_attempts(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  summary text not null default '' check (char_length(summary) <= 4000),
  next_steps text not null default '' check (char_length(next_steps) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assessment_report_notes enable row level security;
revoke all on table public.assessment_report_notes from anon, authenticated;
grant all on table public.assessment_report_notes to service_role;
create trigger set_assessment_report_notes_updated_at before update on public.assessment_report_notes for each row execute function public.set_assessment_updated_at();

create or replace function public.save_assessment_report_note(p_attempt_id uuid, p_summary text, p_next_steps text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_teacher uuid := (select auth.uid());
begin
  if not exists (select 1 from public.assessment_attempts attempt join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id where attempt.id = p_attempt_id and assignment.teacher_id = v_teacher) then
    raise exception 'Assessment attempt not found';
  end if;
  insert into public.assessment_report_notes (attempt_id, teacher_id, summary, next_steps)
  values (p_attempt_id, v_teacher, left(trim(coalesce(p_summary, '')), 4000), left(trim(coalesce(p_next_steps, '')), 4000))
  on conflict (attempt_id) do update set summary = excluded.summary, next_steps = excluded.next_steps, teacher_id = excluded.teacher_id;
end;
$$;

create or replace function public.get_assessment_report_note(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_actor uuid := (select auth.uid()); v_attempt public.assessment_attempts%rowtype; v_teacher uuid; v_visibility text; v_note public.assessment_report_notes%rowtype;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt where attempt.id = p_attempt_id;
  if not found then raise exception 'Assessment report not found'; end if;
  select assignment.teacher_id into v_teacher from public.assessment_assignments assignment where assignment.id = v_attempt.assessment_assignment_id;
  if v_actor is null or v_actor not in (v_teacher, v_attempt.student_id) then raise exception 'Assessment report not found'; end if;
  if v_actor = v_attempt.student_id and v_actor <> v_teacher then
    select show_results into v_visibility from public.assessments where id = v_attempt.assessment_id;
    if not (v_attempt.status = 'completed' and v_visibility <> 'none' and (v_visibility <> 'after_teacher_review' or v_attempt.reviewed_at is not null)) then return null; end if;
  end if;
  select * into v_note from public.assessment_report_notes where attempt_id = p_attempt_id;
  if not found then return null; end if;
  return jsonb_build_object('summary', v_note.summary, 'nextSteps', v_note.next_steps, 'updatedAt', v_note.updated_at);
end;
$$;

revoke all on function public.save_assessment_report_note(uuid, text, text) from public, anon;
revoke all on function public.get_assessment_report_note(uuid) from public, anon;
grant execute on function public.save_assessment_report_note(uuid, text, text) to authenticated;
grant execute on function public.get_assessment_report_note(uuid) to authenticated;

-- The completed attempt that precedes p_attempt_id for the same student, with per-skill
-- percentages, for the "compared with the previous assessment" part of the report.
-- Students only get attempts whose full result is visible to them (get_assessment_progress
-- does not apply result visibility, so the report does not use it).
create or replace function public.get_previous_assessment_for_report(p_attempt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare v_actor uuid := (select auth.uid()); v_attempt public.assessment_attempts%rowtype; v_teacher uuid; v_is_teacher boolean; v_previous record;
begin
  select attempt.* into v_attempt from public.assessment_attempts attempt where attempt.id = p_attempt_id;
  if not found then raise exception 'Assessment report not found'; end if;
  select assignment.teacher_id into v_teacher from public.assessment_assignments assignment where assignment.id = v_attempt.assessment_assignment_id;
  if v_actor is null or v_actor not in (v_teacher, v_attempt.student_id) then raise exception 'Assessment report not found'; end if;
  v_is_teacher := v_actor = v_teacher;

  select attempt.id, assessment.title, coalesce(attempt.reviewed_at, attempt.submitted_at) completed_at, attempt.scaled_score into v_previous
  from public.assessment_attempts attempt
  join public.assessments assessment on assessment.id = attempt.assessment_id
  join public.assessment_assignments assignment on assignment.id = attempt.assessment_assignment_id
  where attempt.student_id = v_attempt.student_id and attempt.id <> v_attempt.id and attempt.status = 'completed'
    and coalesce(attempt.reviewed_at, attempt.submitted_at) < coalesce(v_attempt.reviewed_at, v_attempt.submitted_at, now())
    and (case when v_is_teacher then assignment.teacher_id = v_teacher
      else assessment.show_results in ('full_report', 'after_teacher_review') and (assessment.show_results <> 'after_teacher_review' or attempt.reviewed_at is not null) end)
  order by coalesce(attempt.reviewed_at, attempt.submitted_at) desc
  limit 1;
  if v_previous.id is null then return null; end if;

  return jsonb_build_object('attemptId', v_previous.id, 'title', v_previous.title, 'completedAt', v_previous.completed_at, 'score', v_previous.scaled_score,
    'skills', coalesce((select jsonb_object_agg(skill, percentage) from (
      select case when section.skill = 'use_of_english' then 'language_use' else section.skill end skill,
        round(100 * sum(response.score) / nullif(sum(response.max_score), 0), 2) percentage
      from public.assessment_sections section
      join public.assessment_questions question on question.section_id = section.id
      join public.assessment_responses response on response.assessment_question_id = question.id and response.attempt_id = v_previous.id
      group by 1) by_skill where percentage is not null), '{}'::jsonb));
end;
$$;
revoke all on function public.get_previous_assessment_for_report(uuid) from public, anon;
grant execute on function public.get_previous_assessment_for_report(uuid) to authenticated;
