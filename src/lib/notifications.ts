import { DbNotification } from '../supabase';
import { type StudentTab } from '../student/types';
import { type AppNotification } from '../types';

const teacherNotificationTargets = ['Visão geral', 'Notificações', 'Alunos', 'Aulas', 'Materiais', 'Tarefas', 'Quiz', 'Avaliações', 'Financeiro', 'Progresso', 'Relatórios', 'Configurações'] as const;

const studentNotificationTargets = ['Visão geral', 'Aulas', 'Progresso', 'Materiais', 'Tarefas', 'Quiz', 'Avaliações', 'Flashcards', 'Metas', 'Conquistas', 'Diário', 'Perfil', 'Notificações'] as const;

export function mapDbNotificationToTeacher(row: DbNotification): AppNotification {
  const target = teacherNotificationTargets.includes(row.target as typeof teacherNotificationTargets[number]) ? row.target : 'Visão geral';
  return { id: row.id, kind: row.kind, title: row.title, description: row.description, date: row.scheduled_for ?? row.created_at, target: target as AppNotification['target'], urgent: row.urgent, readAt: row.read_at };
}

export type StudentNotification = Omit<AppNotification, 'target'> & { target: StudentTab };

export function mapDbNotificationToStudent(row: DbNotification): StudentNotification {
  const target = studentNotificationTargets.includes(row.target as typeof studentNotificationTargets[number]) ? row.target : 'Visão geral';
  return { id: row.id, kind: row.kind, title: row.title, description: row.description, date: row.scheduled_for ?? row.created_at, target: target as StudentTab, urgent: row.urgent, readAt: row.read_at };
}
