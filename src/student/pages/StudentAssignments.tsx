import { Check, ClipboardList, Clock3, ExternalLink, FileQuestion, FileText, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { countWords } from '../../domains/assessments/reviewQueue';
import { gradeQuestionSet as scoreInteractiveAssignment } from '../../domains/questions';
import { DbAssignment, DbMaterial, supabase } from '../../supabase';
import { MAX_UPLOAD_SIZE, STUDENT_SUBMISSION_ACCEPT, isStudentSubmissionFile } from '../../lib/uploads';
import { type InteractiveAssignmentContent, type InteractiveAssignmentResult } from '../../types';
import { InteractiveAssignmentForm, InteractiveSubmissionReview } from '../components/InteractiveAssignment';
import { EmptyPortal } from '../components/ui';
import { canAttemptInteractive, interactiveAttempts, interactiveMaxAttempts } from '../interactive';

const wordCountLabel = (count: number) => `${count} ${count === 1 ? 'palavra' : 'palavras'}`;

export function StudentAssignments({ assignments, materials, mode = 'tasks', onAssignmentsChange, readOnly = false }: { assignments: DbAssignment[]; materials: DbMaterial[]; mode?: 'tasks' | 'quiz'; onAssignmentsChange: React.Dispatch<React.SetStateAction<DbAssignment[]>>; readOnly?: boolean }) {
  type TaskFilter = 'all' | 'pending' | 'submitted' | 'reviewed';
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [interactiveAnswers, setInteractiveAnswers] = useState<Record<string, Record<string, string>>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (assignment: DbAssignment) => assignment.status === 'pending' && new Date(`${assignment.due_date}T12:00:00`) < today;
  const ordered = [...assignments].sort((a, b) => {
    const priority = (item: DbAssignment) => isOverdue(item) ? 0 : item.status === 'pending' ? 1 : item.status === 'submitted' ? 2 : 3;
    return priority(a) - priority(b) || a.due_date.localeCompare(b.due_date);
  });
  const visible = filter === 'all' ? ordered : ordered.filter((assignment) => assignment.status === filter);
  const counts = {
    pending: assignments.filter((assignment) => assignment.status === 'pending').length,
    submitted: assignments.filter((assignment) => assignment.status === 'submitted').length,
    reviewed: assignments.filter((assignment) => assignment.status === 'reviewed').length,
  };
  const copy = mode === 'quiz'
    ? { eyebrow: 'QUIZ', title: 'Meus quizzes', description: 'Responda atividades interativas, acompanhe suas tentativas e revise a correção.', listTitle: 'Lista de quizzes', open: 'Abrir quiz', empty: 'Nenhum quiz por enquanto', emptyFiltered: 'Nenhum quiz neste filtro', emptyText: 'Os quizzes enviados pelo professor aparecerão aqui.', icon: FileQuestion }
    : { eyebrow: 'ATIVIDADES', title: 'Minhas tarefas', description: 'Organize suas entregas, acesse os materiais e acompanhe o feedback do professor.', listTitle: 'Lista de tarefas', open: 'Abrir tarefa', empty: 'Nenhuma tarefa por enquanto', emptyFiltered: 'Nenhuma tarefa neste filtro', emptyText: 'As atividades enviadas pelo professor aparecerão aqui.', icon: ClipboardList };
  const submittedLabel = mode === 'quiz' ? 'Realizados' : 'Enviadas';
  const reviewedLabel = mode === 'quiz' ? 'Corrigidos' : 'Corrigidas';
  const EmptyIcon = copy.icon;
  const submit = async (assignment: DbAssignment) => {
    const text = (drafts[assignment.id] ?? '').trim();
    const file = files[assignment.id] ?? null;
    if (readOnly) { setMessage('Modo de visualização: o envio de tarefas está desativado.'); return; }
    if (!text && !file) { setMessage('Escreva sua resposta ou anexe um arquivo antes de enviar.'); return; }
    if (file && (!isStudentSubmissionFile(file) || file.size > MAX_UPLOAD_SIZE)) { setMessage('O anexo precisa ser PDF, DOC, DOCX ou imagem de até 10 MB.'); return; }
    setSendingId(assignment.id); setMessage('');
    let uploadedPath: string | null = null;
    let signedUrl = '';
    try {
      if (file) {
        const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
        uploadedPath = `${assignment.student_id}/${assignment.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase!.storage.from('assignment-submissions').upload(uploadedPath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
        const { data: signed } = await supabase!.storage.from('assignment-submissions').createSignedUrl(uploadedPath, 60 * 60);
        signedUrl = signed?.signedUrl ?? '';
      }
      const submittedAt = new Date().toISOString();
      const payload = {
        submission_text: text,
        submitted_at: submittedAt,
        status: 'submitted',
        submission_file_path: uploadedPath,
        submission_file_name: file?.name ?? null,
        submission_file_size: file?.size ?? null,
        submission_file_mime_type: file?.type ?? null,
      };
      const { data, error } = await supabase!.from('assignments').update(payload).eq('id', assignment.id).eq('student_id', assignment.student_id).select('*').single();
      if (error) throw new Error(error.message);
      const submitted = { ...(data as DbAssignment), submission_file_url: signedUrl };
      onAssignmentsChange((current) => current.map((item) => item.id === assignment.id ? submitted : item));
      setMessage('Tarefa enviada com sucesso.');
      setDrafts((current) => ({ ...current, [assignment.id]: '' }));
      setFiles((current) => ({ ...current, [assignment.id]: null }));
    } catch (error) {
      if (uploadedPath) await supabase!.storage.from('assignment-submissions').remove([uploadedPath]);
      setMessage((error as Error).message);
    }
    setSendingId(null);
  };
  const submitInteractive = async (assignment: DbAssignment) => {
    if (readOnly) { setMessage('Modo de visualização: o envio de quizzes está desativado.'); return; }
    const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
    const previousResult = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
    if (!canAttemptInteractive(content, previousResult)) { setMessage('Você já usou todas as tentativas deste quiz.'); return; }
    const answers = interactiveAnswers[assignment.id] ?? {};
    const questions = content?.questions ?? [];
    if (!questions.length) { setMessage('Esta atividade interativa ainda não possui questões.'); return; }
    if (questions.some((question) => !answers[question.id])) { setMessage('Responda todas as questões antes de enviar.'); return; }
    const result = scoreInteractiveAssignment(content, answers);
    setSendingId(assignment.id); setMessage('');
    try {
      const submittedAt = new Date().toISOString();
      const attempt = { ...result, submittedAt };
      const attempts = [...interactiveAttempts(previousResult), attempt];
      const interactiveResult = { ...result, attempts };
      const payload = { submission_text: `Quiz interativo: ${result.score}/${result.total} acertos (${result.percentage}%). Tentativa ${attempts.length}.`, submitted_at: submittedAt, status: 'submitted', interactive_result: interactiveResult };
      const { data, error } = await supabase!.from('assignments').update(payload).eq('id', assignment.id).eq('student_id', assignment.student_id).select('*').single();
      if (error) throw new Error(error.message);
      onAssignmentsChange((current) => current.map((item) => item.id === assignment.id ? data as DbAssignment : item));
      setInteractiveAnswers((current) => ({ ...current, [assignment.id]: {} }));
      setMessage(`Atividade enviada. Resultado: ${result.score}/${result.total} (${result.percentage}%).`);
    } catch (error) {
      setMessage((error as Error).message);
    }
    setSendingId(null);
  };
  const materialFor = (id: string | null) => materials.find((material) => material.id === id);
  const dueLabel = (assignment: DbAssignment) => {
    const date = new Date(`${assignment.due_date}T12:00:00`);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
    if (isOverdue(assignment)) return `Atrasada · ${date.toLocaleDateString('pt-BR')}`;
    if (diff === 0) return 'Entrega hoje';
    if (diff === 1) return 'Entrega amanhã';
    return `Prazo: ${date.toLocaleDateString('pt-BR')}`;
  };
  return <div className="student-page student-tasks-page">
    <section className="student-task-summary">
      <div><p className="eyebrow">{copy.eyebrow}</p><h2>{copy.title}</h2><p>{copy.description}</p></div>
      <div className="student-task-metrics"><article><Clock3 size={19} /><span>Pendentes</span><strong>{counts.pending}</strong></article><article><ClipboardList size={19} /><span>{submittedLabel}</span><strong>{counts.submitted}</strong></article><article><Check size={19} /><span>{reviewedLabel}</span><strong>{counts.reviewed}</strong></article></div>
    </section>
    <section className="student-panel">
      <div className="student-section-heading task-heading"><div><h2>{copy.listTitle}</h2><span>{visible.length} de {assignments.length}</span></div><div className="student-task-filters"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button><button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pendentes</button><button className={filter === 'submitted' ? 'active' : ''} onClick={() => setFilter('submitted')}>{submittedLabel}</button><button className={filter === 'reviewed' ? 'active' : ''} onClick={() => setFilter('reviewed')}>{reviewedLabel}</button></div></div>
      {message && <div className="auth-message">{message}</div>}
      <div className="student-assignment-list">{visible.length ? visible.map((assignment) => {
        const material = materialFor(assignment.material_id);
        const overdue = isOverdue(assignment);
        const isOpen = openAssignmentId === assignment.id;
        const interactiveContent = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
        const interactiveResult = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
        const questionCount = interactiveContent?.questions.length ?? 0;
        const canRetryInteractive = assignment.assignment_type === 'interactive' && assignment.status === 'pending' && canAttemptInteractive(interactiveContent, interactiveResult);
        const attempts = interactiveAttempts(interactiveResult);
        const maxAttempts = interactiveMaxAttempts(interactiveContent);
        return <article key={assignment.id} className={`${overdue ? 'overdue' : ''} ${isOpen ? 'open' : ''}`}>
          <div className="student-assignment-heading"><div><div className="task-status-row"><span className={`assignment-status ${assignment.status}`}>{assignment.status === 'pending' ? 'Pendente' : assignment.status === 'submitted' ? 'Entregue' : 'Corrigida'}</span>{assignment.assignment_type === 'interactive' && <span className="task-kind-badge">Quiz{questionCount ? ` · ${questionCount} questão(ões)` : ''}{attempts.length ? ` · ${attempts.length}/${maxAttempts || '∞'} tentativa(s)` : ''}</span>}{overdue && <span className="task-overdue-badge">Atrasada</span>}</div><h3>{assignment.title}</h3><p>{assignment.instructions}</p></div><div className="student-assignment-meta"><strong className={overdue ? 'overdue-text' : ''}>{dueLabel(assignment)}</strong><button type="button" onClick={() => setOpenAssignmentId(isOpen ? null : assignment.id)}>{isOpen ? 'Fechar' : copy.open}</button></div></div>
          {isOpen && <div className="student-assignment-details"><div className="task-instructions"><strong>Instruções</strong><p>{assignment.instructions}</p></div>
          {material && <a className="task-material-link" href={material.url} target="_blank" rel="noreferrer"><FileText size={16} /><span><strong>{material.title}</strong><small>Abrir material de apoio</small></span><ExternalLink size={14} /></a>}
          {assignment.assignment_type === 'interactive' && interactiveResult && <InteractiveSubmissionReview assignment={assignment} />}
          {assignment.assignment_type === 'interactive' && canRetryInteractive && <InteractiveAssignmentForm assignment={assignment} answers={interactiveAnswers[assignment.id] ?? {}} onAnswer={(questionId, answer) => setInteractiveAnswers((current) => ({ ...current, [assignment.id]: { ...(current[assignment.id] ?? {}), [questionId]: answer } }))} onSubmit={() => submitInteractive(assignment)} busy={sendingId === assignment.id} />}
          {assignment.assignment_type !== 'interactive' && (assignment.status === 'pending' ? <div className="task-response-box"><div className="task-response-header"><div><label htmlFor={`assignment-${assignment.id}`}>Sua resposta</label></div><span className="task-response-count">{wordCountLabel(countWords(drafts[assignment.id] ?? ''))}</span></div><textarea className="task-response-input" id={`assignment-${assignment.id}`} rows={6} value={drafts[assignment.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [assignment.id]: event.target.value }))} placeholder="Digite sua resposta em inglês ou descreva o que realizou." lang="en" spellCheck={true} autoComplete="off" /><label className="task-pdf-upload"><span>Anexo <small>(opcional)</small></span><input type="file" accept={STUDENT_SUBMISSION_ACCEPT} onChange={(event) => setFiles((current) => ({ ...current, [assignment.id]: event.target.files?.[0] ?? null }))} />{files[assignment.id] && <em>{files[assignment.id]?.name} · {(((files[assignment.id]?.size ?? 0) / 1024 / 1024).toFixed(1))} MB</em>}</label><div className="task-submit-row"><small>Você pode enviar texto, PDF, Word, imagem ou combinar texto e anexo.</small><button className="student-primary" disabled={sendingId === assignment.id} onClick={() => submit(assignment)}>{sendingId === assignment.id ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{sendingId === assignment.id ? 'Enviando...' : 'Enviar tarefa'}</button></div></div> : <InteractiveSubmissionReview assignment={assignment} />)}</div>}
        </article>;
      }) : <EmptyPortal icon={EmptyIcon} title={assignments.length ? copy.emptyFiltered : copy.empty} text={assignments.length ? 'Escolha outro filtro para visualizar suas atividades.' : copy.emptyText} />}</div>
    </section>
  </div>;
}
