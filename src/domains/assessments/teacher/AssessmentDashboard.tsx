import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BarChart3, ClipboardList, Edit3, FileQuestion, Inbox, LoaderCircle, Mic, Plus, TrendingUp } from 'lucide-react';
import { assignAssessment, generateAssessmentFromPreset, getAssessmentFeatureFlags, listAssessmentIdsWithLiveTasks, listAssessmentReviewQueue, listCefrLevelCheckPresets, listTeacherAssessments, loadAssessmentDraft, openLiveAssessmentSession, publishAssessment, saveAssessmentDraft } from '../assessmentService';
import type { AssessmentRow } from '../database';
import type { AssessmentDraft, CefrLevelCheckPreset } from '../types';
import { AssessmentAssignments, type AssessmentStudentOption } from './AssessmentAssignments';
import { AssessmentEditor, type AssessmentBankQuestion } from './AssessmentEditor';
import { AssessmentResults } from './AssessmentResults';
import { AssessmentProgress } from './AssessmentProgress';
import { CefrAnalytics } from './CefrAnalytics';
import { LiveAssessmentSession } from './LiveAssessmentSession';
import { ASSESSMENT_LISTENING_DEFAULT } from '../../../config/env';
import { ReviewQueue } from './ReviewQueue';

const emptyDraft = (): AssessmentDraft => ({
  id: null, title: '', description: '', type: 'custom', framework: 'none', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: null, levelMax: null, timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review', sections: [],
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
  formVersion: 'GENERIC-1.0', decisionRuleVersion: 'objective-v1', routingRuleVersion: 'none', reportModelVersion: 'standard-report-v1',
});

const cefrPlacementDraft = (listeningEnabled: boolean): AssessmentDraft => {
  const blueprint = [
    { skill: 'reading' as const, target: 4, construct: 'Reading: gist, detail, reference, purpose, inference, attitude and structure' },
    { skill: 'listening' as const, target: 4, construct: 'Listening: gist, detail, intention, attitude, inference and speaker relationship' },
    { skill: 'language_use' as const, target: 5, construct: 'Language Use: contextual grammar, vocabulary, collocation, precision and register' },
  ];
  const skills = listeningEnabled ? blueprint : blueprint.filter(({ skill }) => skill !== 'listening');
  return { ...emptyDraft(), title: 'CEFR Placement Test', description: 'Forma fixa oficial interna para localizar, confirmar e gerar um perfil inicial.', type: 'placement', framework: 'cefr', navigationMode: 'linear', timeLimitMinutes: 50, showResults: 'after_teacher_review', formVersion: 'CEFR-PLACEMENT-FIXED-1.0', decisionRuleVersion: 'cefr-decision-v1', routingRuleVersion: 'cefr-routing-v1', reportModelVersion: 'cefr-profile-v1', sections: skills.flatMap(({ skill, target, construct }) => (['A1','A2','B1','B2','C1','C2'] as const).map((level) => ({ id: crypto.randomUUID(), title: `${skill.replace('_', ' ')} ${level} · ${target} itens`, skill, instructions: 'Responda com base apenas no material apresentado.', weight: 1, drawCount: null, cefrLevel: level, construct, taskletKind: 'primary' as const, confirmationForSectionId: null, questions: [] }))) };
};

export function AssessmentDashboard({ client, teacherId, students, bank }: {
  client: SupabaseClient;
  teacherId: string;
  students: AssessmentStudentOption[];
  bank: AssessmentBankQuestion[];
}) {
  const [items, setItems] = useState<AssessmentRow[]>([]);
  const [draft, setDraft] = useState<AssessmentDraft | null>(null);
  const [assigning, setAssigning] = useState<AssessmentRow | null>(null);
  const [resultsFor, setResultsFor] = useState<AssessmentRow | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [analyticsFor, setAnalyticsFor] = useState<AssessmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [creationOpen, setCreationOpen] = useState(false);
  const [presets, setPresets] = useState<CefrLevelCheckPreset[]>([]);
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set());
  const [livePickerFor, setLivePickerFor] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState<{ attemptId: string; assessment: AssessmentRow } | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [listeningEnabled, setListeningEnabled] = useState(ASSESSMENT_LISTENING_DEFAULT);
  const [pendingReviews, setPendingReviews] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const [assessments, levelCheckPresets, withLiveTasks, flags] = await Promise.all([listTeacherAssessments(client), listCefrLevelCheckPresets(client), listAssessmentIdsWithLiveTasks(client), getAssessmentFeatureFlags(client, { listening: ASSESSMENT_LISTENING_DEFAULT })]);
      setItems(assessments); setPresets(levelCheckPresets); setLiveIds(withLiveTasks); setListeningEnabled(flags.listening);
      // The badge is a convenience: a failure here must not block the dashboard.
      void listAssessmentReviewQueue(client).then((queue) => setPendingReviews(queue.items.length + queue.readyToFinalize.length)).catch(() => undefined);
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as avaliações.'); }
    setLoading(false);
  }, [client]);
  useEffect(() => { void load(); }, [load]);

  const edit = async (assessment: AssessmentRow) => {
    setBusy(true); setMessage('');
    try { setDraft(await loadAssessmentDraft(client, assessment.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o draft.'); }
    setBusy(false);
  };
  const createLevelCheck = async (presetId: string) => {
    setBusy(true); setMessage('');
    try {
      const assessmentId = await generateAssessmentFromPreset(client, presetId);
      setDraft(await loadAssessmentDraft(client, assessmentId));
      setCreationOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o Level Check.'); }
    setBusy(false);
  };
  const save = useCallback((value: AssessmentDraft) => saveAssessmentDraft(client, value), [client]);
  const publish = async (value: AssessmentDraft) => {
    setBusy(true);
    try {
      const id = await saveAssessmentDraft(client, value);
      await publishAssessment(client, id);
      setDraft(null); await load();
    } finally { setBusy(false); }
  };

  const openLive = async (assessment: AssessmentRow, studentId: string) => {
    setBusy(true); setMessage('');
    try { setLiveSession({ attemptId: await openLiveAssessmentSession(client, assessment.id, studentId), assessment }); setLivePickerFor(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a sessão ao vivo.'); }
    setBusy(false);
  };

  if (liveSession) return <LiveAssessmentSession client={client} attemptId={liveSession.attemptId} onBack={() => { setLiveSession(null); void load(); }} onOpenResults={() => { setResultsFor(liveSession.assessment); setLiveSession(null); }} />;
  if (queueOpen) return <ReviewQueue client={client} onBack={() => { setQueueOpen(false); void load(); }} onOpenLive={(item) => { const assessment = items.find((entry) => entry.id === item.assessmentId); if (assessment) { setQueueOpen(false); setLiveSession({ attemptId: item.attemptId, assessment }); } }} />;
  if (draft) return <AssessmentEditor client={client} teacherId={teacherId} initialDraft={draft} bank={bank} listeningEnabled={listeningEnabled} onBack={() => { setDraft(null); void load(); }} onSave={save} onPublish={publish} />;
  if (resultsFor) return <AssessmentResults client={client} assessment={resultsFor} studentNames={new Map(students.map((student) => [student.id, student.name]))} onBack={() => setResultsFor(null)} />;
  if (progressOpen) return <AssessmentProgress client={client} students={students} onBack={() => setProgressOpen(false)} />;
  if (analyticsFor) return <CefrAnalytics client={client} assessment={analyticsFor} onBack={() => setAnalyticsFor(null)} />;
  return <section className="assessment-dashboard">
    <header className="assessment-dashboard-header"><div><p className="eyebrow">ASSESSMENTS</p><h2>Construtor de avaliações</h2><p>Crie, aplique e acompanhe avaliações multimodais.</p></div><div className="assessment-header-actions"><button type="button" className="primary-button assessment-new-action" onClick={() => setCreationOpen((value) => !value)}><Plus size={17} />Nova avaliação</button><button type="button" className="secondary-button" onClick={() => setQueueOpen(true)}><Inbox size={17} />Fila de correção{pendingReviews ? <span className="review-queue-badge">{pendingReviews}</span> : null}</button><button type="button" className="secondary-button" onClick={() => setProgressOpen(true)}><TrendingUp size={17} />Evolução</button></div></header>
    {creationOpen && <section className="assessment-creation-menu" aria-label="Criar avaliação"><header><div><span>NOVA AVALIAÇÃO</span><h3>Escolha o ponto de partida</h3></div><button type="button" className="cancel-button" onClick={() => setCreationOpen(false)}>Fechar</button></header><div className="assessment-creation-primary"><button type="button" onClick={() => setDraft(emptyDraft())}><strong>Blank Assessment</strong><span>Comece com uma estrutura vazia e configure tudo manualmente.</span></button><button type="button" onClick={() => setDraft(cefrPlacementDraft(listeningEnabled))}><strong>General CEFR Placement</strong><span>Estime a faixa CEFR de um estudante cujo nível ainda é desconhecido.</span></button></div><div className="assessment-level-checks"><div><span>CEFR LEVEL CHECK</span><h4>Confirme a consolidação de um nível</h4>{!listeningEnabled && <small>Listening está desativado enquanto os áudios são produzidos: os Level Checks usam Reading, Language Use e as tarefas produtivas.</small>}</div>{presets.map((preset) => <button type="button" key={preset.id} disabled={busy} onClick={() => void createLevelCheck(preset.id)}><strong>{preset.name}</strong><span>{preset.floorLevel ? `Floor ${preset.floorLevel} · ` : ''}Target {preset.targetLevel}{preset.ceilingLevel ? ` · Ceiling ${preset.ceilingLevel}` : ''}</span><small>{preset.purpose}</small><em>{preset.estimatedDurationMinMinutes}–{preset.estimatedDurationMaxMinutes} min</em></button>)}</div></section>}
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading || busy ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando avaliações…</div> : items.length ? <div className="assessment-card-grid">{items.map((assessment) => <article key={assessment.id}>
      <div className="assessment-card-top"><span className={`assessment-status ${assessment.status}`}>{assessment.status === 'draft' ? 'Draft' : assessment.status === 'published' ? 'Publicada' : 'Arquivada'}</span><FileQuestion size={21} /></div>
      <h3>{assessment.title}</h3><p>{assessment.description || 'Sem descrição.'}</p>
      <dl><div><dt>Tipo</dt><dd>{assessment.type}</dd></div><div><dt>Tempo</dt><dd>{assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'Livre'}</dd></div><div><dt>Versão</dt><dd>{assessment.version}</dd></div></dl>
      <div className="assessment-card-actions">{assessment.status === 'draft' ? <button className="secondary-button" onClick={() => void edit(assessment)}><Edit3 size={15} />Editar draft</button> : assessment.status === 'published' ? <><button className="secondary-button" onClick={() => setResultsFor(assessment)}><FileQuestion size={15} />Resultados</button>{assessment.framework === 'cefr' && <button className="secondary-button" onClick={() => setAnalyticsFor(assessment)}><BarChart3 size={15} />Analytics</button>}{liveIds.has(assessment.id) && <button className="secondary-button" onClick={() => setLivePickerFor((current) => current === assessment.id ? null : assessment.id)}><Mic size={15} />Aplicar ao vivo</button>}<button className="primary-button" onClick={() => setAssigning(assessment)}><ClipboardList size={15} />Atribuir</button></> : null}</div>
      {livePickerFor === assessment.id && <form className="assessment-assign-form live-session-picker" onSubmit={(event) => { event.preventDefault(); const studentId = String(new FormData(event.currentTarget).get('studentId') ?? ''); if (studentId) void openLive(assessment, studentId); }}>
        <h3>Aplicar ao vivo</h3>
        <p>Conduza e pontue as tarefas ao vivo durante a aula. Se o aluno ainda não tiver a avaliação, ela é atribuída agora.</p>
        <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
        <button className="primary-button" disabled={busy || !students.length}><Mic size={15} />Abrir sessão</button>
      </form>}
      {assigning?.id === assessment.id && <AssessmentAssignments students={students} busy={busy} onAssign={async (input) => {
        setBusy(true);
        try {
          await assignAssessment(client, { assessmentId: assessment.id, teacherId, studentId: input.studentId, availableFrom: input.availableFrom ? new Date(input.availableFrom).toISOString() : null, dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null, attemptLimit: input.attemptLimit });
        } finally { setBusy(false); }
      }} />}
    </article>)}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação criada</h3><p>Comece por uma avaliação curta e publique quando a validação estiver pronta.</p></div>}
  </section>;
}
