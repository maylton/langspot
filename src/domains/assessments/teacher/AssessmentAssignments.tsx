import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { AssessmentStudentExposure } from '../types';
import { formatSeenDate, skillName, summarizeExposure } from './exposure';

export type AssessmentStudentOption = { id: string; name: string };

/** What the chosen student has already seen in this assessment (texts, tasks, items). */
function ExposureNotice({ studentName, state, onNewVersion }: {
  studentName: string;
  state: { loading: boolean; exposure: AssessmentStudentExposure | null; error: string };
  onNewVersion?: () => void;
}) {
  if (state.loading) return <p className="assessment-exposure loading"><LoaderCircle className="spin" size={14} />Verificando o que {studentName} já viu…</p>;
  if (state.error) return <p className="assessment-exposure warning">{state.error}</p>;
  if (!state.exposure) return null;
  const summary = summarizeExposure(state.exposure);
  if (summary.clean) {
    return <p className="assessment-exposure clean"><CheckCircle2 size={15} />Nenhum texto ou questão desta prova foi visto por {studentName} antes.{state.exposure.pools.length ? ' Nas partes sorteadas, só entram questões novas para ele.' : ''}</p>;
  }
  return <div className="assessment-exposure warning" role="status">
    <strong><AlertTriangle size={15} />{studentName} já viu parte desta prova</strong>
    <ul>
      {summary.texts.map((text) => <li key={text.key}>Texto <b>{text.title ? `“${text.title}”` : text.key}</b> ({text.key}) — em “{text.assessmentTitle}”, {formatSeenDate(text.seenAt)}</li>)}
      {summary.tasks.map((task) => <li key={task.key}>Tarefa de {skillName(task.skill)} <b>{task.key}</b> — em “{task.assessmentTitle}”, {formatSeenDate(task.seenAt)}</li>)}
      {summary.otherItems > 0 && <li>{summary.otherItems} outra(s) questão(ões) fixa(s) repetida(s).</li>}
      {summary.shortPools.map((pool) => <li key={pool.sectionTitle}>{pool.sectionTitle}: só {pool.unseen} questão(ões) nova(s) para sortear {pool.drawCount}; o restante será repetido.</li>)}
    </ul>
    {summary.freshPools > 0 && <small>Nas outras partes sorteadas (Language Use), o sorteio usa só questões que ele ainda não viu.</small>}
    {onNewVersion && <button type="button" className="secondary-button compact" onClick={onNewVersion}>Gerar uma versão nova para {studentName}</button>}
  </div>;
}

export function AssessmentAssignments({ students, busy, onAssign, onClose, defaultStudentId, loadExposure, onNewVersionFor }: {
  students: AssessmentStudentOption[];
  busy: boolean;
  onClose?: () => void;
  onAssign: (input: { studentId: string; availableFrom: string | null; dueAt: string | null; attemptLimit: number }) => Promise<void>;
  /** Pre-selected student, e.g. the one the form was generated for. */
  defaultStudentId?: string | null;
  /** Repeated texts/items for the chosen student; omitted for forms without bank items. */
  loadExposure?: (studentId: string) => Promise<AssessmentStudentExposure>;
  /** Offered when the student has seen part of a ready-made form. */
  onNewVersionFor?: (studentId: string) => void;
}) {
  const [message, setMessage] = useState('');
  const [studentId, setStudentId] = useState(defaultStudentId && students.some((student) => student.id === defaultStudentId) ? defaultStudentId : '');
  const [exposure, setExposure] = useState<{ loading: boolean; exposure: AssessmentStudentExposure | null; error: string }>({ loading: false, exposure: null, error: '' });

  // Callers pass inline functions; keep the latest without re-running the effect on every render.
  const loadRef = useRef(loadExposure);
  loadRef.current = loadExposure;
  const canCheck = Boolean(loadExposure);
  useEffect(() => {
    const loadExposure = loadRef.current;
    if (!studentId || !loadExposure) { setExposure({ loading: false, exposure: null, error: '' }); return; }
    let current = true;
    setExposure({ loading: true, exposure: null, error: '' });
    loadExposure(studentId)
      .then((value) => { if (current) setExposure({ loading: false, exposure: value, error: '' }); })
      .catch(() => { if (current) setExposure({ loading: false, exposure: null, error: 'Não foi possível verificar se o aluno já viu estes textos.' }); });
    return () => { current = false; };
  }, [canCheck, studentId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // React clears event.currentTarget once the handler yields, so keep the element.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage('');
    try {
      await onAssign({
        studentId,
        availableFrom: String(form.get('availableFrom') || '') || null,
        dueAt: String(form.get('dueAt') || '') || null,
        attemptLimit: Number(form.get('attemptLimit') || 1),
      });
      formElement.reset();
      setStudentId('');
      setMessage('Avaliação atribuída com sucesso.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atribuir a avaliação.'); }
  };
  const studentName = students.find((student) => student.id === studentId)?.name ?? 'O aluno';
  return <form className="assessment-assign-form" onSubmit={submit} ref={(node) => node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>
    <h3>Atribuir a um aluno</h3>
    <p>O aluno verá a prova na área Avaliações do portal dele a partir da data de disponibilidade (ou imediatamente, se ficar em branco).</p>
    <label>Aluno<select name="studentId" required value={studentId} onChange={(event) => setStudentId(event.target.value)}><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    {studentId && loadExposure && <ExposureNotice studentName={studentName} state={exposure} onNewVersion={onNewVersionFor ? () => onNewVersionFor(studentId) : undefined} />}
    <label>Disponível em<input name="availableFrom" type="datetime-local" /></label>
    <label>Prazo<input name="dueAt" type="datetime-local" /></label>
    <label>Tentativas<input name="attemptLimit" type="number" min="1" defaultValue="1" /></label>
    <div className="assessment-assign-actions">{onClose && <button type="button" className="cancel-button" onClick={onClose}>Fechar</button>}<button className="primary-button" disabled={busy || !students.length}>{busy ? 'Atribuindo…' : 'Atribuir'}</button></div>
    {!students.length && <p role="status">Nenhum aluno com conta no portal. Convide o aluno pela página Alunos.</p>}
    {message && <p role="status" className="assessment-assign-status">{message}</p>}
  </form>;
}
