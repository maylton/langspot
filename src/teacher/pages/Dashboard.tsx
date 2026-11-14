import { CalendarDays, ChevronRight } from 'lucide-react';
import { StatCard, Timeline } from '../../components/ui';
import { type Id, type ScheduledLesson, type Student } from '../../types';
import { StudentPanel } from '../components/StudentList';

export function Dashboard({ teacherName, students, schedule, averageProgress, authenticatedMode, onOpenStudent, onOpenSchedule }: { teacherName: string; students: Student[]; schedule: ScheduledLesson[]; averageProgress: number; authenticatedMode: boolean; onOpenStudent: (id: Id) => void; onOpenSchedule: () => void }) {
  const upcomingLessons = schedule
    .filter((lesson) => lesson.status === 'Agendada' && new Date(`${lesson.date}T${lesson.startTime}:00`) >= new Date())
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 3);

  return <>
    <section className="hero-card"><div><span className="pill">LANGSPOT MVP</span><h2>Olá, {teacherName}!</h2><p>Seus alunos, aulas e progresso agora estão no mesmo lugar.</p></div><button className="ghost-button" onClick={onOpenSchedule}>Ver agenda <ChevronRight size={18} /></button></section>
    <section className="stats-grid"><StatCard label="Alunos ativos" value={String(students.filter((s) => s.status === 'Ativo').length)} note="dados salvos localmente" /><StatCard label="Aulas registradas" value={String(students.reduce((sum, s) => sum + s.lessons.length, 0))} note="histórico do MVP" /><StatCard label="Perfis cadastrados" value={String(students.length)} note="incluindo pausados" /><StatCard label="Média de progresso" value={`${averageProgress}%`} note="média das habilidades" /></section>
    <section className="content-grid"><StudentPanel students={students.slice(0, 4)} schedule={schedule} onOpen={onOpenStudent} /><aside className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">AGENDA</p><h3>Próximas aulas</h3></div></div>{upcomingLessons.length ? upcomingLessons.map((lesson) => <Timeline key={lesson.id} time={lesson.startTime} name={students.find((student) => student.id === lesson.studentId)?.name ?? 'Aluno'} topic={lesson.topic} />) : <div className="empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula agendada</h3><p>Suas próximas aulas cadastradas aparecerão aqui.</p></div>}<button className="secondary-button" onClick={onOpenSchedule}>Abrir calendário</button></aside></section>
  </>;
}
