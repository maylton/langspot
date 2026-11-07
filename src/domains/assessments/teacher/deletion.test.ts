import { describe, expect, it } from 'vitest';
import { deletionWarnings } from './deletion';

describe('deletionWarnings', () => {
  it('has nothing to warn about for an unassigned draft', () => {
    expect(deletionWarnings({ assignments: 0, inProgressStudents: 0, submittedStudents: 0 })).toEqual([]);
    expect(deletionWarnings(null)).toEqual([]);
  });
  it('mentions assignments only when no student has started', () => {
    expect(deletionWarnings({ assignments: 2, inProgressStudents: 0, submittedStudents: 0 })).toEqual(['A atribuição para 2 alunos também será removida.']);
  });
  it('warns about lost results and running attempts with singular and plural', () => {
    expect(deletionWarnings({ assignments: 3, inProgressStudents: 1, submittedStudents: 2 })).toEqual([
      'As provas enviadas por 2 alunos e os resultados delas serão apagados.',
      '1 aluno está fazendo esta prova agora e perderá as respostas.',
    ]);
    expect(deletionWarnings({ assignments: 2, inProgressStudents: 2, submittedStudents: 0 })[0]).toBe('2 alunos estão fazendo esta prova agora e perderão as respostas.');
  });
});
