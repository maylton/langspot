import type { ReviewQueueItem } from './types';

export type ReviewQueueFilters = { studentId: string; skill: string };

export function filterReviewQueue(items: ReviewQueueItem[], filters: ReviewQueueFilters): ReviewQueueItem[] {
  return items.filter((item) => (filters.studentId === 'all' || item.studentId === filters.studentId) && (filters.skill === 'all' || item.skill === filters.skill));
}

/** Item to open after `currentId` is reviewed: the next one in the list, else the previous one. */
export function nextReviewItemId(items: ReviewQueueItem[], currentId: string): string | null {
  const index = items.findIndex((item) => item.responseId === currentId);
  if (index < 0) return items[0]?.responseId ?? null;
  return items[index + 1]?.responseId ?? items[index - 1]?.responseId ?? null;
}

export function countWords(text: string | null | undefined): number {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

export function hoursWaiting(submittedAt: string | null, now = Date.now()): number | null {
  if (!submittedAt) return null;
  return Math.max(0, Math.floor((now - new Date(submittedAt).getTime()) / 3_600_000));
}

export function formatWaiting(submittedAt: string | null, now = Date.now()): string {
  const hours = hoursWaiting(submittedAt, now);
  if (hours === null) return '';
  if (hours < 1) return 'há menos de 1 h';
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}
