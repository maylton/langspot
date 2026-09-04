import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BarChart3, ClipboardList, Edit3, FileQuestion, LoaderCircle, Plus, TrendingUp } from 'lucide-react';
import { assignAssessment, generateAssessmentFromPreset, listCefrLevelCheckPresets, listTeacherAssessments, loadAssessmentDraft, publishAssessment, saveAssessmentDraft } from '../assessmentService';
import type { AssessmentRow } from '../database';
import type { AssessmentDraft, CefrLevelCheckPreset } from '../types';
import { AssessmentAssignments, type AssessmentStudentOption } from './AssessmentAssignments';
import { AssessmentEditor, type AssessmentBankQuestion } from './AssessmentEditor';
import { AssessmentResults } from './AssessmentResults';
import { AssessmentProgress } from './AssessmentProgress';
import { CefrAnalytics } from './CefrAnalytics';

const emptyDraft = (): AssessmentDraft => ({
  id: null, title: '', description: '', type: 'custom', framework: 'none', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: null, levelMax: null, timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review', sections: [],
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
  formVersion: 'GENERIC-1.0', decisionRuleVersion: 'objective-v1', routingRuleVersion: 'none', reportModelVersion: 'standard-report-v1',
});

const cefrPlacementDraft = (): AssessmentDraft => {
  const blueprint = [
    { skill: 'reading' as const, target: 4, construct: 'Reading: gist, detail, reference, purpose, inference, attitude and structure' },
    { skill: 'listening' as const, target: 4, construct: 'Listening: gist, detail, intention, attitude, inference and speaker relationship' },
    { skill: 'language_use' as const, target: 5, construct: 'Language Use: contextual grammar, vocabulary, collocation, precision and register' },
  ];
  return { ...emptyDraft(), title: 'CEFR Placement Test', description: 'Forma fixa oficial interna para localizar, confirmar e gerar um perfil inicial.', type: 'placement', framework: 'cefr', navigationMode: 'linear', timeLimitMinutes: 50, showResults: 'after_teacher_review', formVersion: 'CEFR-PLACEMENT-FIXED-1.0', decisionRuleVersion: 'cefr-decision-v1', routingRuleVersion: 'cefr-routing-v1', reportModelVersion: 'cefr-profile-v1', sections: blueprint.flatMap(({ skill, target, construct }) => (['A1','A2','B1','B2','C1','C2'] as const).map((level) => ({ id: crypto.randomUUID(), title: `${skill.replace('_', ' ')} ${level} · ${target} itens`, skill, instructions: 'Responda com base apenas no material apresentado.', weight: 1, drawCount: null, cefrLevel: level, construct, taskletKind: 'primary' as const, confirmationForSectionId: null, questions: [] }))) };
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

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const [assessments, levelCheckPresets] = await Promise.all([listTeacherAssessments(client), listCefrLevelCheckPresets(client)]);
      setItems(assessments); setPresets(levelCheckPresets);
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

  if (draft) return <AssessmentEditor client={client} teacherId={teacherId} initialDraft={draft} bank={bank} onBack={() => { setDraft(null); void load(); }} onSave={save} onPublish={publish} />;
  if (resultsFor) return <AssessmentResults client={client} assessment={resultsFor} onBack={() => setResultsFor(null)} />;
  if (progressOpen) return <AssessmentProgress client={client} students={students} onBack={() => setProgressOpen(false)} />;
  if (analyticsFor) return <CefrAnalytics client={client} assessment={analyticsFor} onBack={() => setAnalyticsFor(null)} />;
  return <section className="assessment-dashboard">
    <header className="assessment-dashboard-header"><div><p className="eyebrow">ASSESSMENTS</p><h2>Construtor de avaliações</h2><p>Crie, aplique e acompanhe avaliações multimodais.</p></div><div className="assessment-header-actions"><button type="button" className="primary-button assessment-new-action" onClick={() => setCreationOpen((value) => !value)}><Plus size={17} />Nova avaliação</button><button type="button" className="secondary-button" onClick={() => setProgressOpen(true)}><TrendingUp size={17} />Evolução</button></div></header>
    {creationOpen && <section className="assessment-creation-menu" aria-label="Criar avaliação"><header><div><span>NOVA AVALIAÇÃO</span><h3>Escolha o ponto de partida</h3></div><button type="button" className="cancel-button" onClick={() => setCreationOpen(false)}>Fechar</button></header><div className="assessment-creation-primary"><button type="button" onClick={() => setDraft(emptyDraft())}><strong>Blank Assessment</strong><span>Comece com uma estrutura vazia e configure tudo manualmente.</span></button><button type="button" onClick={() => setDraft(cefrPlacementDraft())}><strong>General CEFR Placement</strong><span>Estime a faixa CEFR de um estudante cujo nível ainda é desconhecido.</span></button></div><div className="assessment-level-checks"><div><span>CEFR LEVEL CHECK</span><h4>Confirme a consolidação de um nível</h4></div>{presets.map((preset) => <button type="button" key={preset.id} disabled={busy} onClick={() => void createLevelCheck(preset.id)}><strong>{preset.name}</strong><span>{preset.floorLevel ? `Floor ${preset.floorLevel} · ` : ''}Target {preset.targetLevel}{preset.ceilingLevel ? ` · Ceiling ${preset.ceilingLevel}` : ''}</span><small>{preset.purpose}</small><em>{preset.estimatedDurationMinMinutes}–{preset.estimatedDurationMaxMinutes} min</em></button>)}</div></section>}
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading || busy ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando avaliações…</div> : items.length ? <div className="assessment-card-grid">{items.map((assessment) => <article key={assessment.id}>
      <div className="assessment-card-top"><span className={`assessment-status ${assessment.status}`}>{assessment.status === 'draft' ? 'Draft' : assessment.status === 'published' ? 'Publicada' : 'Arquivada'}</span><FileQuestion size={21} /></div>
      <h3>{assessment.title}</h3><p>{assessment.description || 'Sem descrição.'}</p>
      <dl><div><dt>Tipo</dt><dd>{assessment.type}</dd></div><div><dt>Tempo</dt><dd>{assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'Livre'}</dd></div><div><dt>Versão</dt><dd>{assessment.version}</dd></div></dl>
      <div className="assessment-card-actions">{assessment.status === 'draft' ? <button className="secondary-button" onClick={() => void edit(assessment)}><Edit3 size={15} />Editar draft</button> : assessment.status === 'published' ? <><button className="secondary-button" onClick={() => setResultsFor(assessment)}><FileQuestion size={15} />Resultados</button>{assessment.framework === 'cefr' && <button className="secondary-button" onClick={() => setAnalyticsFor(assessment)}><BarChart3 size={15} />Analytics</button>}<button className="primary-button" onClick={() => setAssigning(assessment)}><ClipboardList size={15} />Atribuir</button></> : null}</div>
      {assigning?.id === assessment.id && <AssessmentAssignments students={students} busy={busy} onAssign={async (input) => {
        setBusy(true);
        try {
          await assignAssessment(client, { assessmentId: assessment.id, teacherId, studentId: input.studentId, availableFrom: input.availableFrom ? new Date(input.availableFrom).toISOString() : null, dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null, attemptLimit: input.attemptLimit });
        } finally { setBusy(false); }
      }} />}
    </article>)}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação criada</h3><p>Comece por uma avaliação curta e publique quando a validação estiver pronta.</p></div>}
  </section>;
}
