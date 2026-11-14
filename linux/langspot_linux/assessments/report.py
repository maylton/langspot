"""The student report and CEFR profile labels, question timing, recordings, live scoring."""
from __future__ import annotations

import re
from datetime import datetime


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
