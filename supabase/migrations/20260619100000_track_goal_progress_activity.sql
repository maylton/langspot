create or replace function public.track_goal_study_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.progress > coalesce(old.progress, 0)
    or (new.status = 'completed' and old.status is distinct from 'completed') then
    perform public.record_study_activity(new.student_id, new.teacher_id, 'goal', new.id);
  end if;
  return new;
end;
$$;
