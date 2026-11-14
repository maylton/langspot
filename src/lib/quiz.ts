import { type InteractiveAssignmentContent, type InteractiveAssignmentResult, type InteractiveQuestion, type InteractiveQuestionType, type QuestionBankItem, type QuestionBankLevel } from '../types';

export const questionBankLevels: QuestionBankLevel[] = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];

export const interactiveResultSummary = (result?: InteractiveAssignmentResult | null) => result ? `${result.score}/${result.total} acertos (${result.percentage}%)` : '';

export function questionTypeLabel(type: InteractiveQuestionType) {
  return type === 'multiple_choice' ? 'Múltipla escolha' : type === 'fill_blank' ? 'Complete a frase' : type === 'true_false' ? 'Verdadeiro ou falso' : 'Ordenação';
}

export function splitOrderingSource(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parts = trimmed.includes('/') ? trimmed.split('/') : trimmed.split(',');
  return parts.map((item) => item.trim()).filter(Boolean);
}

export function formatOrderingAnswer(items: string[]) {
  return items.join(' / ');
}

export function displayQuestionAnswer(question: InteractiveQuestion | QuestionBankItem) {
  return question.type === 'ordering' ? splitOrderingSource(question.answer).join(' ') : question.answer;
}

function bankQuestionToInteractive(question: QuestionBankItem): InteractiveQuestion {
  return { id: crypto.randomUUID(), type: question.type, prompt: question.prompt, options: question.options, answer: question.answer, explanation: question.explanation };
}

export function buildInteractiveContent(form: FormData, questionCount: number, bankQuestions: QuestionBankItem[] = [], generatedQuestions: InteractiveQuestion[] = []): InteractiveAssignmentContent {
  const maxAttempts = Number(form.get('interactiveMaxAttempts') || '1');
  const revealAnswers = String(form.get('interactiveRevealAnswers') || 'after_each') === 'after_last' ? 'after_last' : 'after_each';
  const manualQuestions: InteractiveQuestion[] = Array.from({ length: questionCount }).flatMap<InteractiveQuestion>((_, index) => {
    const prompt = String(form.get(`question-${index}`) || '').trim();
    const type = String(form.get(`question-${index}-type`) || 'multiple_choice') as InteractiveQuestionType;
    const labels = ['A', 'B', 'C', 'D'];
    const options = labels.map((label) => String(form.get(`question-${index}-option-${label}`) || '').trim()).filter(Boolean);
    const answerIndex = labels.indexOf(String(form.get(`question-${index}-answer`) || 'A'));
    const textAnswer = String(form.get(`question-${index}-text-answer`) || '').trim();
    const selectedAnswer = String(form.get(`question-${index}-answer`) || 'A');
    const explanation = String(form.get(`question-${index}-explanation`) || '').trim() || undefined;
    if (!prompt) return [];
    if (type === 'true_false') return [{ id: crypto.randomUUID(), type, prompt, options: ['Verdadeiro', 'Falso'], answer: selectedAnswer === 'Falso' ? 'Falso' : 'Verdadeiro', explanation }];
    if (type === 'fill_blank') return textAnswer ? [{ id: crypto.randomUUID(), type, prompt, options: [], answer: textAnswer, explanation }] : [];
    if (type === 'ordering') {
      const ordered = splitOrderingSource(textAnswer);
      const shuffled = [...ordered].sort(() => Math.random() - 0.5);
      return ordered.length > 1 ? [{ id: crypto.randomUUID(), type, prompt, options: shuffled, answer: formatOrderingAnswer(ordered), explanation }] : [];
    }
    if (options.length < 2 || !options[answerIndex]) return [];
    return [{ id: crypto.randomUUID(), type, prompt, options, answer: options[answerIndex], explanation }];
  });
  const questions = [...bankQuestions.map(bankQuestionToInteractive), ...generatedQuestions, ...manualQuestions];
  return { questions, settings: { maxAttempts: Number.isFinite(maxAttempts) ? maxAttempts : 1, revealAnswers } };
}
