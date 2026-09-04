import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, ClipboardCheck, LoaderCircle } from 'lucide-react';
import { finalizeAssessmentReview, getAssessmentResult, listAssessmentAttempts, reviewAssessmentResponse } from '../assessmentService';
import type { AssessmentAttemptRow, AssessmentRow } from '../database';
import type { AssessmentResultQuestion, TeacherAssessmentResult } from '../types';
import { AssessmentIntegrityPanel } from './AssessmentIntegrityPanel';

export function AssessmentResults({ client, assessment, onBack }: { client: SupabaseClient; assessment: AssessmentRow; onBack: () => void }) {
  const [attempts, setAttempts] = useState<AssessmentAttemptRow[]>([]);
  const [report, setReport] = useState<TeacherAssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const loadAttempts = useCallback(async () => {
    setLoading(true); setMessage('');
    try { setAttempts(await listAssessmentAttempts(client, assessment.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as tentativas.'); }
    setLoading(false);
  }, [assessment.id, client]);
  useEffect(() => { void loadAttempts(); }, [loadAttempts]);
  const open = async (attemptId: string) => {
    setLoading(true); setMessage('');
    try { setReport(await getAssessmentResult(client, attemptId)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o relatório.'); }
    setLoading(false);
  };
  const reloadReport = async () => { if (report) setReport(await getAssessmentResult(client, report.attempt.id)); };

  if (report) return <AssessmentAttemptDetails report={report} onBack={() => setReport(null)} onReview={async (responseId, score, feedback) => { await reviewAssessmentResponse(client, responseId, score, feedback); await reloadReport(); }} onFinalize={async () => { await finalizeAssessmentReview(client, report.attempt.id); await reloadReport(); await loadAttempts(); }} />;
  return <section className="assessment-results"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button><p className="eyebrow">RESULTADOS</p><h2>{assessment.title}</h2><p>Tentativas, notas por seção e revisão pedagógica.</p></div></header>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando resultados…</div> : attempts.length ? <div className="assessment-attempt-list">{attempts.map((attempt) => <button key={attempt.id} onClick={() => void open(attempt.id)}><span><strong>{new Date(attempt.started_at).toLocaleString('pt-BR')}</strong><small>{attempt.status} · {attempt.scaled_score === null ? 'Aguardando nota' : `${attempt.scaled_score}%`}</small></span><ClipboardCheck size={18} /></button>)}</div> : <div className="assessment-empty"><ClipboardCheck size={38} /><h3>Nenhuma tentativa</h3><p>Os envios dos alunos aparecerão aqui.</p></div>}
  </section>;
}

function AssessmentAttemptDetails({ report, onBack, onReview, onFinalize }: {
  report: TeacherAssessmentResult;
  onBack: () => void;
  onReview: (responseId: string, score: number, feedback: string) => Promise<void>;
  onFinalize: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = report.questions.filter((question) => question.gradingStatus === 'manual_review' || question.gradingStatus === 'pending').length;
  return <section className="assessment-report"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Tentativas</button><p className="eyebrow">RELATÓRIO DA TENTATIVA</p><h2>{report.attempt.studentName}</h2><p>{report.assessment.title} · versão {report.assessment.version} · {report.attempt.scoringModelVersion}</p></div><div className="assessment-score"><strong>{report.attempt.scaledScore ?? '—'}%</strong><span>{report.attempt.status}</span></div></header>
    <div className="assessment-section-results">{report.sections.map((section) => <article key={section.id}><span>{section.skill}</span><strong>{section.percentage ?? 0}%</strong><small>{section.score}/{section.maxScore} pontos</small></article>)}</div>
    {report.adaptiveSkills?.length ? <section className="assessment-adaptive-results"><p className="eyebrow">PLACEMENT ADAPTATIVO</p><div>{report.adaptiveSkills.map((skill) => <article key={skill.sectionId}><span>{skill.skill}</span><strong>{skill.cefr}</strong><small>ability {skill.ability} · confiança {Math.round(skill.confidence * 100)}% · {skill.itemsAnswered} itens</small></article>)}</div></section> : null}
    <AssessmentIntegrityPanel report={report.integrity} />
    <div className="assessment-report-questions">{report.questions.map((question, index) => <QuestionReview key={question.id} index={index} question={question} onReview={onReview} />)}</div>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    <footer className="assessment-review-footer"><span>{pending ? `${pending} resposta(s) aguardando revisão manual.` : report.attempt.reviewedAt ? `Revisão concluída em ${new Date(report.attempt.reviewedAt).toLocaleString('pt-BR')}.` : 'Todas as respostas estão corrigidas.'}</span>{!pending && !report.attempt.reviewedAt && <button className="primary-button" disabled={busy} onClick={() => void (async () => { setBusy(true); setMessage(''); try { await onFinalize(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a revisão.'); } finally { setBusy(false); } })()}><Check size={16} />{busy ? 'Concluindo…' : 'Concluir revisão'}</button>}</footer>
  </section>;
}

function QuestionReview({ question, index, onReview }: { question: AssessmentResultQuestion; index: number; onReview: (responseId: string, score: number, feedback: string) => Promise<void> }) {
  const manual = question.gradingStatus === 'manual_review' || question.gradingStatus === 'pending';
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!question.responseId) return;
    const form = new FormData(event.currentTarget); setBusy(true);
    try { await onReview(question.responseId, Number(form.get('score')), String(form.get('feedback') ?? '')); }
    finally { setBusy(false); }
  };
  return <article><div className="assessment-question-result-heading"><span>{index + 1}</span><div><h3>{question.prompt}</h3><small>{question.type} · {question.gradingStatus}</small></div><strong>{question.score ?? '—'}/{question.maxScore ?? '—'}</strong></div><div className="assessment-answer-comparison"><p><b>Resposta do aluno</b>{question.answer || 'Em branco'}</p><p><b>Gabarito</b>{question.correctAnswer || 'Correção manual'}</p></div>{question.explanation && <p className="assessment-explanation">{question.explanation}</p>}{manual && question.responseId ? <form className="assessment-manual-review" onSubmit={submit}><label>Nota<input name="score" type="number" min="0" max={question.maxScore ?? undefined} step="0.01" required /></label><label>Feedback<textarea name="feedback" rows={2} defaultValue={question.teacherFeedback} /></label><button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar correção'}</button></form> : question.teacherFeedback && <p className="teacher-feedback"><b>Feedback</b>{question.teacherFeedback}</p>}</article>;
}
