import { Check, Clock3, FileQuestion, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { showAlert } from '../../components/dialogs';
import { Modal } from '../../components/ui';
import { displayQuestionAnswer, formatOrderingAnswer, questionBankLevels, questionTypeLabel, splitOrderingSource } from '../../lib/quiz';
import { type Assignment, type Id, type InteractiveQuestionType, type QuestionBankCategory, type QuestionBankInput, type QuestionBankItem, type QuestionBankLevel } from '../../types';

export function QuizPreviewModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const content = assignment.interactiveContent;
  const questions = content?.questions ?? [];
  const maxAttempts = content?.settings?.maxAttempts ?? 1;
  const reveal = content?.settings?.revealAnswers === 'after_last' ? 'Apenas na última tentativa' : 'Depois de cada envio';
  return <Modal title="Pré-visualizar quiz" onClose={onClose} className="quiz-preview-modal"><div className="quiz-preview">
    <section className="quiz-preview-hero"><div><p className="eyebrow">VISÃO DO ALUNO</p><h3>{assignment.title}</h3><p>{assignment.instructions || 'Sem instruções adicionais.'}</p></div><div><span>{questions.length}</span><small>questão(ões)</small></div></section>
    <div className="quiz-preview-settings"><span>Tentativas: <b>{maxAttempts ? maxAttempts : 'Ilimitadas'}</b></span><span>Gabarito: <b>{reveal}</b></span></div>
    {questions.length ? <div className="quiz-preview-question-list">{questions.map((question, index) => <article key={question.id}><div><span>Questão {index + 1}</span><strong>{question.prompt}</strong><small>{questionTypeLabel(question.type)}</small></div>{question.type === 'fill_blank' ? <div className="quiz-preview-answer-line">Campo de resposta curta</div> : question.type === 'ordering' ? <div className="ordering-drag-list preview">{question.options.map((option, optionIndex) => <button type="button" key={`${option}-${optionIndex}`}>{option}</button>)}</div> : <div className="quiz-preview-options">{question.options.map((option) => <label key={option}><input type="radio" disabled />{option}</label>)}</div>}<footer><span>Gabarito: <b>{displayQuestionAnswer(question)}</b></span>{question.explanation && <p>{question.explanation}</p>}</footer></article>)}</div> : <div className="empty-state small"><FileQuestion size={30} /><h3>Quiz sem questões</h3><p>Adicione questões antes de enviar para o aluno.</p></div>}
    <div className="form-actions"><button className="primary-button" onClick={onClose}><Check size={16} />Concluir prévia</button></div>
  </div></Modal>;
}

export function QuestionBankModal({ questions, onClose, onCreate, onDelete }: { questions: QuestionBankItem[]; onClose: () => void; onCreate: (input: QuestionBankInput) => Promise<void> | void; onDelete: (id: Id) => Promise<void> | void }) {
  const [level, setLevel] = useState<QuestionBankLevel>('A1');
  const [category, setCategory] = useState<QuestionBankCategory>('Grammar');
  const [type, setType] = useState<InteractiveQuestionType>('multiple_choice');
  const [saving, setSaving] = useState(false);
  const visible = questions.filter((question) => question.level === level && question.category === category);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const prompt = String(form.get('prompt') || '').trim();
    const explanation = String(form.get('explanation') || '').trim() || undefined;
    const optionLabels = ['A', 'B', 'C', 'D'];
    const options = type === 'multiple_choice'
      ? optionLabels.map((label) => String(form.get(`option-${label}`) || '').trim()).filter(Boolean)
      : type === 'true_false'
        ? ['Verdadeiro', 'Falso']
        : type === 'ordering'
          ? splitOrderingSource(String(form.get('textAnswer') || ''))
          : [];
    const answer = type === 'multiple_choice'
      ? options[optionLabels.indexOf(String(form.get('answer') || 'A'))] ?? ''
      : type === 'true_false'
        ? String(form.get('answer') || 'Verdadeiro')
        : type === 'ordering'
          ? formatOrderingAnswer(options)
          : String(form.get('textAnswer') || '').trim();
    if (!prompt || !answer || (type === 'multiple_choice' && options.length < 2) || (type === 'ordering' && options.length < 2)) {
      void showAlert('Preencha o enunciado, o gabarito e as alternativas necessárias.');
      return;
    }
    setSaving(true);
    await onCreate({ level, category, type, prompt, options, answer, explanation, skill: String(form.get('skill') || '') as QuestionBankItem['skill'] || undefined, subskill: String(form.get('subskill') || '').trim() || undefined, difficulty: Number(form.get('difficulty') || 5), taskType: String(form.get('taskType') || '').trim() || undefined, topic: String(form.get('topic') || '').trim() || undefined, genre: String(form.get('genre') || '').trim() || undefined, operationalDescriptor: String(form.get('operationalDescriptor') || '').trim() || undefined, qualityStatus: String(form.get('qualityStatus') || 'draft') as QuestionBankItem['qualityStatus'], restricted: form.get('restricted') === 'on', usageCount: 0 });
    formElement.reset();
    setSaving(false);
  };
  return <Modal title="Banco de questões" onClose={onClose} className="question-bank-shell"><div className="question-bank-modal">
    <section className="question-bank-create"><div><p className="eyebrow">{category.toUpperCase()}</p><h3>Nova questão</h3><p>Cadastre itens reutilizáveis com metadados pedagógicos e controle de qualidade.</p></div><form className="form-grid" onSubmit={submit}>
      <label>Nível<select value={level} onChange={(event) => setLevel(event.target.value as QuestionBankLevel)}>{questionBankLevels.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value as QuestionBankCategory)}>{['Grammar','Vocabulary','Reading','Listening','Writing','Speaking','Mediation','Language Use'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Tipo<select value={type} onChange={(event) => setType(event.target.value as InteractiveQuestionType)}><option value="multiple_choice">Múltipla escolha</option><option value="fill_blank">Complete a frase</option><option value="true_false">Verdadeiro ou falso</option><option value="ordering">Ordenar palavras/frases</option></select></label>
      <label className="full-field">Enunciado<input name="prompt" required placeholder={type === 'ordering' ? 'Ex.: Ordene as palavras para formar uma frase.' : 'Ex.: I ____ to Canada.'} /></label>
      {type === 'multiple_choice' && <><div className="interactive-options-grid full-field">{['A', 'B', 'C', 'D'].map((option) => <label key={option}>Alternativa {option}<input name={`option-${option}`} placeholder={option === 'A' ? 'have been' : option === 'B' ? 'has been' : ''} /></label>)}</div><label>Gabarito<select name="answer" defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></label></>}
      {type === 'true_false' && <label>Gabarito<select name="answer" defaultValue="Verdadeiro"><option>Verdadeiro</option><option>Falso</option></select></label>}
      {(type === 'fill_blank' || type === 'ordering') && <label className="full-field">{type === 'ordering' ? 'Ordem correta' : 'Resposta correta'}<span>{type === 'ordering' ? 'Separe palavras, trechos ou pontuações por /.' : 'Digite a palavra ou expressão esperada.'}</span><input name="textAnswer" required placeholder={type === 'ordering' ? 'Ex.: If / I / study, / I / will / pass' : 'Ex.: have been'} /></label>}
      <label className="full-field">Explicação <span>(opcional)</span><input name="explanation" placeholder="Ex.: Usamos present perfect para experiências de vida." /></label>
      <label>Skill<select name="skill" defaultValue="language_use"><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option><option value="spoken_production">Spoken Production</option><option value="spoken_interaction">Spoken Interaction</option><option value="mediation">Mediation</option><option value="language_use">Language Use</option></select></label><label>Subskill<input name="subskill" placeholder="Ex.: inference" /></label><label>Dificuldade<input name="difficulty" type="number" min="1" max="10" defaultValue="5" /></label><label>Task type<input name="taskType" placeholder="Ex.: contextual item" /></label><label>Tópico<input name="topic" /></label><label>Gênero<input name="genre" /></label><label>Status<select name="qualityStatus" defaultValue="draft"><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved_for_pilot">Approved for pilot</option><option value="pilot_data_collected">Pilot data collected</option><option value="item_analysis">Item analysis</option><option value="approved">Approved</option><option value="needs_revision">Needs revision</option><option value="retired">Retired</option></select></label><label className="check"><input name="restricted" type="checkbox" />Item restrito</label><label className="full-field">Descritor operacional<input name="operationalDescriptor" /></label>
      <div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Fechar</button><button className="primary-button" disabled={saving}>{saving ? <Clock3 size={16} /> : <Plus size={16} />}{saving ? 'Salvando...' : 'Salvar questão'}</button></div>
    </form></section>
    <section className="question-bank-library"><div className="question-bank-library-heading"><div><p className="eyebrow">{level} · {category.toUpperCase()}</p><h3>Questões cadastradas</h3></div><span>{visible.length}</span></div>{visible.length ? <div className="question-bank-items">{visible.map((question) => <article key={question.id}><div><small>{question.externalId ? `${question.externalId} · ` : ''}{questionTypeLabel(question.type)} · {question.skill ?? 'sem skill'} · {question.subskill ?? 'sem subskill'} · {question.qualityStatus ?? 'draft'} · uso {question.usageCount ?? 0}</small><strong>{question.prompt}</strong><p>{question.answer ? `Gabarito: ${displayQuestionAnswer(question)}` : 'Correção por rubrica'}</p></div>{question.sourceOrigin !== 'cefr_pilot' && <button type="button" className="icon-button danger" onClick={() => onDelete(question.id)}><Trash2 size={15} /></button>}</article>)}</div> : <div className="empty-state small"><FileQuestion size={30} /><h3>Nenhuma questão em {level}</h3><p>Crie o primeiro item de {category} para este nível.</p></div>}</section>
  </div></Modal>;
}
