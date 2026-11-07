-- Assessment notifications.
--   * Student: "Nova avaliação disponível" when an assessment is assigned. It is scheduled for
--     available_from when that is in the future; the apps only show notifications whose
--     scheduled_for has passed. Nothing is sent for live-only forms, which the teacher administers
--     in person.
--   * Teacher: "Avaliação enviada" when a student submits. Nothing is sent for attempts the teacher
--     opened and completed in a live session (no device session).
-- Both go in-app and by e-mail, like task notifications.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('lesson', 'assignment', 'quiz', 'payment', 'cancellation', 'mission', 'system', 'assessment'));

create or replace function private.notify_assessment_assigned()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_due text := '';
begin
  select title into v_title from public.assessments where id = new.assessment_id;
  if v_title is null then return new; end if;
  if not exists (
    select 1 from public.assessment_questions question
    where question.assessment_id = new.assessment_id
      and not private.assessment_question_is_live(question.question_snapshot)
  ) then return new; end if;
  if new.due_at is not null then
    v_due := ' Prazo: ' || to_char(new.due_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') || '.';
  end if;
  perform public.create_notification(
    new.student_id, 'assessment', 'Nova avaliação disponível',
    'Seu professor atribuiu "' || v_title || '".' || v_due,
    'Avaliações', new.id, false, greatest(coalesce(new.available_from, now()), now()),
    new.teacher_id, new.student_id, array['in_app', 'email']::text[],
    jsonb_build_object('assessmentId', new.assessment_id, 'assignmentId', new.id)
  );
  return new;
end $$;

create or replace function private.notify_assessment_submitted()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_teacher uuid;
  v_student text;
begin
  if old.submitted_at is not null or new.submitted_at is null or new.device_session_id is null then return new; end if;
  select assessment.title, assignment.teacher_id into v_title, v_teacher
    from public.assessment_assignments assignment
    join public.assessments assessment on assessment.id = assignment.assessment_id
   where assignment.id = new.assessment_assignment_id;
  if v_teacher is null then return new; end if;
  select coalesce(full_name, 'Aluno') into v_student from public.profiles where id = new.student_id;
  perform public.create_notification(
    v_teacher, 'assessment', 'Avaliação enviada',
    coalesce(v_student, 'Aluno') || ' enviou "' || v_title || '".',
    'Avaliações', new.id, true, now(),
    v_teacher, new.student_id, array['in_app', 'email']::text[],
    jsonb_build_object('assessmentId', new.assessment_id, 'attemptId', new.id)
  );
  return new;
end $$;

drop trigger if exists notify_assessment_assigned on public.assessment_assignments;
create trigger notify_assessment_assigned after insert on public.assessment_assignments
  for each row execute function private.notify_assessment_assigned();
drop trigger if exists notify_assessment_submitted on public.assessment_attempts;
create trigger notify_assessment_submitted after update of submitted_at on public.assessment_attempts
  for each row execute function private.notify_assessment_submitted();

revoke all on function private.notify_assessment_assigned() from public, anon, authenticated;
revoke all on function private.notify_assessment_submitted() from public, anon, authenticated;
