import { Check, ClipboardList, Clock3, ExternalLink, Eye, FileQuestion, FileText, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AnnotatedSubmissionText, TextCommentsList } from '../../components/TextComments';
import { interactiveResultSummary } from '../../lib/quiz';
import { type Assignment, type AssignmentStatus, type Id, type Student } from '../../types';
import { QuizPreviewModal } from '../modals/QuizModals';

export function AssignmentsPage({ assignments, students, mode, onNew, onManageBank, onDelete, onReview }: { assignments: Assignment[]; students: Student[]; mode: 'tasks' | 'quiz'; onNew: () => void; onManageBank?: () => void; onDelete: (assignment: Assignment) => void; onReview: (assignment: Assignment) => void }) {
  const [openAssignmentId, setOpenAssignmentId] = useState<Id | null>(null);
  const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<Id | null>(null);
  const ordered = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
  const statusCount = (status: AssignmentStatus) => assignments.filter((assignment) => assignment.status === status).length;
  const copy = mode === 'quiz'
    ? { eyebrow: 'QUIZ', title: 'Quizzes interativos', description: 'Crie atividades objetivas, acompanhe tentativas e revise os resultados.', button: 'Novo quiz', open: 'Abrir quiz', emptyTitle: 'Nenhum quiz criado', emptyText: 'Crie quizzes interativos para os alunos responderem na plataforma.', emptyButton: 'Criar primeiro quiz', review: 'Corrigir quiz', icon: FileQuestion }
    : { eyebrow: 'ATIVIDADES', title: 'Tarefas e entregas', description: 'Acompanhe prazos, respostas e correções dos alunos.', button: 'Nova tarefa', open: 'Abrir tarefa', emptyTitle: 'Nenhuma tarefa criada', emptyText: 'Crie atividades com prazo e acompanhe as entregas dos alunos.', emptyButton: 'Criar primeira tarefa', review: 'Corrigir tarefa', icon: ClipboardList };
  const deliveredLabel = mode === 'quiz' ? 'Realizados' : 'Entregues';
  const reviewedLabel = mode === 'quiz' ? 'Corrigidos' : 'Corrigidas';
  const EmptyIcon = copy.icon;
  return <>
    <div className="assignment-summary-grid">
      <article><ClipboardList size={18} /><span>Pendentes</span><strong>{statusCount('Pendente')}</strong></article>
      <article><Clock3 size={18} /><span>{deliveredLabel}</span><strong>{statusCount('Entregue')}</strong></article>
      <article><Check size={18} /><span>{reviewedLabel}</span><strong>{statusCount('Corrigida')}</strong></article>
    </div>
    <section className="panel assignments-panel">
      <div className="panel-heading assignments-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h3>{copy.title}</h3><p>{copy.description}</p></div><div className="assignment-heading-actions">{mode === 'quiz' && onManageBank && <button className="secondary-button compact" onClick={onManageBank}><FolderOpen size={16} />Banco de questões</button>}<button className="secondary-button compact" onClick={onNew}><Plus size={16} />{copy.button}</button></div></div>
      {ordered.length ? <div className="assignment-board">{ordered.map((assignment) => { const isOpen = openAssignmentId === assignment.id; return <article className={`assignment-card ${isOpen ? 'open' : ''}`} key={assignment.id}>
        <div className="assignment-card-top">
          <div className="assignment-card-title"><div className="assignment-status-line"><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><span className="assignment-student-name">{studentName(assignment.studentId)}</span>{assignment.assignmentType === 'interactive' && <span className="assignment-kind-badge"><FileQuestion size={12} />Interativa</span>}</div><h3>{assignment.title}</h3><p>{assignment.instructions}</p></div>
          <div className="assignment-card-meta"><div className="assignment-due"><span>Prazo</span><strong>{new Date(`${assignment.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div><button type="button" onClick={() => setOpenAssignmentId(isOpen ? null : assignment.id)}>{isOpen ? 'Fechar' : copy.open}</button></div>
        </div>
        {isOpen && <div className="assignment-card-details"><div className="assignment-instructions"><span>Instruções</span><p>{assignment.instructions}</p></div>
        {(assignment.submissionText || assignment.submissionFileUrl || assignment.interactiveResult) && <div className="submission-preview"><strong>Resposta do aluno</strong>{assignment.interactiveResult && <p>Resultado do quiz: {interactiveResultSummary(assignment.interactiveResult)}</p>}{assignment.submissionText && <AnnotatedSubmissionText text={assignment.submissionText} comments={assignment.textComments} activeId={activeCommentId} onActivate={setActiveCommentId} />}{assignment.submissionFileUrl && <a className="submission-file-link" href={assignment.submissionFileUrl} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submissionFileName || 'Arquivo anexado'}<ExternalLink size={13} /></a>}<TextCommentsList comments={assignment.textComments} activeId={activeCommentId} onActivate={setActiveCommentId} /></div>}
        {assignment.feedback && <div className="feedback-preview"><strong>Feedback</strong><p>{assignment.feedback}</p>{assignment.grade !== undefined && <span className="assignment-grade">Nota: {assignment.grade}</span>}</div>}</div>}
        <div className="assignment-card-actions">{mode === 'quiz' && assignment.assignmentType === 'interactive' && <button className="assignment-preview-button" onClick={() => setPreviewAssignment(assignment)}><Eye size={15} />Pré-visualizar</button>}{assignment.status === 'Entregue' && <button className="assignment-review-button" onClick={() => onReview(assignment)}><Check size={15} />{copy.review}</button>}<button className="assignment-delete-button" onClick={() => onDelete(assignment)} aria-label={`Excluir ${assignment.title}`}><Trash2 size={15} />Excluir</button></div>
      </article>; })}</div> : <div className="empty-state"><EmptyIcon size={38} /><h3>{copy.emptyTitle}</h3><p>{copy.emptyText}</p><button className="primary-button" onClick={onNew}><Plus size={16} />{copy.emptyButton}</button></div>}
    </section>
    {previewAssignment && <QuizPreviewModal assignment={previewAssignment} onClose={() => setPreviewAssignment(null)} />}
  </>;
}
