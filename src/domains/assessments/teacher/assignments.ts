import type { AssessmentAssignmentRow } from '../database';

/** What the teacher needs to know about an assignment, from its status and dates. */
export type AssignmentState = 'scheduled' | 'waiting' | 'overdue' | 'in_progress' | 'to_review' | 'completed' | 'expired';

export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = {
  scheduled: 'Agendada',
  waiting: 'Aguardando o aluno',
  overdue: 'Prazo vencido',
  in_progress: 'Em andamento',
  to_review: 'Para corrigir',
  completed: 'Concluída',
  expired: 'Expirada',
};

/** Filters of the "Provas atribuídas" panel. `open` = not started yet (scheduled, waiting or overdue). */
export const ASSIGNMENT_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Não iniciadas' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'to_review', label: 'Para corrigir' },
  { key: 'done', label: 'Concluídas' },
] as const;
export type AssignmentFilter = typeof ASSIGNMENT_FILTERS[number]['key'];

export type AssignmentListRow = Pick<AssessmentAssignmentRow, 'id' | 'assessment_id' | 'student_id' | 'available_from' | 'due_at' | 'attempt_limit' | 'status' | 'created_at'>;

export function assignmentState(row: Pick<AssignmentListRow, 'status' | 'available_from' | 'due_at'>, now = new Date()): AssignmentState {
  if (row.status === 'started') return 'in_progress';
  if (row.status === 'submitted' || row.status === 'grading') return 'to_review';
  if (row.status === 'completed') return 'completed';
  if (row.status === 'expired') return 'expired';
  if (row.due_at && new Date(row.due_at) < now) return 'overdue';
  if (row.available_from && new Date(row.available_from) > now) return 'scheduled';
  return 'waiting';
}

/** Not started yet: the teacher can still change dates and attempts, or cancel (no attempt or result is lost). */
export const isNotStarted = (row: Pick<AssignmentListRow, 'status'>) => row.status === 'assigned' || row.status === 'available';

export function matchesAssignmentFilter(state: AssignmentState, filter: AssignmentFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'open') return state === 'scheduled' || state === 'waiting' || state === 'overdue';
  if (filter === 'done') return state === 'completed' || state === 'expired';
  return state === filter;
}

const ORDER: AssignmentState[] = ['overdue', 'waiting', 'scheduled', 'in_progress', 'to_review', 'completed', 'expired'];

/** Most actionable first; within a state, the nearest due date (no date last), then the newest. */
export function sortAssignments<T extends AssignmentListRow>(rows: T[], now = new Date()): T[] {
  return [...rows].sort((a, b) => {
    const state = ORDER.indexOf(assignmentState(a, now)) - ORDER.indexOf(assignmentState(b, now));
    if (state) return state;
    const due = (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999');
    return due || b.created_at.localeCompare(a.created_at);
  });
}

/** Counts per assessment of assignments not finished yet, for the "Atribuída a N aluno(s)" line on the cards. */
export function assignmentCounts(rows: Pick<AssignmentListRow, 'assessment_id' | 'status'>[]): Map<string, { total: number; notStarted: number }> {
  const counts = new Map<string, { total: number; notStarted: number }>();
  for (const row of rows) {
    const current = counts.get(row.assessment_id) ?? { total: 0, notStarted: 0 };
    counts.set(row.assessment_id, { total: current.total + 1, notStarted: current.notStarted + (isNotStarted(row) ? 1 : 0) });
  }
  return counts;
}

/** "2026-11-13T14:30:00.000Z" → value for <input type="datetime-local"> in the browser's time zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
