"""Live monitor of an attempt in progress: presence, stages, what is missing."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from .common import parse_time
from .grading import student_section_title, teacher_section_detail


def presence_of(last_seen: str | None, last_activity: str | None, now: datetime | None = None) -> str:
    """online (heartbeat in the last 60 s), recent (activity in 5 min) or away."""
    now = now or datetime.now(timezone.utc)
    seen = parse_time(last_seen)
    if seen and (now - seen).total_seconds() <= 60:
        return 'online'
    moments = [moment for moment in (seen, parse_time(last_activity)) if moment]
    if moments and (now - max(moments)).total_seconds() <= 300:
        return 'recent'
    return 'away'
PRESENCE_LABELS = {'online': 'Na prova agora', 'recent': 'Ativo há pouco', 'away': 'Sem atividade'}
STAGE_LABELS = {'done': 'Concluída', 'current': 'O aluno está aqui', 'open': 'Iniciada', 'pending': 'Não iniciada', 'teacher': 'Com você'}


@dataclass
class Stage:
    section: dict
    number: int | None
    student_title: str
    teacher_detail: str
    questions: list[dict] = field(default_factory=list)
    answered: int = 0
    state: str = 'pending'
    seconds_left: int | None = None


def build_stages(status: dict, now: datetime | None = None) -> list[Stage]:
    now = now or datetime.now(timezone.utc)
    attempt = status.get('attempt') or {}
    questions = status.get('questions') or []
    viewing = attempt.get('viewingQuestionId')
    viewing_section = next((question.get('sectionId') for question in questions if question.get('id') == viewing), None)
    submitted = attempt.get('status') != 'in_progress'
    paced = bool((status.get('assessment') or {}).get('sectionPacing'))
    stages: list[Stage] = []
    number = 0
    for section in sorted(status.get('sections') or [], key=lambda item: item.get('position', 0)):
        section_questions = [question for question in questions if question.get('sectionId') == section.get('id')]
        student_questions = [question for question in section_questions if not question.get('live')]
        answered = sum(1 for question in student_questions if question.get('answered'))
        teacher_only = not student_questions
        expires = parse_time(section.get('expiresAt'))
        left = None
        if section.get('startedAt') and not section.get('completedAt') and expires:
            left = max(0, int((expires - now).total_seconds()))
        closed = bool(section.get('completedAt')) or (expires is not None and left == 0)
        if teacher_only:
            state = 'teacher'
        elif section.get('id') == viewing_section and not submitted:
            state = 'current'
        elif closed or submitted or (not paced and answered == len(student_questions)):
            state = 'done'
        elif section.get('startedAt'):
            state = 'open'
        else:
            state = 'pending'
        if not teacher_only:
            number += 1
        stages.append(Stage(section=section, number=None if teacher_only else number, student_title=student_section_title(section.get('title', '')),
                            teacher_detail=teacher_section_detail(section.get('title', '')), questions=section_questions,
                            answered=answered, state=state, seconds_left=None if closed else left))
    return stages


def missing_summary(stages: list[Stage]) -> list[tuple[Stage, int]]:
    result = []
    for stage in stages:
        if stage.state in ('teacher', 'done'):
            continue
        unanswered = sum(1 for question in stage.questions if not question.get('live') and not question.get('answered'))
        if unanswered or stage.state == 'pending':
            result.append((stage, unanswered))
    return result


def event_detail(event: dict) -> str:
    metadata = event.get('metadata') or {}
    duration = metadata.get('durationMs')
    if event.get('type') == 'tab_focus' and isinstance(duration, (int, float)):
        return f'fora por {max(1, round(duration / 1000))} s'
    length = metadata.get('pasteLength', metadata.get('length'))
    if isinstance(length, (int, float)) and length > 0:
        return f'{int(length)} caracteres'
    return ''
