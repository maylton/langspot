import { DbLesson } from '../supabase';

export function portalCalendarUrl(lesson: DbLesson) {
  const start = new Date(lesson.starts_at);
  const end = new Date(start.getTime() + lesson.duration_minutes * 60000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: lesson.topic, dates: `${stamp(start)}/${stamp(end)}`, details: lesson.online_url ?? '' });
  return `https://calendar.google.com/calendar/render?${params}`;
}
