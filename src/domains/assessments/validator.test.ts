import { describe, expect, it } from 'vitest';
import { validateAssessmentDraft } from './validator';
import type { AssessmentDraft } from './types';

const validDraft = (): AssessmentDraft => ({
  id: null, title: 'Unit 1', description: '', type: 'unit', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: 'A1', levelMax: 'A2', timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review',
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
  sections: [{ id: 's1', title: 'Grammar', skill: 'grammar', instructions: '', weight: 1, drawCount: null, questions: [
    { id: 'q1', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q1', type: 'multiple_choice', prompt: 'Choose', options: ['A', 'B'], answer: 'A' } },
    { id: 'q2', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q2', type: 'true_false', prompt: 'True?', options: ['True', 'False'], answer: 'True' } },
    { id: 'q3', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q3', type: 'fill_blank', prompt: 'Complete', options: [], answer: 'word' } },
  ] }],
});

describe('validateAssessmentDraft', () => {
  it('accepts a complete objective assessment', () => expect(validateAssessmentDraft(validDraft())).toEqual([]));
  it('blocks empty sections and invalid questions', () => {
    const draft = validDraft();
    draft.sections[0].questions = [];
    expect(validateAssessmentDraft(draft).some((issue) => issue.severity === 'error')).toBe(true);
  });
  it('warns without blocking a short valid assessment', () => {
    const draft = validDraft();
    draft.sections[0].questions = draft.sections[0].questions.slice(0, 1);
    expect(validateAssessmentDraft(draft)).toContainEqual(expect.objectContaining({ severity: 'warning' }));
  });
  it('blocks a pool draw larger than the available question set', () => {
    const draft = validDraft();
    draft.sections[0].drawCount = 4;
    expect(validateAssessmentDraft(draft)).toContainEqual(expect.objectContaining({ path: 'sections.0.drawCount', severity: 'error' }));
  });
  it('requires calibrated questions and a valid range for adaptive placement', () => {
    const draft = validDraft();
    draft.assessmentMode = 'adaptive'; draft.navigationMode = 'linear'; draft.adaptiveMinItems = 3; draft.adaptiveMaxItems = 2;
    expect(validateAssessmentDraft(draft).filter((issue) => issue.severity === 'error').length).toBeGreaterThan(1);
  });
});
