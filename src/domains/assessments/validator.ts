import { validateQuestion } from '../questions';
import type { AssessmentDraft } from './types';

export type AssessmentValidationIssue = {
  severity: 'error' | 'warning';
  path: string;
  message: string;
};

export function validateAssessmentDraft(draft: AssessmentDraft): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  if (!draft.title.trim()) issues.push({ severity: 'error', path: 'title', message: 'Informe o título da avaliação.' });
  if (!draft.sections.length) issues.push({ severity: 'error', path: 'sections', message: 'Adicione pelo menos uma seção.' });
  if (draft.timeLimitMinutes !== null && draft.timeLimitMinutes < 1) issues.push({ severity: 'error', path: 'timeLimitMinutes', message: 'O tempo deve ser de pelo menos 1 minuto.' });

  draft.sections.forEach((section, sectionIndex) => {
    if (!section.title.trim()) issues.push({ severity: 'error', path: `sections.${sectionIndex}.title`, message: `A seção ${sectionIndex + 1} precisa de um título.` });
    if (!section.questions.length) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions`, message: `A seção “${section.title || sectionIndex + 1}” está sem questões.` });
    section.questions.forEach((question, questionIndex) => {
      const result = validateQuestion(question.snapshot);
      result.errors.forEach((error) => issues.push({
        severity: 'error',
        path: `sections.${sectionIndex}.questions.${questionIndex}`,
        message: `Questão ${questionIndex + 1}: ${error.message}`,
      }));
    });
  });

  const totalQuestions = draft.sections.reduce((total, section) => total + section.questions.length, 0);
  if (totalQuestions > 0 && totalQuestions < 3) issues.push({ severity: 'warning', path: 'sections', message: 'Avaliações muito curtas podem produzir resultados pouco representativos.' });
  return issues;
}
