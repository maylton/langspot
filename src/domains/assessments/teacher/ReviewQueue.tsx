import { useCallback, useEffect, useMemo, useState } from 'react';
import { richText } from '../richText';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check, Eye, EyeOff, Inbox, LoaderCircle, Mic } from 'lucide-react';
import { finalizeAssessmentReview, getAssessmentResult, listAssessmentReviewQueue, reviewAssessmentResponse } from '../assessmentService';
import { REPORT_SKILL_LABELS } from '../report';
import { countWords, filterReviewQueue, formatWaiting, nextReviewItemId, type ReviewQueueFilters } from '../reviewQueue';
import type { ReviewQueue as Queue, ReviewQueueItem, TeacherAssessmentResult } from '../types';
import { discardedRecordings, QuestionReview, TeacherReportPanel } from './AssessmentResults';

export function ReviewQueue({ client, onBack, onOpenLive }: {
  client: SupabaseClient;
  onBack: () => void;
  onOpenLive: (item: ReviewQueueItem) => void;
}) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [filters, setFilters] = useState<ReviewQueueFilters>({ studentId: 'all', skill: 'all' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const loaded = await listAssessmentReviewQueue(client);
    setQueue(loaded);
    return loaded;
  }, [client]);
  useEffect(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar a fila.')); }, [load]);

  const visible = useMemo(() => filterReviewQueue(queue?.items ?? [], filters), [filters, queue?.items]);
  const selected = visible.find((item) => item.responseId === selectedId) ?? visible[0] ?? null;
  const students = useMemo(() => [...new Map((queue?.items ?? []).map((item) => [item.studentId, item.studentName ?? 'Aluno'])).entries()], [queue?.items]);
  const skills = useMemo(() => [...new Set((queue?.items ?? []).map((item) => item.skill))], [queue?.items]);

  const reviewed = async (item: ReviewQueueItem) => {
    const next = nextReviewItemId(visible, item.responseId);
    await load();
    setSelectedId(next);
  };
  const finalize = async (attemptId: string) => {
    setFinalizing(attemptId); setMessage('');
    try { await finalizeAssessmentReview(client, attemptId); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a revisão.'); }
    finally { setFinalizing(null); }
  };

  return <section className="review-queue">
    <header className="assessment-dashboard-header">
      <div>
        <button className="back-button" onClick={onBack}><ArrowLeft size={15} />Avaliações</button>
        <p className="eyebrow">FILA DE CORREÇÃO</p>
        <h2>Respostas aguardando você</h2>
        <p>Writing, Speaking e Mediation de todas as avaliações, da entrega mais antiga para a mais recente.</p>
      </div>
      {queue && <div className="live-session-progress"><strong>{queue.items.length}</strong><span>resposta(s) pendente(s)</span></div>}
    </header>
    {message && <div className="assessment-message" role="alert">{message}</div>}

    {queue?.readyToFinalize.length ? <section className="review-queue-ready">
      <h3>Prontas para concluir</h3>
      <p>Todas as respostas já foram corrigidas. Concluir libera o resultado ao aluno conforme a configuração da avaliação.</p>
      {queue.readyToFinalize.map((attempt) => <div key={attempt.attemptId} className={previewing === attempt.attemptId ? 'previewing' : ''}>
        <span><strong>{attempt.studentName ?? 'Aluno'}</strong><small>{attempt.assessmentTitle} · enviada {formatWaiting(attempt.submittedAt)}</small></span>
        <div className="review-queue-ready-actions">
          <button className="secondary-button compact" onClick={() => setPreviewing((current) => current === attempt.attemptId ? null : attempt.attemptId)}>{previewing === attempt.attemptId ? <EyeOff size={15} /> : <Eye size={15} />}{previewing === attempt.attemptId ? 'Fechar correção' : 'Ver correção'}</button>
          <button className="primary-button" disabled={finalizing !== null} onClick={() => void finalize(attempt.attemptId)}>{finalizing === attempt.attemptId ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}Concluir revisão</button>
        </div>
        {previewing === attempt.attemptId && <CorrectionPreview client={client} attemptId={attempt.attemptId} />}
      </div>)}
    </section> : null}

    {!queue ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando fila…</div>
      : !queue.items.length ? <div className="assessment-empty"><Inbox size={38} /><h3>Nada para corrigir</h3><p>Quando um aluno enviar Writing, Speaking ou Mediation, a resposta aparece aqui.</p></div>
        : <>
          <div className="review-queue-filters">
            <label>Aluno<select value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))}><option value="all">Todos</option>{students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label>Habilidade<select value={filters.skill} onChange={(event) => setFilters((current) => ({ ...current, skill: event.target.value }))}><option value="all">Todas</option>{skills.map((skill) => <option key={skill} value={skill}>{REPORT_SKILL_LABELS[skill] ?? skill}</option>)}</select></label>
          </div>
          <div className="review-queue-layout">
            <nav className="live-session-tasks" aria-label="Respostas pendentes">
              {visible.map((item) => <button key={item.responseId} className={item.responseId === selected?.responseId ? 'active' : ''} onClick={() => setSelectedId(item.responseId)}>
                {item.live ? <Mic size={16} /> : <span className="review-queue-dot" aria-hidden="true" />}
                <span><strong>{item.studentName ?? 'Aluno'} · {REPORT_SKILL_LABELS[item.skill] ?? item.skill}</strong><small>{item.assessmentTitle} · {formatWaiting(item.submittedAt)}</small></span>
              </button>)}
              {!visible.length && <p className="review-queue-none">Nenhuma resposta com esses filtros.</p>}
            </nav>
            {selected && <ReviewItem key={selected.responseId} client={client} item={selected} onReviewed={() => reviewed(selected)} onOpenLive={() => onOpenLive(selected)} />}
          </div>
        </>}
  </section>;
}

function ReviewItem({ client, item, onReviewed, onOpenLive }: { client: SupabaseClient; item: ReviewQueueItem; onReviewed: () => Promise<void>; onOpenLive: () => void }) {
  const [result, setResult] = useState<TeacherAssessmentResult | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (item.live) return;
    let active = true;
    void getAssessmentResult(client, item.attemptId).then((value) => { if (active) setResult(value); }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a resposta.'); });
    return () => { active = false; };
  }, [client, item.attemptId, item.live]);
  const question = result?.questions.find((entry) => entry.responseId === item.responseId);
  const words = item.type === 'writing' || item.type === 'mediation' ? countWords(question?.answer) : null;
  const constraints = item.responseConstraints;

  return <article className="live-task review-item">
    <div className="live-task-meta">
      <span>{item.studentName ?? 'Aluno'}</span>
      <span>{item.assessmentTitle}</span>
      <span>{REPORT_SKILL_LABELS[item.skill] ?? item.skill}</span>
      {item.cefr && <span>alvo {item.cefr}</span>}
      {item.taskType && <span>{item.taskType.replace(/_/g, ' ')}</span>}
    </div>
    {(item.primaryEvidence || item.operationalDescriptor || constraints) && <dl className="live-task-evidence">
      {item.primaryEvidence && <div><dt>Evidência esperada</dt><dd>{item.primaryEvidence}</dd></div>}
      {item.operationalDescriptor && <div><dt>Descritor</dt><dd>{item.operationalDescriptor}</dd></div>}
      {constraints && <div><dt>Extensão pedida</dt><dd>{constraints.label || `${constraints.min}–${constraints.max} ${constraints.unit}`}{words !== null && constraints.unit === 'words' ? <b className={words < constraints.min || words > constraints.max ? 'review-words off' : 'review-words'}> · {words} palavras</b> : null}</dd></div>}
    </dl>}
    {item.sourceMaterial && <div className="live-task-source"><b>Material-fonte</b><p className="assessment-rich-text">{richText(item.sourceMaterial)}</p></div>}
    {item.live
      ? <div className="review-live-cta"><p>Esta tarefa é aplicada ao vivo. Pontue durante a sessão com o aluno.</p><button className="primary-button" onClick={onOpenLive}><Mic size={15} />Abrir sessão ao vivo</button></div>
      : message ? <p className="assessment-message" role="alert">{message}</p>
        : !question ? <div className="assessment-loading"><LoaderCircle className="spin" size={20} />Carregando resposta…</div>
          : <div className="assessment-report-questions"><QuestionReview client={client} question={question} index={result!.questions.indexOf(question)} discarded={discardedRecordings(result!, question.id)} onReview={async (responseId, score, feedback, rubricScores) => { await reviewAssessmentResponse(client, responseId, score, feedback, rubricScores); await onReviewed(); }} /></div>}
  </article>;
}

/** Productive answers already graded for one attempt, editable, with the report comment, before finalising. */
function CorrectionPreview({ client, attemptId }: { client: SupabaseClient; attemptId: string }) {
  const [result, setResult] = useState<TeacherAssessmentResult | null>(null);
  const [message, setMessage] = useState('');
  const load = useCallback(() => getAssessmentResult(client, attemptId).then(setResult).catch((error) => setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a correção.')), [attemptId, client]);
  useEffect(() => { void load(); }, [load]);
  if (message) return <p className="assessment-message" role="alert">{message}</p>;
  if (!result) return <div className="assessment-loading"><LoaderCircle className="spin" size={20} />Carregando correção…</div>;
  const graded = result.questions.filter((question) => question.rubric?.length || ['writing', 'speaking', 'mediation'].includes(question.type ?? ''));
  return <div className="review-queue-preview">
    <p>Confira a correção de cada tarefa. Você pode editar antes de concluir; depois de concluir, o resultado é liberado ao aluno.</p>
    <div className="assessment-report-questions">{graded.map((question) => <QuestionReview key={question.id} client={client} question={question} index={result.questions.indexOf(question)} discarded={discardedRecordings(result, question.id)}
      onReview={async (responseId, score, feedback, rubricScores) => { await reviewAssessmentResponse(client, responseId, score, feedback, rubricScores); await load(); }} />)}</div>
    <TeacherReportPanel client={client} report={result} />
  </div>;
}
