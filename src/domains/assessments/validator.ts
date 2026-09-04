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
    if (section.drawCount !== null && (section.drawCount < 1 || section.drawCount > section.questions.length)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.drawCount`, message: `O pool da seção ${sectionIndex + 1} deve selecionar entre 1 e ${section.questions.length} questões.` });
    if (draft.assessmentMode === 'adaptive' && section.questions.length < draft.adaptiveMinItems) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions`, message: `A seção adaptativa ${sectionIndex + 1} precisa de pelo menos ${draft.adaptiveMinItems} questões.` });
    section.questions.forEach((question, questionIndex) => {
      const result = validateQuestion(question.snapshot);
      result.errors.forEach((error) => issues.push({
        severity: 'error',
        path: `sections.${sectionIndex}.questions.${questionIndex}`,
        message: `Questão ${questionIndex + 1}: ${error.message}`,
      }));
      if (draft.assessmentMode === 'adaptive' && (!question.snapshot.difficulty || !question.snapshot.cefr)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}`, message: `Questão ${questionIndex + 1}: informe dificuldade e nível CEFR para o placement.` });
    });
  });

  const totalQuestions = draft.sections.reduce((total, section) => total + section.questions.length, 0);
  if (draft.assessmentMode === 'adaptive' && draft.adaptiveMaxItems < draft.adaptiveMinItems) issues.push({ severity: 'error', path: 'adaptiveMaxItems', message: 'O máximo adaptativo deve ser maior ou igual ao mínimo.' });
  if (totalQuestions > 0 && totalQuestions < 3) issues.push({ severity: 'warning', path: 'sections', message: 'Avaliações muito curtas podem produzir resultados pouco representativos.' });
  return issues;
}
