import { describe, expect, it } from 'vitest';
import { validateAssessmentDraft } from './validator';
import type { AssessmentDraft } from './types';

const validDraft = (): AssessmentDraft => ({
  id: null, title: 'Unit 1', description: '', type: 'unit', framework: 'none', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: 'A1', levelMax: 'A2', timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review',
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
  formVersion: 'GENERIC-1.0', decisionRuleVersion: 'objective-v1', routingRuleVersion: 'none', reportModelVersion: 'standard-report-v1',
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
  it('validates listening media and manual rubrics', () => {
    const draft = validDraft();
    draft.sections[0].questions = [
      { id: 'l1', questionBankId: null, weight: 1, required: true, snapshot: { id: 'l1', type: 'listening', prompt: 'Listen', options: ['A', 'B'], answer: 'A', audioPath: 'teacher/listening/a/l1.webm', maxPlays: 2 } },
      { id: 'w1', questionBankId: null, weight: 1, required: true, snapshot: { id: 'w1', type: 'writing', prompt: 'Write', options: [], answer: '', rubric: [{ key: 'grammar', label: 'Grammar', maxScore: 5 }] } },
      { id: 's1', questionBankId: null, weight: 1, required: true, snapshot: { id: 's1', type: 'speaking', prompt: 'Speak', options: [], answer: '', rubric: [{ key: 'fluency', label: 'Fluency', maxScore: 5 }] } },
    ];
    expect(validateAssessmentDraft(draft)).toEqual([]);
    delete draft.sections[0].questions[0].snapshot.audioPath;
    expect(validateAssessmentDraft(draft)).toContainEqual(expect.objectContaining({ path: 'sections.0.questions.0.audioPath' }));
  });
  it('accepts live speaking and mediation tasks in fixed forms', () => {
    const draft = validDraft();
    draft.sections.push({ id: 's2', title: 'Interaction', skill: 'spoken_interaction', instructions: '', weight: 1, drawCount: null, questions: [
      { id: 'q4', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q4', type: 'speaking', prompt: 'Agree on a plan', options: [], answer: '', administration: 'live', rubric: [{ key: 'interaction', label: 'Interaction', maxScore: 5 }] } },
    ] });
    expect(validateAssessmentDraft(draft)).toEqual([]);
  });
  it('rejects live objective questions and live tasks in adaptive forms', () => {
    const draft = validDraft();
    draft.sections[0].questions[0].snapshot.administration = 'live';
    expect(validateAssessmentDraft(draft).some((issue) => issue.path.endsWith('administration') && issue.severity === 'error')).toBe(true);
    const adaptive = validDraft();
    adaptive.assessmentMode = 'adaptive';
    adaptive.sections[0].questions.push({ id: 'q5', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q5', type: 'speaking', prompt: 'Talk', options: [], answer: '', administration: 'live', rubric: [{ key: 'fluency', label: 'Fluency', maxScore: 5 }] } });
    expect(validateAssessmentDraft(adaptive).some((issue) => issue.message.includes('forma fixa'))).toBe(true);
  });
  it('suggests live administration for spoken interaction recorded by the student', () => {
    const draft = validDraft();
    draft.sections.push({ id: 's2', title: 'Interaction', skill: 'spoken_interaction', instructions: '', weight: 1, drawCount: null, questions: [
      { id: 'q4', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q4', type: 'speaking', prompt: 'Agree on a plan', options: [], answer: '', rubric: [{ key: 'interaction', label: 'Interaction', maxScore: 5 }] } },
    ] });
    expect(validateAssessmentDraft(draft)).toEqual([expect.objectContaining({ severity: 'warning', path: 'sections.1.questions.0.administration' })]);
  });
  it('blocks Listening while the module is disabled', () => {
    const draft = validDraft();
    draft.sections.push({ id: 's3', title: 'Listening', skill: 'listening', instructions: '', weight: 1, drawCount: null, questions: [
      { id: 'q6', questionBankId: null, weight: 1, required: true, snapshot: { id: 'q6', type: 'listening', prompt: 'Listen', options: ['A', 'B'], answer: 'A', audioPath: 'a.webm', maxPlays: 2 } },
    ] });
    expect(validateAssessmentDraft(draft).filter((issue) => issue.severity === 'error')).toEqual([]);
    const errors = validateAssessmentDraft(draft, { listeningEnabled: false }).filter((issue) => issue.severity === 'error');
    expect(errors.map((issue) => issue.path)).toEqual(['sections.1.skill', 'sections.1.questions.0.type']);
  });
});
