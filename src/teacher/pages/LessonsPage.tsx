import { Ban, CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock3, Edit3, ExternalLink, Plus, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addDays, startOfWeek, toDateInput } from '../../lib/dates';
import { formatDate } from '../../lib/format';
import { googleCalendarUrl } from '../../lib/lessons';
import { type Id, type LessonStatus, type ScheduledLesson, type Student } from '../../types';

export function LessonsPage({ students, lessons, onNew, onEdit, onComplete, onCancel }: { students: Student[]; lessons: ScheduledLesson[]; onNew: (date?: string) => void; onEdit: (lesson: ScheduledLesson) => void; onComplete: (lesson: ScheduledLesson) => void; onCancel: (id: Id) => void }) {
  type CalendarView = 'week' | 'month';
  const [calendarView, setCalendarView] = useState<CalendarView>(() => {
    const saved = localStorage.getItem('langspot-calendar-view');
    return saved === 'month' ? 'month' : 'week';
  });
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [studentFilter, setStudentFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'Todos'>('Todos');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('langspot-calendar-view', calendarView);
    setExpandedDay(null);
  }, [calendarView]);

  const filteredLessons = lessons.filter((lesson) =>
    (studentFilter === 'Todos' || lesson.studentId === studentFilter)
    && (statusFilter === 'Todos' || lesson.status === statusFilter),
  );

  const weekStart = startOfWeek(calendarDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekVisible = filteredLessons.filter((lesson) => lesson.date >= toDateInput(weekStart) && lesson.date <= toDateInput(weekDays[6]));

  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index));
  const monthGridEnd = monthDays[41];
  const monthVisible = filteredLessons.filter((lesson) => lesson.date >= toDateInput(monthGridStart) && lesson.date <= toDateInput(monthGridEnd));
  const visible = calendarView === 'week' ? weekVisible : monthVisible;

  const movePeriod = (direction: -1 | 1) => {
    if (calendarView === 'week') setCalendarDate(addDays(calendarDate, direction * 7));
    else setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1));
  };

  const periodLabel = calendarView === 'week'
    ? formatWeekRange(weekStart)
    : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarDate);

  const selectedDayLessons = expandedDay
    ? monthVisible.filter((lesson) => lesson.date === expandedDay).sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  return <div className="agenda-layout">
    <section className="agenda-toolbar panel">
      <div className="week-controls"><button className="icon-button" onClick={() => movePeriod(-1)} aria-label={calendarView === 'week' ? 'Semana anterior' : 'Mês anterior'}><ChevronLeft size={18} /></button><button className="today-button" onClick={() => setCalendarDate(new Date())}>Hoje</button><button className="icon-button" onClick={() => movePeriod(1)} aria-label={calendarView === 'week' ? 'Próxima semana' : 'Próximo mês'}><ChevronRight size={18} /></button><div><p className="eyebrow">{calendarView === 'week' ? 'SEMANA' : 'MÊS'}</p><strong className="calendar-period-label">{periodLabel}</strong></div></div>
      <div className="agenda-toolbar-actions">
        <div className="calendar-view-switch" role="group" aria-label="Visualização da agenda"><button type="button" className={calendarView === 'week' ? 'active' : ''} onClick={() => setCalendarView('week')}>Semana</button><button type="button" className={calendarView === 'month' ? 'active' : ''} onClick={() => setCalendarView('month')}>Mês</button></div>
        <div className="agenda-filters"><select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option>Todos</option>{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LessonStatus | 'Todos')}><option>Todos</option><option>Agendada</option><option>Concluída</option><option>Cancelada</option></select><button className="primary-button compact" onClick={() => onNew()}><Plus size={16} />Nova aula</button></div>
      </div>
    </section>

    {calendarView === 'week' ? <section className="week-grid">
      {weekDays.map((day) => {
        const dayLessons = weekVisible.filter((lesson) => lesson.date === toDateInput(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isToday = toDateInput(day) === toDateInput(new Date());
        return <article className={`day-column${isToday ? ' today' : ''}`} key={day.toISOString()}>
          <header><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day).replace('.', '')}</span><strong>{day.getDate()}</strong></header>
          <div className="day-lessons">{dayLessons.map((lesson) => <AgendaLessonCard key={lesson.id} lesson={lesson} student={students.find((student) => student.id === lesson.studentId)} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} />)}{!dayLessons.length && <button className="free-day" onClick={() => onNew(toDateInput(day))}>Livre</button>}</div>
        </article>;
      })}
    </section> : <>
      <section className="month-calendar panel">
        <div className="month-weekdays">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">
          {monthDays.map((day) => {
            const date = toDateInput(day);
            const dayLessons = monthVisible.filter((lesson) => lesson.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = date === toDateInput(new Date());
            const outside = day.getMonth() !== calendarDate.getMonth();
            return <article className={`month-day${isToday ? ' today' : ''}${outside ? ' outside' : ''}`} key={date} onDoubleClick={() => onNew(date)}>
              <button className="month-day-number" onClick={() => dayLessons.length ? setExpandedDay(date) : onNew(date)} aria-label={`${day.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(day)}`}>{day.getDate()}</button>
              <div className="month-day-lessons">
                {dayLessons.slice(0, 3).map((lesson) => {
                  const student = students.find((item) => item.id === lesson.studentId);
                  return <button key={lesson.id} className={`month-lesson-chip ${lesson.status.toLowerCase().replace('í', 'i')}`} onClick={() => onEdit(lesson)} title={`${lesson.startTime} · ${student?.name ?? 'Aluno'} · ${lesson.topic}`}><span>{lesson.startTime}</span><strong>{student?.name ?? 'Aluno'}</strong></button>;
                })}
                {dayLessons.length > 3 && <button className="month-more" onClick={() => setExpandedDay(date)}>+{dayLessons.length - 3} aula(s)</button>}
              </div>
              {!dayLessons.length && <button className="month-add-lesson" onClick={() => onNew(date)} aria-label="Agendar aula neste dia"><Plus size={14} /></button>}
            </article>;
          })}
        </div>
      </section>
      {expandedDay && <section className="panel month-day-details"><div className="panel-heading"><div><p className="eyebrow">DETALHES DO DIA</p><h3>{formatDate(expandedDay)}</h3></div><div className="month-detail-actions"><button className="secondary-button compact" onClick={() => onNew(expandedDay)}><Plus size={16} />Nova aula</button><button className="icon-button" onClick={() => setExpandedDay(null)} aria-label="Fechar detalhes"><X size={17} /></button></div></div>{selectedDayLessons.length ? <div className="month-detail-list">{selectedDayLessons.map((lesson) => <AgendaLessonCard key={lesson.id} lesson={lesson} student={students.find((student) => student.id === lesson.studentId)} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} />)}</div> : <p className="free-day-text">Nenhuma aula neste dia.</p>}</section>}
    </>}

    {!visible.length && <section className="panel empty-state small"><CalendarDays size={34} /><h3>Nenhuma aula neste {calendarView === 'week' ? 'período' : 'mês'}</h3><p>Ajuste os filtros ou agende uma nova aula.</p><button className="secondary-button compact" onClick={() => onNew()}><Plus size={16} />Nova aula</button></section>}
  </div>;
}

function AgendaLessonCard({ lesson, student, onEdit, onComplete, onCancel }: { lesson: ScheduledLesson; student?: Student; onEdit: (lesson: ScheduledLesson) => void; onComplete: (lesson: ScheduledLesson) => void; onCancel: (id: Id) => void }) {
  return <div className={`agenda-card ${lesson.status.toLowerCase().replace('í', 'i')}`}>
    <div className="agenda-time"><Clock3 size={13} />{lesson.startTime} · {lesson.duration} min</div><strong>{student?.name ?? 'Aluno removido'}</strong><span>{student?.level} · {lesson.topic}</span><em>{lesson.status}</em>
    {lesson.status !== 'Cancelada' && <div className="lesson-links">{lesson.onlineUrl && <a href={lesson.onlineUrl} target="_blank" rel="noreferrer" title="Abrir sala online"><Video size={13} />Abrir sala <ExternalLink size={10} /></a>}<a href={googleCalendarUrl(lesson, student)} target="_blank" rel="noreferrer" title="Adicionar ao Google Calendar"><CalendarPlus size={13} />Google</a></div>}
    {lesson.status === 'Agendada' && <div className="agenda-actions"><button title="Concluir aula" onClick={() => onComplete(lesson)}><Check size={14} /></button><button title="Editar aula" onClick={() => onEdit(lesson)}><Edit3 size={14} /></button><button title="Cancelar aula" onClick={() => onCancel(lesson.id)}><Ban size={14} /></button></div>}
  </div>;
}

function formatWeekRange(date: Date) { const end = addDays(date, 6); const startText = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date); const endText = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(end); return `${startText} — ${endText}`; }
