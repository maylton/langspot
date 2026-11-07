-- Teachers delete their own assessments (drafts, published or archived) from the dashboard.
-- The RLS delete policy only covers drafts; published assessments go through this RPC, which
-- reports what will be lost first so the confirmation dialog can show it.
-- Assignments, attempts, responses, CEFR profiles and report notes cascade with the assessment.
-- Recordings already uploaded to Storage are not removed (Supabase forbids deleting storage
-- objects from SQL).

create or replace function public.get_assessment_deletion_impact(p_assessment_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_teacher uuid := (select auth.uid());
begin
  if v_teacher is null or not (select public.teacher_has_access(v_teacher)) then raise exception 'Teacher access required'; end if;
  if not exists (select 1 from public.assessments where id = p_assessment_id and teacher_id = v_teacher) then
    raise exception 'Assessment not found';
  end if;
  return jsonb_build_object(
    'assignments', (select count(*) from public.assessment_assignments where assessment_id = p_assessment_id),
    'inProgressStudents', (select count(distinct student_id) from public.assessment_attempts where assessment_id = p_assessment_id and status = 'in_progress'),
    'submittedStudents', (select count(distinct student_id) from public.assessment_attempts where assessment_id = p_assessment_id and status in ('submitted', 'grading', 'completed'))
  );
end $$;

create or replace function public.delete_assessment(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_teacher uuid := (select auth.uid());
begin
  if v_teacher is null or not (select public.teacher_has_access(v_teacher)) then raise exception 'Teacher access required'; end if;
  delete from public.assessments where id = p_assessment_id and teacher_id = v_teacher;
  if not found then raise exception 'Assessment not found'; end if;
end $$;

revoke all on function public.get_assessment_deletion_impact(uuid) from public, anon;
revoke all on function public.delete_assessment(uuid) from public, anon;
grant execute on function public.get_assessment_deletion_impact(uuid) to authenticated;
grant execute on function public.delete_assessment(uuid) to authenticated;
