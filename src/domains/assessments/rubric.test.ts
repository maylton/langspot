import { describe, expect, it } from 'vitest';
import { calculateRubricScore } from './rubric';

const rubric = [{ key: 'grammar', label: 'Grammar', maxScore: 5 }, { key: 'range', label: 'Range', maxScore: 5 }];

describe('calculateRubricScore', () => {
  it('maps criterion totals to the official response weight', () => expect(calculateRubricScore(rubric, { grammar: 4, range: 3 }, 2)).toBe(1.4));
  it('rejects values outside the configured rubric', () => expect(() => calculateRubricScore(rubric, { grammar: 6, range: 3 }, 2)).toThrow());
});
