import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ClipboardList, Edit3, FileQuestion, LoaderCircle, Plus, TrendingUp } from 'lucide-react';
import { assignAssessment, listTeacherAssessments, loadAssessmentDraft, publishAssessment, saveAssessmentDraft } from '../assessmentService';
import type { AssessmentRow } from '../database';
import type { AssessmentDraft } from '../types';
import { AssessmentAssignments, type AssessmentStudentOption } from './AssessmentAssignments';
import { AssessmentEditor, type AssessmentBankQuestion } from './AssessmentEditor';
import { AssessmentResults } from './AssessmentResults';
import { AssessmentProgress } from './AssessmentProgress';

const emptyDraft = (): AssessmentDraft => ({
  id: null, title: '', description: '', type: 'custom', assessmentMode: 'fixed', navigationMode: 'free',
  levelMin: null, levelMax: null, timeLimitMinutes: 30, maxAttempts: 1,
  randomizeQuestions: false, randomizeOptions: false, showResults: 'after_teacher_review', sections: [],
  adaptiveInitialAbility: 5, adaptiveMinItems: 4, adaptiveMaxItems: 10, adaptiveConfidenceThreshold: 0.65,
});

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try { setItems(await listTeacherAssessments(client)); }
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
  return <section className="assessment-dashboard">
    <header className="assessment-dashboard-header"><div><p className="eyebrow">ASSESSMENTS</p><h2>Construtor de avaliações</h2><p>Crie, aplique e acompanhe avaliações multimodais.</p></div><div className="assessment-header-actions"><button className="secondary-button" onClick={() => setProgressOpen(true)}><TrendingUp size={17} />Evolução</button><button className="primary-button" onClick={() => setDraft(emptyDraft())}><Plus size={17} />Nova avaliação</button></div></header>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {loading || busy ? <div className="assessment-loading"><LoaderCircle className="spin" size={24} />Carregando avaliações…</div> : items.length ? <div className="assessment-card-grid">{items.map((assessment) => <article key={assessment.id}>
      <div className="assessment-card-top"><span className={`assessment-status ${assessment.status}`}>{assessment.status === 'draft' ? 'Draft' : assessment.status === 'published' ? 'Publicada' : 'Arquivada'}</span><FileQuestion size={21} /></div>
      <h3>{assessment.title}</h3><p>{assessment.description || 'Sem descrição.'}</p>
      <dl><div><dt>Tipo</dt><dd>{assessment.type}</dd></div><div><dt>Tempo</dt><dd>{assessment.time_limit_minutes ? `${assessment.time_limit_minutes} min` : 'Livre'}</dd></div><div><dt>Versão</dt><dd>{assessment.version}</dd></div></dl>
      <div className="assessment-card-actions">{assessment.status === 'draft' ? <button className="secondary-button" onClick={() => void edit(assessment)}><Edit3 size={15} />Editar draft</button> : assessment.status === 'published' ? <><button className="secondary-button" onClick={() => setResultsFor(assessment)}><FileQuestion size={15} />Resultados</button><button className="primary-button" onClick={() => setAssigning(assessment)}><ClipboardList size={15} />Atribuir</button></> : null}</div>
      {assigning?.id === assessment.id && <AssessmentAssignments students={students} busy={busy} onAssign={async (input) => {
        setBusy(true);
        try {
          await assignAssessment(client, { assessmentId: assessment.id, teacherId, studentId: input.studentId, availableFrom: input.availableFrom ? new Date(input.availableFrom).toISOString() : null, dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null, attemptLimit: input.attemptLimit });
        } finally { setBusy(false); }
      }} />}
    </article>)}</div> : <div className="assessment-empty"><FileQuestion size={38} /><h3>Nenhuma avaliação criada</h3><p>Comece por uma avaliação curta e publique quando a validação estiver pronta.</p></div>}
  </section>;
}
