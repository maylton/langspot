"""Pure helpers shared by the pages (no GTK): formatting, CEFR scale, rubric score, live stages.

Ported from the web app (src/domains/assessments/*) so both apps grade and describe attempts alike.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

CEFR_LEVELS = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']

SKILL_LABELS = {
    'reading': 'Reading', 'listening': 'Listening', 'writing': 'Writing', 'speaking': 'Speaking',
    'spoken_production': 'Spoken Production', 'spoken_interaction': 'Spoken Interaction',
    'mediation': 'Mediation', 'language_use': 'Language Use', 'grammar': 'Grammar', 'vocabulary': 'Vocabulary',
    'use_of_english': 'Language Use',
}

CRITERION_LABELS = {
    'task_achievement': 'Cumprimento da tarefa', 'range': 'Repertório', 'accuracy': 'Correção',
    'grammatical_accuracy': 'Correção gramatical', 'lexical_control': 'Controle do vocabulário',
    'organisation_cohesion': 'Organização e coesão', 'organisation': 'Organização',
    'register_pragmatic_appropriacy': 'Adequação ao contexto', 'fluency': 'Fluência', 'coherence': 'Coerência',
    'interaction': 'Interação', 'pronunciation_phonological_control': 'Pronúncia',
    'information_selection': 'Seleção de informações', 'accuracy_of_meaning': 'Precisão do significado',
    'reformulation': 'Reformulação', 'audience_appropriacy': 'Adequação ao leitor', 'language_control': 'Controle da língua',
}

EVENT_LABELS = {
    'tab_blur': 'Saiu da janela da prova', 'tab_focus': 'Voltou para a prova', 'fullscreen_exit': 'Saiu da tela cheia',
    'paste_detected': 'Colou texto', 'copy_detected': 'Copiou texto', 'drop_detected': 'Arrastou texto para a resposta',
    'bulk_insert_detected': 'Inseriu muito texto de uma vez', 'network_disconnect': 'Perdeu a conexão',
    'network_reconnect': 'Reconectou', 'session_conflict': 'Abriu a prova em outro dispositivo', 'resumed': 'Retomou a prova',
}

LESSON_STATUS = {'scheduled': 'Agendada', 'completed': 'Concluída', 'cancelled': 'Cancelada'}
WEEKDAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']
MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']


# ---------------------------------------------------------------- dates
def parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.replace('Z', '+00:00')
    # PostgreSQL may send 5-digit fractions or a space separator.
    text = text.replace(' ', 'T', 1)
    match = re.match(r'^(.*T\d\d:\d\d:\d\d)(\.\d+)?(.*)$', text)
    if match:
        fraction = (match.group(2) or '')[:7].ljust(7, '0') if match.group(2) else ''
        text = match.group(1) + fraction + match.group(3)
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def local(value: datetime) -> datetime:
    return value.astimezone()


def relative_time(value: str | datetime | None, now: datetime | None = None) -> str:
    moment = parse_time(value) if isinstance(value, str) or value is None else value
    if moment is None:
        return '—'
    now = now or datetime.now(timezone.utc)
    seconds = max(0, round((now - moment).total_seconds()))
    if seconds < 45:
        return 'agora'
    minutes = round(seconds / 60)
    if minutes < 60:
        return f'há {minutes} min'
    hours = minutes // 60
    if hours < 24:
        rest = minutes % 60
        return f'há {hours} h' + (f' {rest} min' if rest else '')
    days = hours // 24
    return f'há {days} dia' + ('' if days == 1 else 's')


def day_label(day: date, today: date | None = None) -> str:
    today = today or date.today()
    if day == today:
        return 'Hoje'
    if day == today + timedelta(days=1):
        return 'Amanhã'
    if day == today - timedelta(days=1):
        return 'Ontem'
    return f'{WEEKDAYS[day.weekday()].capitalize()}, {day.day} {MONTHS[day.month - 1]}'


def short_datetime(value: str | None) -> str:
    moment = parse_time(value)
    if moment is None:
        return '—'
    moment = local(moment)
    return f'{moment.day:02d}/{moment.month:02d}/{moment.year} às {moment:%H:%M}'


def clock(seconds: int | None) -> str:
    if seconds is None:
        return 'sem limite'
    hours, rest = divmod(max(0, int(seconds)), 3600)
    minutes, secs = divmod(rest, 60)
    return f'{hours}:{minutes:02d}:{secs:02d}' if hours else f'{minutes:02d}:{secs:02d}'


# ---------------------------------------------------------------- lessons
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
                              notes=row.get('notes') or '', homework=row.get('homework') or ''))
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


# ---------------------------------------------------------------- grading
def rubric_score(criteria: list[dict], scores: dict[str, float], max_score: float) -> float:
    """Same as the web app: earned / rubric maximum × the response's maximum score."""
    rubric_max = sum(float(criterion.get('maxScore') or 0) for criterion in criteria)
    if not rubric_max or max_score <= 0:
        return 0.0
    earned = 0.0
    for criterion in criteria:
        value = scores.get(criterion['key'])
        if value is None or value < 0 or value > float(criterion.get('maxScore') or 0):
            raise ValueError(f'Escolha um nível para {criterion_label(criterion)}.')
        earned += float(value)
    return round(earned / rubric_max * max_score, 4)


def criterion_label(criterion: dict) -> str:
    return CRITERION_LABELS.get(criterion.get('key', ''), criterion.get('label') or criterion.get('key', ''))


def word_count(text: str | None) -> int:
    return len(re.findall(r"[\wÀ-ÿ'’-]+", text or ''))


def student_section_title(title: str) -> str:
    """'PART 1 — Reading · Floor A2 · R-A2-002' → 'Parte 1 — Reading' (what the student sees)."""
    match = re.match(r'^PART (\d+) — ([^·]+?)\s*(?:·.*)?$', title or '')
    return f'Parte {match.group(1)} — {match.group(2).strip()}' if match else (title or '')


def teacher_section_detail(title: str) -> str:
    parts = [part.strip() for part in (title or '').split('·')]
    return ' · '.join(parts[1:]) if len(parts) > 1 else ''


def discarded_recordings(events: list[dict], question_id: str) -> int:
    return sum(1 for event in events if event.get('type') == 'recording_discarded' and (event.get('metadata') or {}).get('questionId') == question_id)


# ---------------------------------------------------------------- live monitor
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
