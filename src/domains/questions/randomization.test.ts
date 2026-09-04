import { describe, expect, it } from 'vitest';
import { seededShuffle, shuffle } from './randomization';

const items = Array.from({ length: 12 }, (_, index) => index + 1);

describe('question randomization', () => {
  it('does not lose or duplicate elements', () => {
    const result = shuffle(items);
    expect(result).toHaveLength(items.length);
    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('does not mutate the input', () => {
    const original = [...items];
    shuffle(items);
    expect(items).toEqual(original);
  });

  it('produces the same order for the same seed', () => {
    expect(seededShuffle(items, 'attempt-42')).toEqual(seededShuffle(items, 'attempt-42'));
  });

  it('can produce different orders for different seeds', () => {
    expect(seededShuffle(items, 'attempt-42')).not.toEqual(seededShuffle(items, 'attempt-43'));
  });
});
