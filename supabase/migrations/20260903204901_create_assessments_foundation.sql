-- Assessments domain foundation. Operational writes remain server-only until the
-- secure RPC/Edge Function layer is introduced in a later phase.

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  parent_assessment_id uuid,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  type text not null check (type in ('placement', 'diagnostic', 'progress', 'unit', 'custom')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  assessment_mode text not null default 'fixed' check (assessment_mode in ('fixed', 'adaptive')),
  navigation_mode text not null default 'free' check (navigation_mode in ('free', 'linear')),
  level_min text check (level_min is null or level_min in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_max text check (level_max is null or level_max in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  max_attempts integer not null default 1 check (max_attempts > 0),
  randomize_questions boolean not null default false,
  randomize_options boolean not null default false,
  show_results text not null default 'after_teacher_review' check (
    show_results in ('none', 'score_only', 'level_only', 'full_report', 'after_teacher_review')
  ),
  version integer not null default 1 check (version > 0),
  scoring_model_version text not null default 'objective-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint assessments_teacher_identity unique (id, teacher_id),
  constraint assessments_parent_same_teacher foreign key (parent_assessment_id, teacher_id)
    references public.assessments(id, teacher_id) on delete set null (parent_assessment_id),
  constraint assessments_level_range check (
    level_min is null
    or level_max is null
    or array_position(array['A1', 'A2', 'B1', 'B2', 'C1', 'C2']::text[], level_min)
      <= array_position(array['A1', 'A2', 'B1', 'B2', 'C1', 'C2']::text[], level_max)
  ),
  constraint assessments_adaptive_navigation check (
    assessment_mode <> 'adaptive' or navigation_mode = 'linear'
  ),
  constraint assessments_publication_time check (
    status = 'draft' or published_at is not null
  )
);

create table public.assessment_sections (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  skill text not null check (skill in ('grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking', 'use_of_english')),
  position integer not null check (position >= 0),
  instructions text not null default '',
  time_limit_seconds integer check (time_limit_seconds is null or time_limit_seconds > 0),
  adaptive boolean not null default false,
  weight numeric(8, 4) not null default 1 check (weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_sections_position unique (assessment_id, position),
  constraint assessment_sections_identity unique (id, assessment_id)
);

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  section_id uuid not null,
  question_bank_id uuid references public.question_bank(id) on delete set null,
  position integer not null check (position >= 0),
  weight numeric(8, 4) not null default 1 check (weight > 0),
  required boolean not null default true,
  question_snapshot jsonb not null check (jsonb_typeof(question_snapshot) = 'object'),
  difficulty_snapshot smallint check (difficulty_snapshot is null or difficulty_snapshot between 1 and 10),
  cefr_snapshot text check (cefr_snapshot is null or cefr_snapshot in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  created_at timestamptz not null default now(),
  constraint assessment_questions_section foreign key (section_id, assessment_id)
    references public.assessment_sections(id, assessment_id) on delete cascade,
  constraint assessment_questions_position unique (section_id, position),
  constraint assessment_questions_identity unique (id, assessment_id)
);

create table public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  available_from timestamptz,
  due_at timestamptz,
  attempt_limit integer not null default 1 check (attempt_limit > 0),
  access_code_hash text check (access_code_hash is null or char_length(access_code_hash) >= 32),
  status text not null default 'assigned' check (
    status in ('assigned', 'available', 'started', 'submitted', 'grading', 'completed', 'expired')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_assignments_assessment_teacher foreign key (assessment_id, teacher_id)
    references public.assessments(id, teacher_id) on delete cascade,
  constraint assessment_assignments_window check (
    due_at is null or available_from is null or due_at > available_from
  ),
  constraint assessment_assignments_identity unique (id, assessment_id, student_id)
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_assignment_id uuid not null,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'submitted', 'grading', 'completed', 'expired', 'invalidated')
  ),
  current_section_id uuid,
  current_question_id uuid,
  raw_score numeric check (raw_score is null or raw_score >= 0),
  scaled_score numeric check (scaled_score is null or scaled_score >= 0),
  estimated_cefr text check (estimated_cefr is null or estimated_cefr in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  integrity_status text not null default 'no_unusual_activity' check (
    integrity_status in ('no_unusual_activity', 'unusual_activity', 'review_recommended')
  ),
  device_session_id text,
  randomization_seed text not null default gen_random_uuid()::text,
  scoring_model_version text not null default 'objective-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_attempts_assignment_scope foreign key (
    assessment_assignment_id,
    assessment_id,
    student_id
  ) references public.assessment_assignments(id, assessment_id, student_id) on delete cascade,
  constraint assessment_attempts_current_section foreign key (current_section_id, assessment_id)
    references public.assessment_sections(id, assessment_id) on delete set null (current_section_id),
  constraint assessment_attempts_current_question foreign key (current_question_id, assessment_id)
    references public.assessment_questions(id, assessment_id) on delete set null (current_question_id),
  constraint assessment_attempts_identity unique (id, assessment_id),
  constraint assessment_attempts_expiration check (expires_at is null or expires_at > started_at),
  constraint assessment_attempts_submission_time check (submitted_at is null or submitted_at >= started_at),
  constraint assessment_attempts_submitted_status check (
    status not in ('submitted', 'grading', 'completed') or submitted_at is not null
  )
);

create table public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  assessment_question_id uuid not null,
  answer_payload jsonb not null default '{}'::jsonb,
  answered_at timestamptz,
  time_spent_ms integer not null default 0 check (time_spent_ms >= 0),
  score numeric check (score is null or score >= 0),
  max_score numeric check (max_score is null or max_score > 0),
  grading_status text not null default 'pending' check (
    grading_status in ('pending', 'auto_graded', 'manual_review', 'reviewed')
  ),
  teacher_feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_responses_attempt foreign key (attempt_id, assessment_id)
    references public.assessment_attempts(id, assessment_id) on delete cascade,
  constraint assessment_responses_question foreign key (assessment_question_id, assessment_id)
    references public.assessment_questions(id, assessment_id) on delete cascade,
  constraint assessment_responses_attempt_question unique (attempt_id, assessment_question_id),
  constraint assessment_responses_score check (
    score is null or max_score is null or score <= max_score
  )
);

create table public.assessment_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  event_type text not null check (event_type in (
    'assessment_started',
    'question_opened',
    'answer_saved',
    'tab_blur',
    'tab_focus',
    'fullscreen_exit',
    'paste_detected',
    'network_disconnect',
    'network_reconnect',
    'resumed',
    'submitted',
    'session_conflict'
  )),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object')
);

create unique index assessment_attempts_one_active_idx
  on public.assessment_attempts (assessment_assignment_id, student_id)
  where status = 'in_progress';

create index assessments_teacher_status_idx
  on public.assessments (teacher_id, status, created_at desc);
create index assessments_parent_idx
  on public.assessments (parent_assessment_id)
  where parent_assessment_id is not null;
create index assessment_questions_assessment_idx
  on public.assessment_questions (assessment_id, section_id, position);
create index assessment_questions_bank_idx
  on public.assessment_questions (question_bank_id)
  where question_bank_id is not null;
create index assessment_assignments_student_status_idx
  on public.assessment_assignments (student_id, status, due_at);
create index assessment_assignments_teacher_status_idx
  on public.assessment_assignments (teacher_id, status, due_at);
create index assessment_assignments_assessment_idx
  on public.assessment_assignments (assessment_id);
create index assessment_attempts_student_status_idx
  on public.assessment_attempts (student_id, status, started_at desc);
create index assessment_attempts_assignment_idx
  on public.assessment_attempts (assessment_assignment_id, started_at desc);
create index assessment_attempts_assessment_idx
  on public.assessment_attempts (assessment_id);
create index assessment_attempts_current_section_idx
  on public.assessment_attempts (current_section_id)
  where current_section_id is not null;
create index assessment_attempts_current_question_idx
  on public.assessment_attempts (current_question_id)
  where current_question_id is not null;
create index assessment_responses_question_idx
  on public.assessment_responses (assessment_question_id);
create index assessment_responses_assessment_idx
  on public.assessment_responses (assessment_id);
create index assessment_events_attempt_time_idx
  on public.assessment_events (attempt_id, occurred_at);

create function public.set_assessment_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_assessment_updated_at() from public, anon, authenticated;

create trigger set_assessments_updated_at
before update on public.assessments
for each row execute function public.set_assessment_updated_at();

create trigger set_assessment_sections_updated_at
before update on public.assessment_sections
for each row execute function public.set_assessment_updated_at();

create trigger set_assessment_assignments_updated_at
before update on public.assessment_assignments
for each row execute function public.set_assessment_updated_at();

create trigger set_assessment_attempts_updated_at
before update on public.assessment_attempts
for each row execute function public.set_assessment_updated_at();

create trigger set_assessment_responses_updated_at
before update on public.assessment_responses
for each row execute function public.set_assessment_updated_at();

alter table public.assessments enable row level security;
alter table public.assessment_sections enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.assessment_events enable row level security;

revoke all on table
  public.assessments,
  public.assessment_sections,
  public.assessment_questions,
  public.assessment_assignments,
  public.assessment_attempts,
  public.assessment_responses,
  public.assessment_events
from anon, authenticated;

grant select, insert, update, delete on table
  public.assessments,
  public.assessment_sections,
  public.assessment_questions
to authenticated;

grant insert, update, delete on table public.assessment_assignments to authenticated;

-- The optional access-code hash is intentionally excluded from direct client reads.
grant select (
  id,
  assessment_id,
  teacher_id,
  student_id,
  available_from,
  due_at,
  attempt_limit,
  status,
  created_at,
  updated_at
) on table public.assessment_assignments to authenticated;

grant select on table
  public.assessment_attempts,
  public.assessment_responses,
  public.assessment_events
to authenticated;

grant all on table
  public.assessments,
  public.assessment_sections,
  public.assessment_questions,
  public.assessment_assignments,
  public.assessment_attempts,
  public.assessment_responses,
  public.assessment_events
to service_role;

create policy "teachers read own assessments"
on public.assessments for select to authenticated
using (teacher_id = (select auth.uid()));

create policy "teachers create own assessments"
on public.assessments for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and status = 'draft'
  and published_at is null
);

create policy "teachers update own assessments"
on public.assessments for update to authenticated
using (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and status = 'draft'
)
with check (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and status = 'draft'
  and published_at is null
);

create policy "teachers delete own assessments"
on public.assessments for delete to authenticated
using (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and status = 'draft'
);

create policy "teachers read own assessment sections"
on public.assessment_sections for select to authenticated
using (exists (
  select 1 from public.assessments assessment
  where assessment.id = assessment_id
    and assessment.teacher_id = (select auth.uid())
));

create policy "teachers create own assessment sections"
on public.assessment_sections for insert to authenticated
with check (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers update own assessment sections"
on public.assessment_sections for update to authenticated
using (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
)
with check (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers delete own assessment sections"
on public.assessment_sections for delete to authenticated
using (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers read own assessment questions"
on public.assessment_questions for select to authenticated
using (exists (
  select 1 from public.assessments assessment
  where assessment.id = assessment_id
    and assessment.teacher_id = (select auth.uid())
));

create policy "teachers create own assessment questions"
on public.assessment_questions for insert to authenticated
with check (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers update own assessment questions"
on public.assessment_questions for update to authenticated
using (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
)
with check (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers delete own assessment questions"
on public.assessment_questions for delete to authenticated
using (
  (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'draft'
  )
);

create policy "teachers read own assessment assignments"
on public.assessment_assignments for select to authenticated
using (teacher_id = (select auth.uid()));

create policy "students read own assessment assignments"
on public.assessment_assignments for select to authenticated
using (student_id = (select auth.uid()));

create policy "teachers create own assessment assignments"
on public.assessment_assignments for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.student_records student
    where student.student_id = assessment_assignments.student_id
      and student.teacher_id = (select auth.uid())
  )
  and exists (
    select 1 from public.assessments assessment
    where assessment.id = assessment_assignments.assessment_id
      and assessment.teacher_id = (select auth.uid())
      and assessment.status = 'published'
  )
);

create policy "teachers update own assessment assignments"
on public.assessment_assignments for update to authenticated
using (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
)
with check (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
  and exists (
    select 1 from public.student_records student
    where student.student_id = assessment_assignments.student_id
      and student.teacher_id = (select auth.uid())
  )
);

create policy "teachers delete own assessment assignments"
on public.assessment_assignments for delete to authenticated
using (
  teacher_id = (select auth.uid())
  and (select public.teacher_has_access((select auth.uid())))
);

create policy "teachers read own assessment attempts"
on public.assessment_attempts for select to authenticated
using (exists (
  select 1 from public.assessment_assignments assignment
  where assignment.id = assessment_assignment_id
    and assignment.teacher_id = (select auth.uid())
));

create policy "teachers read own assessment responses"
on public.assessment_responses for select to authenticated
using (exists (
  select 1
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment
    on assignment.id = attempt.assessment_assignment_id
  where attempt.id = attempt_id
    and assignment.teacher_id = (select auth.uid())
));

create policy "teachers read own assessment events"
on public.assessment_events for select to authenticated
using (exists (
  select 1
  from public.assessment_attempts attempt
  join public.assessment_assignments assignment
    on assignment.id = attempt.assessment_assignment_id
  where attempt.id = attempt_id
    and assignment.teacher_id = (select auth.uid())
));
