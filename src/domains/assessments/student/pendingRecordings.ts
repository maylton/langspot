/**
 * Speaking recordings that exist only in the browser (still recording, or recorded and not sent).
 * The runner sends them before it closes a part or submits, so a student who moves on without
 * pressing "Enviar gravação" does not lose the recording.
 */
type Flush = () => Promise<void>;
const pending = new Map<string, Flush>();

export function setPendingRecording(questionId: string, flush: Flush | null): void {
  if (flush) pending.set(questionId, flush); else pending.delete(questionId);
}

export const hasPendingRecordings = () => pending.size > 0;

/** Sends every pending recording; throws if one cannot be sent. */
export async function flushPendingRecordings(): Promise<void> {
  for (const flush of [...pending.values()]) await flush();
}
