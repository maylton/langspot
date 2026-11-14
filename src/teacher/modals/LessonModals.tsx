import { CalendarDays, Check, Save, Trash2 } from 'lucide-react';
import { FormEvent, type ReactNode, useState } from 'react';
import { toDateInput } from '../../lib/dates';
import { Field, Modal } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { lessonRecordTemplate, scheduledToHistory } from '../../lib/lessons';
import { defaultSkills, skills } from '../../lib/skills';
import { type AttendanceStatus, type Lesson, type LessonRecordInput, type ScheduledLesson, type ScheduledLessonInput, type Skill, type Student } from '../../types';

export function LessonModal({ studentName, onClose, onSave }: { studentName: string; onClose: () => void; onSave: (lesson: Omit<Lesson, 'id'>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ date: String(form.get('date')), topic: String(form.get('topic')), notes: String(form.get('notes')), strengths: String(form.get('strengths')), improvements: String(form.get('improvements')), homework: String(form.get('homework')) }); };
  return <Modal title={`Registrar aula · ${studentName}`} onClose={onClose}><form className="form-grid" onSubmit={submit}><Field name="date" label="Data" type="date" required /><Field name="topic" label="Tema da aula" required /><label className="full-field">Resumo da aula<textarea name="notes" rows={7} defaultValue={lessonRecordTemplate.notes} placeholder="Conteúdo trabalhado e contexto geral" /></label><label className="full-field">Pontos fortes<textarea name="strengths" rows={7} defaultValue={lessonRecordTemplate.strengths} placeholder="O que o aluno fez bem, avanços e conquistas" /></label><label className="full-field">Pontos a melhorar<textarea name="improvements" rows={7} defaultValue={lessonRecordTemplate.improvements} placeholder="Dificuldades, próximos focos e ajustes necessários" /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={6} defaultValue={lessonRecordTemplate.homework} placeholder="Atividade para a próxima aula" /></label><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Registrar aula</button></div></form></Modal>;
}

export function ScheduleLessonModal({ students, lesson, onClose, onSave }: { students: Student[]; lesson?: ScheduledLesson; onClose: () => void; onSave: (lesson: ScheduledLessonInput) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ studentId: String(form.get('studentId')), date: String(form.get('date')), startTime: String(form.get('startTime')), duration: Number(form.get('duration')), topic: String(form.get('topic')), onlineUrl: String(form.get('onlineUrl')).trim() }); };
  return <Modal title={lesson ? 'Editar aula' : 'Agendar nova aula'} onClose={onClose}><form className="form-grid" onSubmit={submit}><label>Aluno<select name="studentId" defaultValue={lesson?.studentId ?? students[0]?.id} required>{students.map((student) => <option value={student.id} key={student.id}>{student.name} · {student.level}</option>)}</select></label><Field name="topic" label="Tema da aula" defaultValue={lesson?.topic} required /><Field name="date" label="Data" type="date" defaultValue={lesson?.date ?? toDateInput(new Date())} required /><Field name="startTime" label="Horário" type="time" defaultValue={lesson?.startTime ?? '14:00'} required /><label>Duração<select name="duration" defaultValue={lesson?.duration ?? 60}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><Field name="onlineUrl" label="Link da aula online" type="url" defaultValue={lesson?.onlineUrl} placeholder="https://meet.google.com/..." /><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">{lesson ? 'Salvar alterações' : 'Agendar aula'}</button></div></form></Modal>;
}

export function CompleteLessonModal({ lesson, student, onClose, onSave }: { lesson: ScheduledLesson; student?: Student; onClose: () => void; onSave: (record: LessonRecordInput) => void }) {
  return <LessonRecordForm title={`Concluir aula · ${student?.name ?? 'Aluno'}`} lesson={scheduledToHistory(lesson)} student={student} submitLabel="Concluir e registrar" submitIcon={<Check size={17} />} onClose={onClose} onSave={onSave} />;
}

export function LessonRecordModal({ lesson, student, onClose, onSave }: { lesson: Lesson; student: Student; onClose: () => void; onSave: (record: LessonRecordInput) => void | Promise<void> }) {
  return <LessonRecordForm title={`Editar registro · ${student.name}`} lesson={lesson} student={student} submitLabel="Salvar registro" submitIcon={<Save size={17} />} onClose={onClose} onSave={onSave} />;
}

function LessonRecordForm({ title, lesson, student, submitLabel, submitIcon, onClose, onSave }: { title: string; lesson: Lesson; student?: Student; submitLabel: string; submitIcon: ReactNode; onClose: () => void; onSave: (record: LessonRecordInput) => void | Promise<void> }) {
  const [attendance, setAttendance] = useState<AttendanceStatus>(lesson.attendance ?? 'Presente');
  const [skillScores, setSkillScores] = useState<Record<Skill, number>>(() => ({ ...(student?.skills ?? defaultSkills()), ...(lesson.skillScores ?? {}) }));
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    await onSave({
      date: String(form.get('date')),
      startTime: String(form.get('startTime') || lesson.startTime || '12:00'),
      duration: Number(form.get('duration') || lesson.duration || 60),
      topic: String(form.get('topic')),
      onlineUrl: String(form.get('onlineUrl') || '').trim(),
      notes: String(form.get('notes')),
      strengths: String(form.get('strengths')),
      improvements: String(form.get('improvements')),
      homework: String(form.get('homework')),
      attendance,
      skillScores,
    });
  };
  return <Modal title={title} onClose={onClose}><div className="completion-summary"><CalendarDays size={18} /><div><strong>{lesson.topic || 'Aula'}</strong><span>{formatDate(lesson.date)}{lesson.startTime ? ` às ${lesson.startTime}` : ''}</span></div></div><form className="form-grid" onSubmit={submit}><Field name="date" label="Data" type="date" defaultValue={lesson.date} required /><Field name="startTime" label="Horário" type="time" defaultValue={lesson.startTime ?? '12:00'} required /><label>Duração<select name="duration" defaultValue={lesson.duration ?? 60}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="50">50 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label>Presença<select value={attendance} onChange={(event) => setAttendance(event.target.value as AttendanceStatus)}><option>Presente</option><option>Ausente</option><option>Remarcada</option></select></label><Field name="topic" label="Tema da aula" defaultValue={lesson.topic} required /><Field name="onlineUrl" label="Link da aula online" type="url" defaultValue={lesson.onlineUrl} placeholder="https://meet.google.com/..." /><label className="full-field">Resumo da aula<textarea name="notes" rows={7} defaultValue={lesson.notes || lessonRecordTemplate.notes} placeholder="Conteúdo trabalhado e contexto geral" /></label><label className="full-field">Pontos fortes<textarea name="strengths" rows={7} defaultValue={lesson.strengths || lessonRecordTemplate.strengths} placeholder="O que o aluno fez bem, avanços e conquistas" /></label><label className="full-field">Pontos a melhorar<textarea name="improvements" rows={7} defaultValue={lesson.improvements || lessonRecordTemplate.improvements} placeholder="Dificuldades, próximos focos e ajustes necessários" /></label><label className="full-field">Tarefa de casa<textarea name="homework" rows={6} defaultValue={lesson.homework || lessonRecordTemplate.homework} placeholder="Atividade para a próxima aula" /></label><div className="full-field completion-skills"><div><strong>Avaliação rápida</strong><span>Atualize as habilidades observadas nesta aula.</span></div>{skills.map((skill) => <label className="skill-row" key={skill}><div><strong>{skill}</strong><span>{skillScores[skill]}%</span></div><input type="range" min="0" max="100" value={skillScores[skill]} onChange={(event) => setSkillScores((current) => ({ ...current, [skill]: Number(event.target.value) }))} /></label>)}</div><div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Voltar</button><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Salvando...' : <>{submitIcon}{submitLabel}</>}</button></div></form></Modal>;
}

export function ConfirmLessonDelete({ lesson, onClose, onConfirm }: { lesson: Lesson; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir registro de aula" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir “{lesson.topic}”?</strong><p>O registro de {formatDate(lesson.date)} será removido do histórico do aluno. Esta ação não pode ser desfeita.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter registro</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir registro</button></div></Modal>;
}
