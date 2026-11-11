/** A speaking task allows three recordings: the student may delete and record again twice. */
export const MAX_RECORDING_ATTEMPTS = 3;

export const attemptNumber = (discarded: number) => Math.min(MAX_RECORDING_ATTEMPTS, discarded + 1);
export const canRecordAgain = (discarded: number) => discarded + 1 < MAX_RECORDING_ATTEMPTS;
export const attemptsLeftLabel = (discarded: number) => {
  const left = MAX_RECORDING_ATTEMPTS - attemptNumber(discarded);
  return left === 0 ? 'Esta é a sua última tentativa.' : `Você ainda pode apagar e gravar de novo ${left === 1 ? 'uma vez' : `${left} vezes`}.`;
};

/** Active recording time, without the paused intervals. */
export function activeDuration(startedAt: number, pausedMs: number, pausedSince: number | null, now = Date.now()): number {
  return Math.max(0, now - startedAt - pausedMs - (pausedSince ? now - pausedSince : 0));
}
