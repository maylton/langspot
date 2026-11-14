"""Students: skills, progress, study streaks and achievements."""
from __future__ import annotations

from datetime import date

from .finance import SKILLS


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
