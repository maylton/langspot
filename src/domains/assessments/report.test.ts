import { describe, expect, it } from 'vitest';
import { buildStudentReport, formatReportItem } from './report';
import type { AssessmentResultSection, CefrProfile } from './types';

const section = (id: string, skill: AssessmentResultSection['skill'], score: number, maxScore: number): AssessmentResultSection => ({ id, title: id, skill, score, maxScore, percentage: maxScore ? (100 * score) / maxScore : null });

describe('buildStudentReport', () => {
  it('merges sections of the same skill and compares with the previous assessment', () => {
    const report = buildStudentReport({
      sections: [section('g1', 'grammar', 3, 4), section('g2', 'grammar', 1, 4), section('r', 'reading', 9, 10), section('u', 'use_of_english', 1, 4)],
      score: 70,
      previous: { attemptId: 'p', title: 'Unit 3', completedAt: '2026-10-01', score: 62.5, skills: { grammar: 40, reading: 95 } },
    });
    expect(report.skills).toEqual([
      expect.objectContaining({ key: 'grammar', percentage: 50, previousPercentage: 40, delta: 10 }),
      expect.objectContaining({ key: 'reading', percentage: 90, previousPercentage: 95, delta: -5 }),
      expect.objectContaining({ key: 'language_use', label: 'Language Use', percentage: 25, previousPercentage: null, delta: null }),
    ]);
    expect(report.scoreDelta).toBe(7.5);
  });

  it('derives strengths and priorities from percentages without a CEFR profile', () => {
    const report = buildStudentReport({ sections: [section('r', 'reading', 9, 10), section('l', 'listening', 8, 10), section('w', 'writing', 2, 10), section('g', 'grammar', 6.5, 10)], score: 63 });
    expect(report.strengths).toEqual(['Reading', 'Listening']);
    expect(report.priorities).toEqual(['Writing']);
    expect(report.scoreDelta).toBeNull();
  });

  it('uses the CEFR profile levels, strengths and priorities when available', () => {
    const profile = {
      overallLevel: 'B1', confidence: 'moderate', strengths: ['reading'], developmentPriorities: ['writing.task_achievement'], flags: [], manualReviewRequired: false,
      skills: { reading: { level: 'B1+', confidence: 'moderate' }, spoken_production: { level: 'B1', confidence: 'moderate' } },
      decisionRuleVersion: 'v', routingRuleVersion: 'v', reportModelVersion: 'v', provisionalStandard: true, disclaimer: '',
    } satisfies CefrProfile;
    const report = buildStudentReport({ sections: [section('r', 'reading', 5, 10), section('s', 'speaking', 1, 2)], score: 55, cefrProfile: profile });
    expect(report.skills.map((line) => line.level)).toEqual(['B1+', 'B1']);
    expect(report.strengths).toEqual(['Reading']);
    expect(report.priorities).toEqual(['Writing · cumprimento da tarefa']);
    // Speaking is rated with a rubric: the line shows the level, not a percentage, and no delta.
    expect(report.skills.find((line) => line.key === 'speaking')).toMatchObject({ rubric: true, level: 'B1', delta: null });
    expect(report.skills.find((line) => line.key === 'reading')?.rubric).toBe(false);
  });

  it('drops objective dimensions answered correctly from the priorities', () => {
    const profile = {
      overallLevel: 'A2+', confidence: 'low', strengths: [], developmentPriorities: ['writing', 'reading.sequence', 'reading.inference'], flags: ['MANUAL_REVIEW_REQUIRED'], manualReviewRequired: true,
      skills: { reading: { level: 'B1+', confidence: 'high', dimensions: { sequence: { level: 'A2', evidence: '1/1 objective items' }, inference: { level: 'A2', evidence: '1/3 objective items' } } } },
      decisionRuleVersion: 'v', routingRuleVersion: 'v', reportModelVersion: 'v', provisionalStandard: true, disclaimer: '',
    } as unknown as CefrProfile;
    const report = buildStudentReport({ sections: [section('r', 'reading', 15, 16)], score: 90, cefrProfile: profile });
    expect(report.priorities).toEqual(['Writing', 'Reading · inferência']);
  });

  it('formats unknown skill keys readably', () => expect(formatReportItem('use_of_tense.past_simple')).toBe('use of tense · past simple'));
});
