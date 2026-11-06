import type { AssessmentPresentedQuestion, StudentAttemptSection } from '../types';

export type StageStatus = 'done' | 'open' | 'available' | 'locked';
export type Stage = { section: StudentAttemptSection; number: number; questionCount: number; status: StageStatus };

/** Parts the student takes, in order, with their status. Sections without student questions (live-only) are skipped. */
export function buildStages(sections: StudentAttemptSection[], questions: AssessmentPresentedQuestion[], now = Date.now()): Stage[] {
  const counts = new Map<string, number>();
  for (const question of questions) counts.set(question.sectionId, (counts.get(question.sectionId) ?? 0) + 1);
  let previousDone = true;
  return [...sections].sort((a, b) => a.position - b.position).filter((section) => counts.has(section.id)).map((section, index) => {
    const expired = Boolean(section.expiresAt && new Date(section.expiresAt).getTime() <= now);
    const status: StageStatus = section.completedAt || (section.startedAt && expired) ? 'done' : section.startedAt ? 'open' : previousDone ? 'available' : 'locked';
    previousDone = status === 'done';
    return { section, number: index + 1, questionCount: counts.get(section.id) ?? 0, status };
  });
}

export const currentStage = (stages: Stage[]) => stages.find((stage) => stage.status === 'open') ?? null;
export const nextStage = (stages: Stage[]) => stages.find((stage) => stage.status === 'open' || stage.status === 'available') ?? null;
export const allStagesDone = (stages: Stage[]) => stages.length > 0 && stages.every((stage) => stage.status === 'done');

export function secondsLeft(expiresAt: string | null | undefined, now = Date.now()): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

export function formatClock(seconds: number | null): string {
  if (seconds === null) return 'Sem limite';
  const hours = Math.floor(seconds / 3600);
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const rest = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${minutes}:${rest}` : `${minutes}:${rest}`;
}

/** Short code the student types to confirm the final submission (prevents accidental sends). */
export function generateConfirmationCode(random: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32): string {
  return String(Math.floor(random() * 9000) + 1000);
}

/**
 * Student-facing part title. Generated Level Check sections are named like
 * "PART 1 — Reading · Floor A2 · R-A2-002"; the level role and item code must not be shown to the student.
 */
export function studentSectionTitle(title: string): string {
  const generated = title.match(/^PART (\d+) — ([^·]+?)\s*(?:·.*)?$/);
  return generated ? `Parte ${generated[1]} — ${generated[2].trim()}` : title;
}
