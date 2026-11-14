"""Interactive quizzes, the question bank and comments on parts of a submission."""
from __future__ import annotations

from datetime import datetime, timezone


QUESTION_TYPES = {'multiple_choice': 'Múltipla escolha', 'fill_blank': 'Complete a frase', 'true_false': 'Verdadeiro ou falso', 'ordering': 'Ordenação'}
QUESTION_BANK_LEVELS = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']
QUESTION_CATEGORIES = ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Writing', 'Speaking', 'Mediation', 'Language Use']
QUESTION_SKILLS = [('reading', 'Reading'), ('listening', 'Listening'), ('writing', 'Writing'), ('spoken_production', 'Spoken Production'),
                   ('spoken_interaction', 'Spoken Interaction'), ('mediation', 'Mediation'), ('language_use', 'Language Use')]
QUALITY_STATUSES = [('draft', 'Draft'), ('reviewed', 'Reviewed'), ('approved_for_pilot', 'Approved for pilot'), ('pilot_data_collected', 'Pilot data collected'),
                    ('item_analysis', 'Item analysis'), ('approved', 'Approved'), ('needs_revision', 'Needs revision'), ('retired', 'Retired')]
TRUE_FALSE = ['Verdadeiro', 'Falso']
ORDERING_SEPARATOR = '\u001f'  # between the chunks of an assessment's ordering/matching answer key
MAX_ATTEMPTS = [(1, '1 tentativa'), (2, '2 tentativas'), (3, '3 tentativas'), (0, 'Ilimitadas')]
REVEAL = [('after_each', 'Depois de cada envio'), ('after_last', 'Apenas na última tentativa')]


def question_type_label(kind: str) -> str:
    return QUESTION_TYPES.get(kind, kind.replace('_', ' ').capitalize())


def split_ordering(value: str) -> list[str]:
    """Ordered chunks of an answer key: the assessments' internal separator, else '/', else ',' (web splitOrderingAnswer)."""
    value = (value or '').strip()
    if not value:
        return []
    parts = value.split(ORDERING_SEPARATOR) if ORDERING_SEPARATOR in value else value.split('/') if '/' in value else value.split(',')
    return [part.strip() for part in parts if part.strip()]


def display_answer(question: dict) -> str:
    return ' '.join(split_ordering(question.get('answer') or '')) if question.get('type') == 'ordering' else (question.get('answer') or '')


def new_question(kind: str, prompt: str, *, options: list[str] | None = None, answer: str = '', explanation: str = '', shuffle=None) -> dict:
    """Builds a question exactly like the website's manual question (raises ValueError with what is missing).

    multiple_choice: options (2–4) and answer = the correct option's letter (A–D);
    true_false: answer 'Verdadeiro' / 'Falso'; fill_blank: answer = expected text;
    ordering: answer = the correct order, chunks separated by '/'.
    """
    import random
    import uuid
    prompt = prompt.strip()
    explanation = explanation.strip()
    if not prompt:
        raise ValueError('Escreva o enunciado.')
    question = {'id': str(uuid.uuid4()), 'type': kind, 'prompt': prompt}
    if kind == 'true_false':
        question.update(options=list(TRUE_FALSE), answer='Falso' if answer == 'Falso' else 'Verdadeiro')
    elif kind == 'fill_blank':
        if not answer.strip():
            raise ValueError('Escreva a resposta correta.')
        question.update(options=[], answer=answer.strip())
    elif kind == 'ordering':
        ordered = split_ordering(answer)
        if len(ordered) < 2:
            raise ValueError('Escreva a ordem correta com pelo menos dois trechos separados por /.')
        shuffled = list(ordered)
        (shuffle or random.shuffle)(shuffled)
        question.update(options=shuffled, answer=' / '.join(ordered))
    else:
        labels = ['A', 'B', 'C', 'D']
        filled = [(label, text.strip()) for label, text in zip(labels, options or []) if text.strip()]
        chosen = dict(filled).get(answer)
        if len(filled) < 2 or not chosen:
            raise ValueError('Preencha pelo menos duas alternativas, incluindo a do gabarito.')
        question.update(type='multiple_choice', options=[text for _label, text in filled], answer=chosen)
    if explanation:
        question['explanation'] = explanation
    return question


def bank_to_question(row: dict) -> dict:
    """Web bankQuestionToInteractive: a bank item copied into a quiz with a fresh id."""
    import uuid
    question = {'id': str(uuid.uuid4()), 'type': row.get('question_type') or row.get('type') or 'multiple_choice', 'prompt': row.get('prompt') or '',
                'options': list(row.get('options') or []), 'answer': row.get('answer') or ''}
    if row.get('explanation'):
        question['explanation'] = row['explanation']
    return question


def bank_values(level: str, category: str, question: dict, *, skill: str | None, subskill: str = '', difficulty: int = 5, task_type: str = '',
                topic: str = '', genre: str = '', descriptor: str = '', quality: str = 'draft', restricted: bool = False) -> dict:
    """question_bank insert payload, as the website's createQuestionBankItem (teacher_id added by the caller)."""
    return {'level': level, 'category': category, 'question_type': question['type'], 'prompt': question['prompt'], 'options': question['options'],
            'answer': question['answer'], 'explanation': question.get('explanation') or None, 'skill': skill or None, 'subskill': subskill.strip() or None,
            'difficulty': difficulty, 'task_type': task_type.strip() or None, 'topic': topic.strip() or None, 'genre': genre.strip() or None,
            'operational_descriptor': descriptor.strip() or None, 'quality_status': quality, 'restricted': restricted}


def quiz_content(questions: list[dict], max_attempts: int, reveal: str) -> dict:
    return {'questions': questions, 'settings': {'maxAttempts': max_attempts, 'revealAnswers': 'after_last' if reveal == 'after_last' else 'after_each'}}


def quiz_summary(result: dict | None) -> str:
    if not result:
        return ''
    return f'{result.get("score", 0)}/{result.get("total", 0)} acertos ({result.get("percentage", 0)}%)'


# The website stores offsets as JavaScript string indices (UTF-16 code units); Python indexes code points.
def js_offset(text: str, index: int) -> int:
    return len(text[:index].encode('utf-16-le')) // 2


def py_index(text: str, offset: int) -> int:
    units = 0
    for index, char in enumerate(text):
        if units >= offset:
            return index
        units += 2 if ord(char) > 0xFFFF else 1
    return len(text)


def text_comment(text: str, start: int, end: int, comment: str, now: datetime | None = None) -> dict:
    """A TextComment for text[start:end] (Python indices), with the website's UTF-16 offsets."""
    import uuid
    return {'id': str(uuid.uuid4()), 'start': js_offset(text, start), 'end': js_offset(text, end), 'text': text[start:end], 'comment': comment.strip(),
            'createdAt': (now or datetime.now(timezone.utc)).isoformat().replace('+00:00', 'Z')}


def comment_span(text: str, comment: dict) -> tuple[int, int] | None:
    """Python (start, end) of a stored comment, or None when it does not fit the text (as the website ignores it)."""
    try:
        start, end = int(comment['start']), int(comment['end'])
    except (KeyError, TypeError, ValueError):
        return None
    if start < 0 or end <= start or end > js_offset(text, len(text)):
        return None
    return py_index(text, start), py_index(text, end)
