import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, CheckCircle2, Circle, LoaderCircle, Mic, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { completeLiveAssessmentSession, getLiveAssessmentSession, scoreLiveAssessmentResponse } from '../assessmentService';
import { CEFR_LEVELS } from '../cefr';
import { calculateRubricScore } from '../rubric';
import type { LiveAssessmentQuestion, LiveAssessmentSession as LiveSession } from '../types';

const SKILL_LABELS: Record<string, string> = {
  speaking: 'Speaking',
  spoken_production: 'Spoken Production',
  spoken_interaction: 'Spoken Interaction',
  mediation: 'Mediation',
};

const formatClock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function LiveAssessmentSession({ client, attemptId, onBack, onOpenResults }: {
  client: SupabaseClient;
  attemptId: string;
  onBack: () => void;
  onOpenResults: () => void;
}) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async (preferredId?: string) => {
    const loaded = await getLiveAssessmentSession(client, attemptId);
    setSession(loaded);
    setActiveId((current) => preferredId ?? current ?? loaded.questions.find((question) => question.gradingStatus !== 'reviewed')?.id ?? loaded.questions[0]?.id ?? null);
    return loaded;
  }, [attemptId, client]);

  useEffect(() => {
    void load().catch((error) => setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a sessão ao vivo.'));
  }, [load]);

  if (!session) {
    return message
      ? <div className="assessment-message" role="alert">{message}<button className="secondary-button compact" onClick={onBack}>Voltar</button></div>
      : <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Abrindo sessão ao vivo…</div>;
  }

  const scored = session.questions.filter((question) => question.gradingStatus === 'reviewed').length;
  const allScored = scored === session.questions.length;
  const active = session.questions.find((question) => question.id === activeId) ?? session.questions[0];
  const locked = !['in_progress', 'submitted', 'grading'].includes(session.attempt.status);
  const studentPart = session.studentQuestionCount === 0
    ? null
    : session.attempt.status === 'in_progress'
      ? session.attempt.studentStarted ? 'Parte do aluno em andamento.' : 'O aluno ainda não começou a parte dele.'
      : 'Parte do aluno enviada.';

  const saved = async (questionId: string) => {
    const reloaded = await load(questionId);
    const next = reloaded.questions.find((question) => question.gradingStatus !== 'reviewed');
    if (next) setActiveId(next.id);
  };

  const complete = async () => {
    setCompleting(true); setMessage('');
    try { await completeLiveAssessmentSession(client, attemptId); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a avaliação.'); }
    finally { setCompleting(false); }
  };

  return <section className="live-session">
    <header className="assessment-dashboard-header">
      <div>
        <button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button>
        <p className="eyebrow">AVALIAÇÃO AO VIVO</p>
        <h2>{session.attempt.studentName || 'Aluno'}</h2>
        <p>{session.assessment.title}</p>
      </div>
      <div className="live-session-progress" aria-live="polite">
        <strong>{scored}/{session.questions.length}</strong>
        <span>tarefa(s) pontuada(s)</span>
        {studentPart && <small>{studentPart}</small>}
      </div>
    </header>

    {message && <div className="assessment-message" role="alert">{message}</div>}

    <div className="live-session-layout">
      <nav className="live-session-tasks" aria-label="Tarefas ao vivo">
        {session.questions.map((question, index) => <button key={question.id} className={question.id === active?.id ? 'active' : ''} onClick={() => setActiveId(question.id)}>
          {question.gradingStatus === 'reviewed' ? <CheckCircle2 size={17} className="done" /> : <Circle size={17} />}
          <span><strong>{index + 1}. {SKILL_LABELS[question.skill] ?? question.sectionTitle}</strong><small>{question.prompt}</small></span>
        </button>)}
      </nav>
      {active && <LiveTask key={active.id} client={client} attemptId={attemptId} question={active} locked={locked} onSaved={saved} />}
    </div>

    <footer className="assessment-review-footer">
      {session.attempt.status === 'completed'
        ? <span>Avaliação concluída. O resultado já está em Resultados e na evolução do aluno.</span>
        : !allScored
          ? <span>Pontue todas as tarefas para concluir a parte ao vivo.</span>
          : session.studentQuestionCount > 0 && session.attempt.status === 'in_progress'
            ? <span>Parte ao vivo concluída. A avaliação segue para revisão quando o aluno enviar a parte dele.</span>
            : session.studentQuestionCount > 0
              ? <span>Parte ao vivo concluída. Finalize a revisão da parte do aluno em Resultados.</span>
              : <span>Todas as tarefas foram pontuadas.</span>}
      {allScored && session.studentQuestionCount === 0 && session.attempt.status === 'in_progress' && <button className="primary-button" disabled={completing} onClick={() => void complete()}>{completing ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{completing ? 'Concluindo…' : 'Concluir avaliação'}</button>}
      {session.studentQuestionCount > 0 && ['grading', 'completed'].includes(session.attempt.status) && <button className="secondary-button compact" onClick={onOpenResults}>Abrir resultados</button>}
    </footer>
  </section>;
}

function LiveTask({ client, attemptId, question, locked, onSaved }: {
  client: SupabaseClient;
  attemptId: string;
  question: LiveAssessmentQuestion;
  locked: boolean;
  onSaved: (questionId: string) => Promise<void>;
}) {
  const rubric = useMemo(() => question.rubric ?? [], [question.rubric]);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => Object.fromEntries(rubric.map((criterion) => [criterion.key, question.rubricScores?.[criterion.key] ?? 0])));
  const [manualScore, setManualScore] = useState<string>(question.score === null || question.score === undefined ? '' : String(question.score));
  const [notes, setNotes] = useState(question.notes ?? '');
  const [feedback, setFeedback] = useState(question.teacherFeedback ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useLiveTimer(question.preparationSeconds ?? 0, question.durationSeconds ?? 0);

  const missingCriteria = rubric.filter((criterion) => criterion.scale === 'cefr' && !rubricScores[criterion.key]);
  let score: number | null = null;
  try {
    score = rubric.length ? (missingCriteria.length ? null : calculateRubricScore(rubric, rubricScores, question.maxScore)) : manualScore === '' ? null : Number(manualScore);
  } catch { score = null; }
  const roundedScore = score === null ? null : Math.round(score * 100) / 100;

  const save = async () => {
    if (roundedScore === null || Number.isNaN(roundedScore)) { setError(missingCriteria.length ? `Escolha o nível de: ${missingCriteria.map((criterion) => criterion.label).join(', ')}.` : 'Informe a nota.'); return; }
    setBusy(true); setError('');
    try {
      await scoreLiveAssessmentResponse(client, { attemptId, questionId: question.id, score: roundedScore, feedback, rubricScores: rubric.length ? rubricScores : {}, notes, durationSeconds: timer.speakingSeconds || null });
      await onSaved(question.id);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a pontuação.'); }
    finally { setBusy(false); }
  };

  return <article className="live-task">
    <div className="live-task-meta">
      <span>{SKILL_LABELS[question.skill] ?? question.skill}</span>
      {question.cefr && <span>{question.cefr}</span>}
      {question.taskType && <span>{question.taskType.replace(/_/g, ' ')}</span>}
      {question.estimatedDurationLabel && <span><Timer size={12} />{question.estimatedDurationLabel}</span>}
      {question.gradingStatus === 'reviewed' && <span className="done"><Check size={12} />Pontuada</span>}
    </div>
    <h3 className="live-task-prompt">{question.prompt}</h3>
    {question.sourceMaterial && <div className="live-task-source"><b>Material de apoio</b><p>{question.sourceMaterial}</p></div>}
    {(question.primaryEvidence || question.operationalDescriptor) && <dl className="live-task-evidence">
      {question.primaryEvidence && <div><dt>Evidência esperada</dt><dd>{question.primaryEvidence}</dd></div>}
      {question.operationalDescriptor && <div><dt>Descritor</dt><dd>{question.operationalDescriptor}</dd></div>}
    </dl>}

    <section className="live-timer" aria-label="Cronômetro">
      <div className={`live-timer-clock ${timer.phase}`}>
        <span>{timer.phase === 'preparing' ? 'Preparação' : timer.phase === 'speaking' ? 'Fala' : timer.phase === 'paused' ? 'Pausado' : 'Pronto'}</span>
        <strong>{timer.phase === 'preparing' ? formatClock(timer.preparationLeft) : formatClock(timer.speakingSeconds)}</strong>
        {question.recordingSeconds ? <small>meta: {formatClock(question.recordingSeconds)}</small> : null}
      </div>
      <div className="live-timer-actions">
        {question.preparationSeconds ? <button type="button" className="secondary-button compact" disabled={timer.phase === 'preparing' || timer.phase === 'speaking'} onClick={timer.startPreparation}><Timer size={15} />Preparação {formatClock(question.preparationSeconds)}</button> : null}
        {timer.phase === 'speaking'
          ? <button type="button" className="secondary-button compact" onClick={timer.pause}><Pause size={15} />Pausar</button>
          : <button type="button" className="primary-button" onClick={timer.startSpeaking}>{timer.speakingSeconds ? <Play size={15} /> : <Mic size={15} />}{timer.speakingSeconds ? 'Retomar fala' : 'Iniciar fala'}</button>}
        <button type="button" className="icon-button" aria-label="Zerar cronômetro" onClick={timer.reset}><RotateCcw size={15} /></button>
      </div>
    </section>

    <form className="live-scoring" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      {rubric.length ? <div className="live-rubric">
        {rubric.map((criterion) => <fieldset key={criterion.key} disabled={locked}>
          <legend>{criterion.label}</legend>
          {criterion.scale === 'cefr'
            ? <div className="live-level-picker" role="radiogroup" aria-label={criterion.label}>
              {CEFR_LEVELS.map((level, index) => <button type="button" role="radio" aria-checked={rubricScores[criterion.key] === index + 1} key={level} className={rubricScores[criterion.key] === index + 1 ? 'selected' : ''} onClick={() => setRubricScores((current) => ({ ...current, [criterion.key]: index + 1 }))}>{level}</button>)}
            </div>
            : <input type="number" min="0" max={criterion.maxScore} step="0.5" value={rubricScores[criterion.key] ?? 0} onChange={(event) => setRubricScores((current) => ({ ...current, [criterion.key]: Number(event.target.value) }))} aria-label={`${criterion.label} (0–${criterion.maxScore})`} />}
        </fieldset>)}
      </div> : <label>Nota (0–{question.maxScore})<input type="number" min="0" max={question.maxScore} step="0.01" value={manualScore} disabled={locked} onChange={(event) => setManualScore(event.target.value)} /></label>}
      <label>Anotações do professor <small>(privadas)</small><textarea rows={3} value={notes} disabled={locked} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: hesitou ao negociar o orçamento; boa retomada de turno." /></label>
      <label>Feedback para o aluno<textarea rows={2} value={feedback} disabled={locked} onChange={(event) => setFeedback(event.target.value)} /></label>
      {error && <p className="assessment-message" role="alert">{error}</p>}
      <div className="live-scoring-footer">
        <span>Nota: <b>{roundedScore === null ? '—' : roundedScore}</b> / {question.maxScore}</span>
        {!locked && <button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{busy ? 'Salvando…' : question.gradingStatus === 'reviewed' ? 'Atualizar pontuação' : 'Salvar e avançar'}</button>}
      </div>
    </form>
  </article>;
}

type TimerPhase = 'idle' | 'preparing' | 'speaking' | 'paused';

/** Preparation countdown followed by a speaking stopwatch; the speaking time is stored with the score. */
function useLiveTimer(preparationSeconds: number, initialSpeakingSeconds: number) {
  const [phase, setPhase] = useState<TimerPhase>(initialSpeakingSeconds ? 'paused' : 'idle');
  const [preparationLeft, setPreparationLeft] = useState(preparationSeconds);
  const [speakingSeconds, setSpeakingSeconds] = useState(initialSpeakingSeconds);
  const interval = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'preparing' && phase !== 'speaking') return;
    interval.current = window.setInterval(() => {
      if (phase === 'preparing') {
        setPreparationLeft((left) => {
          if (left <= 1) { setPhase('speaking'); return 0; }
          return left - 1;
        });
      } else setSpeakingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => { if (interval.current) window.clearInterval(interval.current); };
  }, [phase]);

  return {
    phase,
    preparationLeft,
    speakingSeconds,
    startPreparation: () => { setPreparationLeft(preparationSeconds); setPhase('preparing'); },
    startSpeaking: () => setPhase('speaking'),
    pause: () => setPhase('paused'),
    reset: () => { setPhase('idle'); setPreparationLeft(preparationSeconds); setSpeakingSeconds(0); },
  };
}
