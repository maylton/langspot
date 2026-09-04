import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssessmentAssignmentRow, AssessmentRow } from './database';
import type { AssessmentDraft } from './types';

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('O servidor não retornou os dados esperados.');
  return data;
}

export async function listTeacherAssessments(client: SupabaseClient): Promise<AssessmentRow[]> {
  const { data, error } = await client.from('assessments').select('*').order('updated_at', { ascending: false });
  return requireData(data as AssessmentRow[] | null, error);
}

export async function listAssessmentAssignments(client: SupabaseClient, assessmentId: string): Promise<AssessmentAssignmentRow[]> {
  const { data, error } = await client.from('assessment_assignments').select('id,assessment_id,teacher_id,student_id,available_from,due_at,attempt_limit,status,created_at,updated_at').eq('assessment_id', assessmentId).order('created_at', { ascending: false });
  return requireData(data as AssessmentAssignmentRow[] | null, error);
}

export async function loadAssessmentDraft(client: SupabaseClient, assessmentId: string): Promise<AssessmentDraft> {
  const { data, error } = await client.rpc('get_assessment_draft', { p_assessment_id: assessmentId });
  return requireData(data as AssessmentDraft | null, error);
}

export async function saveAssessmentDraft(client: SupabaseClient, draft: AssessmentDraft): Promise<string> {
  const { data, error } = await client.rpc('save_assessment_draft', { p_draft: draft });
  return requireData(data as string | null, error);
}

export async function publishAssessment(client: SupabaseClient, assessmentId: string): Promise<void> {
  const { error } = await client.rpc('publish_assessment', { p_assessment_id: assessmentId });
  if (error) throw new Error(error.message);
}

export async function assignAssessment(client: SupabaseClient, input: {
  assessmentId: string;
  teacherId: string;
  studentId: string;
  availableFrom: string | null;
  dueAt: string | null;
  attemptLimit: number;
}): Promise<void> {
  const { error } = await client.from('assessment_assignments').insert({
    assessment_id: input.assessmentId,
    teacher_id: input.teacherId,
    student_id: input.studentId,
    available_from: input.availableFrom,
    due_at: input.dueAt,
    attempt_limit: input.attemptLimit,
  });
  if (error) throw new Error(error.message);
}
