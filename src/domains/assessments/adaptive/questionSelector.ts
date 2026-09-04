import type { AdaptiveQuestionCandidate } from './types';

export function selectNextQuestion(candidates: readonly AdaptiveQuestionCandidate[], ability: number): AdaptiveQuestionCandidate | null {
  let selected: AdaptiveQuestionCandidate | null = null;
  let smallestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate.difficulty - ability);
    if (distance < smallestDistance) {
      selected = candidate;
      smallestDistance = distance;
    }
  }
  return selected;
}
