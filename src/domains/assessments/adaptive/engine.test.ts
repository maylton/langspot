import { describe, expect, it } from 'vitest';
import { abilityToCefr, estimateAbility, processAdaptiveAnswer, selectNextQuestion, shouldStopAdaptiveSkill, type AdaptiveConfig, type AdaptiveState } from '.';

const config: AdaptiveConfig = { initialAbility: 5, minItems: 3, maxItems: 8, confidenceThreshold: 0.35 };
const state: AdaptiveState = { skill: 'grammar', ability: 5, confidence: 0, itemsAnswered: 0, correctCount: 0, incorrectCount: 0, recentAbilities: [] };

describe('adaptive placement engine', () => {
  it('raises ability after a correct difficult answer and lowers it after an error', () => {
    const raised = estimateAbility(state, 7, true);
    const lowered = estimateAbility(state, 3, false);
    expect(raised.ability).toBeGreaterThan(state.ability);
    expect(lowered.ability).toBeLessThan(state.ability);
  });

  it('selects the unused candidate closest to current ability', () => {
    expect(selectNextQuestion([{ id: 'easy', difficulty: 2, cefr: 'A1' }, { id: 'near', difficulty: 5.2, cefr: 'B1' }], 5)?.id).toBe('near');
  });

  it('stops at the hard maximum and can stop early when stable and confident', () => {
    expect(shouldStopAdaptiveSkill({ ...state, itemsAnswered: 8 }, config)).toBe(true);
    expect(shouldStopAdaptiveSkill({ ...state, itemsAnswered: 4, confidence: 0.5, recentAbilities: [5, 5.2, 5.1] }, config)).toBe(true);
  });

  it('maps ability with a versionable CEFR policy', () => {
    expect(abilityToCefr(1.9)).toBe('A1');
    expect(abilityToCefr(5.4)).toBe('B2');
    expect(processAdaptiveAnswer(state, 6, true, config).cefr).toBe('B2');
  });
});
