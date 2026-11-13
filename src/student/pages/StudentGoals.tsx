import { CalendarDays, Check, Flag, LoaderCircle, Plus, Target, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { confirmAction } from '../../components/dialogs';
import { LearningGoal, Profile, supabase } from '../../supabase';
import { EmptyPortal } from '../components/ui';

export function StudentGoals({ profile, goals, onGoalsChange, onChanged, readOnly = false }: { profile: Profile; goals: LearningGoal[]; onGoalsChange: React.Dispatch<React.SetStateAction<LearningGoal[]>>; onChanged: () => Promise<void>; readOnly?: boolean }) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const active = goals.filter((goal) => goal.status === 'active');
  const completed = goals.filter((goal) => goal.status === 'completed');

  const createGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (saving) return;
    if (!supabase || !profile.teacher_id) return;
    setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    const { data, error } = await supabase.from('learning_goals').insert({
      student_id: profile.id,
      teacher_id: profile.teacher_id,
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim(),
      category: String(form.get('category') ?? 'Geral'),
      target_date: String(form.get('targetDate') ?? '') || null,
      progress: 0,
      status: 'active',
    }).select('*').single();
    if (error) setMessage(error.message);
    else if (data) {
      const newGoal = data as LearningGoal;
      onGoalsChange((current) => [newGoal, ...current.filter((goal) => goal.id !== newGoal.id)]);
      formElement.reset();
      setCreating(false);
      setMessage('Meta criada com sucesso.');
      await onChanged();
    }
    setSaving(false);
  };

  const updateProgress = async (goal: LearningGoal, progress: number) => {
    if (!supabase) return;
    setBusyId(goal.id);
    const normalized = Math.max(0, Math.min(100, progress));
    const nextGoal = {
      ...goal,
      progress: normalized,
      status: normalized === 100 ? 'completed' as const : 'active' as const,
      updated_at: new Date().toISOString(),
    };
    const previousGoals = goals;
    onGoalsChange((current) => current.map((item) => item.id === goal.id ? nextGoal : item));
    const { error } = await supabase.from('learning_goals').update({
      progress: nextGoal.progress,
      status: nextGoal.status,
      updated_at: nextGoal.updated_at,
    }).eq('id', goal.id).eq('student_id', profile.id);
    if (error) {
      onGoalsChange(previousGoals);
      setMessage(error.message);
    } else {
      setMessage(normalized === 100 ? 'Meta concluída.' : 'Progresso atualizado.');
      await onChanged();
    }
    setBusyId(null);
  };

  const deleteGoal = async (goalId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !(await confirmAction({ title: 'Excluir esta meta?', confirmLabel: 'Sim, excluir', danger: true }))) return;
    const previousGoals = goals;
    onGoalsChange((current) => current.filter((goal) => goal.id !== goalId));
    const { error } = await supabase.from('learning_goals').delete().eq('id', goalId).eq('student_id', profile.id);
    if (error) {
      onGoalsChange(previousGoals);
      setMessage(error.message);
    } else await onChanged();
  };

  return <div className="student-page student-goals-page">
    <section className="student-goals-hero"><div><p className="eyebrow">PLANO DE APRENDIZAGEM</p><h2>Minhas metas</h2><p>Transforme seus objetivos em pequenos passos e acompanhe cada conquista.</p></div><button className="student-primary" onClick={() => readOnly ? setMessage('Modo de visualização: alterações estão desativadas.') : setCreating((value) => !value)}><Plus size={16} />Nova meta</button></section>
    <section className="student-goal-stats"><article><Flag size={20} /><span>Em andamento</span><strong>{active.length}</strong></article><article><Check size={20} /><span>Concluídas</span><strong>{completed.length}</strong></article><article><Target size={20} /><span>Progresso médio</span><strong>{goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0}%</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {creating && <section className="student-panel"><form className="student-interactive-form" onSubmit={createGoal}><label>Título da meta<input name="title" required placeholder="Ex.: Melhorar minha conversação" /></label><label>Categoria<select name="category" defaultValue="Speaking"><option>Speaking</option><option>Listening</option><option>Reading</option><option>Writing</option><option>Grammar</option><option>Vocabulary</option><option>Geral</option></select></label><label className="full-field">Como você pretende alcançar essa meta?<textarea name="description" rows={3} placeholder="Ex.: Praticar 15 minutos três vezes por semana." /></label><label>Data-alvo <span>(opcional)</span><input name="targetDate" type="date" /></label><div className="form-actions"><button type="button" className="cancel-button" disabled={saving} onClick={() => setCreating(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{saving ? 'Criando...' : 'Criar meta'}</button></div></form></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">EM ANDAMENTO</p><h2>Objetivos atuais</h2></div></div><div className="student-goal-list">{active.length ? active.map((goal) => <article key={goal.id}><div className="goal-card-heading"><div><span>{goal.category}</span><h3>{goal.title}</h3></div><button className="icon-button danger" onClick={() => deleteGoal(goal.id)}><Trash2 size={15} /></button></div>{goal.description && <p>{goal.description}</p>}<div className="goal-progress-heading"><span>Progresso</span><strong>{goal.progress}%</strong></div><i><b style={{ width: `${goal.progress}%` }} /></i><div className="goal-progress-actions"><button disabled={busyId === goal.id || goal.progress === 0} onClick={() => updateProgress(goal, goal.progress - 10)}>−10%</button><button disabled={busyId === goal.id || goal.progress === 100} onClick={() => updateProgress(goal, goal.progress + 10)}>+10%</button><button className="goal-complete-button" disabled={busyId === goal.id} onClick={() => updateProgress(goal, 100)}><Check size={14} />Concluir</button></div>{goal.target_date && <small><CalendarDays size={13} />Data-alvo: {new Date(`${goal.target_date}T12:00:00`).toLocaleDateString('pt-BR')}</small>}</article>) : <EmptyPortal icon={Flag} title="Nenhuma meta em andamento" text="Crie uma meta pequena e específica para orientar seus estudos." />}</div></section>
    {completed.length > 0 && <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">CONQUISTAS</p><h2>Metas concluídas</h2></div></div><div className="completed-goals-list">{completed.map((goal) => <article key={goal.id}><Check size={17} /><div><strong>{goal.title}</strong><small>{goal.category} · concluída em {new Date(goal.updated_at).toLocaleDateString('pt-BR')}</small></div><button onClick={() => updateProgress(goal, 90)}>Reabrir</button></article>)}</div></section>}
  </div>;
}
