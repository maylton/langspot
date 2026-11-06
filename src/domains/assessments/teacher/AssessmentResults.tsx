import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, ClipboardCheck, FileText, LoaderCircle } from 'lucide-react';
import { finalizeAssessmentReview, getAssessmentReportNote, getAssessmentResult, getPreviousAssessmentForReport, listAssessmentAttempts, overrideAssessmentCefrLevel, reviewAssessmentResponse, saveAssessmentReportNote } from '../assessmentService';
import type { AssessmentReportNote, PreviousAssessmentForReport } from '../report';
import { StudentReport } from '../StudentReport';
import type { AssessmentAttemptRow, AssessmentRow } from '../database';
import type { AssessmentResultQuestion, TeacherAssessmentResult } from '../types';
import { AssessmentIntegrityPanel } from './AssessmentIntegrityPanel';
import { createAssessmentAudioUrl } from '../mediaService';
import { calculateRubricScore } from '../rubric';
import { CefrProfileReport } from '../CefrProfileReport';
import { CEFR_LEVELS } from '../cefr';

export function AssessmentResults({ client, assessment, studentNames, onBack }: { client: SupabaseClient; assessment: AssessmentRow; studentNames?: Map<string, string>; onBack: () => void }) {
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

  if (report) return <AssessmentAttemptDetails client={client} report={report} onBack={() => setReport(null)} onReview={async (responseId, score, feedback, rubricScores) => { await reviewAssessmentResponse(client, responseId, score, feedback, rubricScores); await reloadReport(); }} onFinalize={async () => { await finalizeAssessmentReview(client, report.attempt.id); await reloadReport(); await loadAttempts(); }} />;
  return <section className="assessment-results"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button><p className="eyebrow">RESULTADOS</p><h2>{assessment.title}</h2><p>Tentativas, notas por seção e revisão pedagógica.</p></div></header>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando resultados…</div> : attempts.length ? <div className="assessment-attempt-list">{attempts.map((attempt) => <button key={attempt.id} onClick={() => void open(attempt.id)}><span><strong>{studentNames?.get(attempt.student_id) ?? 'Aluno'}</strong><small>{new Date(attempt.started_at).toLocaleString('pt-BR')} · {attempt.status} · {attempt.scaled_score === null ? 'Aguardando nota' : `${attempt.scaled_score}%`}</small></span><ClipboardCheck size={18} /></button>)}</div> : <div className="assessment-empty"><ClipboardCheck size={38} /><h3>Nenhuma tentativa</h3><p>Os envios dos alunos aparecerão aqui.</p></div>}
  </section>;
}

function AssessmentAttemptDetails({ client, report, onBack, onReview, onFinalize }: {
  client: SupabaseClient;
  report: TeacherAssessmentResult;
  onBack: () => void;
  onReview: (responseId: string, score: number, feedback: string, rubricScores: Record<string, number>) => Promise<void>;
  onFinalize: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const pending = report.questions.filter((question) => question.gradingStatus === 'manual_review' || question.gradingStatus === 'pending').length;
  return <section className="assessment-report"><header className="assessment-dashboard-header"><div><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Tentativas</button><p className="eyebrow">RELATÓRIO DA TENTATIVA</p><h2>{report.attempt.studentName}</h2><p>{report.assessment.title} · versão {report.assessment.version} · {report.attempt.scoringModelVersion}</p></div><div className="assessment-score"><strong>{report.cefrProfile?.overallLevel ?? `${report.attempt.scaledScore ?? '—'}%`}</strong><span>{report.attempt.status}</span></div></header>
    <button type="button" className="secondary-button compact assessment-report-toggle" onClick={() => setReportOpen((value) => !value)}><FileText size={15} />{reportOpen ? 'Fechar relatório do aluno' : 'Relatório para o aluno'}</button>
    {reportOpen && <TeacherReportPanel client={client} report={report} />}
    {report.cefrProfile && <><CefrProfileReport profile={report.cefrProfile} /><CefrOverride attemptId={report.attempt.id} currentLevel={report.cefrProfile.overallLevel} onOverride={async (level, reason) => { await overrideAssessmentCefrLevel(client, report.attempt.id, level, reason); await onFinalize().catch(() => undefined); }} /></>}
    <div className="assessment-section-results">{report.sections.map((section) => <article key={section.id}><span>{section.skill}</span><strong>{section.percentage ?? 0}%</strong><small>{section.score}/{section.maxScore} pontos</small></article>)}</div>
    {report.adaptiveSkills?.length ? <section className="assessment-adaptive-results"><p className="eyebrow">PLACEMENT ADAPTATIVO</p><div>{report.adaptiveSkills.map((skill) => <article key={skill.sectionId}><span>{skill.skill}</span><strong>{skill.cefr}</strong><small>ability {skill.ability} · confiança {Math.round(skill.confidence * 100)}% · {skill.itemsAnswered} itens</small></article>)}</div></section> : null}
    <AssessmentIntegrityPanel report={report.integrity} />
    <div className="assessment-report-questions">{report.questions.map((question, index) => <QuestionReview client={client} key={question.id} index={index} question={question} onReview={onReview} />)}</div>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    <footer className="assessment-review-footer"><span>{pending ? `${pending} resposta(s) aguardando revisão manual.` : report.attempt.reviewedAt ? `Revisão concluída em ${new Date(report.attempt.reviewedAt).toLocaleString('pt-BR')}.` : 'Todas as respostas estão corrigidas.'}</span>{!pending && !report.attempt.reviewedAt && <button className="primary-button" disabled={busy} onClick={() => void (async () => { setBusy(true); setMessage(''); try { await onFinalize(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a revisão.'); } finally { setBusy(false); } })()}><Check size={16} />{busy ? 'Concluindo…' : 'Concluir revisão'}</button>}</footer>
  </section>;
}

export function QuestionReview({ client, question, index, onReview }: { client: SupabaseClient; question: AssessmentResultQuestion; index: number; onReview: (responseId: string, score: number, feedback: string, rubricScores: Record<string, number>) => Promise<void> }) {
  const manual = question.gradingStatus === 'manual_review' || question.gradingStatus === 'pending';
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!question.responseId) return;
    const form = new FormData(event.currentTarget); setBusy(true);
    const rubricScores = Object.fromEntries((question.rubric ?? []).map((criterion) => [criterion.key, Number(form.get(`rubric_${criterion.key}`))]));
    const score = question.rubric?.length ? calculateRubricScore(question.rubric, rubricScores, question.maxScore ?? 0) : Number(form.get('score'));
    try { await onReview(question.responseId, score, String(form.get('feedback') ?? ''), rubricScores); }
    finally { setBusy(false); }
  };
  return <article><div className="assessment-question-result-heading"><span>{index + 1}</span><div><h3>{question.prompt}</h3><small>{question.type} · {question.gradingStatus}</small></div><strong>{question.score ?? '—'}/{question.maxScore ?? '—'}</strong></div><div className="assessment-answer-comparison"><p><b>Resposta do aluno</b>{question.answer === 'live' && ['speaking', 'mediation'].includes(question.type ?? '') ? 'Aplicada ao vivo pelo professor' : question.type === 'speaking' ? 'Gravação enviada' : question.answer || 'Em branco'}</p><p><b>Gabarito</b>{question.correctAnswer || 'Correção manual'}</p></div>{question.mediaPath && <TeacherAudioPlayer client={client} path={question.mediaPath} />}{question.transcript && <p className="assessment-transcript"><b>Transcrição</b>{question.transcript}</p>}{question.explanation && <p className="assessment-explanation">{question.explanation}</p>}{manual && question.responseId ? <form className="assessment-manual-review" onSubmit={submit}>{question.rubric?.length ? <div className="assessment-rubric">{question.rubric.map((criterion) => <label key={criterion.key}>{criterion.label}{criterion.scale === 'cefr' ? <select name={`rubric_${criterion.key}`} defaultValue={question.rubricScores?.[criterion.key] ?? 1} required>{CEFR_LEVELS.map((level, levelIndex) => <option key={level} value={levelIndex + 1}>{level}</option>)}</select> : <input name={`rubric_${criterion.key}`} type="number" min="0" max={criterion.maxScore} step="0.5" defaultValue={question.rubricScores?.[criterion.key] ?? 0} required />}</label>)}</div> : <label>Nota<input name="score" type="number" min="0" max={question.maxScore ?? undefined} step="0.01" required /></label>}<label>Feedback<textarea name="feedback" rows={2} defaultValue={question.teacherFeedback} /></label><button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar correção'}</button></form> : question.teacherFeedback && <p className="teacher-feedback"><b>Feedback</b>{question.teacherFeedback}</p>}</article>;
}

function CefrOverride({ attemptId, currentLevel, onOverride }: { attemptId: string; currentLevel: string | null; onOverride: (level: typeof CEFR_LEVELS[number], reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  if (!open) return <button className="secondary-button" onClick={() => setOpen(true)}>Revisar nível CEFR</button>;
  return <form className="assessment-manual-review" onSubmit={(event) => void (async () => { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage(''); try { await onOverride(String(form.get('level')) as typeof CEFR_LEVELS[number], String(form.get('reason'))); setOpen(false); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível registrar o override.'); } finally { setBusy(false); } })()}><p>Resultado automático: <b>{currentLevel ?? 'sem classificação'}</b></p><label>Nível revisado<select name="level" defaultValue={currentLevel ?? 'B1'}>{CEFR_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label><label>Justificativa<textarea name="reason" minLength={10} required /></label>{message && <p role="alert">{message}</p>}<button className="primary-button" disabled={busy}>Registrar revisão auditável</button></form>;
}

export function TeacherAudioPlayer({ client, path }: { client: SupabaseClient; path: string }) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { let active = true; void createAssessmentAudioUrl(client, path).then((value) => { if (active) setUrl(value); }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Áudio indisponível.'); }); return () => { active = false; }; }, [client, path]);
  return url ? <audio aria-label="Gravação do aluno" className="assessment-teacher-audio" src={url} controls preload="metadata" /> : <small>{message || 'Carregando áudio…'}</small>;
}

function TeacherReportPanel({ client, report }: { client: SupabaseClient; report: TeacherAssessmentResult }) {
  const attemptId = report.attempt.id;
  const [summary, setSummary] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [saved, setSaved] = useState<AssessmentReportNote | null>(null);
  const [previous, setPrevious] = useState<PreviousAssessmentForReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    void getAssessmentReportNote(client, attemptId).then((note) => { if (!active) return; setSaved(note); setSummary(note?.summary ?? ''); setNextSteps(note?.nextSteps ?? ''); }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o comentário.'); });
    void getPreviousAssessmentForReport(client, attemptId).then((value) => { if (active) setPrevious(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [attemptId, client]);
  const dirty = summary.trim() !== (saved?.summary ?? '') || nextSteps.trim() !== (saved?.nextSteps ?? '');
  const save = async () => {
    setBusy(true); setMessage('');
    try { await saveAssessmentReportNote(client, attemptId, summary, nextSteps); setSaved(await getAssessmentReportNote(client, attemptId)); setMessage('Comentário salvo. O aluno verá quando o resultado estiver liberado.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar o comentário.'); }
    finally { setBusy(false); }
  };
  return <section className="teacher-report-panel">
    <form className="teacher-report-note" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div><p className="eyebrow">RELATÓRIO PARA O ALUNO</p><p>Escreva um comentário geral e os próximos passos. Eles aparecem no relatório do aluno e no PDF.</p></div>
      <label>Comentário do professor<textarea rows={3} maxLength={4000} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ex.: Você evoluiu muito na interação oral desde a última avaliação." /></label>
      <label>Próximos passos<textarea rows={3} maxLength={4000} value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} placeholder="Ex.: Revisar conectivos; gravar um resumo de 2 minutos por semana." /></label>
      {message && <p role="status" className="teacher-report-message">{message}</p>}
      <button className="primary-button" disabled={busy || !dirty}>{busy ? 'Salvando…' : 'Salvar comentário'}</button>
    </form>
    <StudentReport title={report.assessment.title} studentName={report.attempt.studentName} completedAt={report.attempt.reviewedAt ?? report.attempt.submittedAt} score={report.attempt.scaledScore} estimatedCefr={report.attempt.estimatedCefr} sections={report.sections} cefrProfile={report.cefrProfile} previous={previous} note={{ summary: summary.trim(), nextSteps: nextSteps.trim(), updatedAt: saved?.updatedAt ?? '' }} />
  </section>;
}
