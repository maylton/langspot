import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Check, Clock3, Cloud, CloudOff, LoaderCircle } from 'lucide-react';
import { advanceAdaptiveAttempt, loadAssessmentAttempt, recordAssessmentEvent, saveAssessmentResponse, submitAssessmentAttempt } from '../attemptService';
import type { StudentAttemptPayload } from '../types';
import { enqueueAssessmentWrite, listAssessmentWrites, removeAssessmentWrite, type PendingAssessmentWrite } from './offlineQueue';
import { QuestionRenderer } from './QuestionRenderer';

type SaveState = 'saved' | 'saving' | 'offline';

export function AssessmentRunner({ client, attemptId, onComplete, onExit }: { client: SupabaseClient; attemptId: string; onComplete: () => void; onExit: () => void }) {
  const [payload, setPayload] = useState<StudentAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textTimer = useRef<number | null>(null);
  const questionStartedAt = useRef(Date.now());
  const outsideStartedAt = useRef<number | null>(null);
  const wasFullscreen = useRef(false);

  const flush = useCallback(async () => {
    if (!navigator.onLine) { setSaveState('offline'); return false; }
    const writes = await listAssessmentWrites(attemptId);
    if (!writes.length) { setSaveState('saved'); return true; }
    setSaveState('saving');
    try {
      for (const write of writes) { await saveAssessmentResponse(client, write.attemptId, write.questionId, write.answer); await removeAssessmentWrite(write.id); }
      setSaveState('saved'); return true;
    } catch { setSaveState('offline'); return false; }
  }, [attemptId, client]);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await loadAssessmentAttempt(client, attemptId);
        const pending = await listAssessmentWrites(attemptId);
        const merged = { ...loaded.answers };
        pending.forEach((write) => { merged[write.questionId] = write.answer; });
        setPayload(loaded); setAnswers(merged);
        const restored = loaded.questions.findIndex((question) => question.id === loaded.attempt.currentQuestionId);
        if (restored >= 0) setIndex(restored);
        void flush();
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a tentativa.'); }
    })();
  }, [attemptId, client, flush]);

  useEffect(() => {
    if (!payload?.attempt.expiresAt) { setRemaining(null); return; }
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(payload.attempt.expiresAt!).getTime() - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [payload?.attempt.expiresAt]);
  useEffect(() => {
    const audit = (type: Parameters<typeof recordAssessmentEvent>[2], metadata: Record<string, unknown> = {}) => void recordAssessmentEvent(client, attemptId, type, null, metadata).catch(() => undefined);
    const leave = () => { if (outsideStartedAt.current === null) { outsideStartedAt.current = Date.now(); audit('tab_blur'); } void flush(); };
    const returnToAssessment = () => { if (outsideStartedAt.current !== null) { audit('tab_focus', { durationMs: Date.now() - outsideStartedAt.current }); outsideStartedAt.current = null; } };
    const online = () => { audit('network_reconnect'); void flush(); };
    const offline = () => { setSaveState('offline'); audit('network_disconnect'); };
    const visibility = () => { if (document.visibilityState === 'hidden') leave(); else returnToAssessment(); };
    const fullscreen = () => { if (wasFullscreen.current && !document.fullscreenElement) audit('fullscreen_exit'); wasFullscreen.current = Boolean(document.fullscreenElement); };
    window.addEventListener('online', online); window.addEventListener('offline', offline); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', leave); window.addEventListener('focus', returnToAssessment); document.addEventListener('fullscreenchange', fullscreen);
    const periodic = window.setInterval(() => void flush(), 15000);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('blur', leave); window.removeEventListener('focus', returnToAssessment); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', fullscreen); window.clearInterval(periodic); };
  }, [attemptId, client, flush]);

  const queueAnswer = async (questionId: string, answer: string, immediate: boolean) => {
    setAnswers((current) => ({ ...current, [questionId]: answer })); setSaveState(navigator.onLine ? 'saving' : 'offline');
    const write: PendingAssessmentWrite = { id: `${attemptId}:${questionId}`, attemptId, questionId, answer, createdAt: new Date().toISOString() };
    await enqueueAssessmentWrite(write);
    if (textTimer.current) window.clearTimeout(textTimer.current);
    if (immediate) void flush(); else textTimer.current = window.setTimeout(() => void flush(), 600);
  };
  const submit = useCallback(async (forced = false) => {
    if (submitting) return;
    const missingRequired = payload?.questions.filter((item) => item.required && !answers[item.id]).length ?? 0;
    if (!forced && missingRequired) { setMessage(`Responda as ${missingRequired} questão(ões) obrigatória(s) antes de enviar.`); return; }
    setSubmitting(true); setMessage('');
    try {
      const synced = await flush();
      if (!synced) { setMessage('Conecte-se à internet para sincronizar as respostas antes de enviar.'); return; }
      await submitAssessmentAttempt(client, attemptId); onComplete();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar a avaliação.'); }
    finally { setSubmitting(false); }
  }, [answers, attemptId, client, flush, onComplete, payload?.questions, submitting]);
  useEffect(() => { if (remaining === 0) void submit(true); }, [remaining, submit]);

  const question = payload?.questions[index];
  useEffect(() => {
    if (!question) return;
    questionStartedAt.current = Date.now();
    void recordAssessmentEvent(client, attemptId, 'question_opened', question.id).catch(() => undefined);
  }, [attemptId, client, question?.id]);
  const closeQuestion = useCallback(async () => {
    if (!question) return;
    const durationMs = Date.now() - questionStartedAt.current;
    questionStartedAt.current = Date.now();
    await recordAssessmentEvent(client, attemptId, 'question_closed', question.id, { durationMs }).catch(() => undefined);
  }, [attemptId, client, question]);
  const advance = async () => {
    if (!payload || !question) return;
    if (!answers[question.id]) { setMessage('Responda a questão antes de avançar.'); return; }
    setSubmitting(true); setMessage('');
    try {
      await closeQuestion();
      if (!await flush()) { setMessage('Conecte-se à internet para receber a próxima questão adaptativa.'); return; }
      const result = await advanceAdaptiveAttempt(client, attemptId, question.id);
      if (result.complete) { await submitAssessmentAttempt(client, attemptId); onComplete(); return; }
      const loaded = await loadAssessmentAttempt(client, attemptId);
      setPayload(loaded); setAnswers(loaded.answers); setIndex(Math.max(0, loaded.questions.findIndex((item) => item.id === result.nextQuestionId)));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível avançar no placement.'); }
    finally { setSubmitting(false); }
  };
  const answered = useMemo(() => payload?.questions.filter((item) => Boolean(answers[item.id])).length ?? 0, [answers, payload?.questions]);
  if (message && !payload) return <div className="assessment-runner-shell"><div className="assessment-runner-error"><p>{message}</p><button onClick={onExit}>Voltar</button></div></div>;
  if (!payload || !question) return <div className="assessment-runner-shell"><LoaderCircle className="spin" size={28} />Carregando prova…</div>;
  const section = payload.sections.find((item) => item.id === question.sectionId);
  const linear = payload.assessment.navigationMode === 'linear';
  const adaptive = payload.assessment.assessmentMode === 'adaptive';
  const last = index === payload.questions.length - 1;
  const formatTime = remaining === null ? 'Sem limite' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  return <div className="assessment-runner-shell" onPasteCapture={(event) => void recordAssessmentEvent(client, attemptId, 'paste_detected', question.id, { pasteLength: event.clipboardData.getData('text').length }).catch(() => undefined)}><div className="assessment-runner-top"><div><span>{adaptive ? 'PLACEMENT ADAPTATIVO' : 'AVALIAÇÃO EM ANDAMENTO'}</span><h1>{payload.assessment.title}</h1></div><div className="assessment-runner-status"><span><Clock3 size={16} />{formatTime}</span><span aria-live="polite">{saveState === 'offline' ? <CloudOff size={16} /> : <Cloud size={16} />}{saveState === 'saving' ? 'Salvando…' : saveState === 'offline' ? 'Offline — alterações pendentes' : 'Salvo'}</span></div></div>
    <div className="assessment-runner-progress"><span>{adaptive ? `${answered} questão(ões) concluída(s) · percurso ajustado pelo servidor` : `${answered} de ${payload.questions.length} respondidas`}</span><i><b style={{ width: adaptive ? `${Math.min(95, answered * 10)}%` : `${payload.questions.length ? (answered / payload.questions.length) * 100 : 0}%` }} /></i></div>
    <main className="assessment-question-stage"><header><small>{section?.title} · Questão {index + 1}{adaptive ? '' : ` de ${payload.questions.length}`}</small><h2>{question.prompt}</h2>{section?.instructions && <p>{section.instructions}</p>}</header><QuestionRenderer client={client} attemptId={attemptId} question={question} value={answers[question.id] ?? ''} onChange={(value) => void queueAnswer(question.id, value, !['fill_blank', 'writing'].includes(question.type))} /></main>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {!linear && <nav className="assessment-question-nav" aria-label="Questões">{payload.questions.map((item, questionIndex) => <button key={item.id} className={`${questionIndex === index ? 'active' : ''} ${answers[item.id] ? 'answered' : ''}`} onClick={() => { void flush(); setIndex(questionIndex); }}>{questionIndex + 1}</button>)}</nav>}
    <footer className="assessment-runner-actions"><button className="secondary-button" disabled={adaptive || index === 0} onClick={() => { void closeQuestion(); void flush(); setIndex((value) => value - 1); }}><ArrowLeft size={16} />Anterior</button>{adaptive ? <button className="primary-button" disabled={submitting} onClick={() => void advance()}>{submitting ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}{submitting ? 'Calculando…' : 'Próxima questão'}</button> : last ? <button className="primary-button" disabled={submitting} onClick={() => { if (window.confirm('Enviar a avaliação? Depois do envio, as respostas não poderão ser alteradas.')) { void closeQuestion(); void submit(false); } }}>{submitting ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{submitting ? 'Enviando…' : 'Enviar avaliação'}</button> : <button className="primary-button" onClick={() => { void closeQuestion(); void flush(); setIndex((value) => value + 1); }}>Próxima<ArrowRight size={16} /></button>}</footer>
  </div>;
}
