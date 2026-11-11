import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, CircleDot, Clock3, Eye, LoaderCircle, Lock, Mic, Radio, RefreshCw, UserRound } from 'lucide-react';
import { getAttemptLiveStatus } from '../assessmentService';
import { richText } from '../richText';
import { formatClock, studentSectionTitle } from '../student/pacing';
import type { ActiveTeacherAttempt, AttemptLiveQuestion, AttemptLiveStatus } from '../types';
import { buildMonitorStages, EVENT_LABELS, eventDetail, missingSummary, presenceOf, PRESENCE_LABELS, relativeTime, type MonitorStage } from './monitor';

const LETTERS = 'ABCDEFGH';
const POLL_MS = 10_000;
const timing = (question: AttemptLiveQuestion) => [question.preparationSeconds ? `${question.preparationSeconds}s de preparação` : '', question.recordingSeconds ? `até ${question.recordingSeconds}s de gravação` : ''].filter(Boolean).join(', ');
const STATE_LABELS: Record<MonitorStage['state'], string> = { done: 'Concluída', current: 'O aluno está aqui', open: 'Iniciada', pending: 'Não iniciada', teacher: 'Com você' };

/** In-progress attempts, shown at the top of the teacher's Avaliações page. */
export function ActiveAttemptsPanel({ attempts, onOpen }: { attempts: ActiveTeacherAttempt[]; onOpen: (attempt: ActiveTeacherAttempt) => void }) {
  const now = Date.now();
  if (!attempts.length) return null;
  return <section className="attempt-monitor-strip" aria-label="Provas em andamento">
    <header><Radio size={16} /><strong>Provas em andamento</strong><small>Acompanhe onde o aluno está e veja as instruções que aparecem para ele.</small></header>
    <ul>{attempts.map((attempt) => {
      const presence = presenceOf(attempt.lastSeenAt, attempt.lastActivityAt, now);
      return <li key={attempt.attemptId}>
        <button type="button" onClick={() => onOpen(attempt)}>
          <span className={`attempt-presence ${presence}`}><i />{PRESENCE_LABELS[presence]}</span>
          <strong>{attempt.studentName || 'Aluno'}</strong>
          <span>{attempt.assessmentTitle}</span>
          <small>{attempt.answered}/{attempt.delivered} respondidas{attempt.currentSectionTitle ? ` · ${studentSectionTitle(attempt.currentSectionTitle)}` : ''} · última atividade {relativeTime(attempt.lastActivityAt, now)}</small>
          <em><Eye size={14} />Acompanhar</em>
        </button>
      </li>;
    })}</ul>
  </section>;
}

function MonitorQuestion({ question, stage, index, viewing }: { question: AttemptLiveQuestion; stage: MonitorStage; index: number; viewing: boolean }) {
  const isSpeaking = question.type === 'speaking';
  const interaction = stage.section.skill === 'spoken_interaction';
  const showOptions = question.options.length > 0 && !['writing', 'speaking', 'mediation'].includes(question.type);
  const target = question.responseConstraints?.label;
  return <article className={`attempt-monitor-question ${viewing ? 'viewing' : ''}`}>
    <header>
      <div>
        <span className="eyebrow">{stage.number ? `ETAPA ${stage.number}` : 'TAREFA AO VIVO'} · QUESTÃO {index + 1} DE {stage.questions.length}</span>
        <h3>{stage.studentTitle}</h3>
        {stage.teacherDetail && <small className="assessment-preview-teacher-only">Só você vê: {stage.teacherDetail}</small>}
      </div>
      {viewing ? <span className="attempt-monitor-tag viewing"><Eye size={13} />Na tela do aluno</span>
        : question.live ? <span className="attempt-monitor-tag"><Radio size={13} />Você conduz</span>
          : question.answered ? <span className="attempt-monitor-tag done"><CheckCircle2 size={13} />Respondida</span>
            : <span className="attempt-monitor-tag"><Circle size={13} />Sem resposta</span>}
    </header>
    {(isSpeaking || question.type === 'mediation' || question.live) && <p className="attempt-monitor-hint">
      {question.live ? 'Tarefa aplicada ao vivo: leia a instrução com o aluno, conduza a conversa e depois pontue na sessão ao vivo.'
        : interaction ? `O aluno vê esta instrução e grava a resposta${timing(question) ? ` (${timing(question)})` : ''}. Se estiver com ele, você pode fazer o papel do examinador (“the examiner”).`
          : isSpeaking ? `O aluno vê esta instrução e grava a resposta${timing(question) ? ` (${timing(question)})` : ''}.`
            : 'O aluno lê o material abaixo e escreve a resposta em inglês.'}
    </p>}
    {stage.section.instructions && index === 0 && <p className="attempt-monitor-instructions">{richText(stage.section.instructions)}</p>}
    {question.sourceMaterial && question.type !== 'mediation' && <div className="assessment-preview-text">
      <p className="assessment-source-material">{richText(question.sourceMaterial)}</p>
      {question.sourceCredit && <small className="assessment-source-credit">{question.sourceCredit}</small>}
    </div>}
    <h4 className="assessment-rich-text">{richText(question.prompt)}</h4>
    {question.type === 'mediation' && question.sourceMaterial && <p className="assessment-source-material">{richText(question.sourceMaterial)}</p>}
    {target && <p className="assessment-response-target">{isSpeaking ? 'Duração esperada' : 'Extensão esperada'}: {target}</p>}
    {showOptions && <ol className="assessment-preview-options">{question.options.map((option, optionIndex) => <li key={`${option}-${optionIndex}`}><b>{LETTERS[optionIndex] ?? optionIndex + 1}</b><span>{option}</span></li>)}</ol>}
    <footer>
      {question.wordCount !== undefined && <span>{question.wordCount} palavra{question.wordCount === 1 ? '' : 's'} escrita{question.wordCount === 1 ? '' : 's'} até agora</span>}
      {isSpeaking && !question.live && <span><Mic size={13} />{question.answered ? 'Gravação enviada' : 'Ainda sem gravação'}</span>}
      {question.timeSpentMs ? <span><Clock3 size={13} />{Math.max(1, Math.round(question.timeSpentMs / 60000))} min nesta questão</span> : null}
    </footer>
  </article>;
}

export function AttemptMonitor({ client, attemptId, onBack, onOpenLiveSession, onOpenResults }: {
  client: SupabaseClient;
  attemptId: string;
  onBack: () => void;
  onOpenLiveSession: () => void;
  onOpenResults: () => void;
}) {
  const [status, setStatus] = useState<AttemptLiveStatus | null>(null);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setStatus(await getAttemptLiveStatus(client, attemptId)); setMessage(''); setNow(Date.now()); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o acompanhamento.'); }
    finally { setRefreshing(false); }
  }, [attemptId, client]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearInterval(poll); window.clearInterval(tick); };
  }, [load]);

  const stages = useMemo(() => status ? buildMonitorStages(status, now) : [], [now, status]);

  if (!status) {
    return message
      ? <div className="assessment-message" role="alert">{message}<button className="secondary-button compact" onClick={onBack}>Voltar</button></div>
      : <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Abrindo acompanhamento…</div>;
  }

  const inProgress = status.attempt.status === 'in_progress';
  const viewingId = inProgress ? status.attempt.viewingQuestionId : null;
  const following = selectedId === null;
  const shownId = selectedId ?? viewingId ?? status.questions[0]?.id ?? null;
  const shownStage = stages.find((stage) => stage.questions.some((question) => question.id === shownId)) ?? null;
  const shownIndex = shownStage?.questions.findIndex((question) => question.id === shownId) ?? -1;
  const shown = shownStage && shownIndex >= 0 ? shownStage.questions[shownIndex] : null;
  const studentQuestions = status.questions.filter((question) => !question.live);
  const answered = studentQuestions.filter((question) => question.answered).length;
  const hasLiveTasks = status.questions.some((question) => question.live);
  const presence = presenceOf(status.attempt.lastSeenAt, status.attempt.lastActivityAt, now);
  const missing = missingSummary(stages);

  return <section className="attempt-monitor">
    <header className="assessment-dashboard-header">
      <div>
        <button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button>
        <p className="eyebrow">ACOMPANHAMENTO AO VIVO</p>
        <h2>{status.attempt.studentName || 'Aluno'}</h2>
        <p>{status.assessment.title}</p>
      </div>
      <div className="attempt-monitor-summary" aria-live="polite">
        {inProgress ? <span className={`attempt-presence ${presence}`}><i />{PRESENCE_LABELS[presence]}</span> : <span className="attempt-presence done"><CheckCircle2 size={13} />Prova enviada</span>}
        <strong>{answered}/{studentQuestions.length}</strong>
        <small>questões respondidas · última atividade {relativeTime(status.attempt.lastActivityAt, now)}</small>
        <button type="button" className="secondary-button compact" onClick={() => void load()} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'spin' : ''} />Atualizar</button>
      </div>
    </header>

    {message && <div className="assessment-message" role="alert">{message}</div>}
    {!inProgress && <div className="assessment-message attempt-monitor-finished">O aluno já enviou esta prova.<button type="button" className="primary-button compact" onClick={onOpenResults}>Ver resultados</button></div>}
    {hasLiveTasks && <div className="attempt-monitor-live-note"><Radio size={15} />Esta prova tem tarefas que você conduz ao vivo.<button type="button" className="secondary-button compact" onClick={onOpenLiveSession}><Mic size={14} />Abrir sessão ao vivo para pontuar</button></div>}

    <div className="attempt-monitor-layout">
      <aside className="attempt-monitor-stages" aria-label="Etapas da prova">
        <h3>Onde o aluno está</h3>
        <ol>{stages.map((stage) => {
          const studentCount = stage.questions.filter((question) => !question.live).length;
          const Icon = stage.state === 'done' ? CheckCircle2 : stage.state === 'current' ? CircleDot : stage.state === 'teacher' ? UserRound : stage.state === 'pending' ? Lock : Circle;
          return <li key={stage.section.id} className={`${stage.state} ${shownStage?.section.id === stage.section.id ? 'active' : ''}`}>
            <button type="button" onClick={() => setSelectedId(stage.questions.some((question) => question.id === viewingId) ? null : stage.questions[0]?.id ?? null)}>
              <Icon size={16} />
              <span>
                <strong>{stage.studentTitle}</strong>
                <small>{stage.number ? `Etapa ${stage.number} · ` : ''}{STATE_LABELS[stage.state]}{stage.state !== 'teacher' ? ` · ${stage.answered}/${studentCount}` : ''}{stage.secondsLeft !== null ? ` · ${formatClock(stage.secondsLeft)} restantes` : ''}</small>
                {stage.teacherDetail && <em>{stage.teacherDetail}</em>}
              </span>
            </button>
          </li>;
        })}</ol>
        {inProgress && <div className="attempt-monitor-missing">
          <h4>O que falta</h4>
          {missing.length ? <ul>{missing.map(({ stage, unanswered }) => <li key={stage.section.id}><strong>{stage.studentTitle} <small>(etapa {stage.number})</small></strong><span>{stage.state === 'pending' ? 'ainda não iniciada' : `${unanswered} sem resposta`}</span></li>)}</ul>
            : <p>Todas as questões do aluno têm resposta. Falta só ele enviar.</p>}
        </div>}
      </aside>

      <div className="attempt-monitor-main">
        <div className="attempt-monitor-toolbar">
          {following ? <span><Eye size={14} />{viewingId ? 'Mostrando a questão que está na tela do aluno.' : 'Ainda não sabemos qual questão está na tela do aluno.'}</span>
            : <button type="button" className="secondary-button compact" onClick={() => setSelectedId(null)} disabled={!viewingId}><Eye size={14} />Voltar para a questão do aluno</button>}
        </div>
        {shownStage && shownStage.questions.length > 1 && <nav className="attempt-monitor-questions" aria-label="Questões desta etapa">{shownStage.questions.map((question, index) =>
          <button type="button" key={question.id} className={`${question.id === shownId ? 'active' : ''} ${question.answered ? 'answered' : ''} ${question.id === viewingId ? 'viewing' : ''}`}
            title={question.id === viewingId ? 'Na tela do aluno' : question.answered ? 'Respondida' : 'Sem resposta'} onClick={() => setSelectedId(question.id)}>{index + 1}</button>)}</nav>}
        {shown && shownStage ? <MonitorQuestion question={shown} stage={shownStage} index={shownIndex} viewing={shown.id === viewingId} />
          : <p className="assessment-empty">Nenhuma questão entregue ainda.</p>}

        {status.events.length > 0 && <section className="attempt-monitor-events" aria-label="Sinais recentes">
          <h4><AlertTriangle size={14} />Sinais recentes</h4>
          <ul>{status.events.slice(0, 8).map((event, index) => <li key={`${event.occurredAt}-${index}`}>
            <span>{EVENT_LABELS[event.type] ?? event.type}{eventDetail(event) ? ` (${eventDetail(event)})` : ''}</span><small>{relativeTime(event.occurredAt, now)}</small>
          </li>)}</ul>
        </section>}
      </div>
    </div>
  </section>;
}
