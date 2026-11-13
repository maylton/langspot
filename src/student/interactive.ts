import { splitOrderingAnswer } from '../domains/questions';
import { DbAssignment } from '../supabase';
import { type InteractiveAssignmentContent, type InteractiveAssignmentResult, type TextComment } from '../types';

export const interactiveAttempts = (result: InteractiveAssignmentResult | null | undefined) => result?.attempts?.length ? result.attempts : result ? [{ answers: result.answers, score: result.score, total: result.total, percentage: result.percentage, submittedAt: new Date().toISOString() }] : [];

export const interactiveMaxAttempts = (content: InteractiveAssignmentContent | null | undefined) => content?.settings?.maxAttempts ?? 1;

export const canAttemptInteractive = (content: InteractiveAssignmentContent | null | undefined, result: InteractiveAssignmentResult | null | undefined) => {
  const maxAttempts = interactiveMaxAttempts(content);
  return maxAttempts === 0 || interactiveAttempts(result).length < maxAttempts;
};

export const shouldRevealInteractiveAnswers = (content: InteractiveAssignmentContent | null | undefined, result: InteractiveAssignmentResult | null | undefined) => {
  if (content?.settings?.revealAnswers !== 'after_last') return true;
  return !canAttemptInteractive(content, result);
};

export const displayInteractiveAnswer = (question: InteractiveAssignmentContent['questions'][number], value: string) => {
  if (question.type !== 'ordering') return value;
  return splitOrderingAnswer(value).join(' ');
};

export function assignmentTextComments(assignment: DbAssignment) {
  return Array.isArray(assignment.text_comments) ? assignment.text_comments as TextComment[] : [];
}
