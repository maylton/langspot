import { Award, Brain, CalendarDays, Check, ClipboardList, Flame, NotebookPen, Sparkles, Target } from 'lucide-react';
import { StreakFreeze, StudyActivity } from '../../supabase';
import { type AchievementDefinition, calculateStreak, streakMilestones } from '../streaks';
import { toDateInput } from '../../lib/dates';

export function StudentAchievements({ studyActivities, streakFreezes }: { studyActivities: StudyActivity[]; streakFreezes: StreakFreeze[] }) {
  const streak = calculateStreak([...studyActivities.map((activity) => activity.activity_date), ...streakFreezes.map((freeze) => freeze.protected_date)]);
  const activityCount = (type: StudyActivity['activity_type']) => studyActivities.filter((activity) => activity.activity_type === type).length;
  const uniqueActivityTypes = new Set(studyActivities.map((activity) => activity.activity_type));
  const currentMonthKey = toDateInput(new Date()).slice(0, 7);
  const lessonMonthKeys = studyActivities.filter((activity) => activity.activity_type === 'lesson').map((activity) => activity.activity_date.slice(0, 7));
  const monthKeys = [...new Set([currentMonthKey, ...lessonMonthKeys])].sort().reverse();
  const monthlyAchievements: AchievementDefinition[] = monthKeys.map((monthKey) => {
    const monthDate = new Date(`${monthKey}-02T12:00:00`);
    const title = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (letter) => letter.toUpperCase());
    const monthlyLessons = studyActivities.filter((activity) => activity.activity_type === 'lesson' && activity.activity_date.startsWith(monthKey)).length;
    return { id: `month-${monthKey}`, category: 'Mensal', title, description: `Assista pelo menos 4 aulas em ${title}.`, target: 4, current: monthlyLessons, icon: CalendarDays };
  });
  const achievements: AchievementDefinition[] = [
    ...streakMilestones.map((milestone) => ({ id: `streak-${milestone.days}`, category: 'Sequência', title: milestone.title, description: `Alcance ${milestone.days} dias de estudo consistente.`, target: milestone.days, current: streak.best, icon: Flame })),
    { id: 'first-action', category: 'Começo', title: 'Primeira missão', description: 'Complete sua primeira atividade real de estudo.', target: 1, current: studyActivities.length, icon: Sparkles },
    { id: 'journal-1', category: 'Diário', title: 'Primeiro registro', description: 'Escreva sua primeira entrada no diário de aprendizagem.', target: 1, current: activityCount('journal'), icon: NotebookPen },
    { id: 'journal-5', category: 'Diário', title: 'Reflexão constante', description: 'Registre 5 momentos de estudo no diário.', target: 5, current: activityCount('journal'), icon: NotebookPen },
    { id: 'flashcard-10', category: 'Flashcards', title: 'Memória ativa', description: 'Revise 10 cartões nos seus baralhos.', target: 10, current: activityCount('flashcard'), icon: Brain },
    { id: 'assignment-3', category: 'Tarefas', title: 'Entrega em dia', description: 'Envie 3 tarefas para correção.', target: 3, current: activityCount('assignment'), icon: ClipboardList },
    { id: 'goal-3', category: 'Metas', title: 'Meta em movimento', description: 'Avance ou conclua metas em 3 momentos diferentes.', target: 3, current: activityCount('goal'), icon: Target },
    { id: 'lesson-5', category: 'Aulas', title: 'Presença firme', description: 'Participe de 5 aulas concluídas.', target: 5, current: activityCount('lesson'), icon: CalendarDays },
    { id: 'all-rounder', category: 'Exploração', title: 'Estudante completo', description: 'Use diário, flashcards, tarefas, metas e aulas pelo menos uma vez.', target: 5, current: uniqueActivityTypes.size, icon: Award },
  ];
  const allAchievements = [...monthlyAchievements, ...achievements];
  const unlocked = allAchievements.filter((achievement) => achievement.current >= achievement.target).length;
  const next = allAchievements.find((achievement) => achievement.current < achievement.target);
  const progress = next ? Math.min(100, Math.round((next.current / next.target) * 100)) : 100;
  return <div className="student-page student-achievements-page">
    <section className="student-achievements-hero"><div><p className="eyebrow">SUA CONSTÂNCIA</p><h2>Conquistas</h2><p>Marcos desbloqueados por sequência, revisões, diário, tarefas, metas, aulas e meses concluídos.</p></div><span><Award size={27} /><strong>{unlocked}/{allAchievements.length}</strong><small>desbloqueadas</small></span></section>
    <section className="student-achievement-summary"><article><Flame size={20} /><span>Sequência atual</span><strong>{streak.current} dia(s)</strong></article><article><Award size={20} /><span>Conquistas</span><strong>{unlocked}</strong></article><article><Target size={20} /><span>Próximo marco</span><strong>{next ? next.title : 'Todos alcançados'}</strong></article></section>
    {next && <section className="student-panel achievement-next-card"><div><span>PRÓXIMA CONQUISTA</span><h2>{next.title}</h2><p>Faltam {Math.max(0, next.target - next.current)} passo(s) para desbloquear este marco.</p></div><strong>{progress}%</strong><i><b style={{ width: `${progress}%` }} /></i></section>}
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">MENSAL</p><h2>Conquistas por mês</h2></div></div><div className="achievement-collection">{monthlyAchievements.map((achievement) => { const achieved = achievement.current >= achievement.target; const Icon = achievement.icon; return <article className={achieved ? 'unlocked' : ''} key={achievement.id}><span><Icon size={24} /></span><div><small>{achievement.category.toUpperCase()} · {Math.min(achievement.current, achievement.target)}/{achievement.target}</small><h3>{achievement.title}</h3><p>{achieved ? 'Conquista mensal desbloqueada pelo seu histórico de aulas.' : achievement.description}</p></div>{achieved ? <b><Check size={14} />Desbloqueada</b> : <b>Em andamento</b>}</article>; })}</div></section>
    <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">COLEÇÃO</p><h2>Marcos de estudo</h2></div></div><div className="achievement-collection">{achievements.map((achievement) => { const achieved = achievement.current >= achievement.target; const Icon = achievement.icon; return <article className={achieved ? 'unlocked' : ''} key={achievement.id}><span><Icon size={24} /></span><div><small>{achievement.category.toUpperCase()} · {Math.min(achievement.current, achievement.target)}/{achievement.target}</small><h3>{achievement.title}</h3><p>{achieved ? 'Conquista desbloqueada pelo seu progresso real.' : achievement.description}</p></div>{achieved ? <b><Check size={14} />Desbloqueada</b> : <b>Bloqueada</b>}</article>; })}</div></section>
  </div>;
}
