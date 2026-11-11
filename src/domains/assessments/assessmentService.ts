import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssessmentAssignmentRow, AssessmentAttemptRow, AssessmentRow } from './database';
import type { AssessmentReportNote, PreviousAssessmentForReport } from './report';
import type { ActiveTeacherAttempt, AttemptLiveStatus, AssessmentDraft, AssessmentProgressReport, CefrLevel, CefrLevelCheckPreset, CefrProfile, AssessmentIntegritySignals, LiveAssessmentSession, ReviewQueue, TeacherAssessmentResult } from './types';

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
  const [{ data, error }, metadata, pacingResult] = await Promise.all([
    client.rpc('get_assessment_draft', { p_assessment_id: assessmentId }),
    client.rpc('get_assessment_cefr_metadata', { p_assessment_id: assessmentId }),
    client.rpc('get_assessment_pacing', { p_assessment_id: assessmentId }),
  ]);
  const loaded = requireData(data as AssessmentDraft | null, error);
  const pacing = pacingResult.error ? null : pacingResult.data as { sectionPacing: 'none' | 'sections'; sections: { timeLimitMinutes: number | null }[] } | null;
  const draft: AssessmentDraft = pacing ? { ...loaded, sectionPacing: pacing.sectionPacing, sections: loaded.sections.map((section, index) => ({ ...section, timeLimitMinutes: pacing.sections[index]?.timeLimitMinutes ?? null })) } : { ...loaded, sectionPacing: 'none' };
  if (metadata.error || !metadata.data) return { ...draft, framework: 'none', formVersion: 'GENERIC-1.0', decisionRuleVersion: 'objective-v1', routingRuleVersion: 'none', reportModelVersion: 'standard-report-v1' };
  const cefr = metadata.data as Pick<AssessmentDraft, 'framework' | 'formVersion' | 'decisionRuleVersion' | 'routingRuleVersion' | 'reportModelVersion'> & { sections: Partial<AssessmentDraft['sections'][number]>[] };
  return { ...draft, ...cefr, sections: draft.sections.map((section, index) => ({ ...section, ...(cefr.sections[index] ?? {}) })) };
}

export async function saveAssessmentDraft(client: SupabaseClient, draft: AssessmentDraft): Promise<string> {
  const { data, error } = await client.rpc('save_assessment_draft', { p_draft: draft });
  const id = requireData(data as string | null, error);
  const { error: metadataError } = await client.rpc('save_assessment_cefr_metadata', { p_assessment_id: id, p_metadata: draft });
  if (metadataError) throw new Error(metadataError.message);
  const { error: pacingError } = await client.rpc('save_assessment_pacing', { p_assessment_id: id, p_draft: { sectionPacing: draft.sectionPacing ?? 'none', sections: draft.sections.map((section) => ({ timeLimitMinutes: section.timeLimitMinutes ?? null })) } });
  if (pacingError) throw new Error(pacingError.message);
  return id;
}

export async function publishAssessment(client: SupabaseClient, assessmentId: string): Promise<void> {
  const { error } = await client.rpc('publish_assessment', { p_assessment_id: assessmentId });
  if (error) throw new Error(error.message);
}

export interface AssessmentDeletionImpact { assignments: number; inProgressStudents: number; submittedStudents: number }

/** What deleting an assessment would remove; used by the confirmation dialog. */
export async function getAssessmentDeletionImpact(client: SupabaseClient, assessmentId: string): Promise<AssessmentDeletionImpact> {
  const { data, error } = await client.rpc('get_assessment_deletion_impact', { p_assessment_id: assessmentId });
  return requireData(data as AssessmentDeletionImpact | null, error);
}

/** Permanently deletes an assessment with its assignments, attempts and results. */
export async function deleteAssessment(client: SupabaseClient, assessmentId: string): Promise<void> {
  const { error } = await client.rpc('delete_assessment', { p_assessment_id: assessmentId });
  if (error) throw new Error(error.message);
}

export async function listCefrLevelCheckPresets(client: SupabaseClient): Promise<CefrLevelCheckPreset[]> {
  const { data, error } = await client.from('cefr_level_check_presets').select('*').eq('active', true).order('target_level');
  const rows = requireData(data, error) as Array<Record<string, string | number | null>>;
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name), purpose: String(row.purpose),
    targetLevel: String(row.target_level) as CefrLevelCheckPreset['targetLevel'],
    floorLevel: row.floor_level as CefrLevelCheckPreset['floorLevel'],
    ceilingLevel: row.ceiling_level as CefrLevelCheckPreset['ceilingLevel'],
    formVersion: String(row.form_version), presetVersion: String(row.preset_version),
    estimatedDurationMinMinutes: Number(row.estimated_duration_min_minutes),
    estimatedDurationMaxMinutes: Number(row.estimated_duration_max_minutes),
  }));
}

export const CURRENT_PILOT_BANK_VERSION = 'pilot-0.8';

export async function generateAssessmentFromPreset(client: SupabaseClient, presetId: string, bankVersion = CURRENT_PILOT_BANK_VERSION, selectionSeed = 'pilot-form-1'): Promise<string> {
  const { data, error } = await client.rpc('generate_assessment_from_preset', { p_preset_id: presetId, p_bank_version: bankVersion, p_selection_seed: selectionSeed });
  return requireData(data as string | null, error);
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
  const [{ data, error }, profile] = await Promise.all([client.rpc('get_assessment_result', { p_attempt_id: attemptId }), client.rpc('get_attempt_cefr_profile', { p_attempt_id: attemptId })]);
  const result = requireData(data as TeacherAssessmentResult | null, error);
  return { ...result, cefrProfile: profile.error ? null : profile.data as CefrProfile | null };
}

export async function overrideAssessmentCefrLevel(client: SupabaseClient, attemptId: string, level: CefrLevel, reason: string): Promise<void> {
  const { error } = await client.rpc('override_assessment_cefr_level', { p_attempt_id: attemptId, p_level: level, p_reason: reason });
  if (error) throw new Error(error.message);
}

export async function getCefrItemAnalytics(client: SupabaseClient, assessmentId: string): Promise<{ calibrationStatus: string; minimumCalibrationResponses: number; items: Array<{ questionId: string; prompt: string; skill: string; cefr: CefrLevel; responses: number; facility: number | null; averageTimeMs: number | null; discrimination: number | null; reliabilityStatus: string }> }> {
  const { data, error } = await client.rpc('get_cefr_item_analytics', { p_assessment_id: assessmentId });
  return requireData(data as never, error);
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

/** Ids of the teacher's assessments that contain at least one live task. */
export async function listAssessmentIdsWithLiveTasks(client: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await client.from('assessment_questions').select('assessment_id').eq('question_snapshot->>administration', 'live');
  return new Set(requireData(data as { assessment_id: string }[] | null, error).map((row) => row.assessment_id));
}

export async function openLiveAssessmentSession(client: SupabaseClient, assessmentId: string, studentId: string): Promise<string> {
  const { data, error } = await client.rpc('open_live_assessment_session', { p_assessment_id: assessmentId, p_student_id: studentId });
  return requireData(data as string | null, error);
}

export async function getLiveAssessmentSession(client: SupabaseClient, attemptId: string): Promise<LiveAssessmentSession> {
  const { data, error } = await client.rpc('get_live_assessment_session', { p_attempt_id: attemptId });
  return requireData(data as LiveAssessmentSession | null, error);
}

export async function scoreLiveAssessmentResponse(client: SupabaseClient, input: {
  attemptId: string;
  questionId: string;
  score: number;
  feedback: string;
  rubricScores: Record<string, number>;
  notes: string;
  durationSeconds: number | null;
}): Promise<void> {
  const { error } = await client.rpc('score_live_assessment_response', {
    p_attempt_id: input.attemptId,
    p_question_id: input.questionId,
    p_score: input.score,
    p_feedback: input.feedback,
    p_rubric_scores: input.rubricScores,
    p_notes: input.notes,
    p_duration_seconds: input.durationSeconds,
  });
  if (error) throw new Error(error.message);
}

export async function completeLiveAssessmentSession(client: SupabaseClient, attemptId: string): Promise<void> {
  const { error } = await client.rpc('complete_live_assessment_session', { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
}

export async function getAssessmentReportNote(client: SupabaseClient, attemptId: string): Promise<AssessmentReportNote | null> {
  const { data, error } = await client.rpc('get_assessment_report_note', { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
  return (data as AssessmentReportNote | null) ?? null;
}

export async function saveAssessmentReportNote(client: SupabaseClient, attemptId: string, summary: string, nextSteps: string): Promise<void> {
  const { error } = await client.rpc('save_assessment_report_note', { p_attempt_id: attemptId, p_summary: summary, p_next_steps: nextSteps });
  if (error) throw new Error(error.message);
}

export async function getPreviousAssessmentForReport(client: SupabaseClient, attemptId: string): Promise<PreviousAssessmentForReport | null> {
  const { data, error } = await client.rpc('get_previous_assessment_for_report', { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
  return (data as PreviousAssessmentForReport | null) ?? null;
}

export async function listAssessmentReviewQueue(client: SupabaseClient): Promise<ReviewQueue> {
  const { data, error } = await client.rpc('list_assessment_review_queue');
  return requireData(data as ReviewQueue | null, error);
}

export type AssessmentFeatureFlags = { listening: boolean };

/** Reads the server-side module switches; falls back to the build default if unavailable. */
export async function getAssessmentFeatureFlags(client: SupabaseClient, fallback: AssessmentFeatureFlags): Promise<AssessmentFeatureFlags> {
  const { data, error } = await client.from('assessment_feature_flags').select('key,enabled');
  if (error || !data) return fallback;
  const listening = (data as { key: string; enabled: boolean }[]).find((row) => row.key === 'listening');
  return { listening: listening ? listening.enabled : fallback.listening };
}

export async function getAssessmentIntegritySignals(client: SupabaseClient, attemptId: string): Promise<AssessmentIntegritySignals> {
  const { data, error } = await client.rpc('get_assessment_integrity_signals', { p_attempt_id: attemptId });
  return requireData(data as AssessmentIntegritySignals | null, error);
}

export async function listActiveTeacherAttempts(client: SupabaseClient): Promise<ActiveTeacherAttempt[]> {
  const { data, error } = await client.rpc('list_active_teacher_attempts');
  return requireData(data as ActiveTeacherAttempt[] | null, error);
}

export async function getAttemptLiveStatus(client: SupabaseClient, attemptId: string): Promise<AttemptLiveStatus> {
  const { data, error } = await client.rpc('get_attempt_live_status', { p_attempt_id: attemptId });
  return requireData(data as AttemptLiveStatus | null, error);
}
