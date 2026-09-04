import { describe, expect, it } from 'vitest';
import { buildCefrProfile, classifyTasklet, productiveLevel, routeCefrTasklet } from './cefr';

describe('CEFR provisional rules', () => {
  it('uses the documented 8-item tasklet thresholds', () => {
    expect(classifyTasklet(3)).toBe('not_demonstrated');
    expect(classifyTasklet(4)).toBe('borderline');
    expect(classifyTasklet(5)).toBe('borderline');
    expect(classifyTasklet(6)).toBe('demonstrated');
  });

  it('routes 4-item screens through confirmation before a level decision', () => {
    expect(routeCefrTasklet('B1', 2, 4)).toMatchObject({ decision: 'confirm', nextLevel: 'B1', requiresConfirmation: true });
    expect(routeCefrTasklet('B1', 7, 8, true)).toMatchObject({ decision: 'move_up', nextLevel: 'B2' });
    expect(routeCefrTasklet('B1', 2, 8, true)).toMatchObject({ decision: 'move_down', nextLevel: 'A2' });
  });

  it('protects productive rubric decisions from a weak critical dimension', () => {
    expect(productiveLevel({ task_achievement: 'B2', range: 'B2', accuracy: 'B1', organisation: 'B2', register: 'B2' }, ['task_achievement', 'accuracy'])).toEqual({ level: 'B1+', priorities: ['accuracy'] });
  });

  it('does not hide a large productive gap behind receptive scores', () => {
    const profile = buildCefrProfile({
      reading: { level: 'C1', confidence: 'high' },
      listening: { level: 'B2', confidence: 'high' },
      writing: { level: 'A2', confidence: 'moderate' },
      spoken_interaction: { level: 'B1', confidence: 'moderate' },
      language_use: { level: 'C1', confidence: 'high' },
    });
    expect(profile.overallLevel).toBe('B1');
    expect(profile.flags).toContain('HIGH_SKILL_VARIANCE');
    expect(profile.flags).toContain('PRODUCTIVE_SKILLS_BELOW_OVERALL');
    expect(profile.manualReviewRequired).toBe(true);
  });
});
