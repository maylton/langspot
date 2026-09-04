import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudentAssessmentResult, StudentAssessmentSummary, StudentAttemptPayload } from './types';

function ensure<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('O servidor não retornou os dados esperados.');
  return data;
}

export async function listStudentAssessments(client: SupabaseClient): Promise<StudentAssessmentSummary[]> {
  const { data, error } = await client.rpc('list_student_assessments');
  return ensure(data as StudentAssessmentSummary[] | null, error);
}

export async function startAssessmentAttempt(client: SupabaseClient, assignmentId: string, deviceSessionId: string): Promise<string> {
  const { data, error } = await client.rpc('start_assessment_attempt', { p_assignment_id: assignmentId, p_device_session_id: deviceSessionId });
  return ensure(data as string | null, error);
}

export async function loadAssessmentAttempt(client: SupabaseClient, attemptId: string): Promise<StudentAttemptPayload> {
  const { data, error } = await client.rpc('load_assessment_attempt', { p_attempt_id: attemptId });
  return ensure(data as StudentAttemptPayload | null, error);
}

export async function saveAssessmentResponse(client: SupabaseClient, attemptId: string, questionId: string, answer: string): Promise<void> {
  const { error } = await client.rpc('save_assessment_response', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_answer_payload: { value: answer },
  });
  if (error) throw new Error(error.message);
}

export async function submitAssessmentAttempt(client: SupabaseClient, attemptId: string): Promise<void> {
  const { error } = await client.rpc('submit_assessment_attempt', { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
}

export async function getStudentAssessmentResult(client: SupabaseClient, attemptId: string): Promise<StudentAssessmentResult> {
  const { data, error } = await client.rpc('get_student_assessment_result', { p_attempt_id: attemptId });
  return ensure(data as StudentAssessmentResult | null, error);
}
