import { describe, expect, it } from 'vitest';
import { countWords, filterReviewQueue, formatWaiting, nextReviewItemId } from './reviewQueue';
import type { ReviewQueueItem } from './types';

const item = (responseId: string, studentId: string, skill: ReviewQueueItem['skill']): ReviewQueueItem => ({
  responseId, attemptId: 'a', attemptStatus: 'grading', assessmentId: 'x', assessmentTitle: 'T', studentId, studentName: studentId, questionId: responseId,
  prompt: 'p', type: 'writing', skill, cefr: null, live: false, taskType: null, primaryEvidence: null, operationalDescriptor: null, responseConstraints: null, sourceMaterial: null, submittedAt: null,
});

describe('review queue helpers', () => {
  const items = [item('r1', 'ana', 'writing'), item('r2', 'bia', 'writing'), item('r3', 'ana', 'spoken_interaction')];

  it('filters by student and skill', () => {
    expect(filterReviewQueue(items, { studentId: 'ana', skill: 'all' }).map((entry) => entry.responseId)).toEqual(['r1', 'r3']);
    expect(filterReviewQueue(items, { studentId: 'all', skill: 'writing' }).map((entry) => entry.responseId)).toEqual(['r1', 'r2']);
  });

  it('advances to the next item, falling back to the previous one', () => {
    expect(nextReviewItemId(items, 'r1')).toBe('r2');
    expect(nextReviewItemId(items, 'r3')).toBe('r2');
    expect(nextReviewItemId([items[0]], 'r1')).toBeNull();
    expect(nextReviewItemId(items, 'missing')).toBe('r1');
  });

  it('counts words in a written answer', () => {
    expect(countWords('  Dear Ana,\nthanks   for the invite. ')).toBe(6);
    expect(countWords('')).toBe(0);
    expect(countWords(null)).toBe(0);
  });

  it('describes how long a submission has waited', () => {
    const now = new Date('2026-11-06T12:00:00Z').getTime();
    expect(formatWaiting('2026-11-06T11:30:00Z', now)).toBe('há menos de 1 h');
    expect(formatWaiting('2026-11-06T07:00:00Z', now)).toBe('há 5 h');
    expect(formatWaiting('2026-11-04T12:00:00Z', now)).toBe('há 2 dias');
    expect(formatWaiting(null, now)).toBe('');
  });
});
