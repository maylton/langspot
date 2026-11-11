import { describe, expect, it } from 'vitest';
import { formatProfileItem, placementLabel } from './cefrLabels';

describe('CEFR labels', () => {
  it('translates placements and dimensions', () => {
    expect(placementLabel('A2+ approaching B1')).toBe('A2+, perto do B1');
    expect(placementLabel('B1 consolidation')).toBe('B1 (consolidar)');
    expect(formatProfileItem('mediation.accuracy_of_meaning')).toBe('Mediation · precisão do significado');
    expect(formatProfileItem('use_of_tense.past_simple')).toBe('use of tense · past simple');
  });
});
