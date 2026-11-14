import { ArrowRight, Check, Clock3, ExternalLink, FileText, LoaderCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { gradeQuestion, joinOrderingAnswer, splitOrderingAnswer } from '../../domains/questions';
import { DbAssignment } from '../../supabase';
import { AnnotatedSubmissionText, TextCommentsList } from '../../components/TextComments';
import { type InteractiveAssignmentContent, type InteractiveAssignmentResult } from '../../types';
import { assignmentTextComments, displayInteractiveAnswer, interactiveAttempts, interactiveMaxAttempts, shouldRevealInteractiveAnswers } from '../interactive';

function OrderingAnswer({ question, value, onChange }: { question: InteractiveAssignmentContent['questions'][number]; value: string; onChange: (value: string) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = value ? splitOrderingAnswer(value) : question.options.map((item) => item.trim()).filter(Boolean);
  const moveItem = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(joinOrderingAnswer(next));
    setDragIndex(null);
  };
  useEffect(() => { if (!value && question.options.length) onChange(joinOrderingAnswer(question.options)); }, [question.id]);
  return <div className="ordering-drag-list">{items.map((item, index) => <button type="button" draggable key={`${item}-${index}`} onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(index)} onDragEnd={() => setDragIndex(null)} className={dragIndex === index ? 'dragging' : ''}>{item}</button>)}</div>;
}

export function InteractiveAssignmentForm({ assignment, answers, onAnswer, onSubmit, busy }: { assignment: DbAssignment; answers: Record<string, string>; onAnswer: (questionId: string, answer: string) => void; onSubmit: () => void; busy: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  const questions = content?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  useEffect(() => { if (currentIndex >= questions.length) setCurrentIndex(Math.max(0, questions.length - 1)); }, [currentIndex, questions.length]);
  const typeHint = (type: string) => type === 'fill_blank' ? 'Digite a palavra ou expressão que completa a frase.' : type === 'ordering' ? 'Arraste os itens para montar a ordem correta.' : 'Escolha uma alternativa.';
  return <div className="task-response-box interactive-task-box"><div className="task-response-header"><div><label>Atividade interativa</label><span>Responda no seu ritmo. Você pode voltar para revisar antes de enviar.</span></div><span className="task-response-count">{answeredCount}/{questions.length}</span></div>{questions.length ? <><div className="interactive-progress"><div><span>Progresso do quiz</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i></div><div className="interactive-step-dots">{questions.map((question, index) => <button type="button" key={question.id} className={`${index === currentIndex ? 'active' : ''} ${answers[question.id] ? 'answered' : ''}`} onClick={() => setCurrentIndex(index)} aria-label={`Ir para questão ${index + 1}`}>{index + 1}</button>)}</div>{currentQuestion && <div className="interactive-question-list interactive-question-single"><fieldset key={currentQuestion.id}><span className="interactive-question-position">Questão {currentIndex + 1} de {questions.length}</span><legend>{currentQuestion.prompt}</legend><small className="interactive-question-hint">{typeHint(currentQuestion.type)}</small>{currentQuestion.type === 'ordering' ? <OrderingAnswer question={currentQuestion} value={answers[currentQuestion.id] ?? ''} onChange={(value) => onAnswer(currentQuestion.id, value)} /> : currentQuestion.type === 'fill_blank' ? <input className="interactive-text-answer" value={answers[currentQuestion.id] ?? ''} onChange={(event) => onAnswer(currentQuestion.id, event.target.value)} placeholder="Digite sua resposta" /> : currentQuestion.options.map((option) => <label key={option} className={answers[currentQuestion.id] === option ? 'selected' : ''}><input type="radio" name={`${assignment.id}-${currentQuestion.id}`} checked={answers[currentQuestion.id] === option} onChange={() => onAnswer(currentQuestion.id, option)} />{option}</label>)}</fieldset></div>}</> : <p>Esta atividade ainda não possui questões.</p>}<div className="interactive-navigation"><button type="button" className="cancel-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>Anterior</button>{currentIndex < questions.length - 1 ? <button type="button" className="student-primary" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}>Próxima <ArrowRight size={15} /></button> : <button className="student-primary" disabled={busy || !allAnswered} onClick={onSubmit}>{busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{busy ? 'Enviando...' : allAnswered ? 'Enviar quiz' : 'Responda tudo'}</button>}</div><div className="task-submit-row interactive-submit-note"><small>{allAnswered ? 'Tudo respondido. Pode enviar quando quiser.' : `Faltam ${Math.max(0, questions.length - answeredCount)} questão(ões) para liberar o envio.`}</small></div></div>;
}

function InteractiveDetailedFeedback({ assignment, result, revealAnswers }: { assignment: DbAssignment; result: InteractiveAssignmentResult; revealAnswers: boolean }) {
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  if (!content?.questions.length) return null;
  return <div className="interactive-feedback-list"><strong>Correção detalhada</strong>{content.questions.map((question, index) => {
    const userAnswer = result.answers[question.id] ?? '';
    const correct = gradeQuestion(question, userAnswer).correct;
    return <article key={question.id} className={correct ? 'correct' : 'incorrect'}><div><span>{correct ? <Check size={14} /> : <X size={14} />}{correct ? 'Correta' : 'Revisar'}</span><h4>{index + 1}. {question.prompt}</h4></div><p><b>Sua resposta:</b> {userAnswer ? displayInteractiveAnswer(question, userAnswer) : 'Sem resposta'}</p>{revealAnswers && !correct && <p><b>Resposta correta:</b> {displayInteractiveAnswer(question, question.answer)}</p>}{revealAnswers && question.explanation && <small>{question.explanation}</small>}{!revealAnswers && !correct && <small>O gabarito será liberado após a última tentativa.</small>}</article>;
  })}</div>;
}

export function InteractiveSubmissionReview({ assignment }: { assignment: DbAssignment }) {
  const result = assignment.interactive_result as InteractiveAssignmentResult | null | undefined;
  const content = assignment.interactive_content as InteractiveAssignmentContent | null | undefined;
  const attempts = interactiveAttempts(result);
  const maxAttempts = interactiveMaxAttempts(content);
  const revealAnswers = shouldRevealInteractiveAnswers(content, result);
  const comments = assignmentTextComments(assignment);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  return <div className="submission-preview student-submission-review"><div><strong>{assignment.assignment_type === 'interactive' ? 'Resultado da atividade' : 'Sua resposta'}</strong>{assignment.submitted_at && <small>Enviada em {new Date(assignment.submitted_at).toLocaleDateString('pt-BR')}</small>}</div>{result && <><div className="interactive-result-card"><strong>{result.percentage}%</strong><span>{result.score}/{result.total} acertos</span><small>Tentativa {attempts.length}{maxAttempts ? ` de ${maxAttempts}` : ' · ilimitadas'}</small></div>{attempts.length > 1 && <div className="interactive-attempt-list">{attempts.map((attempt, index) => <span key={`${attempt.submittedAt}-${index}`}>Tentativa {index + 1}: <b>{attempt.percentage}%</b></span>)}</div>}<InteractiveDetailedFeedback assignment={assignment} result={result} revealAnswers={revealAnswers} /></>}{assignment.submission_text ? <AnnotatedSubmissionText text={assignment.submission_text} comments={comments} activeId={activeCommentId} onActivate={setActiveCommentId} /> : <p>Nenhuma resposta em texto.</p>}<TextCommentsList comments={comments} activeId={activeCommentId} onActivate={setActiveCommentId} />{assignment.submission_file_url && <a className="submission-file-link" href={assignment.submission_file_url} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submission_file_name || 'Arquivo anexado'}<ExternalLink size={13} /></a>}{assignment.status === 'submitted' && <div className="awaiting-review"><Clock3 size={15} />Aguardando correção do professor</div>}{assignment.feedback && <div className="teacher-feedback"><strong>Feedback do professor</strong><p>{assignment.feedback}</p>{assignment.grade !== null && <span>Nota: <b>{assignment.grade}</b>/100</span>}</div>}</div>;
}
