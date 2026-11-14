"""Rubric grading of productive answers (same formulas as the web app)."""
from __future__ import annotations

import re

from .common import CRITERION_LABELS


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
