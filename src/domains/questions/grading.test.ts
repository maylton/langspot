import { describe, expect, it } from 'vitest';
import { gradeQuestion, gradeQuestionSet } from './grading';
import type { QuestionDefinition } from './types';

const questions: QuestionDefinition[] = [
  { id: 'choice', type: 'multiple_choice', prompt: 'Choose.', options: ['A', 'B'], answer: 'A' },
  { id: 'blank', type: 'fill_blank', prompt: 'Complete.', options: [], answer: 'have been' },
  { id: 'boolean', type: 'true_false', prompt: 'True?', options: ['Verdadeiro', 'Falso'], answer: 'Verdadeiro' },
  { id: 'ordering', type: 'ordering', prompt: 'Order.', options: ['I', 'am', 'ready'], answer: 'I / am / ready' },
];

describe('question grading', () => {
  it.each([
    ['multiple choice', questions[0], 'a'],
    ['fill blank', questions[1], '  HAVE   BEEN '],
    ['true/false', questions[2], 'verdadeiro'],
    ['ordering', questions[3], 'I\u001fam\u001fready'],
  ])('grades a correct %s answer', (_, question, answer) => {
    expect(gradeQuestion(question, answer)).toMatchObject({ correct: true, score: 1, maxScore: 1 });
  });

  it('grades an incorrect answer', () => {
    expect(gradeQuestion(questions[0], 'B')).toMatchObject({ correct: false, score: 0 });
  });

  it('grades a question set and preserves the current percentage rounding', () => {
    const answers = { choice: 'A', blank: 'wrong', boolean: 'Verdadeiro', ordering: 'wrong / order' };
    expect(gradeQuestionSet({ questions }, answers)).toEqual({ answers, score: 2, total: 4, percentage: 50 });
  });

  it('returns a zero score and percentage for an empty set', () => {
    expect(gradeQuestionSet({ questions: [] }, {})).toEqual({ answers: {}, score: 0, total: 0, percentage: 0 });
  });
});
