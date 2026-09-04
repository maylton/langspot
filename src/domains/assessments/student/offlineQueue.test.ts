import { describe, expect, it } from 'vitest';
import { coalescePendingWrites, type PendingAssessmentWrite } from './offlineQueue';

describe('coalescePendingWrites', () => {
  it('keeps only the latest answer for each attempt question', () => {
    const writes: PendingAssessmentWrite[] = [
      { id: 'a:q', attemptId: 'a', questionId: 'q', answer: 'old', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'a:q', attemptId: 'a', questionId: 'q', answer: 'new', createdAt: '2026-01-01T00:00:01Z' },
      { id: 'a:q2', attemptId: 'a', questionId: 'q2', answer: 'other', createdAt: '2026-01-01T00:00:02Z' },
    ];
    expect(coalescePendingWrites(writes).map((write) => write.answer)).toEqual(['new', 'other']);
  });
});
