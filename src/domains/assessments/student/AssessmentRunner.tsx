import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Clock3, Cloud, CloudOff, LoaderCircle, Lock, Play } from 'lucide-react';
import { advanceAdaptiveAttempt, completeAssessmentSection, isClosedPartError, loadAssessmentAttempt, recordAssessmentEvent, saveAssessmentResponse, startAssessmentSection, submitAssessmentAttempt } from '../attemptService';
import type { StudentAttemptPayload } from '../types';
import { enqueueAssessmentWrite, listAssessmentWrites, removeAssessmentWrite, type PendingAssessmentWrite } from './offlineQueue';
import { allStagesDone, buildStages, currentStage, formatClock, nextStage, secondsLeft, studentSectionTitle, type Stage } from './pacing';
import { QuestionRenderer } from './QuestionRenderer';
import { SubmitConfirmation } from './SubmitConfirmation';
import { bulkInsertion, canUseAssessmentFullscreen, enterAssessmentFullscreen } from './integrity';

type SaveState = 'saved' | 'saving' | 'offline';

export function AssessmentRunner({ client, attemptId, onComplete, onExit }: { client: SupabaseClient; attemptId: string; onComplete: () => void; onExit: () => void }) {
  const [payload, setPayload] = useState<StudentAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  // Paced assessments: the part being answered (null = list of parts).
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [confirmingStageEnd, setConfirmingStageEnd] = useState(false);
  const textTimer = useRef<number | null>(null);
  const questionStartedAt = useRef(Date.now());
  const outsideStartedAt = useRef<number | null>(null);
  const wasFullscreen = useRef(false);
  const closingStage = useRef(false);
  const fieldLengths = useRef(new WeakMap<EventTarget, number>());
  const [fullscreenLost, setFullscreenLost] = useState(false);

  const flush = useCallback(async () => {
    if (!navigator.onLine) { setSaveState('offline'); return false; }
    const writes = await listAssessmentWrites(attemptId);
    if (!writes.length) { setSaveState('saved'); return true; }
    setSaveState('saving');
    try {
      for (const write of writes) {
        try { await saveAssessmentResponse(client, write.attemptId, write.questionId, write.answer); }
        catch (error) {
          // A write for a part that already closed can never be saved; drop it instead of blocking every later save.
          if (!(error instanceof Error && isClosedPartError(error.message))) throw error;
        }
        await removeAssessmentWrite(write.id);
      }
      setSaveState('saved'); return true;
    } catch { setSaveState('offline'); return false; }
  }, [attemptId, client]);

  const reload = useCallback(async () => {
    const loaded = await loadAssessmentAttempt(client, attemptId);
    const pending = await listAssessmentWrites(attemptId);
    const merged = { ...loaded.answers };
    pending.forEach((write) => { merged[write.questionId] = write.answer; });
    setPayload(loaded); setAnswers(merged);
    return loaded;
  }, [attemptId, client]);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await reload();
        if (loaded.assessment.sectionPacing) {
          const open = currentStage(buildStages(loaded.sections, loaded.questions));
          setActiveSectionId(open?.section.id ?? null);
          const restored = loaded.questions.filter((question) => question.sectionId === open?.section.id).findIndex((question) => question.id === loaded.attempt.currentQuestionId);
          setIndex(Math.max(0, restored));
        } else {
          const restored = loaded.questions.findIndex((question) => question.id === loaded.attempt.currentQuestionId);
          if (restored >= 0) setIndex(restored);
        }
        void flush();
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a tentativa.'); }
    })();
  }, [flush, reload]);

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  useEffect(() => {
    const audit = (type: Parameters<typeof recordAssessmentEvent>[2], metadata: Record<string, unknown> = {}) => void recordAssessmentEvent(client, attemptId, type, null, metadata).catch(() => undefined);
    const leave = () => { if (outsideStartedAt.current === null) { outsideStartedAt.current = Date.now(); audit('tab_blur'); } void flush(); };
    const returnToAssessment = () => { if (outsideStartedAt.current !== null) { audit('tab_focus', { durationMs: Date.now() - outsideStartedAt.current }); outsideStartedAt.current = null; } };
    const online = () => { audit('network_reconnect'); void flush(); };
    const offline = () => { setSaveState('offline'); audit('network_disconnect'); };
    const visibility = () => { if (document.visibilityState === 'hidden') leave(); else returnToAssessment(); };
    const fullscreen = () => { if (wasFullscreen.current && !document.fullscreenElement) { audit('fullscreen_exit'); setFullscreenLost(true); } if (document.fullscreenElement) setFullscreenLost(false); wasFullscreen.current = Boolean(document.fullscreenElement); };
    wasFullscreen.current = Boolean(document.fullscreenElement);
    window.addEventListener('online', online); window.addEventListener('offline', offline); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', leave); window.addEventListener('focus', returnToAssessment); document.addEventListener('fullscreenchange', fullscreen);
    const periodic = window.setInterval(() => void flush(), 15000);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('blur', leave); window.removeEventListener('focus', returnToAssessment); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', fullscreen); window.clearInterval(periodic); };
  }, [attemptId, client, flush]);

  const paced = Boolean(payload?.assessment.sectionPacing);
  const stages = useMemo(() => payload ? buildStages(payload.sections, payload.questions, now) : [], [now, payload]);
  const activeStage = stages.find((stage) => stage.section.id === activeSectionId) ?? null;
  const visibleQuestions = useMemo(() => payload ? (paced ? payload.questions.filter((question) => question.sectionId === activeSectionId) : payload.questions) : [], [activeSectionId, paced, payload]);
  const question = visibleQuestions[index];
  const remaining = paced ? secondsLeft(activeStage?.section.expiresAt, now) : secondsLeft(payload?.attempt.expiresAt, now);

  const queueAnswer = async (questionId: string, answer: string, immediate: boolean) => {
    setAnswers((current) => ({ ...current, [questionId]: answer })); setSaveState(navigator.onLine ? 'saving' : 'offline');
    const write: PendingAssessmentWrite = { id: `${attemptId}:${questionId}`, attemptId, questionId, answer, createdAt: new Date().toISOString() };
    await enqueueAssessmentWrite(write);
    if (textTimer.current) window.clearTimeout(textTimer.current);
    if (immediate) void flush(); else textTimer.current = window.setTimeout(() => void flush(), 600);
  };

  const closeQuestion = useCallback(async () => {
    if (!question) return;
    const durationMs = Date.now() - questionStartedAt.current;
    questionStartedAt.current = Date.now();
    await recordAssessmentEvent(client, attemptId, 'question_closed', question.id, { durationMs }).catch(() => undefined);
  }, [attemptId, client, question]);

  useEffect(() => {
    if (!question) return;
    questionStartedAt.current = Date.now();
    void recordAssessmentEvent(client, attemptId, 'question_opened', question.id).catch(() => undefined);
  }, [attemptId, client, question?.id]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true); setMessage('');
    try {
      const synced = await flush();
      if (!synced) { setMessage('Conecte-se à internet para sincronizar as respostas antes de enviar.'); return; }
      await submitAssessmentAttempt(client, attemptId); onComplete();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar a avaliação.'); }
    finally { setSubmitting(false); setConfirmingSubmit(false); }
  }, [attemptId, client, flush, onComplete, submitting]);

  // Whole-assessment clock (not paced): submit what was saved when time is over.
  useEffect(() => { if (!paced && remaining === 0 && payload) void submit(); }, [paced, payload, remaining, submit]);

  const startStage = async (stage: Stage) => {
    setSubmitting(true); setMessage(''); setNotice('');
    try {
      await startAssessmentSection(client, attemptId, stage.section.id);
      await reload();
      setActiveSectionId(stage.section.id); setIndex(0);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a etapa.'); }
    finally { setSubmitting(false); }
  };

  const finishStage = useCallback(async (reason: 'student' | 'time') => {
    if (!activeSectionId || closingStage.current) return;
    closingStage.current = true; setSubmitting(true); setMessage('');
    try {
      await closeQuestion();
      if (!await flush() && reason === 'student') { setMessage('Conecte-se à internet para salvar as respostas antes de concluir a etapa.'); return; }
      await completeAssessmentSection(client, attemptId, activeSectionId);
      await reload();
      setActiveSectionId(null); setIndex(0); setConfirmingStageEnd(false);
      setNotice(reason === 'time' ? 'O tempo desta etapa terminou. As respostas que você salvou foram mantidas.' : 'Etapa concluída. Você pode continuar agora ou sair e voltar depois — seu progresso está salvo.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a etapa.'); }
    finally { closingStage.current = false; setSubmitting(false); }
  }, [activeSectionId, attemptId, client, closeQuestion, flush, reload]);

  // Part clock: close the part when its time is over.
  useEffect(() => { if (paced && activeStage && remaining === 0) void finishStage('time'); }, [activeStage, finishStage, paced, remaining]);

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

  const answered = useMemo(() => visibleQuestions.filter((item) => Boolean(answers[item.id])).length, [answers, visibleQuestions]);
  const unansweredTotal = payload ? payload.questions.filter((item) => !answers[item.id]).length : 0;

  if (message && !payload) return <div className="assessment-runner-shell"><div className="assessment-runner-error"><p>{message}</p><button className="secondary-button" onClick={onExit}>Voltar</button></div></div>;
  if (payload && !payload.questions.length && payload.assessment.liveQuestionCount) return <div className="assessment-runner-shell"><div className="assessment-runner-error"><p>Esta avaliação é feita ao vivo com seu professor. Não há nada para responder aqui.</p><button className="secondary-button" onClick={onExit}>Voltar</button></div></div>;
  if (!payload) return <div className="assessment-runner-shell"><LoaderCircle className="spin" size={28} />Carregando prova…</div>;

  const saveIndicator = <span aria-live="polite">{saveState === 'offline' ? <CloudOff size={16} /> : <Cloud size={16} />}{saveState === 'saving' ? 'Salvando…' : saveState === 'offline' ? 'Offline — alterações pendentes' : 'Salvo'}</span>;
  const liveNotice = payload.assessment.liveQuestionCount ? <p className="assessment-live-notice">{payload.assessment.liveQuestionCount === 1 ? 'Uma tarefa desta avaliação será feita' : `${payload.assessment.liveQuestionCount} tarefas desta avaliação serão feitas`} ao vivo com seu professor, fora desta tela.</p> : null;
  const confirmation = confirmingSubmit && <SubmitConfirmation unanswered={unansweredTotal} busy={submitting} onCancel={() => setConfirmingSubmit(false)} onConfirm={() => void submit()} />;

  // Paced: list of parts.
  if (paced && !activeStage) {
    const next = nextStage(stages);
    const done = allStagesDone(stages);
    return <div className="assessment-runner-shell">
      <div className="assessment-runner-top"><div><span>AVALIAÇÃO EM ETAPAS</span><h1>{payload.assessment.title}</h1></div><div className="assessment-runner-status">{saveIndicator}</div></div>
      <div className="assessment-runner-progress"><span>{stages.filter((stage) => stage.status === 'done').length} de {stages.length} etapa(s) concluída(s)</span><i><b style={{ width: `${stages.length ? (stages.filter((stage) => stage.status === 'done').length / stages.length) * 100 : 0}%` }} /></i></div>
      {liveNotice}
      {notice && <p className="assessment-stage-notice" role="status">{notice}</p>}
      <main className="assessment-stage-list">
        <p>Faça uma etapa de cada vez. O tempo de cada etapa só começa quando você a inicia. Entre uma etapa e outra você pode sair e voltar depois: suas respostas ficam salvas. Uma etapa concluída não pode mais ser alterada.</p>
        <ol>{stages.map((stage) => <li key={stage.section.id} className={`assessment-stage ${stage.status}`}>
          <span className="assessment-stage-icon">{stage.status === 'done' ? <CheckCircle2 size={18} /> : stage.status === 'locked' ? <Lock size={16} /> : stage.status === 'open' ? <Play size={16} /> : <Circle size={18} />}</span>
          <span><strong>Etapa {stage.number} · {studentSectionTitle(stage.section.title)}</strong><small>{stage.questionCount} questão(ões) · {stage.section.timeLimitMinutes ? `${stage.section.timeLimitMinutes} min` : 'sem limite de tempo'}{stage.status === 'done' ? stage.section.completionReason === 'time_expired' ? ' · encerrada pelo tempo' : ' · concluída' : ''}</small></span>
          {next?.section.id === stage.section.id && <button className="student-primary" disabled={submitting} onClick={() => void startStage(stage)}>{submitting ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />}{stage.status === 'open' ? 'Continuar' : 'Iniciar etapa'}</button>}
        </li>)}</ol>
      </main>
      {message && <div className="assessment-message" role="alert">{message}</div>}
      <footer className="assessment-runner-actions assessment-stage-actions">
        <button className="secondary-button" onClick={() => { void flush(); onExit(); }}><ArrowLeft size={16} />Sair e continuar depois</button>
        {done && <button className="primary-button" disabled={submitting} onClick={() => setConfirmingSubmit(true)}><Check size={16} />Enviar avaliação</button>}
      </footer>
      {confirmation}
    </div>;
  }

  if (!question) return <div className="assessment-runner-shell"><LoaderCircle className="spin" size={28} />Carregando prova…</div>;
  const section = payload.sections.find((item) => item.id === question.sectionId);
  const linear = payload.assessment.navigationMode === 'linear';
  const adaptive = payload.assessment.assessmentMode === 'adaptive';
  const last = index === visibleQuestions.length - 1;
  const goTo = (target: number) => { void closeQuestion(); void flush(); setIndex(target); };

  const record = (type: 'copy_detected' | 'drop_detected' | 'bulk_insert_detected', metadata: Record<string, unknown>) => void recordAssessmentEvent(client, attemptId, type, question.id, metadata).catch(() => undefined);
  const textLength = (target: EventTarget) => (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement ? target.value.length : null);
  return <div className="assessment-runner-shell"
    onPasteCapture={(event) => void recordAssessmentEvent(client, attemptId, 'paste_detected', question.id, { pasteLength: event.clipboardData.getData('text').length }).catch(() => undefined)}
    onCopyCapture={() => record('copy_detected', { length: window.getSelection()?.toString().length ?? 0 })}
    onCutCapture={() => record('copy_detected', { length: window.getSelection()?.toString().length ?? 0 })}
    onDropCapture={(event) => record('drop_detected', { length: event.dataTransfer.getData('text').length })}
    onFocusCapture={(event) => { const length = textLength(event.target); if (length !== null) fieldLengths.current.set(event.target, length); }}
    onInputCapture={(event) => {
      const length = textLength(event.target); if (length === null) return;
      const inserted = bulkInsertion(fieldLengths.current.get(event.target) ?? length, length, (event.nativeEvent as InputEvent).inputType);
      fieldLengths.current.set(event.target, length);
      if (inserted !== null) record('bulk_insert_detected', { length: inserted, inputType: (event.nativeEvent as InputEvent).inputType ?? 'unknown' });
    }}>
    {fullscreenLost && canUseAssessmentFullscreen() && <div className="assessment-fullscreen-banner" role="status">Você saiu da tela cheia. Isso fica registrado para o professor.<button type="button" className="secondary-button compact" onClick={enterAssessmentFullscreen}>Voltar à tela cheia</button></div>}
    <div className="assessment-runner-top"><div><span>{adaptive ? 'PLACEMENT ADAPTATIVO' : paced ? `ETAPA ${activeStage?.number} DE ${stages.length}` : 'AVALIAÇÃO EM ANDAMENTO'}</span><h1>{payload.assessment.title}</h1></div><div className="assessment-runner-status"><span className={remaining !== null && remaining <= 60 ? 'assessment-clock-warning' : ''}><Clock3 size={16} />{formatClock(remaining)}</span>{saveIndicator}</div></div>
    <div className="assessment-runner-progress"><span>{adaptive ? `${answered} questão(ões) concluída(s) · percurso ajustado pelo servidor` : `${answered} de ${visibleQuestions.length} respondidas${paced ? ' nesta etapa' : ''}`}</span><i><b style={{ width: adaptive ? `${Math.min(95, answered * 10)}%` : `${visibleQuestions.length ? (answered / visibleQuestions.length) * 100 : 0}%` }} /></i></div>
    {!paced && liveNotice}
    <main className="assessment-question-stage"><header><small>{section ? studentSectionTitle(section.title) : ''} · Questão {index + 1}{adaptive ? '' : ` de ${visibleQuestions.length}`}</small><h2>{question.prompt}</h2>{section?.instructions && <p>{section.instructions}</p>}</header><QuestionRenderer client={client} attemptId={attemptId} question={question} value={answers[question.id] ?? ''} onChange={(value) => void queueAnswer(question.id, value, !['fill_blank', 'short_answer', 'writing', 'mediation'].includes(question.type))} /></main>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {!linear && <nav className="assessment-question-nav" aria-label="Questões">{visibleQuestions.map((item, questionIndex) => <button key={item.id} className={`${questionIndex === index ? 'active' : ''} ${answers[item.id] ? 'answered' : ''}`} onClick={() => goTo(questionIndex)}>{questionIndex + 1}</button>)}</nav>}
    {confirmingStageEnd && <div className="assessment-stage-confirm" role="alertdialog" aria-labelledby="stage-confirm-title">
      <p id="stage-confirm-title"><strong>Concluir a etapa {activeStage?.number}?</strong> Depois de concluir, as respostas desta etapa não poderão ser alteradas.{visibleQuestions.length - answered ? ` Há ${visibleQuestions.length - answered} questão(ões) sem resposta.` : ''}</p>
      <div><button className="cancel-button" disabled={submitting} onClick={() => setConfirmingStageEnd(false)}>Continuar respondendo</button><button className="primary-button" disabled={submitting} onClick={() => void finishStage('student')}>{submitting ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Concluir etapa</button></div>
    </div>}
    <footer className="assessment-runner-actions">
      <button className="secondary-button" disabled={adaptive || index === 0} onClick={() => goTo(index - 1)}><ArrowLeft size={16} />Anterior</button>
      {adaptive
        ? <button className="primary-button" disabled={submitting} onClick={() => void advance()}>{submitting ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={16} />}{submitting ? 'Calculando…' : 'Próxima questão'}</button>
        : last
          ? paced
            ? <button className="primary-button" disabled={submitting} onClick={() => setConfirmingStageEnd(true)}><Check size={16} />Concluir etapa</button>
            : <button className="primary-button" disabled={submitting} onClick={() => { const missing = payload.questions.filter((item) => item.required && !answers[item.id]).length; if (missing) { setMessage(`Responda as ${missing} questão(ões) obrigatória(s) antes de enviar.`); return; } void closeQuestion(); setConfirmingSubmit(true); }}><Check size={16} />Enviar avaliação</button>
          : <button className="primary-button" onClick={() => goTo(index + 1)}>Próxima<ArrowRight size={16} /></button>}
    </footer>
    {confirmation}
  </div>;
}
