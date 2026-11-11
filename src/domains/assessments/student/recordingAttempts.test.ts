import { describe, expect, it } from 'vitest';
import { activeDuration, attemptNumber, attemptsLeftLabel, canRecordAgain } from './recordingAttempts';

describe('recording attempts', () => {
  it('allows three recordings: two deletions', () => {
    expect([0, 1, 2].map(canRecordAgain)).toEqual([true, true, false]);
    expect([0, 1, 2].map(attemptNumber)).toEqual([1, 2, 3]);
    expect(attemptsLeftLabel(0)).toBe('Você ainda pode apagar e gravar de novo 2 vezes.');
    expect(attemptsLeftLabel(1)).toBe('Você ainda pode apagar e gravar de novo uma vez.');
    expect(attemptsLeftLabel(2)).toBe('Esta é a sua última tentativa.');
  });
  it('excludes paused time from the recording duration', () => {
    expect(activeDuration(0, 10_000, null, 60_000)).toBe(50_000);
    expect(activeDuration(0, 0, 40_000, 60_000)).toBe(40_000);
  });
});
