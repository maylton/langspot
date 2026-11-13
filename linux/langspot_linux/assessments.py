"""Assessment logic without UI, ported from the website (src/domains/assessments): drafts, validation,
question snapshots, deletion and exposure warnings, the student report and CEFR labels."""
from __future__ import annotations

import re
import unicodedata
import uuid
from datetime import date, datetime

CEFR_BASE = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
CEFR_LEVELS = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']
CURRENT_PILOT_BANK_VERSION = 'pilot-0.10'
AUDIO_BUCKET = 'assessment-audio'

TYPES = [('placement', 'Placement'), ('diagnostic', 'Diagnostic'), ('progress', 'Progress'), ('unit', 'Unit'), ('custom', 'Custom')]
FRAMEWORKS = [('none', 'Avaliação escolar'), ('cefr', 'Proficiência CEFR')]
MODES = [('fixed', 'Fixo'), ('adaptive', 'Adaptativo')]
NAVIGATION = [('free', 'Livre'), ('linear', 'Linear')]
RESULTS = [('none', 'Oculto'), ('score_only', 'Somente nota'), ('level_only', 'Somente nível'), ('full_report', 'Relatório completo'),
           ('after_teacher_review', 'Após revisão')]
STATUS_LABELS = {'draft': 'Rascunho', 'published': 'Publicada', 'archived': 'Arquivada'}
SECTION_SKILLS = [('grammar', 'Grammar'), ('vocabulary', 'Vocabulary'), ('reading', 'Reading'), ('listening', 'Listening'), ('writing', 'Writing'),
                  ('spoken_production', 'Spoken Production'), ('spoken_interaction', 'Spoken Interaction'), ('mediation', 'Mediation'),
                  ('language_use', 'Language Use'), ('speaking', 'Speaking (legado)'), ('use_of_english', 'Use of English (legado)')]
CEFR_SKILLS = [('reading', 'Reading'), ('listening', 'Listening'), ('writing', 'Writing'), ('spoken_production', 'Spoken Production'),
               ('spoken_interaction', 'Spoken Interaction'), ('mediation', 'Mediation'), ('language_use', 'Language Use')]
TASKLET_KINDS = [('screening', 'Screening'), ('primary', 'Primary'), ('confirmation', 'Confirmation'), ('floor', 'Floor'), ('ceiling', 'Ceiling')]
QUESTION_TYPES = [('multiple_choice', 'Múltipla escolha'), ('multiple_response', 'Múltiplas respostas'), ('fill_blank', 'Preencher lacuna'),
                  ('short_answer', 'Resposta curta'), ('true_false', 'Verdadeiro/falso'), ('matching', 'Associação'), ('ordering', 'Ordenação'),
                  ('listening', 'Listening'), ('writing', 'Writing'), ('speaking', 'Speaking'), ('mediation', 'Mediation')]
QUALITY = [('draft', 'Draft'), ('reviewed', 'Reviewed'), ('approved_for_pilot', 'Approved for pilot'), ('pilot_data_collected', 'Pilot data collected'),
           ('item_analysis', 'Item analysis'), ('approved', 'Approved'), ('needs_revision', 'Needs revision'), ('retired', 'Retired')]
TRANSCRIPT = [('never', 'Nunca ao aluno'), ('after_submit', 'Após o envio'), ('always', 'Durante a questão')]
PRODUCTIVE_TYPES = ('writing', 'speaking', 'mediation')
LIVE_TYPES = ('speaking', 'mediation')
ORDERING_SEPARATOR = '\u001f'
LEVEL_DIFFICULTY = {'A1': 1.5, 'A1+': 2.25, 'A2': 3, 'A2+': 4, 'B1': 5, 'B1+': 5.75, 'B2': 6.5, 'B2+': 7.25, 'C1': 8, 'C1+': 8.75, 'C2': 9.5}


def _rubric(labels: list[str], key) -> list[dict]:
    return [{'key': key(label), 'label': label, 'maxScore': 11, 'scale': 'cefr'} for label in labels]


WRITING_RUBRIC = _rubric(['Task Achievement', 'Range', 'Accuracy', 'Organisation & Cohesion', 'Register & Pragmatic Appropriacy'],
                         lambda label: label.lower().replace(' & ', '_').replace(' ', '_'))
SPEAKING_RUBRIC = _rubric(['Range', 'Grammatical Accuracy', 'Lexical Control', 'Fluency', 'Interaction', 'Coherence', 'Pronunciation / Phonological Control'],
                          lambda label: label.lower().replace(' / ', '_').replace(' ', '_'))
MEDIATION_RUBRIC = _rubric(['Information Selection', 'Accuracy of Meaning', 'Reformulation', 'Organisation', 'Audience Appropriacy', 'Language Control'],
                           lambda label: label.lower().replace(' ', '_'))
RUBRICS = {'writing': WRITING_RUBRIC, 'speaking': SPEAKING_RUBRIC, 'mediation': MEDIATION_RUBRIC}


def label_of(pairs: list[tuple[str, str]], key: str | None) -> str:
    return dict(pairs).get(key or '', key or '')


# ---------------------------------------------------------------------- drafts
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


# ---------------------------------------------------------------------- questions
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


def split_ordering(value: str) -> list[str]:
    value = (value or '').strip()
    if not value:
        return []
    parts = value.split(ORDERING_SEPARATOR) if ORDERING_SEPARATOR in value else value.split('/') if '/' in value else value.split(',')
    return [part.strip() for part in parts if part.strip()]


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


# ---------------------------------------------------------------------- seeds, deletion, exposure
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


def short_date(value: str | None) -> str:
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).astimezone().strftime('%d/%m/%Y')
    except (TypeError, ValueError):
        return ''


def exposure_lines(exposure: dict) -> list[str]:
    summary = summarize_exposure(exposure)
    lines = [f'Texto {"“" + text["title"] + "”" if text["title"] else text["key"]} ({text["key"]}) — em “{text["assessmentTitle"]}”, {short_date(text["seenAt"])}'
             for text in summary['texts']]
    lines += [f'Tarefa de {label_of(CEFR_SKILLS + [("speaking", "Speaking")], task["skill"])} {task["key"]} — em “{task["assessmentTitle"]}”, {short_date(task["seenAt"])}'
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


# ---------------------------------------------------------------------- report and CEFR labels
DIMENSION_LABELS = {
    'main_idea': 'ideia principal', 'basic_gist': 'sentido geral', 'detail': 'detalhes', 'specific_information': 'informação específica',
    'inference': 'inferência', 'basic_inference': 'inferência simples', 'simple_inference': 'inferência simples', 'nuanced_inference': 'inferência sutil',
    'sequence': 'sequência', 'simple_purpose': 'finalidade do texto', 'writer_purpose': 'objetivo do autor', 'writer_attitude': 'atitude do autor',
    'writer_stance': 'posição do autor', 'author_stance': 'posição do autor', 'speaker_attitude': 'atitude de quem fala', 'speaker_opinion': 'opinião de quem fala',
    'text_organisation': 'organização do texto', 'paragraph_function': 'função do parágrafo', 'reference': 'referência', 'implication': 'implicação',
    'implicit_meaning': 'sentido implícito', 'main_argument': 'argumento central', 'nuanced_stance': 'posição com nuances', 'rhetorical_purpose': 'intenção retórica',
    'figurative_meaning': 'sentido figurado', 'tone': 'tom', 'cause_effect': 'causa e efeito',
    'grammar': 'gramática', 'vocabulary': 'vocabulário', 'collocation': 'colocações', 'phrasal_verbs': 'phrasal verbs', 'discourse_markers': 'conectores',
    'functional_language': 'linguagem funcional', 'lexical_choice': 'escolha de palavras', 'register': 'registro', 'word_formation': 'formação de palavras',
    'task_achievement': 'cumprimento da tarefa', 'range': 'repertório', 'accuracy': 'correção', 'grammatical_accuracy': 'correção gramatical',
    'lexical_control': 'controle do vocabulário', 'organisation_cohesion': 'organização e coesão', 'organisation': 'organização',
    'register_pragmatic_appropriacy': 'adequação ao contexto', 'fluency': 'fluência', 'coherence': 'coerência', 'interaction': 'interação',
    'pronunciation_phonological_control': 'pronúncia', 'information_selection': 'seleção de informações', 'accuracy_of_meaning': 'precisão do significado',
    'reformulation': 'reformulação', 'audience_appropriacy': 'adequação ao leitor', 'language_control': 'controle da língua',
}
PROFILE_SKILLS = {'reading': 'Reading', 'listening': 'Listening', 'writing': 'Writing', 'spoken_production': 'Spoken Production',
                  'spoken_interaction': 'Spoken Interaction', 'mediation': 'Mediation', 'language_use': 'Language Use', 'speaking': 'Speaking'}
REPORT_SKILLS = {**PROFILE_SKILLS, 'grammar': 'Grammar', 'vocabulary': 'Vocabulary'}
CONFIDENCE = {'low': 'baixa', 'moderate': 'moderada', 'high': 'alta'}
RUBRIC_SKILLS = {'writing', 'speaking', 'spoken_production', 'spoken_interaction', 'mediation'}
INTEGRITY_STATUS = {'no_unusual_activity': 'Sem atividade incomum', 'unusual_activity': 'Atividade incomum', 'review_recommended': 'Revisão recomendada'}
EVENT_LABELS = {
    'assessment_started': 'Avaliação iniciada', 'question_opened': 'Questão aberta', 'question_closed': 'Questão encerrada',
    'tab_blur': 'Saiu da janela', 'tab_focus': 'Retornou à janela', 'fullscreen_exit': 'Saiu da tela cheia', 'paste_detected': 'Texto colado',
    'network_disconnect': 'Ficou offline', 'network_reconnect': 'Reconectou', 'resumed': 'Tentativa retomada', 'submitted': 'Avaliação enviada',
    'session_conflict': 'Outra sessão bloqueada', 'copy_detected': 'Texto copiado', 'drop_detected': 'Texto arrastado para a resposta',
    'bulk_insert_detected': 'Texto inserido sem digitação', 'live_session_opened': 'Sessão ao vivo aberta', 'live_response_scored': 'Tarefa pontuada ao vivo',
    'audio_play_started': 'Áudio reproduzido', 'recording_discarded': 'Gravação apagada pelo aluno',
}
ATTEMPT_STATUS = {'in_progress': 'em andamento', 'submitted': 'enviada', 'grading': 'em correção', 'completed': 'concluída', 'expired': 'expirada',
                  'abandoned': 'abandonada'}


def dimension_label(key: str) -> str:
    return DIMENSION_LABELS.get(key, key.replace('_', ' '))


def format_profile_item(item: str) -> str:
    skill, _, dimension = item.partition('.')
    name = PROFILE_SKILLS.get(skill, skill.replace('_', ' '))
    return f'{name} · {dimension_label(dimension)}' if dimension else name


def placement_label(placement: str | None) -> str:
    if not placement:
        return ''
    text = re.sub(r'^(\S+) approaching (\S+)$', r'\1, perto do \2', placement)
    return re.sub(r'^(\S+) consolidation$', r'\1 (consolidar)', text)


def meaningful_priorities(profile: dict) -> list[str]:
    kept = []
    for item in profile.get('developmentPriorities') or []:
        skill, _, dimension = item.partition('.')
        if not dimension:
            kept.append(item)
            continue
        evidence = (((profile.get('skills') or {}).get(skill) or {}).get('dimensions') or {}).get(dimension, {}).get('evidence') or ''
        match = re.match(r'^(\d+)/(\d+) objective', evidence)
        if not match or int(match[2]) == 0 or int(match[1]) / int(match[2]) < 0.75:
            kept.append(item)
    return kept


def _report_key(skill: str) -> str:
    return 'language_use' if skill == 'use_of_english' else skill


def _cefr_key(skill: str) -> str:
    return 'spoken_production' if skill == 'speaking' else 'language_use' if skill in ('grammar', 'vocabulary') else skill


def build_student_report(sections: list[dict], score, profile: dict | None, previous: dict | None) -> dict:
    """buildStudentReport: per-skill lines (level for rubric skills, % otherwise), strengths, priorities and the score delta."""
    totals: dict[str, list[float]] = {}
    for section in sections:
        key = _report_key(section.get('skill') or section.get('title') or '')
        total = totals.setdefault(key, [0.0, 0.0])
        total[0] += float(section.get('score') or 0)
        total[1] += float(section.get('maxScore') or 0)
    lines = []
    for key, (earned, maximum) in totals.items():
        percentage = round(100 * earned / maximum, 1) if maximum > 0 else None
        before = ((previous or {}).get('skills') or {}).get(key)
        level = (((profile or {}).get('skills') or {}).get(_cefr_key(key)) or {}).get('level')
        rubric = key in RUBRIC_SKILLS and level is not None
        delta = round(percentage - before, 1) if not rubric and percentage is not None and before is not None else None
        lines.append({'key': key, 'label': REPORT_SKILLS.get(key, key.replace('_', ' ')), 'percentage': percentage, 'level': level,
                      'previousPercentage': before, 'delta': delta, 'rubric': rubric})
    if profile:
        strengths = [format_profile_item(item) for item in profile.get('strengths') or []]
        priorities = [format_profile_item(item) for item in meaningful_priorities(profile)]
    else:
        scored = [line for line in lines if line['percentage'] is not None]
        strengths = [line['label'] for line in sorted((line for line in scored if line['percentage'] >= 75), key=lambda line: -line['percentage'])[:3]]
        priorities = [line['label'] for line in sorted((line for line in scored if line['percentage'] < 60), key=lambda line: line['percentage'])[:3]]
    previous_score = (previous or {}).get('score')
    delta = round(score - previous_score, 1) if isinstance(score, (int, float)) and isinstance(previous_score, (int, float)) else None
    return {'skills': lines, 'strengths': strengths, 'priorities': priorities, 'scoreDelta': delta}


def question_timing(question: dict) -> str:
    """Time on the question and, for written answers, composing speed (as the website's results)."""
    spent = question.get('timeSpentMs')
    if not spent:
        return ''
    seconds = round(spent / 1000)
    time = f'{round(seconds / 60)} min' if seconds >= 90 else f'{seconds}s'
    if question.get('type') not in ('writing', 'mediation') or question.get('answer') == 'live':
        return f'{time} na questão'
    words = len(re.findall(r"[\wÀ-ÿ'’-]+", question.get('answer') or ''))
    return f'{time} · {words} palavras · ≈{round(words / max(seconds / 60, 1 / 60))} palavras/min'


def discarded_info(result: dict, question_id: str) -> tuple[int, int] | None:
    """(deleted recordings, pauses in them); None for attempts before recordings were logged (2026-11-11 21:00 UTC)."""
    started = (result.get('attempt') or {}).get('startedAt') or ''
    try:
        if datetime.fromisoformat(started.replace('Z', '+00:00')) < datetime.fromisoformat('2026-11-11T21:00:00+00:00'):
            return None
    except ValueError:
        return None
    events = [event for event in ((result.get('integrity') or {}).get('events') or [])
              if event.get('type') == 'recording_discarded' and (event.get('metadata') or {}).get('questionId') == question_id]
    return len(events), sum(int((event.get('metadata') or {}).get('pausedCount') or 0) for event in events)


def live_rubric_score(rubric: list[dict], scores: dict[str, float], max_score: float) -> float | None:
    """Score of a live task, or None while a CEFR criterion has no level."""
    if any(criterion.get('scale') == 'cefr' and not scores.get(criterion['key']) for criterion in rubric):
        return None
    maximum = sum(float(criterion.get('maxScore') or 0) for criterion in rubric)
    if not maximum:
        return None
    earned = sum(min(float(scores.get(criterion['key']) or 0), float(criterion.get('maxScore') or 0)) for criterion in rubric)
    return round(earned / maximum * max_score, 2)


def clock(seconds: int) -> str:
    return f'{seconds // 60:02d}:{seconds % 60:02d}'
