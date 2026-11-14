"""Assigned assessments: state, filters, order and counts (the "Provas atribuídas" panel)."""
from __future__ import annotations

from datetime import datetime

from langspot_linux.model import parse_time


ASSIGNMENT_COLUMNS = 'id,assessment_id,student_id,available_from,due_at,attempt_limit,status,created_at'
ASSIGNMENT_STATES = {'scheduled': 'Agendada', 'waiting': 'Aguardando o aluno', 'overdue': 'Prazo vencido', 'in_progress': 'Em andamento',
                     'to_review': 'Para corrigir', 'completed': 'Concluída', 'expired': 'Expirada'}
ASSIGNMENT_STATE_KIND = {'scheduled': 'accent', 'waiting': 'success', 'overdue': 'error', 'in_progress': 'warning', 'to_review': 'accent',
                         'completed': 'success', 'expired': 'error'}
ASSIGNMENT_FILTERS = [('all', 'Todas'), ('open', 'Não iniciadas'), ('in_progress', 'Em andamento'), ('to_review', 'Para corrigir'), ('done', 'Concluídas')]
NOT_STARTED = ('assigned', 'available')
_STATE_ORDER = ['overdue', 'waiting', 'scheduled', 'in_progress', 'to_review', 'completed', 'expired']


def assignment_state(row: dict, now: datetime | None = None) -> str:
    """Same as the website's assignmentState."""
    status = row.get('status')
    if status == 'started':
        return 'in_progress'
    if status in ('submitted', 'grading'):
        return 'to_review'
    if status in ('completed', 'expired'):
        return status
    now = now or datetime.now().astimezone()
    due, available = parse_time(row.get('due_at')), parse_time(row.get('available_from'))
    if due and due < now:
        return 'overdue'
    if available and available > now:
        return 'scheduled'
    return 'waiting'


def is_not_started(row: dict) -> bool:
    return row.get('status') in NOT_STARTED


def matches_assignment_filter(state: str, key: str) -> bool:
    if key == 'all':
        return True
    if key == 'open':
        return state in ('scheduled', 'waiting', 'overdue')
    if key == 'done':
        return state in ('completed', 'expired')
    return state == key


def sort_assignments(rows: list[dict], now: datetime | None = None) -> list[dict]:
    newest = sorted(rows, key=lambda row: row.get('created_at') or '', reverse=True)
    return sorted(newest, key=lambda row: (_STATE_ORDER.index(assignment_state(row, now)), row.get('due_at') or '9999'))


def assignment_counts(rows: list[dict]) -> dict[str, tuple[int, int]]:
    """assessment id → (assignments, not started)."""
    counts: dict[str, tuple[int, int]] = {}
    for row in rows:
        total, waiting = counts.get(row['assessment_id'], (0, 0))
        counts[row['assessment_id']] = (total + 1, waiting + (1 if is_not_started(row) else 0))
    return counts


def assignment_details(row: dict, now: datetime | None = None) -> str:
    state = assignment_state(row, now)
    fmt = lambda value: parse_time(value).astimezone().strftime('%d/%m, %H:%M')  # noqa: E731
    available = row.get('available_from')
    parts = [(f'disponível em {fmt(available)}' if state == 'scheduled' else f'disponível desde {fmt(available)}') if available else 'disponível desde a atribuição',
             f'prazo {fmt(row["due_at"])}' if row.get('due_at') else 'sem prazo',
             f'{row.get("attempt_limit") or 1} tentativa' + ('' if (row.get('attempt_limit') or 1) == 1 else 's')]
    if row.get('created_at'):
        parts.append(f'atribuída em {fmt(row["created_at"])}')
    return ' · '.join(parts)
