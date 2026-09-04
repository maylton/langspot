import type { AdaptiveConfig, AdaptiveState } from './types';

export function shouldStopAdaptiveSkill(state: AdaptiveState, config: AdaptiveConfig): boolean {
  if (state.itemsAnswered >= config.maxItems) return true;
  if (state.itemsAnswered < config.minItems || state.confidence < config.confidenceThreshold) return false;
  if (state.recentAbilities.length < 3) return false;
  const minimum = Math.min(...state.recentAbilities);
  const maximum = Math.max(...state.recentAbilities);
  return maximum - minimum <= 0.75;
}
