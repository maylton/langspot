import type { AssessmentDeletionImpact } from '../assessmentService';

const students = (count: number) => `${count} aluno${count === 1 ? '' : 's'}`;

/** Lists what is lost together with the assessment, so the teacher answers Sim/Não knowingly. */
export function deletionWarnings(impact: AssessmentDeletionImpact | null): string[] {
  if (!impact) return [];
  const warnings: string[] = [];
  if (impact.submittedStudents) warnings.push(`As provas enviadas por ${students(impact.submittedStudents)} e os resultados delas serão apagados.`);
  if (impact.inProgressStudents) warnings.push(`${students(impact.inProgressStudents)} ${impact.inProgressStudents === 1 ? 'está' : 'estão'} fazendo esta prova agora e ${impact.inProgressStudents === 1 ? 'perderá' : 'perderão'} as respostas.`);
  if (impact.assignments && !impact.submittedStudents && !impact.inProgressStudents) warnings.push(`A atribuição para ${students(impact.assignments)} também será removida.`);
  return warnings;
}
