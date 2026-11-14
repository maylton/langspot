import { BookOpen, Check, Clock3, Edit3, LoaderCircle, NotebookPen, Sparkles, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { confirmAction } from '../../components/dialogs';
import { DbLesson, LearningJournalEntry, Profile, supabase } from '../../supabase';
import { EmptyPortal } from '../components/ui';

export function StudentJournal({ profile, entries, lessons, onEntriesChange, onChanged, readOnly = false }: { profile: Profile; entries: LearningJournalEntry[]; lessons: DbLesson[]; onEntriesChange: React.Dispatch<React.SetStateAction<LearningJournalEntry[]>>; onChanged: () => Promise<void>; readOnly?: boolean }) {
  const [creating, setCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LearningJournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.study_minutes, 0);
  const totalWords = entries.reduce((sum, entry) => sum + entry.new_words.length, 0);
  const moodLabel: Record<LearningJournalEntry['mood'], string> = { great: 'Excelente', good: 'Bem', neutral: 'Normal', hard: 'Difícil' };
  const lessonOptions = [...lessons].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const lessonLabel = (lesson: DbLesson) => `${new Date(lesson.starts_at).toLocaleDateString('pt-BR')} · ${lesson.topic || 'Aula sem tema'}`;

  const closeForm = () => {
    setCreating(false);
    setEditingEntry(null);
  };

  const openEdit = (entry: LearningJournalEntry) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setCreating(false);
    setEditingEntry(entry);
    setMessage('');
  };

  const saveEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (saving) return;
    if (!supabase || !profile.teacher_id) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const words = String(form.get('newWords') ?? '').split(',').map((word) => word.trim()).filter(Boolean);
    const payload = {
      lesson_id: String(form.get('lessonId') ?? '') || null,
      title: String(form.get('title') ?? '').trim(),
      content: String(form.get('content') ?? '').trim(),
      mood: String(form.get('mood') ?? 'good') as LearningJournalEntry['mood'],
      study_minutes: Number(form.get('studyMinutes') ?? 0),
      new_words: words,
    };
    setSaving(true);
    const query = editingEntry
      ? supabase.from('learning_journal_entries').update(payload).eq('id', editingEntry.id).eq('student_id', profile.id).select('*').single()
      : supabase.from('learning_journal_entries').insert({ ...payload, student_id: profile.id, teacher_id: profile.teacher_id }).select('*').single();
    const { data, error } = await query;
    if (error) setMessage(error.message);
    else if (data) {
      const savedEntry = data as LearningJournalEntry;
      onEntriesChange((current) => [savedEntry, ...current.filter((entry) => entry.id !== savedEntry.id)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      formElement.reset();
      closeForm();
      setMessage(editingEntry ? 'Registro atualizado no diário.' : 'Registro adicionado ao seu diário.');
      await onChanged();
    }
    setSaving(false);
  };

  const deleteEntry = async (entryId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !(await confirmAction({ title: 'Excluir este registro do diário?', confirmLabel: 'Sim, excluir', danger: true }))) return;
    const previousEntries = entries;
    onEntriesChange((current) => current.filter((entry) => entry.id !== entryId));
    const { error } = await supabase.from('learning_journal_entries').delete().eq('id', entryId).eq('student_id', profile.id);
    if (error) {
      onEntriesChange(previousEntries);
      setMessage(error.message);
    } else await onChanged();
  };

  return <div className="student-page student-journal-page">
    <section className="student-journal-hero"><div><p className="eyebrow">REFLEXÃO E AUTONOMIA</p><h2>Diário de aprendizagem</h2><p>Registre o que estudou, suas dificuldades, descobertas e dúvidas para a próxima aula.</p></div><button className="student-primary" onClick={() => readOnly ? setMessage('Modo de visualização: alterações estão desativadas.') : (setEditingEntry(null), setCreating((value) => !value))}><NotebookPen size={16} />Novo registro</button></section>
    <section className="student-journal-stats"><article><NotebookPen size={20} /><span>Registros</span><strong>{entries.length}</strong></article><article><Clock3 size={20} /><span>Tempo estudado</span><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min</strong></article><article><Sparkles size={20} /><span>Novas palavras</span><strong>{totalWords}</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {(creating || editingEntry) && <section className="student-panel"><form className="student-interactive-form journal-form" onSubmit={saveEntry}><label>Título<input name="title" required defaultValue={editingEntry?.title ?? ''} placeholder="Ex.: Revisão de Past Simple" /></label><label>Como foi o estudo?<select name="mood" defaultValue={editingEntry?.mood ?? 'good'}><option value="great">Excelente</option><option value="good">Bem</option><option value="neutral">Normal</option><option value="hard">Difícil</option></select></label><label className="full-field">Aula relacionada <span>(opcional)</span><select name="lessonId" defaultValue={editingEntry?.lesson_id ?? ''}><option value="">Sem aula relacionada</option>{lessonOptions.map((lesson) => <option key={lesson.id} value={lesson.id}>{lessonLabel(lesson)}</option>)}</select></label><label className="full-field">O que você estudou ou aprendeu?<textarea name="content" rows={5} required defaultValue={editingEntry?.content ?? ''} placeholder="Conte o que praticou, o que entendeu e o que ainda ficou difícil." /></label><label>Tempo de estudo (minutos)<input name="studyMinutes" type="number" min="0" max="1440" defaultValue={editingEntry?.study_minutes ?? 20} /></label><label>Novas palavras <span>(separe por vírgulas)</span><input name="newWords" defaultValue={editingEntry?.new_words.join(', ') ?? ''} placeholder="borrow, lend, save" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={saving} onClick={closeForm}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}{saving ? 'Salvando...' : editingEntry ? 'Salvar alterações' : 'Salvar registro'}</button></div></form></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2>Seus registros</h2></div></div><div className="student-journal-list">{entries.length ? entries.map((entry) => { const linkedLesson = entry.lesson_id ? lessonById.get(entry.lesson_id) : null; return <article key={entry.id}><div className="journal-entry-heading"><div><time>{new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</time><h3>{entry.title}</h3>{linkedLesson && <small className="journal-linked-lesson"><BookOpen size={13} />{lessonLabel(linkedLesson)}</small>}</div><div><span className={`journal-mood ${entry.mood}`}>{moodLabel[entry.mood]}</span><button className="icon-button" title="Editar registro" onClick={() => openEdit(entry)}><Edit3 size={15} /></button><button className="icon-button danger" title="Excluir registro" onClick={() => deleteEntry(entry.id)}><Trash2 size={15} /></button></div></div><p>{entry.content}</p><footer>{entry.study_minutes > 0 && <span><Clock3 size={13} />{entry.study_minutes} min</span>}{entry.new_words.length > 0 && <div className="journal-word-tags">{entry.new_words.map((word) => <span key={word}>{word}</span>)}</div>}</footer></article>; }) : <EmptyPortal icon={NotebookPen} title="Seu diário está vazio" text="Depois de estudar, registre o que aprendeu e as dúvidas que deseja levar à próxima aula." />}</div></section>
  </div>;
}
