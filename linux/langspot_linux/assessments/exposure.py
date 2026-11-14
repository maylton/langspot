"""Form seeds, deletion warnings and what a student has already seen."""
from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import date

from langspot_linux.model import local_date
from .labels import CEFR_SKILLS, label_of


def student_form_seed(name: str, today: date | None = None, random: str | None = None) -> str:
    slug = unicodedata.normalize('NFD', name)
    slug = ''.join(char for char in slug if not unicodedata.combining(char)).lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')[:40] or 'aluno'
    return f'{slug}-{(today or date.today()).isoformat()}-{(random or uuid.uuid4().hex[:4]).upper()}'


def new_form_seed(today: date | None = None) -> str:
    return f'forma-{(today or date.today()).isoformat()}-{uuid.uuid4().hex[:4].upper()}'


def _students(count: int) -> str:
    return f'{count} aluno{"" if count == 1 else "s"}'


def deletion_warnings(impact: dict | None) -> list[str]:
    if not impact:
        return []
    warnings = []
    submitted, in_progress, assignments = impact.get('submittedStudents') or 0, impact.get('inProgressStudents') or 0, impact.get('assignments') or 0
    if submitted:
        warnings.append(f'As provas enviadas por {_students(submitted)} e os resultados delas serão apagados.')
    if in_progress:
        one = in_progress == 1
        warnings.append(f'{_students(in_progress)} {"está" if one else "estão"} fazendo esta prova agora e {"perderá" if one else "perderão"} as respostas.')
    if assignments and not submitted and not in_progress:
        warnings.append(f'A atribuição para {_students(assignments)} também será removida.')
    return warnings
TEXT_SKILLS = {'reading', 'listening'}
PRODUCTIVE_SKILLS = {'writing', 'spoken_production', 'spoken_interaction', 'speaking', 'mediation'}


def summarize_exposure(exposure: dict) -> dict:
    texts: dict[str, dict] = {}
    tasks: list[dict] = []
    other = 0
    for item in exposure.get('fixed') or []:
        if item.get('skill') in TEXT_SKILLS and item.get('taskletKey'):
            texts.setdefault(item['taskletKey'], {'key': item['taskletKey'], 'title': item.get('taskletTitle'), 'seenAt': item.get('seenAt'),
                                                  'assessmentTitle': item.get('assessmentTitle')})
        elif item.get('skill') in PRODUCTIVE_SKILLS:
            tasks.append({'key': item.get('itemKey'), 'skill': item.get('skill'), 'seenAt': item.get('seenAt'), 'assessmentTitle': item.get('assessmentTitle')})
        else:
            other += 1
    pools = exposure.get('pools') or []
    short = [{'sectionTitle': pool.get('sectionTitle'), 'unseen': pool.get('unseen'), 'drawCount': pool.get('drawCount')}
             for pool in pools if (pool.get('unseen') or 0) < (pool.get('drawCount') or 0)]
    return {'texts': list(texts.values()), 'tasks': tasks, 'otherItems': other, 'shortPools': short, 'freshPools': len(pools) - len(short),
            'clean': not texts and not tasks and not other and not short}


def exposure_lines(exposure: dict) -> list[str]:
    summary = summarize_exposure(exposure)
    lines = [f'Texto {"“" + text["title"] + "”" if text["title"] else text["key"]} ({text["key"]}) — em “{text["assessmentTitle"]}”, {local_date(text["seenAt"])}'
             for text in summary['texts']]
    lines += [f'Tarefa de {label_of(CEFR_SKILLS + [("speaking", "Speaking")], task["skill"])} {task["key"]} — em “{task["assessmentTitle"]}”, {local_date(task["seenAt"])}'
              for task in summary['tasks']]
    if summary['otherItems']:
        lines.append(f'{summary["otherItems"]} outra(s) questão(ões) fixa(s) repetida(s).')
    lines += [f'{pool["sectionTitle"]}: só {pool["unseen"]} questão(ões) nova(s) para sortear {pool["drawCount"]}; o restante será repetido.'
              for pool in summary['shortPools']]
    return lines


def seen_index(seen: list[dict]) -> tuple[dict, dict]:
    """buildSeenIndex: ({itemKey: mark}, {taskletKey: latest mark})."""
    items: dict[str, dict] = {}
    texts: dict[str, dict] = {}
    for entry in seen:
        mark = {'seenAt': entry.get('seenAt') or '', 'assessmentTitle': entry.get('assessmentTitle') or ''}
        items.setdefault(entry.get('itemKey'), mark)
        key = entry.get('taskletKey')
        if key and (key not in texts or texts[key]['seenAt'] < mark['seenAt']):
            texts[key] = mark
    return items, texts
