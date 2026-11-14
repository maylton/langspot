"""Lessons: rows to Lesson, grouping by day."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from .common import LESSON_STATUS, local, parse_time


@dataclass
class Lesson:
    id: str
    student_id: str
    student_name: str
    starts_at: datetime
    duration: int
    topic: str
    online_url: str
    status: str
    notes: str = ''
    homework: str = ''
    attendance: str = ''
    skill_scores: dict = field(default_factory=dict)
    strengths: str = ''
    improvements: str = ''

    @property
    def ends_at(self) -> datetime:
        return self.starts_at + timedelta(minutes=self.duration)

    @property
    def status_label(self) -> str:
        return LESSON_STATUS.get(self.status, self.status)


def lessons_from_rows(rows: list[dict], names: dict[str, str]) -> list[Lesson]:
    lessons = []
    for row in rows:
        starts = parse_time(row.get('starts_at'))
        if starts is None:
            continue
        lessons.append(Lesson(id=row['id'], student_id=row.get('student_id') or '', student_name=names.get(row.get('student_id') or '', 'Aluno'),
                              starts_at=local(starts), duration=int(row.get('duration_minutes') or 60), topic=row.get('topic') or 'Aula',
                              online_url=row.get('online_url') or '', status=row.get('status') or 'scheduled',
                              notes=row.get('notes') or '', homework=row.get('homework') or '',
                              attendance=row.get('attendance') or '', skill_scores=row.get('skill_scores') or {},
                              strengths=row.get('strengths') or '', improvements=row.get('improvements') or ''))
    return sorted(lessons, key=lambda lesson: lesson.starts_at)


def group_by_day(lessons: list[Lesson]) -> list[tuple[date, list[Lesson]]]:
    groups: dict[date, list[Lesson]] = {}
    for lesson in lessons:
        groups.setdefault(lesson.starts_at.date(), []).append(lesson)
    return sorted(groups.items())


def initials(name: str) -> str:
    parts = [part for part in re.split(r'\s+', name.strip()) if part]
    if not parts:
        return '?'
    return (parts[0][0] + (parts[-1][0] if len(parts) > 1 else '')).upper()
