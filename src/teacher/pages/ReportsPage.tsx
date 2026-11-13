import { Award, Copy, GraduationCap, Printer, Target, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toDateInput } from '../../lib/dates';
import { formatDate, formatStudyTime, initials } from '../../lib/format';
import { scheduledToHistory } from '../../lib/lessons';
import { skillAverage, skills } from '../../lib/skills';
import { type Assignment, type Id, type Lesson, type ScheduledLesson, type Skill, type Student } from '../../types';
import { SkillBar } from './ProgressPage';

export function ReportsPage({ students, schedule, assignments }: { students: Student[]; schedule: ScheduledLesson[]; assignments: Assignment[] }) {
  const now = new Date();
  const [tab, setTab] = useState<'Resumo' | 'Individual'>('Resumo');
  const [startDate, setStartDate] = useState(() => toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [studentId, setStudentId] = useState<Id>(() => students[0]?.id ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!students.some((student) => student.id === studentId)) setStudentId(students[0]?.id ?? '');
  }, [students, studentId]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - Math.max(days - 1, 0));
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  };

  const periodLessons = schedule.filter((lesson) => lesson.date >= startDate && lesson.date <= endDate);
  const periodAssignments = assignments.filter((assignment) => assignment.createdAt.slice(0, 10) <= endDate && assignment.dueDate >= startDate);
  const completed = periodLessons.filter((lesson) => lesson.status === 'Concluída');
  const cancelled = periodLessons.filter((lesson) => lesson.status === 'Cancelada');
  const scheduled = periodLessons.filter((lesson) => lesson.status === 'Agendada');
  const completionRate = periodLessons.length ? Math.round((completed.length / periodLessons.length) * 100) : 0;
  const attendanceLessons = completed.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendanceRate = attendanceLessons.length ? Math.round((attendanceLessons.filter((lesson) => lesson.attendance === 'Presente').length / attendanceLessons.length) * 100) : 0;
  const submittedAssignments = periodAssignments.filter((assignment) => assignment.status !== 'Pendente');
  const assignmentRate = periodAssignments.length ? Math.round((submittedAssignments.length / periodAssignments.length) * 100) : 0;
  const gradedAssignments = periodAssignments.filter((assignment) => typeof assignment.grade === 'number');
  const averageGrade = gradedAssignments.length ? Math.round(gradedAssignments.reduce((sum, assignment) => sum + (assignment.grade ?? 0), 0) / gradedAssignments.length) : undefined;
  const selectedStudent = students.find((student) => student.id === studentId) ?? students[0];
  const studentSchedule = selectedStudent ? periodLessons.filter((lesson) => lesson.studentId === selectedStudent.id) : [];
  const studentHistory = selectedStudent ? selectedStudent.lessons.filter((lesson) => lesson.date >= startDate && lesson.date <= endDate) : [];
  const studentAssignments = selectedStudent ? periodAssignments.filter((assignment) => assignment.studentId === selectedStudent.id) : [];
  const strongest = selectedStudent ? skills.reduce((best, skill) => selectedStudent.skills[skill] > selectedStudent.skills[best] ? skill : best, skills[0]) : undefined;
  const attention = selectedStudent ? skills.reduce((lowest, skill) => selectedStudent.skills[skill] < selectedStudent.skills[lowest] ? skill : lowest, skills[0]) : undefined;

  const copySummary = async () => {
    if (!selectedStudent) return;
    const text = studentReportText(selectedStudent, studentHistory, strongest!, attention!, startDate, endDate, studentSchedule, studentAssignments);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <div className="reports-page">
    <section className="reports-controls panel no-print">
      <div className="report-tabs"><button className={tab === 'Resumo' ? 'active' : ''} onClick={() => setTab('Resumo')}>Resumo do período</button><button className={tab === 'Individual' ? 'active' : ''} onClick={() => setTab('Individual')}>Relatório individual</button></div>
      <div className="report-presets"><span>Período rápido</span><button onClick={() => applyPreset(30)}>30 dias</button><button onClick={() => applyPreset(90)}>90 dias</button><button onClick={() => applyPreset(180)}>Semestre</button></div>
      <div className="report-filters"><label>De<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Até<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>{tab === 'Individual' && <label>Aluno<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select></label>}<button className="print-button" onClick={() => window.print()}><Printer size={16} />Imprimir / PDF</button>{tab === 'Individual' && <button className="copy-button" onClick={copySummary}><Copy size={16} />{copied ? 'Copiado!' : 'Copiar resumo'}</button>}</div>
    </section>
    {tab === 'Resumo' ? <PeriodReport students={students} lessons={periodLessons} assignments={periodAssignments} completed={completed.length} cancelled={cancelled.length} scheduled={scheduled.length} completionRate={completionRate} attendanceRate={attendanceRate} assignmentRate={assignmentRate} averageGrade={averageGrade} startDate={startDate} endDate={endDate} /> : selectedStudent ? <IndividualReport student={selectedStudent} scheduledLessons={studentSchedule} history={studentHistory} assignments={studentAssignments} strongest={strongest!} attention={attention!} startDate={startDate} endDate={endDate} /> : <section className="panel empty-state"><UsersRound size={38} /><h3>Nenhum aluno cadastrado</h3><p>Cadastre um aluno para gerar o relatório individual.</p></section>}
  </div>;
}

function PeriodReport({ students, lessons, assignments, completed, cancelled, scheduled, completionRate, attendanceRate, assignmentRate, averageGrade, startDate, endDate }: { students: Student[]; lessons: ScheduledLesson[]; assignments: Assignment[]; completed: number; cancelled: number; scheduled: number; completionRate: number; attendanceRate: number; assignmentRate: number; averageGrade?: number; startDate: string; endDate: string }) {
  const activity = [...students].map((student) => ({ student, lessons: lessons.filter((lesson) => lesson.studentId === student.id), assignments: assignments.filter((assignment) => assignment.studentId === student.id) })).sort((a, b) => b.lessons.length - a.lessons.length);
  const statusData = [{ label: 'Concluídas', value: completed }, { label: 'Agendadas', value: scheduled }, { label: 'Canceladas', value: cancelled }];
  return <section className="report-sheet"><ReportHeader title="Resumo do período" startDate={startDate} endDate={endDate} /><div className="report-metrics report-metrics-advanced"><ReportMetric label="Aulas no período" value={String(lessons.length)} /><ReportMetric label="Conclusão de aulas" value={`${completionRate}%`} /><ReportMetric label="Frequência" value={`${attendanceRate}%`} /><ReportMetric label="Entrega de tarefas" value={`${assignmentRate}%`} /><ReportMetric label="Média das tarefas" value={averageGrade === undefined ? '—' : String(averageGrade)} /><ReportMetric label="Alunos ativos" value={String(students.filter((student) => student.status === 'Ativo').length)} /></div><div className="report-dashboard-grid"><article className="report-block"><h3>Situação das aulas</h3><StatusBars data={statusData} /></article><article className="report-block"><h3>Média por habilidade</h3><div className="report-skills">{skills.map((skill) => <SkillBar skill={skill} value={skillAverage(students, skill)} key={skill} />)}</div></article></div><article className="report-block"><div className="report-section-heading"><div><h3>Atividade por aluno</h3><p>Aulas, tarefas e progresso no período selecionado.</p></div><span>{activity.length} aluno(s)</span></div><div className="report-activity-table"><div className="report-activity-head"><span>Aluno</span><span>Aulas</span><span>Tarefas</span><span>Progresso</span></div>{activity.map(({ student, lessons: studentLessons, assignments: studentTasks }) => <div className="report-activity-row" key={student.id}><div><strong>{student.name}</strong><small>{student.level} · {student.goal}</small></div><b>{studentLessons.length}</b><b>{studentTasks.filter((assignment) => assignment.status !== 'Pendente').length}/{studentTasks.length}</b><div className="report-mini-progress"><span><i style={{ width: `${student.progress}%` }} /></span><b>{student.progress}%</b></div></div>)}</div></article></section>;
}

function IndividualReport({ student, scheduledLessons, history, assignments, strongest, attention, startDate, endDate }: { student: Student; scheduledLessons: ScheduledLesson[]; history: Lesson[]; assignments: Assignment[]; strongest: Skill; attention: Skill; startDate: string; endDate: string }) {
  const completedLessons = scheduledLessons.filter((lesson) => lesson.status === 'Concluída');
  const attendanceBase = completedLessons.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendanceRate = attendanceBase.length ? Math.round(attendanceBase.filter((lesson) => lesson.attendance === 'Presente').length / attendanceBase.length * 100) : 0;
  const delivered = assignments.filter((assignment) => assignment.status !== 'Pendente').length;
  const taskRate = assignments.length ? Math.round(delivered / assignments.length * 100) : 0;
  const graded = assignments.filter((assignment) => typeof assignment.grade === 'number');
  const averageGrade = graded.length ? Math.round(graded.reduce((sum, assignment) => sum + (assignment.grade ?? 0), 0) / graded.length) : undefined;
  const studyMinutes = completedLessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const trend = completedLessons.filter((lesson) => lesson.skillScores && Object.keys(lesson.skillScores).length).sort((a, b) => a.date.localeCompare(b.date)).slice(-8).map((lesson) => ({ label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${lesson.date}T12:00:00`)), value: Math.round(Object.values(lesson.skillScores ?? {}).reduce((sum, value) => sum + Number(value), 0) / Math.max(Object.values(lesson.skillScores ?? {}).length, 1)) }));
  const reportHistory = history.length ? history : completedLessons.map(scheduledToHistory);
  return <section className="report-sheet"><ReportHeader title={`Relatório individual · ${student.name}`} startDate={startDate} endDate={endDate} /><div className="individual-report-header"><div className="avatar large">{initials(student.name)}</div><div><span className="status-badge">{student.status}</span><h2>{student.name}</h2><p>{student.level} · {student.goal} · {student.email}</p></div><strong>{student.progress}%</strong></div><div className="report-metrics report-metrics-advanced"><ReportMetric label="Aulas concluídas" value={String(completedLessons.length || history.length)} /><ReportMetric label="Carga horária" value={formatStudyTime(studyMinutes)} /><ReportMetric label="Frequência" value={`${attendanceRate}%`} /><ReportMetric label="Tarefas entregues" value={`${delivered}/${assignments.length}`} /><ReportMetric label="Média das tarefas" value={averageGrade === undefined ? '—' : String(averageGrade)} /><ReportMetric label="Progresso geral" value={`${student.progress}%`} /></div><div className="report-dashboard-grid"><article className="report-block"><h3>Evolução nas avaliações</h3><p className="report-block-description">Média das habilidades registradas ao concluir cada aula.</p><EvolutionChart points={trend} fallback={student.progress} /></article><article className="report-block"><h3>Indicadores de acompanhamento</h3><div className="report-kpis"><ReportKpi label="Frequência" value={attendanceRate} /><ReportKpi label="Entrega de tarefas" value={taskRate} /><ReportKpi label="Progresso atual" value={student.progress} /></div></article></div><div className="report-columns"><article className="report-block"><h3>Progresso por habilidade</h3><div className="report-skills">{skills.map((skill) => <SkillBar skill={skill} value={student.skills[skill]} key={skill} />)}</div><div className="report-insight-pills"><span><Award size={14} />Destaque: <b>{strongest}</b></span><span><Target size={14} />Atenção: <b>{attention}</b></span></div></article><article className="report-block"><h3>Observações do professor</h3><p className="report-note">{student.notes || 'Nenhuma observação geral registrada.'}</p><h3>Tarefas no período</h3><div className="report-task-list">{assignments.length ? assignments.slice(0, 6).map((assignment) => <div key={assignment.id}><span className={`assignment-status ${assignment.status.toLowerCase()}`}>{assignment.status}</span><div><strong>{assignment.title}</strong><small>Prazo: {formatDate(assignment.dueDate)}{typeof assignment.grade === 'number' ? ` · Nota ${assignment.grade}` : ''}</small></div></div>) : <p className="report-note">Nenhuma tarefa no período.</p>}</div></article></div><article className="report-block"><h3>Histórico de aulas</h3><div className="report-history report-history-grid">{reportHistory.length ? reportHistory.map((lesson) => <div key={lesson.id}><time>{formatDate(lesson.date)}</time><strong>{lesson.topic}</strong><p>{lesson.notes || 'Sem observações.'}</p><div className="lesson-meta">{lesson.attendance && <span>Presença: {lesson.attendance}</span>}{lesson.homework && <small>Tarefa: {lesson.homework}</small>}</div></div>) : <p className="report-note">Nenhuma aula registrada neste período.</p>}</div></article></section>;
}

function ReportHeader({ title, startDate, endDate }: { title: string; startDate: string; endDate: string }) { return <header className="report-header"><div><span>LANGSPOT</span><h2>{title}</h2><p>{formatDate(startDate)} a {formatDate(endDate)}</p></div><GraduationCap size={34} /></header>; }

function ReportMetric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function StatusBars({ data }: { data: { label: string; value: number }[] }) { const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1); return <div className="status-bars">{data.map((item) => <div key={item.label}><div><span>{item.label}</span><b>{item.value}</b></div><span><i style={{ width: `${Math.round(item.value / total * 100)}%` }} /></span></div>)}</div>; }

function EvolutionChart({ points, fallback }: { points: { label: string; value: number }[]; fallback: number }) { const data = points.length ? points : [{ label: 'Atual', value: fallback }]; return <div className="evolution-chart" role="img" aria-label="Gráfico de evolução das avaliações">{data.map((point) => <div className="evolution-column" key={`${point.label}-${point.value}`}><div className="evolution-value">{point.value}%</div><div className="evolution-track"><i style={{ height: `${Math.max(point.value, 6)}%` }} /></div><span>{point.label}</span></div>)}</div>; }

function ReportKpi({ label, value }: { label: string; value: number }) { return <div className="report-kpi"><div style={{ background: `conic-gradient(#345995 ${Math.max(0, Math.min(100, value)) * 3.6}deg, #e4ecf8 0deg)` }}><span>{value}%</span></div><strong>{label}</strong></div>; }

function studentReportText(student: Student, history: Lesson[], strongest: Skill, attention: Skill, startDate: string, endDate: string, schedule: ScheduledLesson[], assignments: Assignment[]) {
  const completed = schedule.filter((lesson) => lesson.status === 'Concluída');
  const attendanceBase = completed.filter((lesson) => lesson.attendance === 'Presente' || lesson.attendance === 'Ausente');
  const attendance = attendanceBase.length ? Math.round(attendanceBase.filter((lesson) => lesson.attendance === 'Presente').length / attendanceBase.length * 100) : 0;
  const delivered = assignments.filter((assignment) => assignment.status !== 'Pendente').length;
  return `Relatório de progresso — ${student.name}\nPeríodo: ${formatDate(startDate)} a ${formatDate(endDate)}\nNível: ${student.level}\nObjetivo: ${student.goal}\nProgresso geral: ${student.progress}%\nHabilidade destaque: ${strongest} (${student.skills[strongest]}%)\nPonto de atenção: ${attention} (${student.skills[attention]}%)\nAulas concluídas no período: ${Math.max(history.length, completed.length)}\nFrequência: ${attendance}%\nTarefas entregues: ${delivered}/${assignments.length}\nObservações: ${student.notes || 'Nenhuma observação registrada.'}`;
}
