import { describe, expect, it } from 'vitest';
import { assignmentCounts, assignmentState, isNotStarted, matchesAssignmentFilter, sortAssignments, toLocalInput, type AssignmentListRow } from './assignments';

const now = new Date('2026-11-13T12:00:00Z');
const row = (values: Partial<AssignmentListRow>): AssignmentListRow => ({
  id: 'a', assessment_id: 'as', student_id: 'st', available_from: null, due_at: null, attempt_limit: 1, status: 'assigned', created_at: '2026-11-10T00:00:00Z', ...values,
});

describe('assignmentState', () => {
  it('reads not-started assignments from their dates', () => {
    expect(assignmentState(row({}), now)).toBe('waiting');
    expect(assignmentState(row({ status: 'available', available_from: '2026-11-14T08:00:00Z' }), now)).toBe('scheduled');
    expect(assignmentState(row({ due_at: '2026-11-12T23:00:00Z' }), now)).toBe('overdue');
  });
  it('maps attempt statuses', () => {
    expect(assignmentState(row({ status: 'started' }), now)).toBe('in_progress');
    expect(assignmentState(row({ status: 'grading' }), now)).toBe('to_review');
    expect(assignmentState(row({ status: 'submitted' }), now)).toBe('to_review');
    expect(assignmentState(row({ status: 'completed', due_at: '2026-11-01T00:00:00Z' }), now)).toBe('completed');
    expect(assignmentState(row({ status: 'expired' }), now)).toBe('expired');
  });
  it('only lets the teacher change or cancel what has not started', () => {
    expect(isNotStarted(row({ status: 'available' }))).toBe(true);
    expect(isNotStarted(row({ status: 'started' }))).toBe(false);
  });
});

describe('filters, order and counts', () => {
  it('groups not-started and finished states', () => {
    expect(matchesAssignmentFilter('overdue', 'open')).toBe(true);
    expect(matchesAssignmentFilter('expired', 'done')).toBe(true);
    expect(matchesAssignmentFilter('in_progress', 'open')).toBe(false);
    expect(matchesAssignmentFilter('to_review', 'all')).toBe(true);
  });
  it('puts overdue first and the nearest due date first', () => {
    const rows = [row({ id: 'done', status: 'completed' }), row({ id: 'later', due_at: '2026-11-30T00:00:00Z' }), row({ id: 'soon', due_at: '2026-11-15T00:00:00Z' }),
      row({ id: 'late', due_at: '2026-11-01T00:00:00Z' }), row({ id: 'nodate' })];
    expect(sortAssignments(rows, now).map((item) => item.id)).toEqual(['late', 'soon', 'later', 'nodate', 'done']);
  });
  it('counts assignments per assessment', () => {
    const counts = assignmentCounts([row({ assessment_id: 'x' }), row({ assessment_id: 'x', status: 'completed' }), row({ assessment_id: 'y', status: 'started' })]);
    expect(counts.get('x')).toEqual({ total: 2, notStarted: 1 });
    expect(counts.get('y')).toEqual({ total: 1, notStarted: 0 });
  });
  it('formats dates for datetime-local inputs', () => {
    expect(toLocalInput(null)).toBe('');
    expect(toLocalInput('2026-11-13T12:05:00Z')).toMatch(/^2026-11-1\dT\d\d:05$/);
  });
});
