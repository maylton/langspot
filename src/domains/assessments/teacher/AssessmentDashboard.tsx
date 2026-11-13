import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BarChart3, ClipboardList, Edit3, FileQuestion, Inbox, LoaderCircle, Mic, Plus, Trash2, TrendingUp } from 'lucide-react';
import { assignAssessment, cancelAssessmentAssignment, deleteAssessment, generateAssessmentFromPreset, getAssessmentDeletionImpact, getAssessmentFeatureFlags, getAssessmentStudentExposure, listActiveTeacherAttempts, listAssessmentIdsWithLiveTasks, listStudentSeenItems, listAssessmentReviewQueue, listCefrLevelCheckPresets, listTeacherAssessments, listTeacherAssignments, loadAssessmentDraft, openLiveAssessmentSession, publishAssessment, saveAssessmentDraft, updateAssessmentAssignment } from '../assessmentService';
import type { AssessmentRow } from '../database';
import type { ActiveTeacherAttempt, AssessmentDraft, CefrLevelCheckPreset } from '../types';
import { ActiveAttemptsPanel, AttemptMonitor } from './AttemptMonitor';
import { studentFormSeed } from './exposure';
import { AssessmentAssignments, type AssessmentStudentOption } from './AssessmentAssignments';
import { AssessmentEditor, type AssessmentBankQuestion } from './AssessmentEditor';
import { AssessmentResults } from './AssessmentResults';
import { AssessmentProgress } from './AssessmentProgress';
import { CefrAnalytics } from './CefrAnalytics';
import { LiveAssessmentSession } from './LiveAssessmentSession';
import { ASSESSMENT_LISTENING_DEFAULT } from '../../../config/env';
import { ReviewQueue } from './ReviewQueue';
import { AssignedAssessments } from './AssignedAssessments';
import { assignmentCounts, type AssignmentListRow } from './assignments';
import { DeleteAssessmentDialog } from './DeleteAssessmentDialog';
import type { AssessmentDeletionImpact } from '../assessmentService';

const emptyDraft = (): AssessmentDraft => ({
  id: null, title: '', description: '', type: 'custom', framework: 'none', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: null, levelMax: null, timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review', sectionPacing: 'none', sections: [],
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
  formVersion: 'GENERIC-1.0', decisionRuleVersion: 'objective-v1', routingRuleVersion: 'none', reportModelVersion: 'standard-report-v1',
});

/** Distinct, readable seed for an additional Level Check form. */
const newFormSeed = () => `forma-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

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
  const [resultsAttemptId, setResultsAttemptId] = useState<string | null>(null);
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
  const [generating, setGenerating] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);
  const [activeAttempts, setActiveAttempts] = useState<ActiveTeacherAttempt[]>([]);
  const [assignments, setAssignments] = useState<AssignmentListRow[]>([]);
  // Assignments are a convenience panel: a failure hides it instead of blocking the dashboard.
  const loadAssignments = useCallback(() => listTeacherAssignments(client).then(setAssignments).catch(() => undefined), [client]);
  // Student a new ready-made form is generated for (avoids what they have seen) and shown in the preview.
  const [creationStudentId, setCreationStudentId] = useState('');
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState<ActiveTeacherAttempt | null>(null);
  const [deleting, setDeleting] = useState<{ assessment: AssessmentRow; impact: AssessmentDeletionImpact | null; loading: boolean; busy: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const [assessments, levelCheckPresets, withLiveTasks, flags] = await Promise.all([listTeacherAssessments(client), listCefrLevelCheckPresets(client), listAssessmentIdsWithLiveTasks(client), getAssessmentFeatureFlags(client, { listening: ASSESSMENT_LISTENING_DEFAULT })]);
      setItems(assessments); setPresets(levelCheckPresets); setLiveIds(withLiveTasks); setListeningEnabled(flags.listening);
      setLoading(false);
      // The badge is a convenience: a failure here must not block the dashboard.
      void loadAssignments();
      void listAssessmentReviewQueue(client).then((queue) => setPendingReviews(queue.items.length + queue.readyToFinalize.length)).catch(() => undefined);
      return assessments;
    }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as avaliações.'); }
    setLoading(false);
    return null;
  }, [client, loadAssignments]);
  useEffect(() => { void load(); }, [load]);

  // Attempts in progress; refreshed while the dashboard is on screen. A failure only hides the panel.
  const loadActive = useCallback(() => listActiveTeacherAttempts(client).then(setActiveAttempts).catch(() => undefined), [client]);
  const onDashboard = !monitoring && !draft && !queueOpen && !resultsFor && !progressOpen && !analyticsFor && !liveSession;
  useEffect(() => {
    if (!onDashboard) return;
    void loadActive();
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void loadActive(); }, 30_000);
    return () => window.clearInterval(poll);
  }, [loadActive, onDashboard]);

  const edit = async (assessment: AssessmentRow) => {
    setBusy(true); setMessage('');
    try { setDraft(await loadAssessmentDraft(client, assessment.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o draft.'); }
    setBusy(false);
  };
  const createLevelCheck = async (presetId: string, selectionSeed?: string, forStudentId = creationStudentId) => {
    setBusy(true); setGenerating(true); setMessage('');
    try {
      const student = students.find((entry) => entry.id === forStudentId);
      // A form for a student always gets a fresh seed, so it is built from what they have not seen yet.
      const seed = student ? studentFormSeed(student.name) : selectionSeed;
      const assessmentId = await generateAssessmentFromPreset(client, presetId, undefined, seed, student?.id ?? null);
      setDraft(await loadAssessmentDraft(client, assessmentId));
      setPreviewStudentId(student?.id ?? null);
      setCreationOpen(false); setAssigning(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível montar a prova pronta.'); }
    setBusy(false); setGenerating(false);
  };
  const save = useCallback((value: AssessmentDraft) => saveAssessmentDraft(client, value), [client]);
  const publish = async (value: AssessmentDraft) => {
    setBusy(true);
    try {
      const id = await saveAssessmentDraft(client, value);
      await publishAssessment(client, id);
      setDraft(null);
      const published = (await load())?.find((item) => item.id === id) ?? null;
      // Next step after publishing: choose the student.
      setAssigning(published);
      if (published) setMessage(`“${published.title}” foi publicada. Agora escolha o aluno no formulário abaixo.`);
    } finally { setBusy(false); }
  };

  const askDelete = async (assessment: AssessmentRow) => {
    setMessage(''); setDeleting({ assessment, impact: null, loading: true, busy: false });
    try {
      const impact = await getAssessmentDeletionImpact(client, assessment.id);
      setDeleting((current) => current?.assessment.id === assessment.id ? { ...current, impact, loading: false } : current);
    } catch (error) {
      setDeleting(null);
      setMessage(error instanceof Error ? error.message : 'Não foi possível verificar a avaliação.');
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    const { assessment } = deleting;
    setDeleting({ ...deleting, busy: true });
    try {
      await deleteAssessment(client, assessment.id);
      setItems((current) => current.filter((item) => item.id !== assessment.id));
      setMessage(`“${assessment.title}” foi excluída.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível excluir a avaliação.'); }
    setDeleting(null);
  };

  const openLive = async (assessment: AssessmentRow, studentId: string) => {
    setBusy(true); setMessage('');
    try { setLiveSession({ attemptId: await openLiveAssessmentSession(client, assessment.id, studentId), assessment }); setLivePickerFor(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível abrir a sessão ao vivo.'); }
    setBusy(false);
  };

  if (monitoring) {
    const assessment = items.find((entry) => entry.id === monitoring.assessmentId) ?? null;
    return <AttemptMonitor client={client} attemptId={monitoring.attemptId} onBack={() => setMonitoring(null)}
      onOpenLiveSession={() => { if (assessment) { setLiveSession({ attemptId: monitoring.attemptId, assessment }); setMonitoring(null); } }}
      onOpenResults={() => { setResultsFor(assessment); setMonitoring(null); }} />;
  }
  if (liveSession) return <LiveAssessmentSession client={client} attemptId={liveSession.attemptId} onBack={() => { setLiveSession(null); void load(); }} onOpenResults={() => { setResultsFor(liveSession.assessment); setLiveSession(null); }} />;
  if (queueOpen) return <ReviewQueue client={client} onBack={() => { setQueueOpen(false); void load(); }} onOpenLive={(item) => { const assessment = items.find((entry) => entry.id === item.assessmentId); if (assessment) { setQueueOpen(false); setLiveSession({ attemptId: item.attemptId, assessment }); } }} />;
  if (draft) return <AssessmentEditor client={client} teacherId={teacherId} initialDraft={draft} bank={bank} listeningEnabled={listeningEnabled} students={students} previewStudentId={previewStudentId} loadSeenItems={(studentId) => listStudentSeenItems(client, studentId)} onBack={() => { setDraft(null); setPreviewStudentId(null); void load(); }} onSave={save} onPublish={publish} onUseReadyMade={() => { setDraft(null); setCreationOpen(true); void load(); }} />;
  if (resultsFor) return <AssessmentResults client={client} assessment={resultsFor} studentNames={new Map(students.map((student) => [student.id, student.name]))} onBack={() => { setResultsFor(null); setResultsAttemptId(null); }} initialAttemptId={resultsAttemptId} />;
  if (progressOpen) return <AssessmentProgress client={client} students={students} onBack={() => setProgressOpen(false)} onOpenReport={(assessmentId, attemptId) => { const assessment = items.find((entry) => entry.id === assessmentId); if (assessment) { setResultsAttemptId(attemptId); setResultsFor(assessment); setProgressOpen(false); } }} />;
  if (analyticsFor) return <CefrAnalytics client={client} assessment={analyticsFor} onBack={() => setAnalyticsFor(null)} />;
  return <section className="assessment-dashboard">
    <header className="assessment-dashboard-header"><div><p className="eyebrow">ASSESSMENTS</p><h2>Construtor de avaliações</h2><p>Crie, aplique e acompanhe avaliações multimodais.</p></div><div className="assessment-header-actions"><button type="button" className="primary-button assessment-new-action" onClick={() => setCreationOpen((value) => !value)}><Plus size={17} />Nova avaliação</button><button type="button" className="secondary-button" onClick={() => setQueueOpen(true)}><Inbox size={17} />Fila de correção{pendingReviews ? <span className="review-queue-badge">{pendingReviews}</span> : null}</button><button type="button" className="secondary-button" onClick={() => setProgressOpen(true)}><TrendingUp size={17} />Evolução</button></div></header>
    {creationOpen && <section className="assessment-creation-menu" aria-label="Criar avaliação" ref={(node) => node?.scrollIntoView({ block: 'nearest' })}>
      <header><div><span>NOVA AVALIAÇÃO</span><h3>Escolha o ponto de partida</h3></div><button type="button" className="cancel-button" onClick={() => setCreationOpen(false)}>Fechar</button></header>
      <div className="assessment-creation-student">
        <label>Para qual aluno é a prova? (opcional)<select value={creationStudentId} onChange={(event) => setCreationStudentId(event.target.value)}>
          <option value="">Nenhum aluno específico</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
        </select></label>
        <small>{creationStudentId ? 'A prova pronta será montada evitando os textos, tarefas e questões que este aluno já viu em provas anteriores.' : 'Escolha o aluno para a prova evitar os textos e questões que ele já viu.'}</small>
      </div>
      <div className="assessment-level-checks">
        <div className="assessment-creation-group"><span>PROVA PRONTA · RECOMENDADO</span><h4>Verificar se o aluno está em um nível</h4><small>Escolha o nível. A prova completa (Reading, Language Use, Writing, Speaking e Mediação) é montada automaticamente com questões revisadas do banco CEFR. Depois é só revisar, publicar e atribuir ao aluno.{!listeningEnabled && ' Por enquanto as provas não têm Listening (os áudios ainda estão sendo produzidos).'}</small></div>
        {presets.length ? presets.map((preset) => <div className="assessment-level-check-option" key={preset.id}>
          <button type="button" disabled={busy} onClick={() => void createLevelCheck(preset.id)} aria-label={`Criar prova pronta de nível ${preset.targetLevel}`}>
            <b className="assessment-level-badge">{preset.targetLevel}</b>
            <strong>Prova de nível {preset.targetLevel}</strong>
            <small>{preset.purpose}</small>
            <span>{[preset.floorLevel, preset.ceilingLevel].filter(Boolean).length ? `Inclui questões de ${[preset.floorLevel, preset.ceilingLevel].filter(Boolean).join(' e ')} para confirmar a faixa.` : ''}</span>
            <em>{preset.estimatedDurationMinMinutes}–{preset.estimatedDurationMaxMinutes} min</em>
          </button>
          <button type="button" className="assessment-new-form" disabled={busy} title="Monta outra seleção de questões com a mesma estrutura, para outro aluno ou para reaplicar a prova" onClick={() => void createLevelCheck(preset.id, newFormSeed())}>Gerar outra versão</button>
        </div>) : <p className="assessment-creation-empty">As provas prontas não carregaram. Feche e abra este menu de novo; se continuar, recarregue a página.</p>}
      </div>
      <div className="assessment-creation-manual">
        <div className="assessment-creation-group"><span>MONTAR DO ZERO</span><small>Para quem quer escolher cada seção e questão manualmente.</small></div>
        <div className="assessment-creation-primary">
          <button type="button" onClick={() => setDraft(emptyDraft())}><strong>Prova em branco</strong><span>Crie as seções e adicione questões do banco ou suas próprias.</span></button>
          <button type="button" onClick={() => setDraft(cefrPlacementDraft(listeningEnabled))}><strong>Nivelamento CEFR (estrutura vazia)</strong><span>Seções de A1 a C2 já criadas, sem questões: você escolhe cada item. Para aluno sem nível conhecido.</span></button>
        </div>
      </div>
    </section>}
    {message && <div className="assessment-message" role="alert">{message}</div>}
    <ActiveAttemptsPanel attempts={activeAttempts} onOpen={setMonitoring} />
    <AssignedAssessments assignments={assignments} assessments={items} students={students} activeAttempts={activeAttempts}
      onUpdate={async (id, input) => { await updateAssessmentAssignment(client, id, input); await loadAssignments(); }}
      onCancel={async (id) => { await cancelAssessmentAssignment(client, id); await loadAssignments(); }}
      onOpenResults={setResultsFor} onMonitor={setMonitoring} />
    {deleting && <DeleteAssessmentDialog title={deleting.assessment.title} impact={deleting.impact} loadingImpact={deleting.loading} busy={deleting.busy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)} />}
    {loading || busy ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />{generating ? 'Montando a prova pronta…' : 'Carregando avaliações…'}</div> : items.length ? <div className="assessment-card-grid">{items.map((assessment) => <article key={assessment.id}>
      <div className="assessment-card-top"><span className={`assessment-status ${assessment.status}`}>{assessment.status === 'draft' ? 'Rascunho' : assessment.status === 'published' ? 'Publicada' : 'Arquivada'}</span><button type="button" className="icon-button danger assessment-delete-button" title="Excluir avaliação" aria-label={`Excluir ${assessment.title}`} onClick={() => void askDelete(assessment)}><Trash2 size={15} /></button></div>
      <h3>{assessment.title}</h3><p>{assessment.description || 'Sem descrição.'}</p>{(() => { const counted = assignmentCounts(assignments).get(assessment.id); return counted ? <small className="assessment-assigned-count">Atribuída a {counted.total} aluno{counted.total === 1 ? '' : 's'}{counted.notStarted ? ` · ${counted.notStarted} ainda não ${counted.notStarted === 1 ? 'começou' : 'começaram'}` : ''}</small> : null; })()}
      <dl><div><dt>Tipo</dt><dd>{assessment.type}</dd></div><div><dt>Tempo</dt><dd>{assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'Livre'}</dd></div><div><dt>Versão</dt><dd>{assessment.version}</dd></div></dl>
      <div className="assessment-card-actions">{assessment.status === 'draft' ? <button className="secondary-button" onClick={() => void edit(assessment)}><Edit3 size={15} />Editar rascunho</button> : assessment.status === 'published' ? <><button className="secondary-button" onClick={() => setResultsFor(assessment)}><FileQuestion size={15} />Resultados</button>{assessment.framework === 'cefr' && <button className="secondary-button" onClick={() => setAnalyticsFor(assessment)}><BarChart3 size={15} />Analytics</button>}{liveIds.has(assessment.id) && <button className="secondary-button" onClick={() => setLivePickerFor((current) => current === assessment.id ? null : assessment.id)}><Mic size={15} />Aplicar ao vivo</button>}<button className="primary-button" onClick={() => setAssigning((current) => current?.id === assessment.id ? null : assessment)}><ClipboardList size={15} />Atribuir</button></> : null}</div>
      {livePickerFor === assessment.id && <form className="assessment-assign-form live-session-picker" onSubmit={(event) => { event.preventDefault(); const studentId = String(new FormData(event.currentTarget).get('studentId') ?? ''); if (studentId) void openLive(assessment, studentId); }}>
        <h3>Aplicar ao vivo</h3>
        <p>Conduza e pontue as tarefas ao vivo durante a aula. Se o aluno ainda não tiver a avaliação, ela é atribuída agora.</p>
        <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
        <button className="primary-button" disabled={busy || !students.length}><Mic size={15} />Abrir sessão</button>
      </form>}
      {assigning?.id === assessment.id && <AssessmentAssignments students={students} busy={assignBusy} defaultStudentId={assessment.generated_for_student_id ?? null}
        loadExposure={(studentId) => getAssessmentStudentExposure(client, assessment.id, studentId)}
        onNewVersionFor={assessment.preset_id && presets.some((preset) => preset.id === assessment.preset_id) ? (studentId) => void createLevelCheck(assessment.preset_id as string, undefined, studentId) : undefined} onClose={() => setAssigning(null)} onAssign={async (input) => {
        setAssignBusy(true);
        try {
          await assignAssessment(client, { assessmentId: assessment.id, teacherId, studentId: input.studentId, availableFrom: input.availableFrom ? new Date(input.availableFrom).toISOString() : null, dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null, attemptLimit: input.attemptLimit });
          await loadAssignments();
        } finally { setAssignBusy(false); }
      }} />}
    </article>)}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação criada</h3><p>Comece por uma avaliação curta e publique quando a validação estiver pronta.</p></div>}
  </section>;
}
