import { describe, expect, it } from 'vitest';
import { joinOrderingAnswer, normalizeInteractiveAnswer, normalizeQuestionAnswer, splitOrderingAnswer } from './normalization';
import type { OrderingQuestion } from './types';

const orderingQuestion: OrderingQuestion = {
  id: 'ordering',
  type: 'ordering',
  prompt: 'Order the words.',
  options: ['I', 'am', 'ready'],
  answer: 'I / am / ready',
};

describe('question normalization', () => {
  it('normalizes case, surrounding whitespace, and repeated whitespace', () => {
    expect(normalizeInteractiveAnswer('  HeLLo   WORLD  ')).toBe('hello world');
  });

  it('keeps empty strings empty', () => {
    expect(normalizeInteractiveAnswer('   ')).toBe('');
    expect(splitOrderingAnswer('   ')).toEqual([]);
  });

  it('splits slash and internal-separator ordering formats', () => {
    expect(splitOrderingAnswer('I / am / ready')).toEqual(['I', 'am', 'ready']);
    expect(splitOrderingAnswer(joinOrderingAnswer(['I', 'am', 'ready']))).toEqual(['I', 'am', 'ready']);
  });

  it('normalizes equivalent ordering answers', () => {
    expect(normalizeQuestionAnswer(orderingQuestion, '  i / AM / ready ')).toBe('i am ready');
  });
});
