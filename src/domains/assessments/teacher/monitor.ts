import type { AttemptLiveQuestion, AttemptLiveSection, AttemptLiveStatus } from '../types';
import { secondsLeft, studentSectionTitle } from '../student/pacing';

export type Presence = 'online' | 'recent' | 'away';

/** The runner reports presence every 20 s; 60 s without it means the student left the page or lost the connection. */
export function presenceOf(lastSeenAt: string | null, lastActivityAt: string | null, now = Date.now()): Presence {
  if (lastSeenAt && now - new Date(lastSeenAt).getTime() <= 60_000) return 'online';
  const last = Math.max(lastSeenAt ? new Date(lastSeenAt).getTime() : 0, lastActivityAt ? new Date(lastActivityAt).getTime() : 0);
  return last && now - last <= 5 * 60_000 ? 'recent' : 'away';
}

export const PRESENCE_LABELS: Record<Presence, string> = { online: 'Na prova agora', recent: 'Ativo há pouco', away: 'Sem atividade' };

export function relativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return 'agora';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? '' : 's'}`;
}

export type MonitorStageState = 'done' | 'current' | 'open' | 'pending' | 'teacher';

export type MonitorStage = {
  section: AttemptLiveSection;
  /** Stage number the student sees; null for parts the teacher conducts live. */
  number: number | null;
  studentTitle: string;
  /** Teacher-only detail hidden from the student, e.g. "Target B1". */
  teacherDetail: string;
  questions: AttemptLiveQuestion[];
  answered: number;
  state: MonitorStageState;
  secondsLeft: number | null;
};

/** Teacher-only part of a generated title: "PART 1 — Reading · Target B1 · R-B1-002" → "Target B1 · R-B1-002". */
export function teacherSectionDetail(title: string): string {
  const parts = title.split('·').map((part) => part.trim());
  return parts.length > 1 ? parts.slice(1).join(' · ') : '';
}

/** Parts in order with progress and state, as the student moves through them. */
export function buildMonitorStages(status: AttemptLiveStatus, now = Date.now()): MonitorStage[] {
  const viewingSection = status.questions.find((question) => question.id === status.attempt.viewingQuestionId)?.sectionId ?? null;
  const submitted = status.attempt.status !== 'in_progress';
  let number = 0;
  return [...status.sections].sort((a, b) => a.position - b.position).map((section) => {
    const questions = status.questions.filter((question) => question.sectionId === section.id);
    const studentQuestions = questions.filter((question) => !question.live);
    const answered = studentQuestions.filter((question) => question.answered).length;
    const teacherOnly = studentQuestions.length === 0;
    const left = section.startedAt && !section.completedAt ? secondsLeft(section.expiresAt, now) : null;
    const closed = Boolean(section.completedAt) || (Boolean(section.expiresAt) && left === 0);
    const state: MonitorStageState = teacherOnly ? 'teacher'
      : section.id === viewingSection && !submitted ? 'current'
        : closed || submitted || (!status.assessment.sectionPacing && answered === studentQuestions.length) ? 'done'
          : section.startedAt ? 'open' : 'pending';
    return {
      section, number: teacherOnly ? null : ++number, studentTitle: studentSectionTitle(section.title), teacherDetail: teacherSectionDetail(section.title),
      questions, answered, state, secondsLeft: closed ? null : left,
    };
  });
}

/** Student questions still unanswered, per stage, for the "what is missing" summary. */
export function missingSummary(stages: MonitorStage[]): { stage: MonitorStage; unanswered: number }[] {
  return stages
    .filter((stage) => stage.state !== 'teacher' && stage.state !== 'done')
    .map((stage) => ({ stage, unanswered: stage.questions.filter((question) => !question.live && !question.answered).length }))
    .filter((entry) => entry.unanswered > 0 || entry.stage.state === 'pending');
}

export const EVENT_LABELS: Record<string, string> = {
  tab_blur: 'Saiu da janela da prova',
  tab_focus: 'Voltou para a prova',
  fullscreen_exit: 'Saiu da tela cheia',
  paste_detected: 'Colou texto',
  copy_detected: 'Copiou texto',
  drop_detected: 'Arrastou texto para a resposta',
  bulk_insert_detected: 'Inseriu muito texto de uma vez',
  network_disconnect: 'Perdeu a conexão',
  network_reconnect: 'Reconectou',
  session_conflict: 'Abriu a prova em outro dispositivo',
  resumed: 'Retomou a prova',
};

export function eventDetail(event: { type: string; metadata: Record<string, unknown> }): string {
  const duration = Number(event.metadata.durationMs);
  if (event.type === 'tab_focus' && Number.isFinite(duration)) return `fora por ${Math.max(1, Math.round(duration / 1000))} s`;
  const length = Number(event.metadata.pasteLength ?? event.metadata.length);
  if (Number.isFinite(length) && length > 0) return `${length} caracteres`;
  return '';
}
