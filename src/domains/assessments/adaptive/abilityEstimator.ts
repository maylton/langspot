import type { AdaptiveState } from './types';

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function estimateAbility(state: AdaptiveState, difficulty: number, correct: boolean): AdaptiveState {
  const challenge = clamp(difficulty, 1, 10) - state.ability;
  const adjustment = correct
    ? 0.65 + Math.max(0, challenge) * 0.18
    : -(0.65 + Math.max(0, -challenge) * 0.18);
  const ability = Number(clamp(state.ability + adjustment, 1, 10).toFixed(3));
  const itemsAnswered = state.itemsAnswered + 1;
  return {
    ...state,
    ability,
    confidence: Number(Math.min(0.95, itemsAnswered / 8).toFixed(3)),
    itemsAnswered,
    correctCount: state.correctCount + (correct ? 1 : 0),
    incorrectCount: state.incorrectCount + (correct ? 0 : 1),
    recentAbilities: [...state.recentAbilities, ability].slice(-4),
  };
}
