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


# ---------------------------------------------------------------- money and tasks
def money(value: float) -> str:
    """12345.5 → 'R$ 12.345,50'"""
    text = f'{value:,.2f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return f'R$ {text}'


PAYMENT_LABELS = {'pending': 'Pendente', 'paid': 'Paga', 'overdue': 'Atrasada'}


def payment_status(row: dict, today: date | None = None) -> str:
    """Same rule as the web app: a pending charge past its due date is overdue."""
    today = today or date.today()
    status = row.get('status') or 'pending'
    if status == 'pending' and (row.get('due_date') or '9999-12-31') < today.isoformat():
        return 'overdue'
    return status


def payment_totals(rows: list[dict], today: date | None = None) -> dict:
    totals = {'paid': 0.0, 'open': 0.0, 'overdue': 0.0, 'count': len(rows)}
    for row in rows:
        amount = float(row.get('amount') or 0)
        status = payment_status(row, today)
        if status == 'paid':
            totals['paid'] += amount
        else:
            totals['open'] += amount
            if status == 'overdue':
                totals['overdue'] += amount
    return totals


def short_date(value: str | None) -> str:
    """'2026-11-12' → '12/11/2026'"""
    if not value:
        return '—'
    year, month, day = value[:10].split('-')
    return f'{day}/{month}/{year}'


TASK_LABELS = {'pending': 'Pendente', 'submitted': 'Entregue', 'reviewed': 'Corrigida'}
MATERIAL_TYPES = ['PDF', 'Documento', 'Apresentação', 'Imagem', 'Vídeo', 'Áudio', 'Link', 'Atividade']
MATERIAL_LEVELS = ['Todos', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
SKILLS = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation']
UPLOAD_EXTENSIONS = {'.pdf': ('application/pdf', 'PDF'),
                     '.docx': ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Documento'),
                     '.pptx': ('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Apresentação'),
                     '.jpg': ('image/jpeg', 'Imagem'), '.jpeg': ('image/jpeg', 'Imagem'), '.png': ('image/png', 'Imagem'),
                     '.webp': ('image/webp', 'Imagem'), '.gif': ('image/gif', 'Imagem')}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def upload_kind(filename: str, size: int) -> tuple[str, str]:
    """(mime type, material type) for an allowed upload; raises ValueError otherwise."""
    suffix = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if suffix not in UPLOAD_EXTENSIONS:
        raise ValueError('Escolha um PDF, DOCX, PPTX ou imagem.')
    if size > MAX_UPLOAD_SIZE:
        raise ValueError('O arquivo passa de 10 MB.')
    return UPLOAD_EXTENSIONS[suffix]


def safe_filename(filename: str) -> str:
    """Same as the web app: drop accents, then any other character becomes '-'."""
    import unicodedata
    plain = ''.join(char for char in unicodedata.normalize('NFD', filename) if unicodedata.category(char) != 'Mn')
    return re.sub(r'[^a-zA-Z0-9._-]', '-', plain)


# ---------------------------------------------------------------- reports (same formulas as the web app)
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


# ---------------------------------------------------------------- calendar (same as the web agenda)
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


# ---------------------------------------------------------------------- students: skills, progress, streaks
STREAK_MILESTONES = [(3, 'Primeiros passos'), (7, 'Uma semana firme'), (14, 'Ritmo consistente'), (30, 'Hábito de estudo'), (100, 'Centenário')]


def normalize_skills(value) -> dict[str, float]:
    """Same as the web app: every skill present, 50 when missing, clamped to 0–100."""
    skills = {skill: 50.0 for skill in SKILLS}
    if isinstance(value, dict):
        for skill in SKILLS:
            try:
                skills[skill] = max(0.0, min(100.0, float(value[skill])))
            except (KeyError, TypeError, ValueError):
                pass
    return skills


def progress_of(skills) -> int:
    """A student's overall progress: the rounded mean of the normalised skills."""
    values = normalize_skills(skills)
    return round(sum(values.values()) / len(values))


def calculate_streak(dates: list[str], today: date | None = None) -> tuple[int, int]:
    """(current, best) study streak in days from ISO dates (activities and protected days), as the web app."""
    days = sorted({date.fromisoformat(str(value)[:10]) for value in dates if value})
    if not days:
        return 0, 0
    best = running = 1
    for previous, current in zip(days, days[1:]):
        running = running + 1 if (current - previous).days == 1 else 1
        best = max(best, running)
    today = today or date.today()
    if (today - days[-1]).days > 1:
        return 0, best
    current = 1
    for index in range(len(days) - 1, 0, -1):
        if (days[index] - days[index - 1]).days != 1:
            break
        current += 1
    return current, best


def achievements(best_streak: int) -> int:
    return sum(1 for days, _title in STREAK_MILESTONES if best_streak >= days)


def skill_average(skill_sets: list[dict], skill: str) -> int:
    return round(sum(normalize_skills(skills)[skill] for skills in skill_sets) / len(skill_sets)) if skill_sets else 0


# ---------------------------------------------------------------------- account
def subscription_active(subscription: dict | None, now: datetime | None = None) -> bool:
    if not subscription:
        return False
    now = now or datetime.now(timezone.utc)
    if subscription.get('plan') == 'owner' or subscription.get('status') == 'active':
        return True
    ends = parse_time(subscription.get('trial_ends_at'))
    return subscription.get('status') == 'trialing' and ends is not None and ends > now


def account_access(subscription: dict | None, now: datetime | None = None) -> tuple[str, str, str] | None:
    """(label, description, kind) like the website's account status card; kind is success / accent / error."""
    if not subscription:
        return None
    now = now or datetime.now(timezone.utc)
    active = subscription_active(subscription, now)
    if subscription.get('plan') == 'owner':
        return 'Acesso permanente', 'Sua conta tem acesso completo ao LangSpot, sem data de expiração.', 'success'
    status = subscription.get('status')
    if status == 'trialing':
        ends = parse_time(subscription.get('trial_ends_at'))
        days = max(0, -(-int((ends - now).total_seconds()) // 86400)) if ends else 0
        title = f'Teste gratuito · {days} dia(s) restante(s)'
    else:
        title = {'active': 'Plano ativo', 'pending_confirmation': 'Confirmação pendente'}.get(status, 'Acesso expirado')
    if status == 'pending_confirmation':
        description = 'Confirme seu e-mail para iniciar os 30 dias de teste gratuito.'
    elif active:
        description = 'Todos os recursos do LangSpot estão liberados para esta conta.'
    else:
        description = 'Seus dados continuam disponíveis, mas novas alterações exigem uma assinatura ativa.'
    return title, description, 'accent' if active else 'error'


def teacher_active(teacher: dict, now: datetime | None = None) -> bool:
    return subscription_active({'plan': teacher.get('plan'), 'status': teacher.get('status'), 'trial_ends_at': teacher.get('trial_ends_at')}, now)
