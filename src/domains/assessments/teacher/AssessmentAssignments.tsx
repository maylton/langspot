import { useState, type FormEvent } from 'react';

export type AssessmentStudentOption = { id: string; name: string };

export function AssessmentAssignments({ students, busy, onAssign }: {
  students: AssessmentStudentOption[];
  busy: boolean;
  onAssign: (input: { studentId: string; availableFrom: string | null; dueAt: string | null; attemptLimit: number }) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('');
    try {
      await onAssign({
        studentId: String(form.get('studentId')),
        availableFrom: String(form.get('availableFrom') || '') || null,
        dueAt: String(form.get('dueAt') || '') || null,
        attemptLimit: Number(form.get('attemptLimit') || 1),
      });
      event.currentTarget.reset();
      setMessage('Avaliação atribuída com sucesso.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atribuir a avaliação.'); }
  };
  return <form className="assessment-assign-form" onSubmit={submit}>
    <h3>Atribuir avaliação</h3>
    <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label>Disponível em<input name="availableFrom" type="datetime-local" /></label>
    <label>Prazo<input name="dueAt" type="datetime-local" /></label>
    <label>Tentativas<input name="attemptLimit" type="number" min="1" defaultValue="1" /></label>
    <button className="primary-button" disabled={busy || !students.length}>{busy ? 'Atribuindo…' : 'Atribuir'}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
