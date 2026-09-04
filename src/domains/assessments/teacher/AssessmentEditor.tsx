import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, Plus, Save, Send, Trash2 } from 'lucide-react';
import { joinOrderingAnswer, type QuestionDefinition, type QuestionType } from '../../questions';
import { validateAssessmentDraft } from '../validator';
import type { AssessmentDraft, AssessmentDraftSection, AssessmentQuestionSnapshot, AssessmentSectionSkill, CefrLevel } from '../types';
import { AssessmentPreview } from './AssessmentPreview';

export type AssessmentBankQuestion = QuestionDefinition & { bankId: string; cefr?: CefrLevel; difficulty?: number };

const newSection = (): AssessmentDraftSection => ({ id: crypto.randomUUID(), title: 'Nova seção', skill: 'grammar', instructions: '', weight: 1, drawCount: null, questions: [] });

export function AssessmentEditor({ initialDraft, bank, onBack, onSave, onPublish }: {
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
        <label>Modo<select value={draft.assessmentMode} onChange={(event) => setDraft({ ...draft, assessmentMode: event.target.value as AssessmentDraft['assessmentMode'], navigationMode: event.target.value === 'adaptive' ? 'linear' : draft.navigationMode, showResults: event.target.value === 'adaptive' ? 'after_teacher_review' : draft.showResults })}><option value="fixed">Fixo</option><option value="adaptive">Adaptativo</option></select></label>
        <label>Navegação<select value={draft.navigationMode} onChange={(event) => setDraft({ ...draft, navigationMode: event.target.value as AssessmentDraft['navigationMode'] })}><option value="free">Livre</option><option value="linear">Linear</option></select></label>
        <label>Tempo (min)<input type="number" min="1" value={draft.timeLimitMinutes ?? ''} onChange={(event) => setDraft({ ...draft, timeLimitMinutes: event.target.value ? Number(event.target.value) : null })} /></label>
        <label>Máx. tentativas<input type="number" min="1" value={draft.maxAttempts} onChange={(event) => setDraft({ ...draft, maxAttempts: Number(event.target.value) })} /></label>
        <label>Resultado<select value={draft.showResults} onChange={(event) => setDraft({ ...draft, showResults: event.target.value as AssessmentDraft['showResults'] })}><option value="none">Oculto</option><option value="score_only">Somente nota</option><option value="level_only">Somente nível</option><option value="full_report">Relatório completo</option><option value="after_teacher_review">Após revisão</option></select></label>
        <label className="check"><input type="checkbox" checked={draft.randomizeQuestions} onChange={(event) => setDraft({ ...draft, randomizeQuestions: event.target.checked })} />Randomizar questões</label>
        <label className="check"><input type="checkbox" checked={draft.randomizeOptions} onChange={(event) => setDraft({ ...draft, randomizeOptions: event.target.checked })} />Randomizar alternativas</label>
        {draft.assessmentMode === 'adaptive' ? <><label>Ability inicial (1–10)<input type="number" min="1" max="10" step="0.5" value={draft.adaptiveInitialAbility} onChange={(event) => setDraft({ ...draft, adaptiveInitialAbility: Number(event.target.value) })} /></label><label>Mínimo por skill<input type="number" min="1" value={draft.adaptiveMinItems} onChange={(event) => setDraft({ ...draft, adaptiveMinItems: Number(event.target.value) })} /></label><label>Máximo por skill<input type="number" min={draft.adaptiveMinItems} value={draft.adaptiveMaxItems} onChange={(event) => setDraft({ ...draft, adaptiveMaxItems: Number(event.target.value) })} /></label><label>Confiança para encerrar<input type="number" min="0.1" max="0.95" step="0.05" value={draft.adaptiveConfidenceThreshold} onChange={(event) => setDraft({ ...draft, adaptiveConfidenceThreshold: Number(event.target.value) })} /></label></> : null}
      </section>
      <div className="assessment-section-list">{draft.sections.map((section, index) => <section className="assessment-section-editor" key={section.id}>
        <div className="assessment-section-heading"><strong>Seção {index + 1}</strong><button className="icon-button danger" aria-label="Excluir seção" onClick={() => removeSection(section.id)}><Trash2 size={16} /></button></div>
        <div className="assessment-section-fields"><label>Título<input value={section.title} onChange={(event) => changeSection(section.id, { title: event.target.value })} /></label><label>Skill<select value={section.skill} onChange={(event) => changeSection(section.id, { skill: event.target.value as AssessmentSectionSkill })}><option value="grammar">Grammar</option><option value="vocabulary">Vocabulary</option><option value="reading">Reading</option><option value="use_of_english">Use of English</option></select></label><label>Questões do pool<input type="number" min="1" max={section.questions.length || undefined} value={section.drawCount ?? ''} placeholder="Todas" onChange={(event) => changeSection(section.id, { drawCount: event.target.value ? Number(event.target.value) : null })} /></label><label className="wide">Instruções<input value={section.instructions} onChange={(event) => changeSection(section.id, { instructions: event.target.value })} /></label></div>
        <div className="assessment-question-list">{section.questions.map((question, questionIndex) => <article key={question.id}><span>{questionIndex + 1}</span><div><strong>{question.snapshot.prompt}</strong><small>{question.snapshot.type.replace(/_/g, ' ')}</small></div><button className="icon-button danger" aria-label="Remover questão" onClick={() => removeQuestion(section.id, question.id)}><Trash2 size={15} /></button></article>)}</div>
        <div className="assessment-question-actions"><label>Adicionar do banco<select defaultValue="" onChange={(event) => { addBankQuestion(section.id, event.target.value); event.target.value = ''; }}><option value="" disabled>Escolha uma questão</option>{bank.map((question) => <option key={question.bankId} value={question.bankId}>{question.prompt}</option>)}</select></label><ManualQuestionForm onAdd={(question) => addManualQuestion(section.id, question)} /></div>
      </section>)}</div>
      <button className="secondary-button assessment-add-section" onClick={() => setDraft((current) => ({ ...current, sections: [...current.sections, newSection()] }))}><Plus size={16} />Adicionar seção</button>
    </>}
  </div>;
}

function ManualQuestionForm({ onAdd }: { onAdd: (question: AssessmentQuestionSnapshot) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const prompt = String(form.get('prompt')).trim();
    let options = String(form.get('options') ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
    if (type === 'true_false') options = ['True', 'False'];
    let answer = String(form.get('answer')).trim();
    if (type === 'ordering') answer = joinOrderingAnswer(answer.split('\n').map((item) => item.trim()).filter(Boolean));
    const cefr = String(form.get('cefr') ?? 'B1') as CefrLevel;
    const difficulty = Number(form.get('difficulty') ?? 5);
    onAdd({ id: crypto.randomUUID(), type, prompt, options, answer, cefr, difficulty });
    event.currentTarget.reset(); setOpen(false);
  };
  if (!open) return <button className="secondary-button" onClick={() => setOpen(true)}><Plus size={15} />Criar questão</button>;
  return <form className="manual-question-form" onSubmit={submit}><label>Tipo<select value={type} onChange={(event) => setType(event.target.value as QuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="fill_blank">Preencher lacuna</option><option value="true_false">Verdadeiro/falso</option><option value="ordering">Ordenação</option></select></label><label>Enunciado<input name="prompt" required /></label><label>Nível CEFR<select name="cefr" defaultValue="B1"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label><label>Dificuldade (1–10)<input name="difficulty" type="number" min="1" max="10" defaultValue="5" required /></label>{type !== 'true_false' && type !== 'fill_blank' && <label>Opções (uma por linha)<textarea name="options" required rows={4} /></label>}<label>{type === 'ordering' ? 'Ordem correta (uma por linha)' : 'Resposta correta'}<textarea name="answer" required rows={type === 'ordering' ? 4 : 2} /></label><div><button type="button" className="cancel-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Adicionar</button></div></form>;
}
