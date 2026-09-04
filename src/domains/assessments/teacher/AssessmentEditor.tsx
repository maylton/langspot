import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, Plus, Save, Send, Trash2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { joinOrderingAnswer, type QuestionDefinition, type QuestionType } from '../../questions';
import { validateAssessmentDraft } from '../validator';
import type { AssessmentDraft, AssessmentDraftSection, AssessmentQuestionSnapshot, AssessmentSectionSkill, CefrLevel } from '../types';
import { AssessmentPreview } from './AssessmentPreview';
import { uploadListeningAudio } from '../mediaService';

export type AssessmentBankQuestion = QuestionDefinition & { bankId: string; cefr?: CefrLevel; difficulty?: number; skill?: AssessmentQuestionSnapshot['skill']; subskill?: string; taskType?: string; topic?: string; genre?: string; qualityStatus?: AssessmentQuestionSnapshot['qualityStatus']; restricted?: boolean };

const newSection = (): AssessmentDraftSection => ({ id: crypto.randomUUID(), title: 'Nova seção', skill: 'grammar', instructions: '', weight: 1, drawCount: null, cefrLevel: null, construct: '', taskletKind: 'primary', confirmationForSectionId: null, questions: [] });

export function AssessmentEditor({ client, teacherId, initialDraft, bank, onBack, onSave, onPublish }: {
  client: SupabaseClient;
  teacherId: string;
  initialDraft: AssessmentDraft;
  bank: AssessmentBankQuestion[];
  onBack: () => void;
  onSave: (draft: AssessmentDraft) => Promise<string>;
  onPublish: (draft: AssessmentDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [message, setMessage] = useState('');
  const [bankLevel, setBankLevel] = useState('all');
  const [bankStatus, setBankStatus] = useState('all');
  const [bankSearch, setBankSearch] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (!draft.title.trim()) return;
    setSaveState('saving');
    const timeout = window.setTimeout(async () => {
      try {
        const id = await onSave(draft);
        setDraft((current) => current.id ? current : { ...current, id });
        setSaveState('saved');
      } catch (error) { setSaveState('error'); setMessage(error instanceof Error ? error.message : 'Falha no autosave.'); }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [draft, onSave]);

  const changeSection = (id: string, changes: Partial<AssessmentDraftSection>) => setDraft((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...changes } : section) }));
  const removeSection = (id: string) => setDraft((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
  const addBankQuestion = (sectionId: string, bankId: string) => {
    const question = bank.find((item) => item.bankId === bankId);
    if (!question) return;
    changeSection(sectionId, { questions: [...(draft.sections.find((section) => section.id === sectionId)?.questions ?? []), { id: crypto.randomUUID(), questionBankId: question.bankId, weight: 1, required: true, snapshot: { ...question, id: crypto.randomUUID() } }] });
  };
  const removeQuestion = (sectionId: string, questionId: string) => {
    const section = draft.sections.find((item) => item.id === sectionId);
    if (section) changeSection(sectionId, { questions: section.questions.filter((question) => question.id !== questionId) });
  };
  const addManualQuestion = (sectionId: string, question: AssessmentQuestionSnapshot) => {
    const section = draft.sections.find((item) => item.id === sectionId);
    if (section) changeSection(sectionId, { questions: [...section.questions, { id: crypto.randomUUID(), questionBankId: null, weight: 1, required: true, snapshot: question }] });
  };
  const saveNow = async () => {
    if (!draft.title.trim()) { setMessage('Informe um título antes de salvar.'); return; }
    setSaveState('saving'); setMessage('');
    try { const id = await onSave(draft); setDraft((current) => ({ ...current, id })); setSaveState('saved'); }
    catch (error) { setSaveState('error'); setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
  };
  const publish = async () => {
    const issues = validateAssessmentDraft(draft);
    const errors = issues.filter((issue) => issue.severity === 'error');
    if (errors.length) { setMessage(errors.map((issue) => issue.message).join(' ')); return; }
    if (issues.some((issue) => issue.severity === 'warning') && !window.confirm(`${issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message).join(' ')} Publicar mesmo assim?`)) return;
    setMessage('');
    try { await onPublish(draft); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível publicar.'); }
  };

  return <div className="assessment-editor">
    <div className="assessment-editor-toolbar"><button className="secondary-button" onClick={onBack}><ArrowLeft size={16} />Voltar</button><span className={`assessment-save-state ${saveState}`}>{saveState === 'saving' ? 'Salvando…' : saveState === 'error' ? 'Não salvo' : 'Salvo'}</span><button className="secondary-button" onClick={() => setPreview((value) => !value)}><Eye size={16} />{preview ? 'Editar' : 'Pré-visualizar'}</button><button className="secondary-button" onClick={saveNow}><Save size={16} />Salvar</button><button className="primary-button" onClick={publish}><Send size={16} />Publicar</button></div>
    {message && <div className="assessment-message" role="alert">{message}</div>}
    {preview ? <AssessmentPreview draft={draft} /> : <>
      <section className="assessment-settings-grid">
        <label className="wide">Título<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex.: Unit 4 Progress Test" /></label>
        <label className="wide">Descrição<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} /></label>
        <label>Tipo<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as AssessmentDraft['type'] })}><option value="placement">Placement</option><option value="diagnostic">Diagnostic</option><option value="progress">Progress</option><option value="unit">Unit</option><option value="custom">Custom</option></select></label>
        <label>Framework<select value={draft.framework} onChange={(event) => { const framework = event.target.value as AssessmentDraft['framework']; setDraft({ ...draft, framework, formVersion: framework === 'cefr' ? 'CEFR-PLACEMENT-FIXED-1.0' : 'GENERIC-1.0', decisionRuleVersion: framework === 'cefr' ? 'cefr-decision-v1' : 'objective-v1', routingRuleVersion: framework === 'cefr' ? 'cefr-routing-v1' : 'none', reportModelVersion: framework === 'cefr' ? 'cefr-profile-v1' : 'standard-report-v1' }); }}><option value="none">Avaliação escolar</option><option value="cefr">Proficiência CEFR</option></select></label>
        <label>Modo<select value={draft.assessmentMode} onChange={(event) => setDraft({ ...draft, assessmentMode: event.target.value as AssessmentDraft['assessmentMode'], navigationMode: event.target.value === 'adaptive' ? 'linear' : draft.navigationMode, showResults: event.target.value === 'adaptive' ? 'after_teacher_review' : draft.showResults })}><option value="fixed">Fixo</option><option value="adaptive">Adaptativo</option></select></label>
        <label>Navegação<select value={draft.navigationMode} onChange={(event) => setDraft({ ...draft, navigationMode: event.target.value as AssessmentDraft['navigationMode'] })}><option value="free">Livre</option><option value="linear">Linear</option></select></label>
        <label>Tempo (min)<input type="number" min="1" value={draft.timeLimitMinutes ?? ''} onChange={(event) => setDraft({ ...draft, timeLimitMinutes: event.target.value ? Number(event.target.value) : null })} /></label>
        <label>Máx. tentativas<input type="number" min="1" value={draft.maxAttempts} onChange={(event) => setDraft({ ...draft, maxAttempts: Number(event.target.value) })} /></label>
        <label>Resultado<select value={draft.showResults} onChange={(event) => setDraft({ ...draft, showResults: event.target.value as AssessmentDraft['showResults'] })}><option value="none">Oculto</option><option value="score_only">Somente nota</option><option value="level_only">Somente nível</option><option value="full_report">Relatório completo</option><option value="after_teacher_review">Após revisão</option></select></label>
        <label className="check"><input type="checkbox" checked={draft.randomizeQuestions} onChange={(event) => setDraft({ ...draft, randomizeQuestions: event.target.checked })} />Randomizar questões</label>
        <label className="check"><input type="checkbox" checked={draft.randomizeOptions} onChange={(event) => setDraft({ ...draft, randomizeOptions: event.target.checked })} />Randomizar alternativas</label>
        {draft.assessmentMode === 'adaptive' ? <><label>Ability inicial (1–10)<input type="number" min="1" max="10" step="0.5" value={draft.adaptiveInitialAbility} onChange={(event) => setDraft({ ...draft, adaptiveInitialAbility: Number(event.target.value) })} /></label><label>Mínimo por skill<input type="number" min="1" value={draft.adaptiveMinItems} onChange={(event) => setDraft({ ...draft, adaptiveMinItems: Number(event.target.value) })} /></label><label>Máximo por skill<input type="number" min={draft.adaptiveMinItems} value={draft.adaptiveMaxItems} onChange={(event) => setDraft({ ...draft, adaptiveMaxItems: Number(event.target.value) })} /></label><label>Confiança para encerrar<input type="number" min="0.1" max="0.95" step="0.05" value={draft.adaptiveConfidenceThreshold} onChange={(event) => setDraft({ ...draft, adaptiveConfidenceThreshold: Number(event.target.value) })} /></label></> : null}
        {draft.framework === 'cefr' && <><label>Form version<input value={draft.formVersion} onChange={(event) => setDraft({ ...draft, formVersion: event.target.value })} /></label><label>Decision rule<input value={draft.decisionRuleVersion} readOnly /></label><p className="wide rubric-summary">Os thresholds iniciais são um <b>PROVISIONAL INTERNAL STANDARD</b>. O resultado é uma estimativa LangSpot alinhada ao CEFR, não uma certificação oficial.</p></>}
      </section>
      {draft.framework === 'cefr' && <section className="assessment-settings-grid"><label>Filtrar banco por CEFR<select value={bankLevel} onChange={(event) => setBankLevel(event.target.value)}><option value="all">Todos</option>{['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'].map((level) => <option key={level}>{level}</option>)}</select></label><label>Status<select value={bankStatus} onChange={(event) => setBankStatus(event.target.value)}><option value="all">Todos</option><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option><option value="pilot">Pilot</option><option value="needs_revision">Needs revision</option><option value="retired">Retired</option></select></label><label>Subskill, task, tópico ou gênero<input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} placeholder="Ex.: inference" /></label></section>}
      <div className="assessment-section-list">{draft.sections.map((section, index) => <section className="assessment-section-editor" key={section.id}>
        <div className="assessment-section-heading"><strong>Seção {index + 1}</strong><button className="icon-button danger" aria-label="Excluir seção" onClick={() => removeSection(section.id)}><Trash2 size={16} /></button></div>
        <div className="assessment-section-fields"><label>Título<input value={section.title} onChange={(event) => changeSection(section.id, { title: event.target.value })} /></label><label>Skill<select value={section.skill} onChange={(event) => changeSection(section.id, { skill: event.target.value as AssessmentSectionSkill })}><option value="grammar">Grammar</option><option value="vocabulary">Vocabulary</option><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="spoken_production">Spoken Production</option><option value="spoken_interaction">Spoken Interaction</option><option value="mediation">Mediation</option><option value="language_use">Language Use</option><option value="speaking">Speaking (legado)</option><option value="use_of_english">Use of English (legado)</option></select></label><label>Questões do pool<input type="number" min="1" max={section.questions.length || undefined} value={section.drawCount ?? ''} placeholder="Todas" onChange={(event) => changeSection(section.id, { drawCount: event.target.value ? Number(event.target.value) : null })} /></label>{draft.framework === 'cefr' && <><label>Nível do tasklet<select value={section.cefrLevel ?? ''} onChange={(event) => changeSection(section.id, { cefrLevel: (event.target.value || null) as CefrLevel | null })}><option value="">Selecione</option>{['A1','A2','B1','B2','C1','C2'].map((level) => <option key={level}>{level}</option>)}</select></label><label>Função<select value={section.taskletKind ?? 'primary'} onChange={(event) => changeSection(section.id, { taskletKind: event.target.value as AssessmentDraftSection['taskletKind'] })}><option value="screening">Screening</option><option value="primary">Primary</option><option value="confirmation">Confirmation</option><option value="floor">Floor</option><option value="ceiling">Ceiling</option></select></label><label>Construct<input value={section.construct ?? ''} onChange={(event) => changeSection(section.id, { construct: event.target.value })} placeholder="Ex.: reading inference" /></label></>}<label className="wide">Instruções<input value={section.instructions} onChange={(event) => changeSection(section.id, { instructions: event.target.value })} /></label></div>
        <div className="assessment-question-list">{section.questions.map((question, questionIndex) => <article key={question.id}><span>{questionIndex + 1}</span><div><strong>{question.snapshot.prompt}</strong><small>{question.snapshot.type.replace(/_/g, ' ')}</small></div><button className="icon-button danger" aria-label="Remover questão" onClick={() => removeQuestion(section.id, question.id)}><Trash2 size={15} /></button></article>)}</div>
        <div className="assessment-question-actions"><label>Adicionar do banco<select defaultValue="" onChange={(event) => { addBankQuestion(section.id, event.target.value); event.target.value = ''; }}><option value="" disabled>Escolha uma questão</option>{bank.filter((question) => (draft.framework !== 'cefr' || !question.skill || question.skill === section.skill || (section.skill === 'language_use' && ['grammar','vocabulary','language_use'].includes(question.skill))) && (bankLevel === 'all' || question.cefr === bankLevel) && (bankStatus === 'all' || question.qualityStatus === bankStatus) && (!bankSearch.trim() || [question.subskill, question.taskType, question.topic, question.genre, question.prompt].some((value) => value?.toLowerCase().includes(bankSearch.trim().toLowerCase())))).map((question) => <option key={question.bankId} value={question.bankId}>{question.cefr ? `${question.cefr} · ` : ''}{question.qualityStatus ? `${question.qualityStatus} · ` : ''}{question.prompt}</option>)}</select></label><ManualQuestionForm assessmentId={draft.id} defaultSkill={section.skill} framework={draft.framework} onUpload={(questionId, file) => {
          if (!draft.id) throw new Error('Salve o draft antes de enviar o áudio.');
          return uploadListeningAudio(client, teacherId, draft.id, questionId, file);
        }} onAdd={(question) => addManualQuestion(section.id, question)} /></div>
      </section>)}</div>
      <button className="secondary-button assessment-add-section" onClick={() => setDraft((current) => ({ ...current, sections: [...current.sections, newSection()] }))}><Plus size={16} />Adicionar seção</button>
    </>}
  </div>;
}

const WRITING_RUBRIC = ['Task Achievement', 'Range', 'Accuracy', 'Organisation & Cohesion', 'Register & Pragmatic Appropriacy'].map((label) => ({ key: label.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'), label, maxScore: 11, scale: 'cefr' as const }));
const SPEAKING_RUBRIC = ['Range', 'Grammatical Accuracy', 'Lexical Control', 'Fluency', 'Interaction', 'Coherence', 'Pronunciation / Phonological Control'].map((label) => ({ key: label.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'), label, maxScore: 11, scale: 'cefr' as const }));
const MEDIATION_RUBRIC = ['Information Selection', 'Accuracy of Meaning', 'Reformulation', 'Organisation', 'Audience Appropriacy', 'Language Control'].map((label) => ({ key: label.toLowerCase().replace(/ /g, '_'), label, maxScore: 11, scale: 'cefr' as const }));

function ManualQuestionForm({ assessmentId, framework, defaultSkill, onUpload, onAdd }: { assessmentId: string | null; framework: AssessmentDraft['framework']; defaultSkill: AssessmentSectionSkill; onUpload: (questionId: string, file: File) => Promise<string>; onAdd: (question: AssessmentQuestionSnapshot) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const prompt = String(form.get('prompt')).trim();
    let options = String(form.get('options') ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
    if (type === 'true_false') options = ['True', 'False'];
    let answer = String(form.get('answer') ?? '').trim();
    if (['ordering', 'multiple_response', 'matching'].includes(type)) answer = joinOrderingAnswer(answer.split('\n').map((item) => item.trim()).filter(Boolean));
    const cefr = String(form.get('cefr') ?? 'B1') as CefrLevel;
    const difficulty = Number(form.get('difficulty') ?? 5);
    const id = crypto.randomUUID();
    try {
      const audioFile = form.get('audio');
      const audioPath = type === 'listening' && audioFile instanceof File && audioFile.size ? await onUpload(id, audioFile) : undefined;
      onAdd({ id, type, prompt, options, answer, cefr, difficulty, audioPath, skill: String(form.get('skill') ?? defaultSkill).replace('speaking', 'spoken_production').replace('use_of_english', 'language_use') as AssessmentQuestionSnapshot['skill'], subskill: String(form.get('subskill') ?? '').trim() || undefined, descriptorId: String(form.get('descriptorId') ?? '').trim() || undefined, operationalDescriptor: String(form.get('operationalDescriptor') ?? '').trim() || undefined, taskType: String(form.get('taskType') ?? '').trim() || undefined, topic: String(form.get('topic') ?? '').trim() || undefined, genre: String(form.get('genre') ?? '').trim() || undefined, qualityStatus: String(form.get('qualityStatus') ?? 'draft') as AssessmentQuestionSnapshot['qualityStatus'], sourceMaterial: type === 'mediation' ? String(form.get('sourceMaterial') ?? '').trim() : undefined,
        maxPlays: type === 'listening' ? Number(form.get('maxPlays') ?? 2) : undefined,
        autoplay: type === 'listening' ? form.get('autoplay') === 'on' : undefined,
        transcript: type === 'listening' ? String(form.get('transcript') ?? '') : undefined,
        transcriptVisibility: type === 'listening' ? String(form.get('transcriptVisibility') ?? 'after_submit') as AssessmentQuestionSnapshot['transcriptVisibility'] : undefined,
        preparationSeconds: type === 'speaking' ? Number(form.get('preparationSeconds') ?? 30) : undefined,
        recordingSeconds: type === 'speaking' ? Number(form.get('recordingSeconds') ?? 120) : undefined,
        allowReview: type === 'speaking' ? form.get('allowReview') === 'on' : undefined,
        rubric: type === 'writing' ? WRITING_RUBRIC : type === 'speaking' ? SPEAKING_RUBRIC : type === 'mediation' ? MEDIATION_RUBRIC : undefined });
      event.currentTarget.reset(); setOpen(false); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar a questão.'); }
  };
  if (!open) return <button className="secondary-button" onClick={() => setOpen(true)}><Plus size={15} />Criar questão</button>;
  const manual = type === 'writing' || type === 'speaking' || type === 'mediation';
  return <form className="manual-question-form" onSubmit={(event) => void submit(event)}>
    <label>Tipo<select value={type} onChange={(event) => setType(event.target.value as QuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="multiple_response">Múltiplas respostas</option><option value="fill_blank">Preencher lacuna</option><option value="short_answer">Resposta curta</option><option value="true_false">Verdadeiro/falso</option><option value="matching">Associação</option><option value="ordering">Ordenação</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="speaking">Speaking</option><option value="mediation">Mediation</option></select></label>
    <label>Enunciado<input name="prompt" required /></label>
    <label>Nível CEFR<select name="cefr" defaultValue="B1">{['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+','C2'].map((level) => <option key={level}>{level}</option>)}</select></label>
    <label>Dificuldade (1–10)<input name="difficulty" type="number" min="1" max="10" defaultValue="5" required /></label>
    {framework === 'cefr' && <><label>Skill<select name="skill" defaultValue={defaultSkill.replace('speaking', 'spoken_production').replace('use_of_english', 'language_use')}><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="spoken_production">Spoken Production</option><option value="spoken_interaction">Spoken Interaction</option><option value="mediation">Mediation</option><option value="language_use">Language Use</option></select></label><label>Subskill<input name="subskill" placeholder="Ex.: inference" /></label><label>Descriptor ID<input name="descriptorId" placeholder="Ex.: LS-READ-B1-INF-01" /></label><label>Task type<input name="taskType" placeholder="Ex.: argumentative article" /></label><label>Tópico<input name="topic" placeholder="Ex.: education" /></label><label>Gênero<input name="genre" placeholder="Ex.: article" /></label><label>Status de qualidade<select name="qualityStatus" defaultValue="draft"><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option><option value="pilot">Pilot</option><option value="needs_revision">Needs revision</option><option value="retired">Retired</option></select></label><label className="wide">Descritor operacional<input name="operationalDescriptor" placeholder="Can identify writer stance…" /></label></>}
    {!manual && type !== 'true_false' && type !== 'fill_blank' && type !== 'short_answer' && <label>Opções (uma por linha){type === 'matching' && <span>Use “esquerda =&gt; direita”.</span>}<textarea name="options" required rows={4} /></label>}
    {!manual && <label>{type === 'ordering' || type === 'multiple_response' || type === 'matching' ? 'Gabarito (uma linha por item)' : 'Resposta correta'}<textarea name="answer" required rows={['ordering','multiple_response','matching'].includes(type) ? 4 : 2} /></label>}
    {type === 'listening' && <><label>Arquivo de áudio<input name="audio" type="file" accept="audio/*" required disabled={!assessmentId} /></label><label>Máximo de reproduções<input name="maxPlays" type="number" min="1" max="10" defaultValue="2" required /></label><label className="check"><input name="autoplay" type="checkbox" />Reproduzir automaticamente</label><label>Transcrição<textarea name="transcript" rows={3} /></label><label>Exibir transcrição<select name="transcriptVisibility" defaultValue="after_submit"><option value="never">Nunca ao aluno</option><option value="after_submit">Após o envio</option><option value="always">Durante a questão</option></select></label></>}
    {type === 'mediation' && <label className="wide">Material-fonte<textarea name="sourceMaterial" rows={5} required /></label>}
    {type === 'writing' && <p className="rubric-summary">Rubrica CEFR: Task Achievement, Range, Accuracy, Organisation &amp; Cohesion e Register &amp; Pragmatic Appropriacy.</p>}
    {type === 'speaking' && <><label>Preparação (segundos)<input name="preparationSeconds" type="number" min="0" max="600" defaultValue="30" /></label><label>Gravação (segundos)<input name="recordingSeconds" type="number" min="10" max="900" defaultValue="120" /></label><label className="check"><input name="allowReview" type="checkbox" />Permitir regravação final (desligado por padrão em placement)</label><p className="rubric-summary">Rubrica CEFR: Range, Grammatical Accuracy, Lexical Control, Fluency, Interaction, Coherence e Phonological Control.</p></>}
    {type === 'mediation' && <p className="rubric-summary">Rubrica CEFR: seleção e precisão da informação, reformulação, organização, adequação ao público e controle linguístico.</p>}
    {type === 'listening' && !assessmentId && <p className="assessment-message">Salve o draft para habilitar o upload.</p>}{message && <p className="assessment-message" role="alert">{message}</p>}<div><button type="button" className="cancel-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Adicionar</button></div>
  </form>;
}
