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
  if (draft.framework === 'cefr' && !draft.formVersion.trim()) issues.push({ severity: 'error', path: 'formVersion', message: 'Informe a versão da form CEFR.' });
  if (draft.framework === 'cefr' && !['placement', 'diagnostic', 'progress'].includes(draft.type)) issues.push({ severity: 'warning', path: 'type', message: 'Uma avaliação CEFR normalmente deve ser Placement, Diagnostic ou Progress.' });

  draft.sections.forEach((section, sectionIndex) => {
    if (!section.title.trim()) issues.push({ severity: 'error', path: `sections.${sectionIndex}.title`, message: `A seção ${sectionIndex + 1} precisa de um título.` });
    if (!section.questions.length) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions`, message: `A seção “${section.title || sectionIndex + 1}” está sem questões.` });
    if (section.drawCount !== null && (section.drawCount < 1 || section.drawCount > section.questions.length)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.drawCount`, message: `O pool da seção ${sectionIndex + 1} deve selecionar entre 1 e ${section.questions.length} questões.` });
    if (draft.assessmentMode === 'adaptive' && section.questions.length < draft.adaptiveMinItems) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions`, message: `A seção adaptativa ${sectionIndex + 1} precisa de pelo menos ${draft.adaptiveMinItems} questões.` });
    if (draft.framework === 'cefr' && !section.cefrLevel) issues.push({ severity: 'error', path: `sections.${sectionIndex}.cefrLevel`, message: `Informe o nível CEFR do tasklet “${section.title}”.` });
    if (draft.framework === 'cefr' && !section.construct?.trim()) issues.push({ severity: 'error', path: `sections.${sectionIndex}.construct`, message: `Informe o construct do tasklet “${section.title}”.` });
    section.questions.forEach((question, questionIndex) => {
      const result = validateQuestion(question.snapshot);
      result.errors.forEach((error) => issues.push({
        severity: 'error',
        path: `sections.${sectionIndex}.questions.${questionIndex}`,
        message: `Questão ${questionIndex + 1}: ${error.message}`,
      }));
      if (draft.assessmentMode === 'adaptive' && (!question.snapshot.difficulty || !question.snapshot.cefr)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}`, message: `Questão ${questionIndex + 1}: informe dificuldade e nível CEFR para o placement.` });
      if (draft.framework === 'cefr' && (!question.snapshot.skill || !question.snapshot.cefr || !question.snapshot.subskill || !question.snapshot.taskType)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.cefr`, message: `Questão ${questionIndex + 1}: skill, subskill, nível CEFR e task type são obrigatórios.` });
      if (draft.framework === 'cefr' && draft.type === 'placement' && !['approved', 'approved_for_pilot'].includes(question.snapshot.qualityStatus ?? '')) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.qualityStatus`, message: `Questão ${questionIndex + 1}: placement CEFR aceita somente itens aprovados ou aprovados para pilotagem.` });
      if (question.snapshot.type === 'listening' && !question.snapshot.audioPath) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.audioPath`, message: `Questão ${questionIndex + 1}: envie o áudio de Listening.` });
      if (question.snapshot.type === 'listening' && (!question.snapshot.maxPlays || question.snapshot.maxPlays < 1)) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.maxPlays`, message: `Questão ${questionIndex + 1}: informe ao menos uma reprodução.` });
      if (['writing', 'speaking', 'mediation'].includes(question.snapshot.type) && !question.snapshot.rubric?.length) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.rubric`, message: `Questão ${questionIndex + 1}: configure a rubrica de correção.` });
      if (question.snapshot.type === 'mediation' && !question.snapshot.sourceMaterial?.trim()) issues.push({ severity: 'error', path: `sections.${sectionIndex}.questions.${questionIndex}.sourceMaterial`, message: `Questão ${questionIndex + 1}: informe o material-fonte de Mediation.` });
    });
  });

  const totalQuestions = draft.sections.reduce((total, section) => total + section.questions.length, 0);
  if (draft.assessmentMode === 'adaptive' && draft.adaptiveMaxItems < draft.adaptiveMinItems) issues.push({ severity: 'error', path: 'adaptiveMaxItems', message: 'O máximo adaptativo deve ser maior ou igual ao mínimo.' });
  if (totalQuestions > 0 && totalQuestions < 3) issues.push({ severity: 'warning', path: 'sections', message: 'Avaliações muito curtas podem produzir resultados pouco representativos.' });
  return issues;
}
