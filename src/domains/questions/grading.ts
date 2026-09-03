import { normalizeQuestionAnswer } from './normalization';
import type { QuestionDefinition, QuestionGradingResult, QuestionSet, QuestionSetResult } from './types';

export function gradeQuestion(question: QuestionDefinition, answer: string): QuestionGradingResult {
  const correct = normalizeQuestionAnswer(question, answer) === normalizeQuestionAnswer(question, question.answer);
  return { questionId: question.id, correct, score: correct ? 1 : 0, maxScore: 1 };
}

export function gradeQuestionSet(
  content: QuestionSet | null | undefined,
  answers: Record<string, string>,
): QuestionSetResult {
  const questions = content?.questions ?? [];
  const score = questions.reduce((sum, question) => sum + gradeQuestion(question, answers[question.id] ?? '').score, 0);

  return {
    answers,
    score,
    total: questions.length,
    percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
  };
}
