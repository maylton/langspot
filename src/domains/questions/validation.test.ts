import { describe, expect, it } from 'vitest';
import { validateQuestion } from './validation';
import type { QuestionDefinition } from './types';

const validQuestion: QuestionDefinition = {
  id: 'choice',
  type: 'multiple_choice',
  prompt: 'Choose the correct answer.',
  options: ['has', 'have', 'had'],
  answer: 'have',
};

describe('question validation', () => {
  it('accepts a valid question', () => {
    expect(validateQuestion(validQuestion)).toEqual({ valid: true, errors: [] });
  });

  it('rejects duplicate options', () => {
    const result = validateQuestion({ ...validQuestion, options: ['Have', ' have '] });
    expect(result.errors.map((error) => error.code)).toContain('duplicate_option');
  });

  it('rejects an empty prompt', () => {
    const result = validateQuestion({ ...validQuestion, prompt: '  ' });
    expect(result.errors.map((error) => error.code)).toContain('empty_prompt');
  });

  it('requires at least two multiple-choice options', () => {
    const result = validateQuestion({ ...validQuestion, options: ['have'] });
    expect(result.errors.map((error) => error.code)).toContain('insufficient_options');
  });

  it('rejects a missing answer', () => {
    const result = validateQuestion({ ...validQuestion, answer: '' });
    expect(result.errors.map((error) => error.code)).toContain('missing_answer');
  });

  it('rejects an answer outside the options', () => {
    const result = validateQuestion({ ...validQuestion, answer: 'was' });
    expect(result.errors.map((error) => error.code)).toContain('answer_not_in_options');
  });

  it('rejects inconsistent ordering', () => {
    const result = validateQuestion({
      id: 'ordering',
      type: 'ordering',
      prompt: 'Order the words.',
      options: ['I', 'am', 'ready'],
      answer: 'I / ready',
    });
    expect(result.errors.map((error) => error.code)).toContain('invalid_ordering');
  });
});
