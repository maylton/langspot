import { Check, ClipboardList, Edit3, ExternalLink, FileQuestion, FileText, LoaderCircle, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { FormEvent, type SyntheticEvent, useState } from 'react';
import { showAlert } from '../../components/dialogs';
import { toDateInput } from '../../lib/dates';
import { supabase } from '../../supabase';
import { AnnotatedSubmissionText } from '../../components/TextComments';
import { Modal } from '../../components/ui';
import { functionInvokeErrorMessage } from '../../lib/errors';
import { buildInteractiveContent, questionBankLevels, questionTypeLabel } from '../../lib/quiz';
import { type Assignment, type AssignmentFormMode, type AssignmentInput, type Id, type InteractiveQuestion, type InteractiveQuestionType, type Material, type QuestionBankItem, type QuestionBankLevel, type Student, type TextComment } from '../../types';

export function AssignmentModal({ students, materials, questionBank, mode, onClose, onSave }: { students: Student[]; materials: Material[]; questionBank: QuestionBankItem[]; mode: AssignmentFormMode; onClose: () => void; onSave: (input: AssignmentInput) => void }) {
  const [assignmentType] = useState<'regular' | 'interactive'>(mode === 'interactive' ? 'interactive' : 'regular');
  const [questionCount, setQuestionCount] = useState(1);
  const [questionTypes, setQuestionTypes] = useState<Record<number, InteractiveQuestionType>>({});
  const [bankLevel, setBankLevel] = useState<QuestionBankLevel>('A1');
  const [autoQuestionCount, setAutoQuestionCount] = useState(5);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<QuestionBankItem[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<InteractiveQuestion[]>([]);
  const typeFor = (index: number) => questionTypes[index] ?? 'multiple_choice';
  const changeQuestionType = (index: number, type: InteractiveQuestionType) => setQuestionTypes((current) => ({ ...current, [index]: type }));
  const bankQuestions = questionBank.filter((question) => question.level === bankLevel && question.category === 'Grammar');
  const addBankQuestion = (question: QuestionBankItem) => setSelectedBankQuestions((current) => current.some((item) => item.id === question.id) ? current : [...current, question]);
  const removeBankQuestion = (id: Id) => setSelectedBankQuestions((current) => current.filter((item) => item.id !== id));
  const removeAiQuestion = (id: Id) => setAiQuestions((current) => current.filter((item) => item.id !== id));
  const buildAutomaticQuiz = () => {
    if (!bankQuestions.length) { void showAlert(`Nenhuma questão Grammar cadastrada para ${bankLevel}.`); return; }
    const count = Math.max(1, Math.min(autoQuestionCount, bankQuestions.length));
    const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5);
    setSelectedBankQuestions(shuffled.slice(0, count));
  };
  const generateAiQuestions = async () => {
    if (!supabase) { void showAlert('Configure o Supabase para usar a geração com IA.'); return; }
    const topic = aiTopic.trim();
    if (!topic) { void showAlert('Informe um tema para a IA gerar as questões.'); return; }
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', { body: { topic, level: bankLevel, count: aiQuestionCount, category: 'Grammar' } });
      if (error) throw new Error(await functionInvokeErrorMessage(error, data));
      const questions = ((data as { questions?: InteractiveQuestion[] } | null)?.questions ?? []).map((question) => ({ ...question, id: question.id || crypto.randomUUID() }));
      if (!questions.length) throw new Error('A IA não retornou questões válidas.');
      setAiQuestions((current) => [...current, ...questions]);
    } catch (error) {
      void showAlert(error instanceof Error ? error.message : 'Não foi possível gerar questões com IA.');
    } finally {
      setAiBusy(false);
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interactiveContent = assignmentType === 'interactive' ? buildInteractiveContent(form, questionCount, selectedBankQuestions, aiQuestions) : null;
    if (assignmentType === 'interactive' && !(interactiveContent?.questions.length)) { void showAlert('Adicione pelo menos uma pergunta com enunciado e gabarito.'); return; }
    onSave({ studentId: String(form.get('studentId')), materialId: String(form.get('materialId') || '') || undefined, title: String(form.get('title')), instructions: String(form.get('instructions')), dueDate: String(form.get('dueDate')), assignmentType, interactiveContent });
  };
  return <Modal title={mode === 'interactive' ? 'Novo quiz' : 'Nova tarefa'} onClose={onClose}><form className="form-grid" onSubmit={submit}>
    <label>Aluno<select name="studentId" required defaultValue=""><option value="" disabled>Selecione</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label>Prazo<input name="dueDate" type="date" required min={toDateInput(new Date())} /></label>
    <label className="full-field">Título<input name="title" required placeholder={mode === 'interactive' ? 'Ex.: Present Perfect Quiz' : 'Ex.: Writing Practice'} /></label>
    <label className="full-field">Material vinculado <span>(opcional)</span><select name="materialId"><option value="">Nenhum</option>{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label>
    <label className="full-field">Instruções<textarea name="instructions" rows={4} required placeholder={assignmentType === 'interactive' ? 'Ex.: Responda as questões abaixo.' : 'Explique o que o aluno deve fazer e como entregar.'} /></label>
    {assignmentType === 'interactive' && <div className="interactive-builder full-field"><div><strong>Configurações do quiz</strong><span>Defina tentativas e quando o aluno verá o gabarito.</span></div><div className="interactive-options-grid"><label>Tentativas permitidas<select name="interactiveMaxAttempts" defaultValue="1"><option value="1">1 tentativa</option><option value="2">2 tentativas</option><option value="3">3 tentativas</option><option value="0">Ilimitadas</option></select></label><label>Mostrar gabarito<select name="interactiveRevealAnswers" defaultValue="after_each"><option value="after_each">Depois de cada envio</option><option value="after_last">Apenas na última tentativa</option></select></label></div>
      <section className="ai-quiz-generator"><div><strong>Gerar com IA</strong><span>Crie um rascunho de questões de Grammar por tema e nível. Revise antes de enviar ao aluno.</span></div><div className="ai-quiz-controls"><label>Tema<input value={aiTopic} onChange={(event) => setAiTopic(event.target.value)} placeholder="Ex.: Present perfect with travel experiences" /></label><label>Quantidade<input type="number" min="1" max="20" value={aiQuestionCount} onChange={(event) => setAiQuestionCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} /></label><button type="button" className="primary-button" disabled={aiBusy} onClick={generateAiQuestions}>{aiBusy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}{aiBusy ? 'Gerando...' : 'Gerar questões'}</button></div>{aiQuestions.length > 0 && <div className="quiz-bank-selected ai-generated-list"><strong>Questões geradas com IA</strong>{aiQuestions.map((question) => <span key={question.id}>IA · {questionTypeLabel(question.type)} · {question.prompt}<button type="button" onClick={() => removeAiQuestion(question.id)}><X size={12} /></button></span>)}</div>}</section>
      <section className="quiz-bank-picker"><div><strong>Banco de questões</strong><span>Use questões salvas por nível. Categoria disponível agora: Grammar.</span></div><div className="quiz-bank-toolbar"><label>Nível<select value={bankLevel} onChange={(event) => setBankLevel(event.target.value as QuestionBankLevel)}>{questionBankLevels.map((level) => <option key={level}>{level}</option>)}</select></label><label>Categoria<select value="Grammar" disabled><option>Grammar</option></select></label><span>{selectedBankQuestions.length} selecionada(s)</span></div><div className="quiz-auto-builder"><div><strong>Montagem automática</strong><small>Escolha a quantidade e deixe a plataforma sortear questões deste nível.</small></div><label>Quantidade<input type="number" min="1" value={autoQuestionCount} onChange={(event) => setAutoQuestionCount(Number(event.target.value) || 1)} /></label><button type="button" className="primary-button" onClick={buildAutomaticQuiz}><Sparkles size={15} />Montar quiz</button></div>{bankQuestions.length ? <div className="quiz-bank-list">{bankQuestions.slice(0, 8).map((question) => { const selected = selectedBankQuestions.some((item) => item.id === question.id); return <article key={question.id}><div><small>{question.level} · {question.category} · {questionTypeLabel(question.type)}</small><strong>{question.prompt}</strong></div><button type="button" disabled={selected} onClick={() => addBankQuestion(question)}>{selected ? <Check size={14} /> : <Plus size={14} />}{selected ? 'Adicionada' : 'Adicionar'}</button></article>; })}</div> : <p className="quiz-bank-empty">Nenhuma questão Grammar cadastrada para {bankLevel} ainda.</p>}{selectedBankQuestions.length > 0 && <div className="quiz-bank-selected"><strong>Questões adicionadas ao quiz</strong>{selectedBankQuestions.map((question) => <span key={question.id}>{question.level} · {question.prompt}<button type="button" onClick={() => removeBankQuestion(question.id)}><X size={12} /></button></span>)}</div>}</section>
      <section className="manual-questions-heading"><div><FileQuestion size={18} /><div><strong>Questões manuais</strong><span>Adicione perguntas específicas para este quiz ou combine com as questões do banco.</span></div></div><em>{questionCount} questão(ões)</em></section>{Array.from({ length: questionCount }).map((_, index) => {
      const currentType = typeFor(index);
      return <fieldset key={index}><legend>Questão {index + 1}</legend>
        <label>Tipo da pergunta<select name={`question-${index}-type`} value={currentType} onChange={(event) => changeQuestionType(index, event.target.value as InteractiveQuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="fill_blank">Complete a frase</option><option value="true_false">Verdadeiro ou falso</option><option value="ordering">Ordenar palavras/frases</option></select></label>
        <label>Enunciado<input name={`question-${index}`} placeholder={currentType === 'ordering' ? 'Ex.: Ordene as palavras para formar uma frase.' : 'Ex.: I ___ never been to Canada.'} /></label>
        {currentType === 'multiple_choice' && <><div className="interactive-options-grid">{['A', 'B', 'C', 'D'].map((option) => <label key={option}>Alternativa {option}<input name={`question-${index}-option-${option}`} placeholder={option === 'A' ? 'have' : option === 'B' ? 'did' : ''} /></label>)}</div><label>Gabarito<select name={`question-${index}-answer`} defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></label></>}
        {currentType === 'true_false' && <label>Gabarito<select name={`question-${index}-answer`} defaultValue="Verdadeiro"><option>Verdadeiro</option><option>Falso</option></select></label>}
        {currentType === 'fill_blank' && <label className="full-field">Resposta correta <span>Digite a palavra ou expressão esperada.</span><input name={`question-${index}-text-answer`} placeholder="Ex.: have" /></label>}
        {currentType === 'ordering' && <label className="full-field">Ordem correta <span>Separe palavras, trechos ou pontuações por /.</span><input name={`question-${index}-text-answer`} placeholder="Ex.: If / I / study, / I / will / pass" /></label>}
        <label>Explicação <span>(opcional)</span><input name={`question-${index}-explanation`} placeholder="Ex.: Usamos present perfect para experiências de vida." /></label>
      </fieldset>;
    })}<button type="button" className="secondary-button compact" onClick={() => setQuestionCount((count) => Math.min(8, count + 1))}><Plus size={15} />Adicionar questão manual</button></div>}
    <div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button">{mode === 'interactive' ? <FileQuestion size={16} /> : <ClipboardList size={16} />}{mode === 'interactive' ? 'Criar quiz' : 'Criar tarefa'}</button></div>
  </form></Modal>;
}

export function ReviewAssignmentModal({ assignment, onClose, onSave }: { assignment: Assignment; onClose: () => void; onSave: (feedback: string, grade?: number, textComments?: TextComment[]) => void }) {
  const [comments, setComments] = useState<TextComment[]>(assignment.textComments ?? []);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<Id | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<Id | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const submissionText = assignment.submissionText ?? '';
  const captureSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    setSelection(end > start ? { start, end, text: submissionText.slice(start, end) } : null);
  };
  const addComment = () => {
    if (!selection || !commentDraft.trim()) return;
    const created = { id: crypto.randomUUID(), ...selection, comment: commentDraft.trim(), createdAt: new Date().toISOString() };
    setComments((current) => [...current, created].sort((a, b) => a.start - b.start));
    setActiveCommentId(created.id);
    setCommentDraft('');
    setSelection(null);
  };
  const startEditComment = (comment: TextComment) => {
    setEditingCommentId(comment.id);
    setEditingDraft(comment.comment);
    setActiveCommentId(comment.id);
  };
  const saveEditedComment = () => {
    if (!editingCommentId || !editingDraft.trim()) return;
    setComments((current) => current.map((comment) => comment.id === editingCommentId ? { ...comment, comment: editingDraft.trim() } : comment));
    setEditingCommentId(null);
    setEditingDraft('');
  };
  const removeComment = (id: Id) => {
    setComments((current) => current.filter((item) => item.id !== id));
    if (activeCommentId === id) setActiveCommentId(null);
    if (editingCommentId === id) { setEditingCommentId(null); setEditingDraft(''); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const raw = String(form.get('grade') || ''); onSave(String(form.get('feedback')), raw ? Number(raw) : undefined, comments); };
  return <Modal title="Corrigir tarefa" onClose={onClose} className="review-assignment-modal"><div className="submission-preview"><strong>Resposta do aluno</strong>{submissionText ? <><textarea className="review-selection-text" readOnly value={submissionText} rows={8} onSelect={captureSelection} onMouseUp={captureSelection} onKeyUp={captureSelection} /><AnnotatedSubmissionText text={submissionText} comments={comments} activeId={activeCommentId} onActivate={setActiveCommentId} /><small>Selecione uma parte do texto para comentar. Clique nos destaques para localizar comentários.</small></> : <p>Nenhuma resposta em texto.</p>}{assignment.submissionFileUrl && <a className="submission-file-link" href={assignment.submissionFileUrl} target="_blank" rel="noreferrer"><FileText size={15} />{assignment.submissionFileName || 'Arquivo anexado'}<ExternalLink size={13} /></a>}</div>{submissionText && <div className="inline-comment-composer"><div><strong>{selection ? 'Trecho selecionado' : 'Nenhum trecho selecionado'}</strong><p>{selection?.text ?? 'Selecione uma palavra, frase ou parágrafo na resposta acima.'}</p></div><textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} placeholder="Comentário para este trecho..." /><button type="button" className="secondary-button compact" disabled={!selection || !commentDraft.trim()} onClick={addComment}><Plus size={15} />Adicionar comentário</button></div>}<div className="text-comments-list editable"><strong>Comentários adicionados</strong>{comments.length ? comments.map((comment, index) => <article key={comment.id} className={activeCommentId === comment.id ? 'active' : ''} onClick={() => setActiveCommentId(comment.id)}><span>{index + 1}</span><div><q>{comment.text}</q>{editingCommentId === comment.id ? <textarea value={editingDraft} onChange={(event) => setEditingDraft(event.target.value)} rows={3} onClick={(event) => event.stopPropagation()} /> : <p>{comment.comment}</p>}</div>{editingCommentId === comment.id ? <div className="inline-comment-actions"><button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); saveEditedComment(); }}><Check size={14} /></button><button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); setEditingCommentId(null); setEditingDraft(''); }}><X size={14} /></button></div> : <div className="inline-comment-actions"><button type="button" className="icon-button" onClick={(event) => { event.stopPropagation(); startEditComment(comment); }}><Edit3 size={14} /></button><button type="button" className="icon-button danger" onClick={(event) => { event.stopPropagation(); removeComment(comment.id); }}><Trash2 size={14} /></button></div>}</article>) : <p className="empty-inline-comments">Nenhum comentário por trecho ainda.</p>}</div><form className="form-grid" onSubmit={submit}><label className="full-field">Feedback geral<textarea name="feedback" rows={5} required defaultValue={assignment.feedback ?? ''} /></label><label>Nota <span>(opcional)</span><input name="grade" type="number" min="0" max="100" defaultValue={assignment.grade ?? ''} /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button"><Check size={16} />Salvar correção</button></div></form></Modal>;
}

export function ConfirmAssignmentDelete({ assignment, onClose, onConfirm }: { assignment: Assignment; onClose: () => void; onConfirm: () => void }) { return <Modal title="Excluir tarefa" onClose={onClose}><p>Deseja excluir <strong>{assignment.title}</strong>? A entrega e o feedback também serão removidos.</p><div className="form-actions"><button className="cancel-button" onClick={onClose}>Voltar</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir</button></div></Modal>; }
