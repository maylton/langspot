import { ChevronRight, Flame } from 'lucide-react';
import { Progress } from '../../components/ui';
import { initials } from '../../lib/format';
import { formatNextLesson, nextScheduledLessonForStudent } from '../../lib/lessons';
import { type Id, type ScheduledLesson, type Student } from '../../types';

export function StudentPanel({ students, schedule, onOpen }: { students: Student[]; schedule: ScheduledLesson[]; onOpen: (id: Id) => void }) { return <div className="panel large-panel"><div className="panel-heading"><div><p className="eyebrow">ACOMPANHAMENTO</p><h3>Meus alunos</h3></div></div><StudentList students={students} schedule={schedule} onOpen={onOpen} /></div>; }

export function StudentList({ students, schedule = [], onOpen }: { students: Student[]; schedule?: ScheduledLesson[]; onOpen: (id: Id) => void }) { return <div className="student-list">{students.map((student) => { const nextLesson = nextScheduledLessonForStudent(student.id, schedule); return <article className="student-row" key={student.id}><div className="avatar">{initials(student.name)}</div><div className="student-main"><strong>{student.name}</strong><span>{student.level} · {student.goal}</span>{Boolean(student.currentStreak) && <small className="teacher-streak"><Flame size={12} />{student.currentStreak} dia(s) de sequência</small>}</div><Progress value={student.progress} /><div className="next-class"><span>Próxima aula</span><strong>{formatNextLesson(nextLesson)}</strong></div><button className="icon-button" onClick={() => onOpen(student.id)} aria-label={`Abrir perfil de ${student.name}`}><ChevronRight size={18} /></button></article>; })}</div>; }
