import { describe, expect, it } from 'vitest';
import type { AttemptLiveQuestion, AttemptLiveStatus } from '../types';
import { buildMonitorStages, eventDetail, missingSummary, presenceOf, relativeTime, teacherSectionDetail } from './monitor';

const NOW = new Date('2026-11-11T15:00:00Z').getTime();
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();
const later = (seconds: number) => new Date(NOW + seconds * 1000).toISOString();
const question = (id: string, sectionId: string, extra: Partial<AttemptLiveQuestion> = {}): AttemptLiveQuestion =>
  ({ id, sectionId, type: 'multiple_choice', prompt: id, options: ['A', 'B'], live: false, answered: false, ...extra });

const status = (overrides: Partial<AttemptLiveStatus['attempt']> = {}, sectionPacing = true): AttemptLiveStatus => ({
  attempt: { id: 'a', status: 'in_progress', studentId: 's', studentName: 'Mateus', startedAt: ago(3600), submittedAt: null, expiresAt: null,
    lastSeenAt: ago(10), lastActivityAt: ago(10), integrityStatus: 'no_unusual_activity', viewingQuestionId: 'r2', ...overrides },
  assessment: { id: 'x', title: 'B1 Level Check', description: '', sectionPacing },
  sections: [
    { id: 'reading', title: 'PART 1 — Reading · Target B1 · R-B1-002', skill: 'reading', position: 0, startedAt: ago(1800), expiresAt: later(300) },
    { id: 'lu', title: 'PART 2 — Language Use · Target B1', skill: 'language_use', position: 1 },
    { id: 'si', title: 'PART 5 — Spoken Interaction · Target B1', skill: 'spoken_interaction', position: 2 },
    { id: 'prior', title: 'PART 0 — Warm-up', skill: 'reading', position: -1, startedAt: ago(3500), completedAt: ago(3000), completionReason: 'student' },
  ],
  questions: [
    question('w1', 'prior', { answered: true }),
    question('r1', 'reading', { answered: true }), question('r2', 'reading'), question('r3', 'reading'),
    question('l1', 'lu'), question('l2', 'lu'),
    question('s1', 'si', { type: 'speaking', options: [], live: true }),
  ],
  events: [],
});

describe('presenceOf', () => {
  it('is online while heartbeats arrive', () => expect(presenceOf(ago(30), ago(30), NOW)).toBe('online'));
  it('falls back to recent activity for clients without heartbeat', () => expect(presenceOf(null, ago(120), NOW)).toBe('recent'));
  it('is away after five minutes of silence', () => expect(presenceOf(ago(900), ago(600), NOW)).toBe('away'));
});

describe('relativeTime', () => {
  it('formats short and long gaps in Portuguese', () => {
    expect(relativeTime(ago(10), NOW)).toBe('agora');
    expect(relativeTime(ago(300), NOW)).toBe('há 5 min');
    expect(relativeTime(ago(3900), NOW)).toBe('há 1 h 5 min');
    expect(relativeTime(ago(2 * 86400), NOW)).toBe('há 2 dias');
    expect(relativeTime(null, NOW)).toBe('—');
  });
});

describe('buildMonitorStages', () => {
  it('orders parts, numbers student stages and marks where the student is', () => {
    const stages = buildMonitorStages(status(), NOW);
    expect(stages.map((stage) => [stage.section.id, stage.number, stage.state])).toEqual([
      ['prior', 1, 'done'], ['reading', 2, 'current'], ['lu', 3, 'pending'], ['si', null, 'teacher'],
    ]);
    expect(stages[1]).toMatchObject({ studentTitle: 'Parte 1 — Reading', teacherDetail: 'Target B1 · R-B1-002', answered: 1, secondsLeft: 300 });
  });

  it('marks every part done once the attempt is submitted', () => {
    const stages = buildMonitorStages(status({ status: 'grading', viewingQuestionId: null }), NOW);
    expect(stages.filter((stage) => stage.state !== 'teacher').every((stage) => stage.state === 'done')).toBe(true);
  });

  it('treats fully answered parts as done in forms without pacing', () => {
    const value = status({ viewingQuestionId: 'l1' }, false);
    value.questions = value.questions.map((item) => item.sectionId === 'reading' ? { ...item, answered: true } : item);
    expect(buildMonitorStages(value, NOW).find((stage) => stage.section.id === 'reading')?.state).toBe('done');
  });
});

describe('missingSummary', () => {
  it('lists unanswered questions and parts not started, never the teacher’s live tasks', () => {
    const missing = missingSummary(buildMonitorStages(status(), NOW));
    expect(missing.map(({ stage, unanswered }) => [stage.section.id, unanswered])).toEqual([['reading', 2], ['lu', 2]]);
  });
});

describe('teacherSectionDetail / eventDetail', () => {
  it('keeps only the teacher-facing suffix', () => {
    expect(teacherSectionDetail('PART 3 — Writing · Target B1')).toBe('Target B1');
    expect(teacherSectionDetail('Grammar')).toBe('');
  });
  it('describes durations and lengths', () => {
    expect(eventDetail({ type: 'tab_focus', metadata: { durationMs: 12400 } })).toBe('fora por 12 s');
    expect(eventDetail({ type: 'paste_detected', metadata: { pasteLength: 80 } })).toBe('80 caracteres');
    expect(eventDetail({ type: 'tab_blur', metadata: {} })).toBe('');
  });
});
