import { type Id, type Lesson, type ScheduledLesson, type Student } from '../types';

export function nextScheduledLessonForStudent(studentId: Id, schedule: ScheduledLesson[]) {
  return schedule
    .filter((lesson) => lesson.studentId === studentId && lesson.status === 'Agendada' && new Date(`${lesson.date}T${lesson.startTime}`) >= new Date())
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))[0];
}

export function formatNextLesson(lesson?: ScheduledLesson) {
  if (!lesson) return 'Não agendada';
  const date = new Date(`${lesson.date}T${lesson.startTime}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const lessonDay = new Date(date);
  lessonDay.setHours(0, 0, 0, 0);
  const prefix = lessonDay.getTime() === today.getTime()
    ? 'Hoje'
    : lessonDay.getTime() === tomorrow.getTime()
      ? 'Amanhã'
      : date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  return `${prefix}, ${lesson.startTime}`;
}

export const lessonRecordTemplate = {
  notes: 'Conteúdo trabalhado:\n- \n\nAtividades realizadas:\n- \n\nParticipação e comportamento durante a aula:\n- ',
  strengths: 'O aluno demonstrou bom desempenho em:\n- \n\nEvoluções percebidas:\n- \n\nExemplos observados na aula:\n- ',
  improvements: 'Pontos que precisam de reforço:\n- \n\nEstratégia sugerida para as próximas aulas:\n- \n\nObservações para acompanhamento:\n- ',
  homework: 'Atividade para casa:\n- \n\nObjetivo da tarefa:\n- \n\nOrientações para entrega ou prática:\n- ',
};

export function scheduledToHistory(lesson: ScheduledLesson): Lesson { return { id: lesson.id, date: lesson.date, startTime: lesson.startTime, duration: lesson.duration, topic: lesson.topic, onlineUrl: lesson.onlineUrl, notes: lesson.notes, strengths: lesson.strengths ?? '', improvements: lesson.improvements ?? '', homework: lesson.homework, attendance: lesson.attendance, skillScores: lesson.skillScores }; }

export function googleCalendarUrl(lesson: ScheduledLesson, student?: Student) {
  const start = new Date(`${lesson.date}T${lesson.startTime}:00`);
  const end = new Date(start.getTime() + lesson.duration * 60_000);
  const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: `${lesson.topic} · ${student?.name ?? 'Aluno'}`, dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`, details: `Aula de idiomas no LangSpot.${lesson.onlineUrl ? `\n\nLink da aula: ${lesson.onlineUrl}` : ''}`, location: lesson.onlineUrl ?? '' });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
