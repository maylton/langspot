import { describe, expect, it } from 'vitest';
import { allStagesDone, buildStages, currentStage, formatClock, generateConfirmationCode, nextStage, secondsLeft } from './pacing';
import type { AssessmentPresentedQuestion, StudentAttemptSection } from '../types';

const now = new Date('2026-11-06T12:00:00Z').getTime();
const section = (id: string, position: number, extra: Partial<StudentAttemptSection> = {}): StudentAttemptSection => ({ id, title: id, instructions: '', position, ...extra });
const question = (id: string, sectionId: string) => ({ id, sectionId, type: 'multiple_choice', prompt: id, options: [], required: true }) as AssessmentPresentedQuestion;

describe('assessment pacing', () => {
  const questions = [question('q1', 's1'), question('q2', 's1'), question('q3', 's2'), question('q4', 's3')];

  it('orders parts, skips sections without student questions and locks later parts', () => {
    const stages = buildStages([section('s2', 1), section('live', 2), section('s1', 0), section('s3', 3)], questions, now);
    expect(stages.map(({ section: { id }, number, status, questionCount }) => [id, number, status, questionCount])).toEqual([
      ['s1', 1, 'available', 2], ['s2', 2, 'locked', 1], ['s3', 3, 'locked', 1],
    ]);
    expect(nextStage(stages)?.section.id).toBe('s1');
    expect(currentStage(stages)).toBeNull();
  });

  it('treats an expired open part as done and unlocks the next one', () => {
    const stages = buildStages([
      section('s1', 0, { startedAt: '2026-11-06T11:00:00Z', completedAt: '2026-11-06T11:20:00Z' }),
      section('s2', 1, { startedAt: '2026-11-06T11:30:00Z', expiresAt: '2026-11-06T11:59:00Z' }),
      section('s3', 2),
    ], questions, now);
    expect(stages.map(({ status }) => status)).toEqual(['done', 'done', 'available']);
    expect(allStagesDone(stages)).toBe(false);
  });

  it('resumes the open part', () => {
    const stages = buildStages([section('s1', 0, { completedAt: 'x', startedAt: 'x' }), section('s2', 1, { startedAt: '2026-11-06T11:55:00Z', expiresAt: '2026-11-06T12:05:00Z' }), section('s3', 2)], questions, now);
    expect(currentStage(stages)?.section.id).toBe('s2');
    expect(stages[2].status).toBe('locked');
    expect(secondsLeft(stages[1].section.expiresAt, now)).toBe(300);
  });

  it('formats clocks and confirmation codes', () => {
    expect(formatClock(null)).toBe('Sem limite');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(generateConfirmationCode(() => 0)).toBe('1000');
    expect(generateConfirmationCode(() => 0.99999)).toBe('9999');
    expect(allStagesDone(buildStages([section('s1', 0, { startedAt: 'x', completedAt: 'x' })], [question('q', 's1')], now))).toBe(true);
  });
  it('hides level roles and item codes from generated part titles', async () => {
    const { studentSectionTitle } = await import('./pacing');
    expect(studentSectionTitle('PART 1 — Reading · Floor A2 · R-A2-002')).toBe('Parte 1 — Reading');
    expect(studentSectionTitle('PART 2 — Language Use · Target B1')).toBe('Parte 2 — Language Use');
    expect(studentSectionTitle('PART 4 — Spoken Production · Target B1')).toBe('Parte 4 — Spoken Production');
    expect(studentSectionTitle('Unit 4 vocabulary')).toBe('Unit 4 vocabulary');
  });
});
