import { toDateInput } from '../lib/dates';
import { Award } from 'lucide-react';

export const streakMilestones = [
  { days: 3, title: 'Primeiros passos' },
  { days: 7, title: 'Uma semana firme' },
  { days: 14, title: 'Ritmo consistente' },
  { days: 30, title: 'Hábito de estudo' },
  { days: 100, title: 'Centenário' },
];

export type AchievementDefinition = {
  id: string;
  category: string;
  title: string;
  description: string;
  target: number;
  current: number;
  icon: typeof Award;
};

function dateKeyDistance(later: string, earlier: string) {
  return Math.round((Date.parse(`${later}T12:00:00Z`) - Date.parse(`${earlier}T12:00:00Z`)) / 86400000);
}

export function calculateStreak(activityDates: string[]) {
  const dates = [...new Set(activityDates)].sort();
  let best = dates.length ? 1 : 0;
  let running = dates.length ? 1 : 0;
  for (let index = 1; index < dates.length; index += 1) {
    running = dateKeyDistance(dates[index], dates[index - 1]) === 1 ? running + 1 : 1;
    best = Math.max(best, running);
  }
  const last = dates[dates.length - 1];
  if (!last) return { current: 0, best: 0 };
  const today = toDateInput(new Date());
  if (dateKeyDistance(today, last) > 1) return { current: 0, best };
  let current = 1;
  for (let index = dates.length - 1; index > 0 && dateKeyDistance(dates[index], dates[index - 1]) === 1; index -= 1) current += 1;
  return { current, best };
}

export function lastStudyDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return { date: toDateInput(date), label: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }).replace('.', '') };
  });
}
