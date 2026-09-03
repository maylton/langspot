import { normalizeInteractiveAnswer, splitOrderingAnswer } from './normalization';
import type { QuestionDefinition, QuestionValidationIssue, QuestionValidationResult } from './types';

function duplicateOptions(options: string[]): boolean {
  const normalized = options.map(normalizeInteractiveAnswer).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

export function validateQuestion(question: QuestionDefinition): QuestionValidationResult {
  const errors: QuestionValidationIssue[] = [];
  const options = question.options.map((option) => option.trim()).filter(Boolean);
  const answer = question.answer.trim();

  if (!question.prompt.trim()) errors.push({ code: 'empty_prompt', message: 'Question prompt is required.' });
  if (duplicateOptions(options)) errors.push({ code: 'duplicate_option', message: 'Question options must be unique.' });
  if (!answer) errors.push({ code: 'missing_answer', message: 'A correct answer is required.' });

  if (question.type === 'multiple_choice' && options.length < 2) {
    errors.push({ code: 'insufficient_options', message: 'Multiple-choice questions require at least two options.' });
  }

  if ((question.type === 'multiple_choice' || question.type === 'true_false') && answer) {
    const normalizedOptions = options.map(normalizeInteractiveAnswer);
    if (!normalizedOptions.includes(normalizeInteractiveAnswer(answer))) {
      errors.push({ code: 'answer_not_in_options', message: 'The correct answer must match one of the options.' });
    }
  }

  if (question.type === 'ordering') {
    const orderedAnswer = splitOrderingAnswer(answer);
    const normalizedOptions = options.map(normalizeInteractiveAnswer).sort();
    const normalizedAnswer = orderedAnswer.map(normalizeInteractiveAnswer).sort();
    const hasSameItems = normalizedOptions.length === normalizedAnswer.length
      && normalizedOptions.every((option, index) => option === normalizedAnswer[index]);
    if (options.length < 2 || !hasSameItems) {
      errors.push({ code: 'invalid_ordering', message: 'Ordering answers must contain each option exactly once.' });
    }
  }

  return { valid: errors.length === 0, errors };
}
