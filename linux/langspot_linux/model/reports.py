"""Period and student reports (same formulas as the web app)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from .finance import SKILLS
from .lessons import Lesson


def percent(part: int, whole: int) -> int:
    return round(part / whole * 100) if whole else 0


@dataclass
class PeriodStats:
    lessons: int
    completed: int
    scheduled: int
    cancelled: int
    completion_rate: int
    attendance_rate: int
    tasks: int
    delivered: int
    task_rate: int
    average_grade: int | None
    study_minutes: int


def period_stats(lessons: list[Lesson], tasks: list[dict]) -> PeriodStats:
    completed = [lesson for lesson in lessons if lesson.status == 'completed']
    marked = [lesson for lesson in completed if lesson.attendance in ('presente', 'ausente')]
    delivered = [task for task in tasks if (task.get('status') or 'pending') != 'pending']
    graded = [float(task['grade']) for task in tasks if task.get('grade') is not None]
    return PeriodStats(
        lessons=len(lessons), completed=len(completed), scheduled=sum(1 for lesson in lessons if lesson.status == 'scheduled'),
        cancelled=sum(1 for lesson in lessons if lesson.status == 'cancelled'), completion_rate=percent(len(completed), len(lessons)),
        attendance_rate=percent(sum(1 for lesson in marked if lesson.attendance == 'presente'), len(marked)),
        tasks=len(tasks), delivered=len(delivered), task_rate=percent(len(delivered), len(tasks)),
        average_grade=round(sum(graded) / len(graded)) if graded else None, study_minutes=sum(lesson.duration for lesson in completed))


def lessons_in_period(lessons: list[Lesson], start: date, end: date) -> list[Lesson]:
    return [lesson for lesson in lessons if start <= lesson.starts_at.date() <= end]


def tasks_in_period(tasks: list[dict], start: date, end: date) -> list[dict]:
    """Web rule: created on or before the end, due on or after the start."""
    return [task for task in tasks if (task.get('created_at') or '')[:10] <= end.isoformat() and (task.get('due_date') or '') >= start.isoformat()]


def study_time(minutes: int) -> str:
    if not minutes:
        return '0h'
    hours, rest = divmod(minutes, 60)
    return f'{hours}h {rest}min' if rest else f'{hours}h'


def skill_extremes(skills: dict) -> tuple[str, str] | None:
    values = {skill: float(skills[skill]) for skill in SKILLS if skill in skills}
    if not values:
        return None
    return max(values, key=values.get), min(values, key=values.get)


def report_text(name: str, level: str, goal: str, skills: dict, start: date, end: date, stats: PeriodStats, notes: list[str]) -> str:
    """Plain-text summary to paste in WhatsApp or e-mail."""
    lines = [f'Relatório de progresso — {name}', f'Período: {start:%d/%m/%Y} a {end:%d/%m/%Y}', f'Nível: {level or "—"}']
    if goal:
        lines.append(f'Objetivo: {goal}')
    extremes = skill_extremes(skills)
    if extremes:
        best, attention = extremes
        lines += [f'Habilidade destaque: {best} ({round(float(skills[best]))}%)', f'Ponto de atenção: {attention} ({round(float(skills[attention]))}%)']
    lines += [f'Aulas concluídas no período: {stats.completed}', f'Frequência: {stats.attendance_rate}%',
              f'Tempo de estudo: {study_time(stats.study_minutes)}', f'Tarefas entregues: {stats.delivered}/{stats.tasks}']
    if stats.average_grade is not None:
        lines.append(f'Média das tarefas: {stats.average_grade}')
    if notes:
        lines.append('Observações das aulas: ' + ' | '.join(notes[-3:]))
    return '\n'.join(lines)


def month_range(today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    start = today.replace(day=1)
    following = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return start, following - timedelta(days=1)
