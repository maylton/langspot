import { useMemo, useState, type FormEvent } from 'react';
import { CalendarClock, ClipboardList, Eye, FileQuestion, LoaderCircle, Pencil, X } from 'lucide-react';
import { confirmAction } from '../../../components/dialogs';
import type { AssessmentRow } from '../database';
import type { ActiveTeacherAttempt } from '../types';
import type { AssessmentStudentOption } from './AssessmentAssignments';
import { ASSIGNMENT_FILTERS, ASSIGNMENT_STATE_LABELS, assignmentState, isNotStarted, matchesAssignmentFilter, sortAssignments, toLocalInput, type AssignmentFilter, type AssignmentListRow } from './assignments';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Every assessment the teacher assigned and where each student is with it, including the ones not started yet. */
export function AssignedAssessments({ assignments, assessments, students, activeAttempts, onUpdate, onCancel, onOpenResults, onMonitor }: {
  assignments: AssignmentListRow[];
  assessments: AssessmentRow[];
  students: AssessmentStudentOption[];
  activeAttempts: ActiveTeacherAttempt[];
  onUpdate: (id: string, input: { availableFrom: string | null; dueAt: string | null; attemptLimit: number }) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onOpenResults: (assessment: AssessmentRow) => void;
  onMonitor: (attempt: ActiveTeacherAttempt) => void;
}) {
  const [filter, setFilter] = useState<AssignmentFilter>('open');
  const [studentId, setStudentId] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const titles = useMemo(() => new Map(assessments.map((item) => [item.id, item])), [assessments]);
  const names = useMemo(() => new Map(students.map((student) => [student.id, student.name])), [students]);
  const now = new Date();
  const visible = sortAssignments(assignments, now).filter((row) => (!studentId || row.student_id === studentId) && matchesAssignmentFilter(assignmentState(row, now), filter));
  const count = (key: AssignmentFilter) => assignments.filter((row) => (!studentId || row.student_id === studentId) && matchesAssignmentFilter(assignmentState(row, now), key)).length;

  const cancel = async (row: AssignmentListRow) => {
    const title = titles.get(row.assessment_id)?.title ?? 'esta prova';
    if (!(await confirmAction({ title: `Cancelar “${title}” para ${names.get(row.student_id) ?? 'o aluno'}?`, message: 'A prova some do portal do aluno. Ele ainda não começou, então nada respondido é perdido.', confirmLabel: 'Sim, cancelar', cancelLabel: 'Voltar', danger: true }))) return;
    setBusy(row.id); setMessage('');
    try { await onCancel(row.id); setMessage('Atribuição cancelada.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível cancelar a atribuição.'); }
    setBusy(null);
  };

  const save = async (event: FormEvent<HTMLFormElement>, row: AssignmentListRow) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const local = (name: string) => { const value = String(form.get(name) || ''); return value ? new Date(value).toISOString() : null; };
    setBusy(row.id); setMessage('');
    try { await onUpdate(row.id, { availableFrom: local('availableFrom'), dueAt: local('dueAt'), attemptLimit: Math.max(1, Number(form.get('attemptLimit') || 1)) }); setEditing(null); setMessage('Atribuição atualizada.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar a atribuição.'); }
    setBusy(null);
  };

  return <section className="assigned-assessments" aria-label="Provas atribuídas">
    <header>
      <div><ClipboardList size={17} /><strong>Provas atribuídas</strong><small>Quem recebeu cada prova e em que ponto está, inclusive quem ainda não começou.</small></div>
      <label>Aluno<select value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="">Todos os alunos</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    </header>
    <nav className="assigned-filters" aria-label="Filtrar atribuições">{ASSIGNMENT_FILTERS.map((item) => <button key={item.key} type="button" className={filter === item.key ? 'active' : ''} aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}<b>{count(item.key)}</b></button>)}</nav>
    {message && <p className="assigned-message" role="status">{message}</p>}
    {visible.length ? <ul>{visible.map((row) => {
      const assessment = titles.get(row.assessment_id);
      const state = assignmentState(row, now);
      const attempt = activeAttempts.find((item) => item.assessmentId === row.assessment_id && item.studentId === row.student_id);
      const dates = [row.available_from ? (state === 'scheduled' ? `disponível em ${formatDateTime(row.available_from)}` : `disponível desde ${formatDateTime(row.available_from)}`) : 'disponível desde a atribuição', row.due_at ? `prazo ${formatDateTime(row.due_at)}` : 'sem prazo', `${row.attempt_limit} tentativa${row.attempt_limit === 1 ? '' : 's'}`];
      return <li key={row.id}>
        <div className="assigned-main">
          <span className={`assigned-state ${state}`}>{ASSIGNMENT_STATE_LABELS[state]}</span>
          <strong>{names.get(row.student_id) ?? 'Aluno'}</strong>
          <span>{assessment?.title ?? 'Avaliação excluída'}</span>
          <small><CalendarClock size={12} />{dates.join(' · ')} · atribuída em {formatDateTime(row.created_at)}</small>
        </div>
        <div className="assigned-actions">
          {attempt && <button type="button" className="secondary-button compact" onClick={() => onMonitor(attempt)}><Eye size={14} />Acompanhar</button>}
          {assessment && (state === 'to_review' || state === 'completed') && <button type="button" className="secondary-button compact" onClick={() => onOpenResults(assessment)}><FileQuestion size={14} />Resultados</button>}
          {isNotStarted(row) && <button type="button" className="secondary-button compact" disabled={busy === row.id} onClick={() => setEditing(editing === row.id ? null : row.id)}><Pencil size={14} />Alterar</button>}
          {isNotStarted(row) && <button type="button" className="icon-button danger" disabled={busy === row.id} title="Cancelar atribuição" aria-label={`Cancelar atribuição de ${names.get(row.student_id) ?? 'aluno'}`} onClick={() => void cancel(row)}>{busy === row.id ? <LoaderCircle className="spin" size={15} /> : <X size={15} />}</button>}
        </div>
        {editing === row.id && <form className="assessment-assign-form assigned-edit" onSubmit={(event) => void save(event, row)}>
          <label>Disponível em<input name="availableFrom" type="datetime-local" defaultValue={toLocalInput(row.available_from)} /></label>
          <label>Prazo<input name="dueAt" type="datetime-local" defaultValue={toLocalInput(row.due_at)} /></label>
          <label>Tentativas<input name="attemptLimit" type="number" min="1" defaultValue={row.attempt_limit} /></label>
          <div className="assessment-assign-actions"><button type="button" className="cancel-button" onClick={() => setEditing(null)}>Fechar</button><button className="primary-button" disabled={busy === row.id}>{busy === row.id ? 'Salvando…' : 'Salvar'}</button></div>
        </form>}
      </li>;
    })}</ul> : <p className="assigned-empty">{assignments.length ? 'Nenhuma atribuição neste filtro.' : 'Nenhuma prova atribuída ainda. Publique uma avaliação e use “Atribuir”.'}</p>}
  </section>;
}
