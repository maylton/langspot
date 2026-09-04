import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssessmentAssignmentRow, AssessmentAttemptRow, AssessmentRow } from './database';
import type { AssessmentDraft, AssessmentProgressReport, CefrLevel, TeacherAssessmentResult } from './types';

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

export async function listAssessmentAttempts(client: SupabaseClient, assessmentId: string): Promise<AssessmentAttemptRow[]> {
  const { data, error } = await client.from('assessment_attempts').select('*').eq('assessment_id', assessmentId).order('started_at', { ascending: false });
  return requireData(data as AssessmentAttemptRow[] | null, error);
}

export async function getAssessmentResult(client: SupabaseClient, attemptId: string): Promise<TeacherAssessmentResult> {
  const { data, error } = await client.rpc('get_assessment_result', { p_attempt_id: attemptId });
  return requireData(data as TeacherAssessmentResult | null, error);
}

export async function reviewAssessmentResponse(client: SupabaseClient, responseId: string, score: number, feedback: string, rubricScores: Record<string, number> = {}): Promise<void> {
  const { error } = await client.rpc('review_assessment_response', { p_response_id: responseId, p_score: score, p_feedback: feedback, p_rubric_scores: rubricScores });
  if (error) throw new Error(error.message);
}

export async function finalizeAssessmentReview(client: SupabaseClient, attemptId: string): Promise<void> {
  const { error } = await client.rpc('finalize_assessment_review', { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
}

export async function getAssessmentProgress(client: SupabaseClient, studentId: string): Promise<AssessmentProgressReport> {
  const { data, error } = await client.rpc('get_assessment_progress', { p_student_id: studentId });
  return requireData(data as AssessmentProgressReport | null, error);
}

export async function confirmAssessmentLevel(client: SupabaseClient, studentId: string, attemptId: string, level: CefrLevel): Promise<void> {
  const { error } = await client.rpc('confirm_assessment_level_update', { p_student_id: studentId, p_attempt_id: attemptId, p_level: level });
  if (error) throw new Error(error.message);
}
