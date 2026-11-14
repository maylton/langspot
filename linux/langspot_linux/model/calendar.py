"""Agenda calendar (same as the web agenda) and lesson records."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from .common import MONTHS
from .lessons import Lesson


MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
ATTENDANCE_LABELS = {'presente': 'Presente', 'ausente': 'Ausente', 'remarcada': 'Remarcada'}
DURATIONS = [30, 45, 50, 60, 90]
RECORD_TEMPLATES = {
    'notes': 'Conteúdo trabalhado:\n- \n\nAtividades realizadas:\n- \n\nParticipação e comportamento durante a aula:\n- ',
    'strengths': 'O aluno demonstrou bom desempenho em:\n- \n\nEvoluções percebidas:\n- \n\nExemplos observados na aula:\n- ',
    'improvements': 'Pontos que precisam de reforço:\n- \n\nEstratégia sugerida para as próximas aulas:\n- \n\nObservações para acompanhamento:\n- ',
    'homework': 'Atividade para casa:\n- \n\nObjetivo da tarefa:\n- \n\nOrientações para entrega ou prática:\n- ',
}


def week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def week_days(day: date) -> list[date]:
    start = week_start(day)
    return [start + timedelta(days=offset) for offset in range(7)]


def month_grid(day: date) -> list[date]:
    """42 days (6 weeks from Monday) covering the month, like the web calendar."""
    start = week_start(day.replace(day=1))
    return [start + timedelta(days=offset) for offset in range(42)]


def period_label(view: str, day: date) -> str:
    if view == 'month':
        return f'{MONTH_NAMES[day.month - 1].capitalize()} de {day.year}'
    days = week_days(day)
    first, last = days[0], days[-1]
    if first.month == last.month:
        return f'{first.day}–{last.day} de {MONTH_NAMES[last.month - 1]} de {last.year}'
    return f'{first.day} {MONTHS[first.month - 1]} – {last.day} {MONTHS[last.month - 1]} {last.year}'


def shift_period(view: str, day: date, direction: int) -> date:
    if view == 'week':
        return day + timedelta(days=7 * direction)
    month = day.month - 1 + direction
    return date(day.year + month // 12, month % 12 + 1, 1)


def google_calendar_url(lesson: Lesson) -> str:
    import urllib.parse
    def stamp(moment: datetime) -> str:
        return moment.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    details = 'Aula de idiomas no LangSpot.' + (f'\n\nLink da aula: {lesson.online_url}' if lesson.online_url else '')
    params = {'action': 'TEMPLATE', 'text': f'{lesson.topic} · {lesson.student_name}', 'dates': f'{stamp(lesson.starts_at)}/{stamp(lesson.ends_at)}',
              'details': details, 'location': lesson.online_url or ''}
    return 'https://calendar.google.com/calendar/render?' + urllib.parse.urlencode(params)


def lesson_record_values(starts: datetime, duration: int, topic: str, online_url: str, attendance: str, texts: dict, skills: dict) -> dict:
    """Same payload as the web app's lessonRecordToDb (completes or edits a lesson record)."""
    return {'starts_at': starts.isoformat(), 'duration_minutes': duration, 'topic': topic, 'online_url': online_url or None, 'status': 'completed',
            'notes': texts.get('notes', ''), 'strengths': texts.get('strengths', ''), 'improvements': texts.get('improvements', ''),
            'homework': texts.get('homework', ''), 'attendance': attendance, 'skill_scores': {key: int(value) for key, value in skills.items()}}
