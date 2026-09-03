import type { QuestionDefinition } from './types';

export const ORDERING_RESPONSE_SEPARATOR = '\u001f';

export function normalizeInteractiveAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function splitOrderingAnswer(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const parts = trimmed.includes(ORDERING_RESPONSE_SEPARATOR)
    ? trimmed.split(ORDERING_RESPONSE_SEPARATOR)
    : trimmed.includes('/')
      ? trimmed.split('/')
      : trimmed.split(',');

  return parts.map((item) => item.trim()).filter(Boolean);
}

export function joinOrderingAnswer(items: string[]): string {
  return items.join(ORDERING_RESPONSE_SEPARATOR);
}

export function normalizeQuestionAnswer(question: QuestionDefinition, value: string): string {
  if (question.type !== 'ordering') return normalizeInteractiveAnswer(value);
  return splitOrderingAnswer(value).map(normalizeInteractiveAnswer).join(' ');
}
