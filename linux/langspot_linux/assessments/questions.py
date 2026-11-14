"""Questions of a draft: bank snapshots, manual questions, live administration and validation (validateAssessmentDraft)."""
from __future__ import annotations

import re
import uuid

from langspot_linux.model import ORDERING_SEPARATOR, split_ordering
from .labels import LEVEL_DIFFICULTY, LIVE_TYPES, PRODUCTIVE_TYPES, RUBRICS


def is_live(snapshot: dict) -> bool:
    return snapshot.get('administration') == 'live'


def can_administer_live(snapshot: dict) -> bool:
    return snapshot.get('type') in LIVE_TYPES


def toggle_live(snapshot: dict) -> None:
    snapshot['administration'] = 'student' if is_live(snapshot) else 'live'


def _clean(values: dict) -> dict:
    """Drops empty optional fields, like JSON.stringify drops undefined."""
    return {key: value for key, value in values.items() if value is not None and value != ''}


def bank_snapshot(row: dict) -> dict:
    """A question_bank row (with question_bank_tasklets) as the AssessmentBankQuestion the website builds."""
    tasklet = row.get('question_bank_tasklets') or {}
    skill = row.get('skill')
    kind = row.get('question_type') or 'multiple_choice'
    constraints = row.get('response_constraints')
    recording = None
    if kind == 'speaking' and constraints:
        recording = constraints.get('max', 0) * (60 if constraints.get('unit') == 'minutes' else 1)
    return _clean({'bankId': row['id'], 'id': row.get('external_id') or row['id'], 'externalId': row.get('external_id'), 'type': kind,
                   'prompt': row.get('prompt') or '', 'options': list(row.get('options') or []), 'answer': row.get('answer') or '',
                   'explanation': row.get('explanation'), 'cefr': row.get('level'),
                   'difficulty': row.get('difficulty') if row.get('difficulty') is not None else LEVEL_DIFFICULTY.get(row.get('level') or ''),
                   'skill': skill, 'subskill': row.get('subskill'), 'taskType': row.get('task_type'), 'topic': row.get('topic'), 'genre': row.get('genre'),
                   'audience': row.get('audience'), 'qualityStatus': row.get('quality_status') or 'draft', 'psychometricStatus': row.get('psychometric_status'),
                   'isPilot': row.get('source_origin') == 'cefr_pilot',
                   'sourceMaterial': tasklet.get('input_text') if skill == 'reading' else row.get('source_material'),
                   'sourceCredit': tasklet.get('source_credit'), 'sourceReference': tasklet.get('source_reference'),
                   'transcript': tasklet.get('input_text') if skill == 'listening' else None,
                   'transcriptVisibility': 'after_submit' if skill == 'listening' else None, 'rubric': row.get('rubric'),
                   'responseConstraints': constraints, 'recordingSeconds': recording, 'primaryEvidence': row.get('primary_evidence'),
                   'taskletId': tasklet.get('external_id'), 'restricted': bool(row.get('restricted'))})


def bank_matches(question: dict, section: dict, framework: str, *, listening_enabled: bool, level: str = 'all', status: str = 'all', search: str = '') -> bool:
    """The website's filter for the 'Adicionar do banco' list of a section."""
    skill = question.get('skill')
    if not listening_enabled and (question.get('type') == 'listening' or skill == 'listening'):
        return False
    if framework == 'cefr' and skill and skill != section['skill'] and not (section['skill'] == 'language_use' and skill in ('grammar', 'vocabulary', 'language_use')):
        return False
    if level != 'all' and question.get('cefr') != level:
        return False
    if status != 'all' and question.get('qualityStatus') != status:
        return False
    needle = search.strip().lower()
    return not needle or any(needle in (question.get(key) or '').lower() for key in ('subskill', 'taskType', 'topic', 'genre', 'prompt'))


def draft_question(snapshot: dict, bank_id: str | None = None) -> dict:
    """A question added to a section (fresh ids, as addBankQuestion / addManualQuestion)."""
    return {'id': str(uuid.uuid4()), 'questionBankId': bank_id, 'weight': 1, 'required': True, 'snapshot': {**snapshot, 'id': str(uuid.uuid4())}}


def manual_snapshot(kind: str, prompt: str, *, options_text: str = '', answer_text: str = '', cefr: str = 'B1', difficulty: int = 5, skill: str | None = None,
                    default_skill: str = 'grammar', subskill: str = '', descriptor_id: str = '', descriptor: str = '', task_type: str = '', topic: str = '',
                    genre: str = '', quality: str = 'draft', source_material: str = '', audio_path: str | None = None, max_plays: int = 2,
                    autoplay: bool = False, transcript: str = '', transcript_visibility: str = 'after_submit', preparation_seconds: int = 30,
                    recording_seconds: int = 120, allow_review: bool = False, question_id: str | None = None) -> dict:
    """The website's ManualQuestionForm: options one per line; ordering/multiple response/matching keys one per line."""
    prompt = prompt.strip()
    if not prompt:
        raise ValueError('Escreva o enunciado.')
    options = [line.strip() for line in options_text.splitlines() if line.strip()]
    if kind == 'true_false':
        options = ['True', 'False']
    answer = answer_text.strip()
    if kind in ('ordering', 'multiple_response', 'matching'):
        answer = ORDERING_SEPARATOR.join(line.strip() for line in answer_text.splitlines() if line.strip())
    if kind in PRODUCTIVE_TYPES:
        options, answer = [], ''
    if kind == 'mediation' and not source_material.strip():
        raise ValueError('Escreva o material-fonte de Mediation.')
    resolved_skill = (skill or default_skill).replace('speaking', 'spoken_production').replace('use_of_english', 'language_use')
    snapshot = {'id': question_id or str(uuid.uuid4()), 'type': kind, 'prompt': prompt, 'options': options, 'answer': answer, 'cefr': cefr,
                'difficulty': difficulty, 'audioPath': audio_path, 'skill': resolved_skill, 'subskill': subskill.strip() or None,
                'descriptorId': descriptor_id.strip() or None, 'operationalDescriptor': descriptor.strip() or None, 'taskType': task_type.strip() or None,
                'topic': topic.strip() or None, 'genre': genre.strip() or None, 'qualityStatus': quality,
                'sourceMaterial': source_material.strip() if kind == 'mediation' else None}
    if kind == 'listening':
        snapshot.update(maxPlays=max_plays, autoplay=autoplay, transcript=transcript, transcriptVisibility=transcript_visibility)
    if kind == 'speaking':
        snapshot.update(preparationSeconds=preparation_seconds, recordingSeconds=recording_seconds, allowReview=allow_review)
    if kind in RUBRICS:
        snapshot['rubric'] = [dict(criterion) for criterion in RUBRICS[kind]]
    return {key: value for key, value in snapshot.items() if value is not None}


def _norm(value: str) -> str:
    return re.sub(r'\s+', ' ', str(value or '').strip().lower())


def validate_question(question: dict) -> list[str]:
    errors = []
    options = [str(option or '').strip() for option in question.get('options') or [] if str(option or '').strip()]
    answer = str(question.get('answer') or '').strip()
    kind = question.get('type')
    if not str(question.get('prompt') or '').strip():
        errors.append('Question prompt is required.')
    normalized = [_norm(option) for option in options]
    if len(set(normalized)) != len(normalized):
        errors.append('Question options must be unique.')
    if not answer and kind not in PRODUCTIVE_TYPES:
        errors.append('A correct answer is required.')
    if kind in ('multiple_choice', 'multiple_response', 'listening', 'matching') and len(options) < 2:
        errors.append('Multiple-choice questions require at least two options.')
    if kind in ('multiple_choice', 'true_false', 'listening') and answer and _norm(answer) not in normalized:
        errors.append('The correct answer must match one of the options.')
    if kind == 'ordering':
        ordered = sorted(_norm(item) for item in split_ordering(answer))
        if len(options) < 2 or sorted(normalized) != ordered:
            errors.append('Ordering answers must contain each option exactly once.')
    if kind == 'matching':
        pairs = split_ordering(answer)
        if len(pairs) < 2 or any('=>' not in pair for pair in pairs):
            errors.append('Matching answers must contain at least two “left => right” pairs.')
    return errors


def validate_draft(draft: dict, *, listening_enabled: bool = True) -> list[tuple[str, str]]:
    """validateAssessmentDraft: [(severity, message)] with severity 'error' or 'warning'."""
    issues: list[tuple[str, str]] = []
    add = lambda severity, message: issues.append((severity, message))  # noqa: E731
    cefr = draft.get('framework') == 'cefr'
    adaptive = draft.get('assessmentMode') == 'adaptive'
    if not (draft.get('title') or '').strip():
        add('error', 'Informe o título da avaliação.')
    if not draft.get('sections'):
        add('error', 'Adicione pelo menos uma seção.')
    if draft.get('timeLimitMinutes') is not None and draft['timeLimitMinutes'] < 1:
        add('error', 'O tempo deve ser de pelo menos 1 minuto.')
    if cefr and not (draft.get('formVersion') or '').strip():
        add('error', 'Informe a versão da form CEFR.')
    if cefr and draft.get('type') not in ('placement', 'diagnostic', 'progress'):
        add('warning', 'Uma avaliação CEFR normalmente deve ser Placement, Diagnostic ou Progress.')
    for index, section in enumerate(draft.get('sections') or [], 1):
        title = section.get('title') or ''
        questions = section.get('questions') or []
        if not title.strip():
            add('error', f'A seção {index} precisa de um título.')
        if not questions:
            add('error', f'A seção “{title or index}” está sem questões.')
        draw = section.get('drawCount')
        if draw is not None and (draw < 1 or draw > len(questions)):
            add('error', f'O pool da seção {index} deve selecionar entre 1 e {len(questions)} questões.')
        if adaptive and len(questions) < draft.get('adaptiveMinItems', 0):
            add('error', f'A seção adaptativa {index} precisa de pelo menos {draft["adaptiveMinItems"]} questões.')
        limit = section.get('timeLimitMinutes')
        if draft.get('sectionPacing') == 'sections' and limit is not None and not 1 <= limit <= 240:
            add('error', f'O tempo da etapa “{title}” deve ficar entre 1 e 240 minutos.')
        if not listening_enabled and section.get('skill') == 'listening':
            add('error', f'A seção “{title}” é de Listening, que está desativado no momento.')
        if cefr and not section.get('cefrLevel'):
            add('error', f'Informe o nível CEFR do tasklet “{title}”.')
        if cefr and not (section.get('construct') or '').strip():
            add('error', f'Informe o construct do tasklet “{title}”.')
        for number, question in enumerate(questions, 1):
            snapshot = question.get('snapshot') or {}
            kind = snapshot.get('type')
            for error in validate_question(snapshot):
                add('error', f'Questão {number}: {error}')
            if adaptive and (not snapshot.get('difficulty') or not snapshot.get('cefr')):
                add('error', f'Questão {number}: informe dificuldade e nível CEFR para o placement.')
            if cefr and not all(snapshot.get(key) for key in ('skill', 'cefr', 'subskill', 'taskType')):
                add('error', f'Questão {number}: skill, subskill, nível CEFR e task type são obrigatórios.')
            if cefr and draft.get('type') == 'placement' and snapshot.get('qualityStatus') not in ('approved', 'approved_for_pilot'):
                add('error', f'Questão {number}: placement CEFR aceita somente itens aprovados ou aprovados para pilotagem.')
            if not listening_enabled and (kind == 'listening' or snapshot.get('skill') == 'listening'):
                add('error', f'Questão {number}: Listening está desativado no momento; remova esta questão.')
            if kind == 'listening' and not snapshot.get('audioPath'):
                add('error', f'Questão {number}: envie o áudio de Listening.')
            if kind == 'listening' and (not snapshot.get('maxPlays') or snapshot['maxPlays'] < 1):
                add('error', f'Questão {number}: informe ao menos uma reprodução.')
            if kind in PRODUCTIVE_TYPES and not snapshot.get('rubric'):
                add('error', f'Questão {number}: configure a rubrica de correção.')
            if is_live(snapshot) and not can_administer_live(snapshot):
                add('error', f'Questão {number}: somente Speaking e Mediation podem ser aplicadas ao vivo.')
            if is_live(snapshot) and adaptive:
                add('error', f'Questão {number}: tarefas ao vivo só existem em avaliações de forma fixa.')
            if section.get('skill') == 'spoken_interaction' and kind == 'speaking' and not is_live(snapshot):
                add('warning', f'Questão {number} (Spoken Interaction) depende de um interlocutor; considere aplicá-la ao vivo.')
            if kind == 'mediation' and not (snapshot.get('sourceMaterial') or '').strip():
                add('error', f'Questão {number}: informe o material-fonte de Mediation.')
    total = sum(len(section.get('questions') or []) for section in draft.get('sections') or [])
    if adaptive and draft.get('adaptiveMaxItems', 0) < draft.get('adaptiveMinItems', 0):
        add('error', 'O máximo adaptativo deve ser maior ou igual ao mínimo.')
    if 0 < total < 3:
        add('warning', 'Avaliações muito curtas podem produzir resultados pouco representativos.')
    return issues


def has_listening(draft: dict) -> bool:
    return any(section.get('skill') == 'listening' or any((question.get('snapshot') or {}).get('type') == 'listening'
                                                          or (question.get('snapshot') or {}).get('skill') == 'listening' for question in section.get('questions') or [])
               for section in draft.get('sections') or [])


def audio_path(teacher_id: str, assessment_id: str, question_id: str, filename: str) -> str:
    """uploadListeningAudio's storage path."""
    extension = re.sub(r'[^a-z0-9]', '', filename.rsplit('.', 1)[-1].lower()) if '.' in filename else ''
    return f'{teacher_id}/listening/{assessment_id}/{question_id}-{uuid.uuid4()}.{extension or "webm"}'
