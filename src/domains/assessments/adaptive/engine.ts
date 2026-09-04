import { estimateAbility } from './abilityEstimator';
import { shouldStopAdaptiveSkill } from './stoppingRules';
import type { AdaptiveAnswerOutcome, AdaptiveConfig, AdaptiveState } from './types';
import type { CefrLevel } from '../types';

export function abilityToCefr(ability: number): CefrLevel {
  if (ability < 2) return 'A1';
  if (ability < 3.5) return 'A2';
  if (ability < 5.25) return 'B1';
  if (ability < 7) return 'B2';
  if (ability < 8.75) return 'C1';
  return 'C2';
}

export function processAdaptiveAnswer(state: AdaptiveState, difficulty: number, correct: boolean, config: AdaptiveConfig): AdaptiveAnswerOutcome {
  const nextState = estimateAbility(state, difficulty, correct);
  return { state: nextState, cefr: abilityToCefr(nextState.ability), stopped: shouldStopAdaptiveSkill(nextState, config) };
}
