"""Write a question by hand, of any type, with the CEFR metadata and Listening audio (the website's ManualQuestionForm)."""
from __future__ import annotations

import uuid

from gi.repository import Adw, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import form_dialog, label, text_view
from langspot_linux.worker import run_async
from .fields import combo


def manual_question(editor, section: dict) -> None:
    dialog, page, save = form_dialog(editor.window, 'Criar questão', 'Adicionar', width=600)
    cefr = editor.draft['framework'] == 'cefr'
    types = [pair for pair in A.QUESTION_TYPES if editor.listening or pair[0] != 'listening']
    state: dict = {'type': 'multiple_choice', 'audio': None}
    main = Adw.PreferencesGroup()
    kind = combo('Tipo', types, 'multiple_choice', lambda value: (state.update(type=value), visible()))
    prompt = Adw.EntryRow(title='Enunciado')
    level = combo('Nível CEFR', [(item, item) for item in A.CEFR_LEVELS], 'B1', lambda value: state.update(cefr=value))
    state['cefr'] = 'B1'
    difficulty = Adw.SpinRow.new_with_range(1, 10, 1)
    difficulty.set_title('Dificuldade (1–10)')
    difficulty.set_value(5)
    for row in (kind, prompt, level, difficulty):
        main.add(row)
    page.add(main)
    meta = Adw.PreferencesGroup(title='Metadados CEFR', visible=cefr)
    default_skill = section.get('skill', 'grammar').replace('speaking', 'spoken_production').replace('use_of_english', 'language_use')
    if default_skill in ('grammar', 'vocabulary'):
        default_skill = 'language_use'
    cefr_skills = [pair for pair in A.CEFR_SKILLS if editor.listening or pair[0] != 'listening']
    state['skill'] = default_skill
    meta.add(combo('Skill', cefr_skills, default_skill, lambda value: state.update(skill=value)))
    fields = {key: Adw.EntryRow(title=title) for key, title in (('subskill', 'Subskill (ex.: inference)'), ('descriptor_id', 'Descriptor ID'),
                                                                ('descriptor', 'Descritor operacional'), ('task_type', 'Task type'), ('topic', 'Tópico'),
                                                                ('genre', 'Gênero'))}
    for row in fields.values():
        meta.add(row)
    state['quality'] = 'draft'
    meta.add(combo('Status', A.QUALITY, 'draft', lambda value: state.update(quality=value)))
    page.add(meta)

    options_group = Adw.PreferencesGroup(title='Opções (uma por linha)')
    options_frame, options_value = text_view('', 90)
    options_group.add(options_frame)
    page.add(options_group)
    answer_group = Adw.PreferencesGroup(title='Resposta correta')
    answer_frame, answer_value = text_view('', 60)
    answer_group.add(answer_frame)
    page.add(answer_group)
    truth_group = Adw.PreferencesGroup()
    state['truth'] = 'True'
    truth_group.add(combo('Gabarito', [('True', 'True'), ('False', 'False')], 'True', lambda value: state.update(truth=value)))
    page.add(truth_group)

    listening_group = Adw.PreferencesGroup(title='Listening')
    audio_row = Adw.ActionRow(title='Arquivo de áudio', subtitle='Nenhum arquivo escolhido' if editor.draft.get('id') else 'Salve o rascunho para habilitar o upload.')
    choose = Gtk.Button(label='Escolher…', valign=Gtk.Align.CENTER, sensitive=bool(editor.draft.get('id')))
    choose.connect('clicked', lambda *_: editor._pick_audio(lambda path: (state.update(audio=path), audio_row.set_subtitle(path.name))))
    audio_row.add_suffix(choose)
    plays = Adw.SpinRow.new_with_range(1, 10, 1)
    plays.set_title('Máximo de reproduções')
    plays.set_value(2)
    autoplay = Adw.SwitchRow(title='Reproduzir automaticamente')
    state['transcript_visibility'] = 'after_submit'
    for row in (audio_row, plays, autoplay, combo('Exibir transcrição', A.TRANSCRIPT, 'after_submit', lambda value: state.update(transcript_visibility=value))):
        listening_group.add(row)
    page.add(listening_group)
    transcript_group = Adw.PreferencesGroup(title='Transcrição')
    transcript_frame, transcript_value = text_view('', 70)
    transcript_group.add(transcript_frame)
    page.add(transcript_group)
    source_group = Adw.PreferencesGroup(title='Material-fonte')
    source_frame, source_value = text_view('', 110)
    source_group.add(source_frame)
    page.add(source_group)
    speaking_group = Adw.PreferencesGroup(title='Speaking')
    preparation = Adw.SpinRow.new_with_range(0, 600, 5)
    preparation.set_title('Preparação (segundos)')
    preparation.set_value(30)
    recording = Adw.SpinRow.new_with_range(10, 900, 10)
    recording.set_title('Gravação (segundos)')
    recording.set_value(120)
    review = Adw.SwitchRow(title='Permitir regravação final', subtitle='Desligado por padrão em placement.')
    for row in (preparation, recording, review):
        speaking_group.add(row)
    page.add(speaking_group)
    rubric_note = Adw.PreferencesGroup()
    rubric_label = label('', css=('dim-label', 'caption'))
    rubric_note.add(rubric_label)
    page.add(rubric_note)
    notes = {'writing': 'Rubrica CEFR: Task Achievement, Range, Accuracy, Organisation & Cohesion e Register & Pragmatic Appropriacy.',
             'speaking': 'Rubrica CEFR: Range, Grammatical Accuracy, Lexical Control, Fluency, Interaction, Coherence e Phonological Control.',
             'mediation': 'Rubrica CEFR: seleção e precisão da informação, reformulação, organização, adequação ao público e controle linguístico.'}

    def visible() -> None:
        current = state['type']
        productive = current in A.PRODUCTIVE_TYPES
        options_group.set_visible(not productive and current not in ('true_false', 'fill_blank', 'short_answer'))
        options_group.set_title('Opções (uma por linha; “esquerda => direita”)' if current == 'matching' else 'Opções (uma por linha)')
        answer_group.set_visible(not productive and current != 'true_false')
        answer_group.set_title('Gabarito (uma linha por item)' if current in ('ordering', 'multiple_response', 'matching') else 'Resposta correta')
        truth_group.set_visible(current == 'true_false')
        listening_group.set_visible(current == 'listening')
        transcript_group.set_visible(current == 'listening')
        source_group.set_visible(current == 'mediation')
        speaking_group.set_visible(current == 'speaking')
        rubric_note.set_visible(current in notes)
        rubric_label.set_text(notes.get(current, ''))
    visible()

    def submit(*_):
        current = state['type']
        if current == 'listening' and not state['audio']:
            dialog.show_error('Escolha o arquivo de áudio.')
            return
        question_id = uuid.uuid4().hex
        try:
            snapshot = A.manual_snapshot(current, prompt.get_text(), options_text=options_value(),
                                         answer_text=state['truth'] if current == 'true_false' else answer_value(), cefr=state['cefr'],
                                         difficulty=int(difficulty.get_value()), skill=state['skill'] if cefr else None, default_skill=section.get('skill', 'grammar'),
                                         subskill=fields['subskill'].get_text(), descriptor_id=fields['descriptor_id'].get_text(),
                                         descriptor=fields['descriptor'].get_text(), task_type=fields['task_type'].get_text(), topic=fields['topic'].get_text(),
                                         genre=fields['genre'].get_text(), quality=state['quality'], source_material=source_value(),
                                         max_plays=int(plays.get_value()), autoplay=autoplay.get_active(), transcript=transcript_value(),
                                         transcript_visibility=state['transcript_visibility'], preparation_seconds=int(preparation.get_value()),
                                         recording_seconds=int(recording.get_value()), allow_review=review.get_active(), question_id=question_id)
        except ValueError as error:
            dialog.show_error(str(error))
            return
        errors = A.validate_question(snapshot)
        if errors:
            dialog.show_error(errors[0])
            return

        def add(final: dict) -> None:
            section['questions'].append({'id': uuid.uuid4().hex, 'questionBankId': None, 'weight': 1, 'required': True, 'snapshot': final})
            dialog.close()
            editor.changed(rebuild=True)
        if current != 'listening':
            add(snapshot)
            return
        save.set_sensitive(False)

        def failed(error: Exception) -> None:
            save.set_sensitive(True)
            dialog.show_error(str(error))
        run_async(lambda: editor._upload_audio(question_id, state['audio']), lambda path: add({**snapshot, 'audioPath': path}), failed)
    save.connect('clicked', submit)
    dialog.present(editor.window)
