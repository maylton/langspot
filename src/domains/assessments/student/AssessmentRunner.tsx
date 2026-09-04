import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Check, Clock3, Cloud, CloudOff, LoaderCircle } from 'lucide-react';
import { loadAssessmentAttempt, saveAssessmentResponse, submitAssessmentAttempt } from '../attemptService';
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
    const online = () => void flush();
    const offline = () => setSaveState('offline');
    const visibility = () => { if (document.visibilityState === 'hidden') void flush(); };
    window.addEventListener('online', online); window.addEventListener('offline', offline); document.addEventListener('visibilitychange', visibility);
    const periodic = window.setInterval(() => void flush(), 15000);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', visibility); window.clearInterval(periodic); };
  }, [flush]);

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
  const answered = useMemo(() => payload?.questions.filter((item) => Boolean(answers[item.id])).length ?? 0, [answers, payload?.questions]);
  if (message && !payload) return <div className="assessment-runner-shell"><div className="assessment-runner-error"><p>{message}</p><button onClick={onExit}>Voltar</button></div></div>;
  if (!payload || !question) return <div className="assessment-runner-shell"><LoaderCircle className="spin" size={28} />Carregando prova…</div>;
  const section = payload.sections.find((item) => item.id === question.sectionId);
  const linear = payload.assessment.navigationMode === 'linear';
  const last = index === payload.questions.length - 1;
  const formatTime = remaining === null ? 'Sem limite' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  return <div className="assessment-runner-shell"><div className="assessment-runner-top"><div><span>AVALIAÇÃO EM ANDAMENTO</span><h1>{payload.assessment.title}</h1></div><div className="assessment-runner-status"><span><Clock3 size={16} />{formatTime}</span><span>{saveState === 'offline' ? <CloudOff size={16} /> : <Cloud size={16} />}{saveState === 'saving' ? 'Salvando…' : saveState === 'offline' ? 'Offline — alterações pendentes' : 'Salvo'}</span></div></div>
    <div className="assessment-runner-progress"><span>{answered} de {payload.questions.length} respondidas</span><i><b style={{ width: `${payload.questions.length ? (answered / payload.questions.length) * 100 : 0}%` }} /></i></div>
    <main className="assessment-question-stage"><header><small>{section?.title} · Questão {index + 1} de {payload.questions.length}</small><h2>{question.prompt}</h2>{section?.instructions && <p>{section.instructions}</p>}</header><QuestionRenderer question={question} value={answers[question.id] ?? ''} onChange={(value) => void queueAnswer(question.id, value, question.type !== 'fill_blank')} /></main>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {!linear && <nav className="assessment-question-nav" aria-label="Questões">{payload.questions.map((item, questionIndex) => <button key={item.id} className={`${questionIndex === index ? 'active' : ''} ${answers[item.id] ? 'answered' : ''}`} onClick={() => { void flush(); setIndex(questionIndex); }}>{questionIndex + 1}</button>)}</nav>}
    <footer className="assessment-runner-actions"><button className="secondary-button" disabled={index === 0} onClick={() => { void flush(); setIndex((value) => value - 1); }}><ArrowLeft size={16} />Anterior</button>{last ? <button className="primary-button" disabled={submitting} onClick={() => { if (window.confirm('Enviar a avaliação? Depois do envio, as respostas não poderão ser alteradas.')) void submit(false); }}>{submitting ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{submitting ? 'Enviando…' : 'Enviar avaliação'}</button> : <button className="primary-button" onClick={() => { void flush(); setIndex((value) => value + 1); }}>Próxima<ArrowRight size={16} /></button>}</footer>
  </div>;
}
