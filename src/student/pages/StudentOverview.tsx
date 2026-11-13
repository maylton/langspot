import { ArrowRight, Award, BookOpen, Brain, CalendarDays, Check, ClipboardList, Clock3, ExternalLink, FileQuestion, Flag, Flame, NotebookPen, Snowflake, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { DbAssignment, DbLesson, LearningGoal, LearningJournalEntry, Profile, StreakFreeze, StudentRecord, StudyActivity, supabase } from '../../supabase';
import { formatPortalDate, shortPortalDate } from '../../lib/format';
import { EmptyPortal } from '../components/ui';
import { calculateStreak, lastStudyDays } from '../streaks';
import { toDateInput } from '../../lib/dates';
import { type DailyMission, type StudentTab } from '../types';

export function StudentOverview({ profile, record, nextLesson, materialCount, assignments, history, goals, journal, studyActivities, streakFreezes, onChanged, onNavigate, readOnly = false }: { profile: Profile; record: StudentRecord | null; nextLesson?: DbLesson; materialCount: number; assignments: DbAssignment[]; history: DbLesson[]; goals: LearningGoal[]; journal: LearningJournalEntry[]; studyActivities: StudyActivity[]; streakFreezes: StreakFreeze[]; onChanged: () => Promise<void>; onNavigate: (tab: StudentTab) => void; readOnly?: boolean }) {
  const [streakMessage, setStreakMessage] = useState('');
  const [protecting, setProtecting] = useState(false);
  const regularAssignments = assignments.filter((item) => item.assignment_type !== 'interactive');
  const quizAssignments = assignments.filter((item) => item.assignment_type === 'interactive');
  const pending = regularAssignments.filter((item) => item.status === 'pending');
  const pendingQuizzes = quizAssignments.filter((item) => item.status === 'pending');
  const urgent = [...pending].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const urgentQuiz = [...pendingQuizzes].sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const activeGoals = goals.filter((goal) => goal.status === 'active');
  const average = record ? Object.values(record.skills ?? {}).reduce((sum, value) => sum + value, 0) / Math.max(Object.values(record.skills ?? {}).length, 1) : 0;
  const activityDates = studyActivities.map((activity) => activity.activity_date);
  const protectedDates = streakFreezes.map((freeze) => freeze.protected_date);
  const streak = calculateStreak([...activityDates, ...protectedDates]);
  const activeDates = new Set(studyActivities.map((activity) => activity.activity_date));
  const freezeDates = new Set(protectedDates);
  const todayKey = toDateInput(new Date());
  const todayActivityTypes = new Set(studyActivities.filter((activity) => activity.activity_date === todayKey).map((activity) => activity.activity_type));
  const streakWeek = lastStudyDays(7);
  const yesterday = lastStudyDays(2)[0].date;
  const dayBeforeYesterday = lastStudyDays(3)[0].date;
  const monthlyFreezeUsed = protectedDates.some((date) => date.slice(0, 7) === yesterday.slice(0, 7));
  const canProtectYesterday = !readOnly && !monthlyFreezeUsed && !activeDates.has(yesterday) && !freezeDates.has(yesterday) && (activeDates.has(dayBeforeYesterday) || freezeDates.has(dayBeforeYesterday));
  const isToday = (value: string) => toDateInput(new Date(value)) === todayKey;
  const dailyMissionOptions: DailyMission[] = [];
  if (nextLesson && isToday(nextLesson.starts_at)) dailyMissionOptions.push({ type: 'lesson', title: 'Participar da aula', text: nextLesson.topic || 'Entre no encontro agendado de hoje.', action: 'Aulas', icon: CalendarDays, completed: todayActivityTypes.has('lesson') });
  if (pending.length) dailyMissionOptions.push({ type: 'assignment', title: 'Enviar uma tarefa', text: urgent ? `Prioridade: ${urgent.title}` : 'Escolha uma atividade pendente.', action: 'Tarefas', icon: ClipboardList, completed: todayActivityTypes.has('assignment') });
  if (!pending.length && pendingQuizzes.length) dailyMissionOptions.push({ type: 'assignment', title: 'Responder um quiz', text: urgentQuiz ? `Prioridade: ${urgentQuiz.title}` : 'Escolha um quiz pendente.', action: 'Quiz', icon: FileQuestion, completed: todayActivityTypes.has('assignment') });
  dailyMissionOptions.push(
    { type: 'journal', title: 'Registrar o estudo', text: 'Anote o que aprendeu ou uma dúvida para a próxima aula.', action: 'Diário', icon: NotebookPen, completed: todayActivityTypes.has('journal') },
    { type: 'flashcard', title: 'Revisar flashcards', text: 'Faça uma sessão rápida de revisão espaçada.', action: 'Flashcards', icon: Brain, completed: todayActivityTypes.has('flashcard') },
  );
  if (activeGoals.length) dailyMissionOptions.push({ type: 'goal', title: 'Avançar uma meta', text: 'Atualize o progresso de uma meta em andamento.', action: 'Metas', icon: Target, completed: todayActivityTypes.has('goal') });
  const dailyMissions = dailyMissionOptions.slice(0, 4);
  const completedMissions = dailyMissions.filter((mission) => mission.completed).length;
  const missionTarget = Math.min(1, dailyMissions.length);
  const streakActivatedToday = missionTarget > 0 && completedMissions >= missionTarget;
  const useFreeze = async () => {
    if (!supabase || !canProtectYesterday) return;
    setProtecting(true); setStreakMessage('');
    const { error } = await supabase.rpc('use_monthly_streak_freeze');
    if (error) setStreakMessage(error.message);
    else { setStreakMessage('Sequência protegida! Ontem agora conta como um dia preservado.'); await onChanged(); }
    setProtecting(false);
  };
  const timeline = [
    ...history.slice(0, 4).map((lesson) => ({ date: lesson.starts_at, icon: 'lesson', title: `Aula: ${lesson.topic}`, text: lesson.notes || 'Aula registrada no seu histórico.' })),
    ...assignments.filter((item) => item.status !== 'pending').slice(0, 4).map((item) => ({ date: item.submitted_at ?? item.created_at, icon: 'task', title: item.assignment_type === 'interactive' ? `Quiz enviado: ${item.title}` : item.status === 'reviewed' ? `Tarefa corrigida: ${item.title}` : `Tarefa enviada: ${item.title}`, text: item.feedback || (item.status === 'reviewed' ? 'Confira o feedback do professor.' : 'Aguardando correção.') })),
    ...journal.slice(0, 3).map((entry) => ({ date: entry.created_at, icon: 'journal', title: entry.title, text: `${entry.study_minutes} min de estudo${entry.new_words.length ? ` · ${entry.new_words.length} nova(s) palavra(s)` : ''}` })),
    ...goals.filter((goal) => goal.status === 'completed').slice(0, 3).map((goal) => ({ date: goal.updated_at, icon: 'goal', title: `Meta concluída: ${goal.title}`, text: goal.description || 'Mais uma conquista no seu aprendizado.' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return <div className="student-page student-dashboard-page">
    <section className="student-welcome student-welcome-enhanced"><div><span>BEM-VINDO DE VOLTA</span><h1>Olá, {profile.full_name}!</h1><p>{record?.goal ? `Seu objetivo: ${record.goal}.` : 'Continue avançando um passo por vez.'}</p></div><div className="student-level-ring"><strong>{Math.round(average)}%</strong><span>progresso</span></div></section>
    <section className="stats-grid student-dashboard-stats">
      <button className="stat-card next-lesson-stat" onClick={() => onNavigate('Aulas')}><i className="student-stat-icon"><CalendarDays size={20} /></i><span>Próxima aula</span><strong>{nextLesson ? shortPortalDate(nextLesson.starts_at) : '—'}</strong><small>{nextLesson?.topic || 'Nenhuma aula agendada'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Tarefas')}><i className="student-stat-icon"><ClipboardList size={20} /></i><span>Tarefas pendentes</span><strong>{pending.length}</strong><small>{urgent ? `Próximo prazo: ${new Date(`${urgent.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Tudo em dia'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Quiz')}><i className="student-stat-icon"><FileQuestion size={20} /></i><span>Quizzes pendentes</span><strong>{pendingQuizzes.length}</strong><small>{urgentQuiz ? `Próximo prazo: ${new Date(`${urgentQuiz.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Tudo em dia'}</small></button>
      <button className="stat-card" onClick={() => onNavigate('Materiais')}><i className="student-stat-icon"><BookOpen size={20} /></i><span>Materiais disponíveis</span><strong>{materialCount}</strong><small>{materialCount === 1 ? '1 recurso compartilhado' : `${materialCount} recursos compartilhados`}</small></button>
    </section>
    <section className="student-dashboard-columns"><div className="student-dashboard-main">{nextLesson && <section className="student-panel next-lesson-panel"><div><p className="eyebrow">PRÓXIMO ENCONTRO</p><h2>{nextLesson.topic}</h2><p><Clock3 size={15} />{formatPortalDate(nextLesson.starts_at)} · {nextLesson.duration_minutes} minutos</p></div>{nextLesson.online_url && <a className="student-primary" href={nextLesson.online_url} target="_blank" rel="noreferrer">Entrar na aula <ExternalLink size={15} /></a>}</section>}
      <section className="student-panel student-timeline-panel"><div className="student-section-heading"><div><p className="eyebrow">SUA JORNADA</p><h2>Linha do tempo</h2></div></div>{timeline.length ? <div className="student-learning-timeline">{timeline.map((item, index) => <article key={`${item.date}-${index}`}><span className={`timeline-icon ${item.icon}`}>{item.icon === 'lesson' ? <CalendarDays size={15} /> : item.icon === 'task' ? <Check size={15} /> : item.icon === 'goal' ? <Flag size={15} /> : <NotebookPen size={15} />}</span><div><time>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</time><strong>{item.title}</strong><p>{item.text}</p></div></article>)}</div> : <EmptyPortal icon={Sparkles} title="Sua jornada está começando" text="Aulas, tarefas, metas e registros de estudo aparecerão aqui." />}</section></div>
      <aside className="student-dashboard-side"><section className="student-panel student-streak-card"><div className="streak-heading"><span><Flame size={24} /></span><div><p className="eyebrow">SEQUÊNCIA DE ESTUDOS</p><h2>{streak.current} dia(s)</h2></div></div><p>{streakActivatedToday ? 'Missão cumprida hoje. Sua sequência está ativa!' : 'Complete uma missão de hoje para acender sua sequência.'}</p><div className="streak-week">{streakWeek.map((day) => <div className={activeDates.has(day.date) ? 'active' : freezeDates.has(day.date) ? 'protected' : ''} key={day.date}><span>{day.label}</span><i>{freezeDates.has(day.date) ? <Snowflake size={13} /> : <Flame size={13} />}</i></div>)}</div>{canProtectYesterday && <button className="streak-freeze-button" disabled={protecting} onClick={useFreeze}><Snowflake size={14} />{protecting ? 'Protegendo...' : 'Proteger sequência de ontem'}</button>}{streakMessage && <small className="streak-message">{streakMessage}</small>}<footer><span>Recorde pessoal</span><strong>{streak.best} dia(s)</strong></footer></section><section className={`student-panel daily-missions-card ${streakActivatedToday ? 'completed' : ''}`}><div className="student-section-heading"><div><p className="eyebrow">MISSÕES DE HOJE</p><h2>{streakActivatedToday ? 'Streak ativado' : 'Escolha uma missão'}</h2></div><span>{completedMissions}/{dailyMissions.length}</span></div><p>{streakActivatedToday ? 'Boa. O dia já conta para sua sequência.' : 'Conclua pelo menos uma ação real de estudo para ativar o dia.'}</p><div className="daily-mission-progress"><b style={{ width: `${dailyMissions.length ? Math.round((completedMissions / dailyMissions.length) * 100) : 0}%` }} /></div><div className="daily-mission-list">{dailyMissions.map((mission) => { const Icon = mission.icon; return <button key={mission.type} className={mission.completed ? 'done' : ''} onClick={() => onNavigate(mission.action)}><span><Icon size={16} /></span><div><strong>{mission.title}</strong><small>{mission.text}</small></div>{mission.completed ? <Check size={16} /> : <ArrowRight size={15} />}</button>; })}</div></section><section className="student-panel quick-actions"><h2>{readOnly ? 'Explorar portal' : 'Ações rápidas'}</h2><button onClick={() => onNavigate('Diário')}><NotebookPen size={17} /><span><strong>Registrar estudo</strong><small>Anote o que aprendeu hoje</small></span></button><button onClick={() => onNavigate('Quiz')}><FileQuestion size={17} /><span><strong>Responder quizzes</strong><small>Pratique com atividades interativas</small></span></button><button onClick={() => onNavigate('Flashcards')}><Brain size={17} /><span><strong>Revisar flashcards</strong><small>Pratique com repetição espaçada</small></span></button><button onClick={() => onNavigate('Metas')}><Target size={17} /><span><strong>Atualizar metas</strong><small>Acompanhe seu progresso</small></span></button><button onClick={() => onNavigate('Conquistas')}><Award size={17} /><span><strong>Ver conquistas</strong><small>Acompanhe os marcos desbloqueados</small></span></button></section>{activeGoals.length > 0 && <section className="student-panel dashboard-goals-preview"><div className="student-section-heading"><div><p className="eyebrow">EM ANDAMENTO</p><h2>Metas</h2></div><button onClick={() => onNavigate('Metas')}>Ver todas</button></div>{activeGoals.slice(0, 3).map((goal) => <article key={goal.id}><div><strong>{goal.title}</strong><span>{goal.progress}%</span></div><i><b style={{ width: `${goal.progress}%` }} /></i></article>)}</section>}</aside></section>
  </div>;
}
