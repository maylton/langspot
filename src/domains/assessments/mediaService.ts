import type { SupabaseClient } from '@supabase/supabase-js';

export const ASSESSMENT_AUDIO_BUCKET = 'assessment-audio';

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('O servidor não retornou os dados de mídia.');
  return data;
}

export async function uploadListeningAudio(client: SupabaseClient, teacherId: string, assessmentId: string, questionId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'webm';
  const path = `${teacherId}/listening/${assessmentId}/${questionId}-${crypto.randomUUID()}.${extension}`;
  const { data, error } = await client.storage.from(ASSESSMENT_AUDIO_BUCKET).upload(path, file, { contentType: file.type || 'audio/webm' });
  return requireData(data, error).path;
}

export async function createAssessmentAudioUrl(client: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await client.storage.from(ASSESSMENT_AUDIO_BUCKET).createSignedUrl(path, 300);
  return requireData(data, error).signedUrl;
}

export async function beginListeningPlay(client: SupabaseClient, attemptId: string, questionId: string): Promise<{ allowed: boolean; playCount: number; maxPlays: number; audioPath: string }> {
  const { data, error } = await client.rpc('begin_assessment_audio_play', { p_attempt_id: attemptId, p_question_id: questionId });
  return requireData(data as { allowed: boolean; playCount: number; maxPlays: number; audioPath: string } | null, error);
}

export async function getSpeakingUploadTarget(client: SupabaseClient, attemptId: string, questionId: string, extension: string): Promise<string> {
  const { data, error } = await client.rpc('get_speaking_upload_target', { p_attempt_id: attemptId, p_question_id: questionId, p_extension: extension });
  return requireData(data as string | null, error);
}

export async function uploadSpeakingRecording(client: SupabaseClient, path: string, blob: Blob): Promise<void> {
  const { error } = await client.storage.from(ASSESSMENT_AUDIO_BUCKET).upload(path, blob, { contentType: blob.type || 'audio/webm' });
  if (error) throw new Error(error.message);
}

export async function registerSpeakingRecording(client: SupabaseClient, attemptId: string, questionId: string, path: string, durationMs: number): Promise<void> {
  const { error } = await client.rpc('register_speaking_recording', { p_attempt_id: attemptId, p_question_id: questionId, p_storage_path: path, p_duration_ms: durationMs });
  if (error) throw new Error(error.message);
}
