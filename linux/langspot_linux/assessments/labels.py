"""Labels, choices and rubrics of the assessment module (same values as the website)."""
from __future__ import annotations




CEFR_BASE = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
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
