import { useState, type FormEvent } from 'react';

export type AssessmentStudentOption = { id: string; name: string };

export function AssessmentAssignments({ students, busy, onAssign, onClose }: {
  students: AssessmentStudentOption[];
  busy: boolean;
  onClose?: () => void;
  onAssign: (input: { studentId: string; availableFrom: string | null; dueAt: string | null; attemptLimit: number }) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // React clears event.currentTarget once the handler yields, so keep the element.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage('');
    try {
      await onAssign({
        studentId: String(form.get('studentId')),
        availableFrom: String(form.get('availableFrom') || '') || null,
        dueAt: String(form.get('dueAt') || '') || null,
        attemptLimit: Number(form.get('attemptLimit') || 1),
      });
      formElement.reset();
      setMessage('Avaliação atribuída com sucesso.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atribuir a avaliação.'); }
  };
  return <form className="assessment-assign-form" onSubmit={submit} ref={(node) => node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>
    <h3>Atribuir a um aluno</h3>
    <p>O aluno verá a prova na área Avaliações do portal dele a partir da data de disponibilidade (ou imediatamente, se ficar em branco).</p>
    <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label>Disponível em<input name="availableFrom" type="datetime-local" /></label>
    <label>Prazo<input name="dueAt" type="datetime-local" /></label>
    <label>Tentativas<input name="attemptLimit" type="number" min="1" defaultValue="1" /></label>
    <div className="assessment-assign-actions">{onClose && <button type="button" className="cancel-button" onClick={onClose}>Fechar</button>}<button className="primary-button" disabled={busy || !students.length}>{busy ? 'Atribuindo…' : 'Atribuir'}</button></div>
    {!students.length && <p role="status">Nenhum aluno com conta no portal. Convide o aluno pela página Alunos.</p>}
    {message && <p role="status" className="assessment-assign-status">{message}</p>}
  </form>;
}
