/**
 * One microphone stream for the whole assessment.
 *
 * Every getUserMedia call may show a permission prompt, and a prompt drops the browser out of
 * fullscreen and blurs the window. The stream granted in the device check (before fullscreen)
 * is kept and reused by every Speaking recording; the runner releases it when the attempt ends.
 * While a prompt can be on screen, isPermissionPromptActive() is true so integrity events caused
 * by the prompt are not recorded against the student.
 */
let shared: MediaStream | null = null;
let pending: Promise<MediaStream> | null = null;
let promptUntil = 0;
const PROMPT_GRACE_MS = 2500;

const isLive = (stream: MediaStream | null) => Boolean(stream?.getAudioTracks().some((track) => track.readyState === 'live'));

export function isPermissionPromptActive(now = Date.now()): boolean {
  return pending !== null || now < promptUntil;
}

export async function acquireMicrophone(): Promise<MediaStream> {
  if (shared && isLive(shared)) return shared;
  if (pending) return pending;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('A gravação de áudio não é suportada neste dispositivo.');
  pending = navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => { shared = stream; return stream; })
    .finally(() => { pending = null; promptUntil = Date.now() + PROMPT_GRACE_MS; });
  return pending;
}

export function releaseMicrophone(): void {
  shared?.getTracks().forEach((track) => track.stop());
  shared = null;
}

/** Test hook. */
export function resetMicrophoneForTests(): void { shared = null; pending = null; promptUntil = 0; }
