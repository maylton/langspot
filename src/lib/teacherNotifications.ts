import type { AppNotification, Assignment, Id, Payment, ScheduledLesson, Student } from '../types';

/** Notifications the teacher dashboard derives from its own data when the server sends none (demo mode). */
export function buildTeacherNotifications({ students, schedule, assignments, payments, cancellationRequestCount }: {
  students: Student[]; schedule: ScheduledLesson[]; assignments: Assignment[]; payments: Payment[]; cancellationRequestCount: number;
}): AppNotification[] {
  const now = new Date();
  const endOfTomorrow = new Date(now);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
  endOfTomorrow.setHours(0, 0, 0, 0);
  const studentName = (id: Id) => students.find((student) => student.id === id)?.name ?? 'Aluno';
  const items: AppNotification[] = [];

  schedule.forEach((lesson) => {
    if (lesson.status !== 'Agendada') return;
    const startsAt = new Date(`${lesson.date}T${lesson.startTime}:00`);
    if (startsAt < now || startsAt >= endOfTomorrow) return;
    const isToday = startsAt.toDateString() === now.toDateString();
    items.push({
      id: `lesson-${lesson.id}-${lesson.date}-${lesson.startTime}`,
      kind: 'lesson',
      title: isToday ? 'Aula hoje' : 'Aula amanhã',
      description: `${studentName(lesson.studentId)} · ${lesson.startTime} · ${lesson.topic || 'Aula sem tema'}`,
      date: startsAt.toISOString(),
      target: 'Aulas',
      urgent: isToday,
    });
  });

  assignments.forEach((assignment) => {
    const due = new Date(`${assignment.dueDate}T23:59:59`);
    const assignmentTarget = assignment.assignmentType === 'interactive' ? 'Quiz' : 'Tarefas';
    const reviewTitle = assignment.assignmentType === 'interactive' ? 'Quiz aguardando correção' : 'Tarefa aguardando correção';
    const overdueTitle = assignment.assignmentType === 'interactive' ? 'Quiz atrasado' : 'Tarefa atrasada';
    const kind = assignment.assignmentType === 'interactive' ? 'quiz' : 'assignment';
    if (assignment.status === 'Entregue') {
      items.push({ id: `assignment-review-${assignment.id}`, kind, title: reviewTitle, description: `${studentName(assignment.studentId)} entregou “${assignment.title}”.`, date: assignment.submittedAt ?? assignment.createdAt, target: assignmentTarget, urgent: true });
    } else if (assignment.status === 'Pendente' && due < now) {
      items.push({ id: `assignment-overdue-${assignment.id}`, kind, title: overdueTitle, description: `${studentName(assignment.studentId)} ainda não entregou “${assignment.title}”.`, date: due.toISOString(), target: assignmentTarget, urgent: true });
    }
  });

  payments.forEach((payment) => {
    const due = new Date(`${payment.dueDate}T23:59:59`);
    if (payment.status !== 'Pago' && due < now) {
      items.push({ id: `payment-${payment.id}`, kind: 'payment', title: 'Cobrança atrasada', description: `${studentName(payment.studentId)} · ${payment.description} · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}`, date: due.toISOString(), target: 'Financeiro', urgent: true });
    }
  });

  if (cancellationRequestCount > 0) items.push({ id: `cancellations-${cancellationRequestCount}`, kind: 'cancellation', title: 'Solicitações de cancelamento', description: `${cancellationRequestCount} solicitação(ões) aguardando sua análise.`, date: now.toISOString(), target: 'Aulas', urgent: true });
  return items.sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) || new Date(b.date).getTime() - new Date(a.date).getTime());
}
