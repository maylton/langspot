"""Assessment drafts: empty draft, CEFR placement structure, loading and pacing."""
from __future__ import annotations

import uuid

from .labels import CEFR_BASE


def empty_draft() -> dict:
    return {'id': None, 'title': '', 'description': '', 'type': 'custom', 'framework': 'none', 'assessmentMode': 'fixed', 'navigationMode': 'free',
            'levelMin': None, 'levelMax': None, 'timeLimitMinutes': 30, 'maxAttempts': 1, 'randomizeQuestions': False, 'randomizeOptions': False,
            'showResults': 'after_teacher_review', 'sectionPacing': 'none', 'sections': [], 'adaptiveInitialAbility': 5, 'adaptiveMinItems': 4,
            'adaptiveMaxItems': 10, 'adaptiveConfidenceThreshold': 0.65, 'formVersion': 'GENERIC-1.0', 'decisionRuleVersion': 'objective-v1',
            'routingRuleVersion': 'none', 'reportModelVersion': 'standard-report-v1'}


def new_section() -> dict:
    return {'id': str(uuid.uuid4()), 'title': 'Nova seção', 'skill': 'grammar', 'instructions': '', 'weight': 1, 'drawCount': None, 'cefrLevel': None,
            'construct': '', 'taskletKind': 'primary', 'confirmationForSectionId': None, 'questions': []}


def cefr_placement_draft(listening_enabled: bool) -> dict:
    """The website's 'Nivelamento CEFR (estrutura vazia)': A1–C2 sections per skill, no questions."""
    blueprint = [('reading', 4, 'Reading: gist, detail, reference, purpose, inference, attitude and structure'),
                 ('listening', 4, 'Listening: gist, detail, intention, attitude, inference and speaker relationship'),
                 ('language_use', 5, 'Language Use: contextual grammar, vocabulary, collocation, precision and register')]
    sections = [{'id': str(uuid.uuid4()), 'title': f'{skill.replace("_", " ")} {level} · {target} itens', 'skill': skill,
                 'instructions': 'Responda com base apenas no material apresentado.', 'weight': 1, 'drawCount': None, 'cefrLevel': level,
                 'construct': construct, 'taskletKind': 'primary', 'confirmationForSectionId': None, 'questions': []}
                for skill, target, construct in blueprint if listening_enabled or skill != 'listening' for level in CEFR_BASE]
    return {**empty_draft(), 'title': 'CEFR Placement Test', 'description': 'Forma fixa oficial interna para localizar, confirmar e gerar um perfil inicial.',
            'type': 'placement', 'framework': 'cefr', 'navigationMode': 'linear', 'timeLimitMinutes': 50, 'formVersion': 'CEFR-PLACEMENT-FIXED-1.0',
            'decisionRuleVersion': 'cefr-decision-v1', 'routingRuleVersion': 'cefr-routing-v1', 'reportModelVersion': 'cefr-profile-v1', 'sections': sections}


def set_framework(draft: dict, framework: str) -> None:
    cefr = framework == 'cefr'
    draft.update(framework=framework, formVersion='CEFR-PLACEMENT-FIXED-1.0' if cefr else 'GENERIC-1.0',
                 decisionRuleVersion='cefr-decision-v1' if cefr else 'objective-v1', routingRuleVersion='cefr-routing-v1' if cefr else 'none',
                 reportModelVersion='cefr-profile-v1' if cefr else 'standard-report-v1')


def set_mode(draft: dict, mode: str) -> None:
    draft['assessmentMode'] = mode
    if mode == 'adaptive':
        draft.update(navigationMode='linear', showResults='after_teacher_review')


def merge_loaded_draft(draft: dict, metadata: dict | None, pacing: dict | None) -> dict:
    """loadAssessmentDraft: the draft plus its CEFR metadata and section pacing (separate RPCs)."""
    if pacing:
        times = pacing.get('sections') or []
        draft = {**draft, 'sectionPacing': pacing.get('sectionPacing') or 'none',
                 'sections': [{**section, 'timeLimitMinutes': (times[index] if index < len(times) else {}).get('timeLimitMinutes')}
                              for index, section in enumerate(draft.get('sections') or [])]}
    else:
        draft = {**draft, 'sectionPacing': 'none'}
    if not metadata:
        return {**draft, 'framework': 'none', 'formVersion': 'GENERIC-1.0', 'decisionRuleVersion': 'objective-v1', 'routingRuleVersion': 'none',
                'reportModelVersion': 'standard-report-v1'}
    extra = metadata.get('sections') or []
    merged = {**draft, **{key: value for key, value in metadata.items() if key != 'sections'}}
    merged['sections'] = [{**section, **(extra[index] if index < len(extra) else {})} for index, section in enumerate(draft.get('sections') or [])]
    return merged


def pacing_payload(draft: dict) -> dict:
    return {'sectionPacing': draft.get('sectionPacing') or 'none', 'sections': [{'timeLimitMinutes': section.get('timeLimitMinutes')} for section in draft['sections']]}


def paced(draft: dict) -> bool:
    return draft.get('sectionPacing') == 'sections' and draft.get('assessmentMode') == 'fixed'


def has_questions(draft: dict) -> bool:
    return any(section['questions'] for section in draft.get('sections') or [])
