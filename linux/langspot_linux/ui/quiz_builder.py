"""Quiz building blocks: question editor, new-quiz dialog (AI, question bank, manual questions), question bank
manager and the student-view preview. Same rules and tables as the website."""
from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Callable

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import confirm, date_row, form_dialog, text_view
from langspot_linux.worker import run_async

BANK_COLUMNS = 'id,external_id,source_origin,level,category,question_type,prompt,options,answer,explanation,skill,subskill,quality_status,usage_count,restricted,created_at'
TYPE_KEYS = list(model.QUESTION_TYPES)


# ---------------------------------------------------------------------- question editor
def question_editor(parent: Gtk.Widget, title: str, on_question: Callable[[dict, dict], None], *, metadata: bool = False,
                    level: str = 'A1', category: str = 'Grammar') -> None:
    """Dialog for one question (the website's manual question; with metadata=True also the bank fields).

    Calls on_question(question, extra) where extra holds the bank metadata.
    """
    dialog, page, save = form_dialog(parent, title, 'Adicionar' if not metadata else 'Salvar questão', width=560)
    head = Adw.PreferencesGroup()
    levels = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(model.QUESTION_BANK_LEVELS))
    levels.set_selected(model.QUESTION_BANK_LEVELS.index(level) if level in model.QUESTION_BANK_LEVELS else 0)
    categories = Adw.ComboRow(title='Categoria', model=Gtk.StringList.new(model.QUESTION_CATEGORIES))
    categories.set_selected(model.QUESTION_CATEGORIES.index(category) if category in model.QUESTION_CATEGORIES else 0)
    kind = Adw.ComboRow(title='Tipo da pergunta', model=Gtk.StringList.new([model.QUESTION_TYPES[key] for key in TYPE_KEYS]))
    prompt = Adw.EntryRow(title='Enunciado')
    if metadata:
        head.add(levels)
        head.add(categories)
    head.add(kind)
    head.add(prompt)
    page.add(head)

    choices = Adw.PreferencesGroup(title='Alternativas')
    options = [Adw.EntryRow(title=f'Alternativa {letter}') for letter in 'ABCD']
    for row in options:
        choices.add(row)
    answer_letter = Adw.ComboRow(title='Gabarito', model=Gtk.StringList.new(['A', 'B', 'C', 'D']))
    choices.add(answer_letter)
    page.add(choices)
    truth = Adw.PreferencesGroup()
    answer_truth = Adw.ComboRow(title='Gabarito', model=Gtk.StringList.new(model.TRUE_FALSE))
    truth.add(answer_truth)
    page.add(truth)
    text_group = Adw.PreferencesGroup()
    answer_text = Adw.EntryRow(title='Resposta correta')
    text_group.add(answer_text)
    page.add(text_group)
    extra_group = Adw.PreferencesGroup()
    explanation = Adw.EntryRow(title='Explicação (opcional)')
    extra_group.add(explanation)
    page.add(extra_group)

    meta: dict = {}
    if metadata:
        group = Adw.PreferencesGroup(title='Metadados pedagógicos')
        skill = Adw.ComboRow(title='Skill', model=Gtk.StringList.new([title for _key, title in model.QUESTION_SKILLS]))
        skill.set_selected([key for key, _title in model.QUESTION_SKILLS].index('language_use'))
        difficulty = Adw.SpinRow.new_with_range(1, 10, 1)
        difficulty.set_title('Dificuldade')
        difficulty.set_value(5)
        quality = Adw.ComboRow(title='Status', model=Gtk.StringList.new([title for _key, title in model.QUALITY_STATUSES]))
        restricted = Adw.SwitchRow(title='Item restrito')
        entries = {key: Adw.EntryRow(title=title) for key, title in (('subskill', 'Subskill'), ('task_type', 'Task type'), ('topic', 'Tópico'),
                                                                     ('genre', 'Gênero'), ('descriptor', 'Descritor operacional'))}
        for row in (skill, entries['subskill'], difficulty, entries['task_type'], entries['topic'], entries['genre'], quality, restricted, entries['descriptor']):
            group.add(row)
        page.add(group)
        meta = {'skill': skill, 'difficulty': difficulty, 'quality': quality, 'restricted': restricted, **entries}

    def switched(*_):
        current = TYPE_KEYS[kind.get_selected()]
        choices.set_visible(current == 'multiple_choice')
        truth.set_visible(current == 'true_false')
        text_group.set_visible(current in ('fill_blank', 'ordering'))
        answer_text.set_title('Ordem correta (separe por /)' if current == 'ordering' else 'Resposta correta')
        prompt.set_title('Enunciado (ex.: Ordene as palavras para formar uma frase.)' if current == 'ordering' else 'Enunciado')
    kind.connect('notify::selected', switched)
    switched()

    def submit(*_):
        current = TYPE_KEYS[kind.get_selected()]
        answer = {'multiple_choice': 'ABCD'[answer_letter.get_selected()], 'true_false': model.TRUE_FALSE[answer_truth.get_selected()]}.get(current, answer_text.get_text())
        try:
            question = model.new_question(current, prompt.get_text(), options=[row.get_text() for row in options], answer=answer,
                                          explanation=explanation.get_text())
        except ValueError as error:
            dialog.show_error(str(error))
            return
        extra = {'level': model.QUESTION_BANK_LEVELS[levels.get_selected()], 'category': model.QUESTION_CATEGORIES[categories.get_selected()]}
        if metadata:
            extra.update(skill=model.QUESTION_SKILLS[meta['skill'].get_selected()][0], difficulty=int(meta['difficulty'].get_value()),
                         quality=model.QUALITY_STATUSES[meta['quality'].get_selected()][0], restricted=meta['restricted'].get_active(),
                         **{key: meta[key].get_text() for key in ('subskill', 'task_type', 'topic', 'genre', 'descriptor')})
        on_question(question, extra)
        dialog.close()
    save.connect('clicked', submit)
    dialog.present(parent)


def question_row(index: int, question: dict, *, source: str = '', on_remove: Callable[[], None] | None = None) -> Adw.ExpanderRow:
    """A question with its options, answer key and explanation (expand to see)."""
    subtitle = ' · '.join(part for part in (source, model.question_type_label(question.get('type', ''))) if part)
    row = Adw.ExpanderRow(title=GLib.markup_escape_text(f'{index}. {question.get("prompt") or ""}'), subtitle=GLib.markup_escape_text(subtitle))
    if question.get('options'):
        options = Adw.ActionRow(title='Opções' if question.get('type') != 'ordering' else 'Trechos embaralhados',
                                subtitle=GLib.markup_escape_text('  ·  '.join(question['options'])))
        options.add_css_class('property')
        row.add_row(options)
    if question.get('type') == 'fill_blank':
        blank = Adw.ActionRow(title='Para o aluno', subtitle='Campo de resposta curta')
        blank.add_css_class('property')
        row.add_row(blank)
    key = Adw.ActionRow(title='Gabarito', subtitle=GLib.markup_escape_text(model.display_answer(question)) or 'Correção por rubrica')
    key.add_css_class('property')
    row.add_row(key)
    if question.get('explanation'):
        why = Adw.ActionRow(title='Explicação', subtitle=GLib.markup_escape_text(question['explanation']))
        why.add_css_class('property')
        row.add_row(why)
    if on_remove:
        remove = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Remover do quiz')
        remove.add_css_class('flat')
        remove.connect('clicked', lambda *_: on_remove())
        row.add_suffix(remove)
    return row


def quiz_preview_groups(content: dict | None) -> list[Adw.PreferencesGroup]:
    """Settings and questions of a quiz as the student will see them (with the answer key for the teacher)."""
    content = content or {}
    settings = content.get('settings') or {}
    questions = content.get('questions') or []
    info = Adw.PreferencesGroup(title='Configurações do quiz')
    attempts = settings.get('maxAttempts', 1)
    for title, value in (('Tentativas', 'Ilimitadas' if not attempts else str(attempts)),
                         ('Mostrar gabarito', dict(model.REVEAL).get(settings.get('revealAnswers', 'after_each'), 'Depois de cada envio'))):
        row = Adw.ActionRow(title=title, subtitle=value)
        row.add_css_class('property')
        info.add(row)
    group = Adw.PreferencesGroup(title=f'{len(questions)} questão(ões)', description='Expanda para ver as opções e o gabarito.')
    if not questions:
        group.add(Adw.ActionRow(title='Quiz sem questões'))
    for index, question in enumerate(questions, 1):
        group.add(question_row(index, question))
    return [info, group]


# ---------------------------------------------------------------------- new quiz
def new_quiz(window, students: dict[str, dict], materials: dict[str, dict], on_done: Callable[[], None]) -> None:
    client = window.client
    dialog, page, save = form_dialog(window, 'Novo quiz', 'Criar quiz', width=640)
    ids = sorted(students, key=lambda key: students[key]['name'].lower())
    basics = Adw.PreferencesGroup()
    student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([students[key]['name'] for key in ids]), enable_search=True)
    title = Adw.EntryRow(title='Título (ex.: Present Perfect Quiz)')
    due, due_value = date_row('Prazo', date.today() + timedelta(days=7))
    material_ids = [''] + sorted(materials, key=lambda key: (materials[key].get('title') or '').lower())
    material = Adw.ComboRow(title='Material (opcional)', model=Gtk.StringList.new(['Nenhum'] + [materials[key].get('title') or 'Material' for key in material_ids[1:]]))
    for row in (student, title, due, material):
        basics.add(row)
    page.add(basics)
    instructions_group = Adw.PreferencesGroup(title='Instruções')
    frame, instructions = text_view('Responda às questões abaixo.', 70)
    instructions_group.add(frame)
    page.add(instructions_group)

    settings = Adw.PreferencesGroup(title='Configurações do quiz', description='Tentativas e quando o aluno vê o gabarito.')
    attempts = Adw.ComboRow(title='Tentativas permitidas', model=Gtk.StringList.new([title for _value, title in model.MAX_ATTEMPTS]))
    reveal = Adw.ComboRow(title='Mostrar gabarito', model=Gtk.StringList.new([title for _value, title in model.REVEAL]))
    settings.add(attempts)
    settings.add(reveal)
    page.add(settings)

    questions: list[tuple[dict, str]] = []
    chosen = Adw.PreferencesGroup(title='Questões do quiz')
    page.add(chosen)
    chosen_rows: list[Gtk.Widget] = []

    def render_chosen() -> None:
        for row in chosen_rows:
            chosen.remove(row)
        chosen_rows.clear()
        chosen.set_description(f'{len(questions)} questão(ões). Combine questões do banco, geradas com IA e manuais.')
        if not questions:
            chosen_rows.append(Adw.ActionRow(title='Nenhuma questão ainda', subtitle='Use as opções abaixo para adicionar.'))
        for index, (question, source) in enumerate(questions, 1):
            chosen_rows.append(question_row(index, question, source=source, on_remove=lambda item=question: remove(item)))
        for row in chosen_rows:
            chosen.add(row)

    def remove(question: dict) -> None:
        questions[:] = [item for item in questions if item[0] is not question]
        render_chosen()

    def add(items: list[dict], source: str) -> None:
        questions.extend((item, source) for item in items)
        render_chosen()

    level_group = Adw.PreferencesGroup(title='Banco de questões e IA', description='Categoria: Grammar. Revise as questões antes de enviar ao aluno.')
    level = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(model.QUESTION_BANK_LEVELS))
    level_group.add(level)
    topic = Adw.EntryRow(title='Tema para a IA (ex.: Present perfect with travel)')
    ai_count = Adw.SpinRow.new_with_range(1, 20, 1)
    ai_count.set_title('Questões geradas com IA')
    ai_count.set_value(5)
    generate = Gtk.Button(label='Gerar com IA', valign=Gtk.Align.CENTER)
    generate.add_css_class('suggested-action')
    ai_count.add_suffix(generate)
    level_group.add(topic)
    level_group.add(ai_count)
    auto_count = Adw.SpinRow.new_with_range(1, 30, 1)
    auto_count.set_title('Sortear do banco')
    auto_count.set_value(5)
    build = Gtk.Button(label='Montar', valign=Gtk.Align.CENTER)
    auto_count.add_suffix(build)
    level_group.add(auto_count)
    page.add(level_group)
    bank_group = Adw.PreferencesGroup()
    page.add(bank_group)
    bank: dict = {'rows': [], 'items': []}

    def load_bank(*_):
        current = model.QUESTION_BANK_LEVELS[level.get_selected()]

        def loaded(rows: list[dict]) -> None:
            for row in bank['rows']:
                bank_group.remove(row)
            bank['rows'] = []
            bank['items'] = rows
            bank_group.set_title(f'Questões Grammar {current}')
            bank_group.set_description(f'{len(rows)} no banco.' if rows else f'Nenhuma questão Grammar cadastrada para {current} ainda.')
            for item in rows[:8]:
                row = Adw.ActionRow(title=GLib.markup_escape_text(item.get('prompt') or ''), subtitle=model.question_type_label(item.get('question_type') or ''))
                plus = Gtk.Button(icon_name='list-add-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Adicionar ao quiz')
                plus.add_css_class('flat')
                plus.connect('clicked', lambda button, entry=item: (add([model.bank_to_question(entry)], f'Banco {current}'), button.set_sensitive(False)))
                row.add_suffix(plus)
                bank['rows'].append(row)
                bank_group.add(row)
        run_async(lambda: client.select('question_bank', select=BANK_COLUMNS, level=f'eq.{current}', category='eq.Grammar', order='created_at.desc'),
                  loaded, lambda error: dialog.show_error(str(error)))
    level.connect('notify::selected', load_bank)

    def build_auto(*_):
        items = bank['items']
        if not items:
            dialog.show_error(f'Nenhuma questão Grammar cadastrada para {model.QUESTION_BANK_LEVELS[level.get_selected()]}.')
            return
        picked = random.sample(items, min(int(auto_count.get_value()), len(items)))
        add([model.bank_to_question(item) for item in picked], f'Banco {model.QUESTION_BANK_LEVELS[level.get_selected()]}')
        dialog.show_error('')
    build.connect('clicked', build_auto)

    def generate_ai(*_):
        subject = topic.get_text().strip()
        if not subject:
            dialog.show_error('Escreva um tema para a IA gerar as questões.')
            return
        generate.set_sensitive(False)
        generate.set_label('Gerando…')
        body = {'topic': subject, 'level': model.QUESTION_BANK_LEVELS[level.get_selected()], 'count': int(ai_count.get_value()), 'category': 'Grammar'}

        def done(result: dict) -> None:
            generate.set_sensitive(True)
            generate.set_label('Gerar com IA')
            import uuid
            items = [{**item, 'id': item.get('id') or str(uuid.uuid4())} for item in (result or {}).get('questions') or []]
            if not items:
                dialog.show_error('A IA não retornou questões válidas.')
                return
            dialog.show_error('')
            add(items, 'IA')

        def failed(error: Exception) -> None:
            generate.set_sensitive(True)
            generate.set_label('Gerar com IA')
            dialog.show_error(f'Não foi possível gerar questões com IA: {error}')
        run_async(lambda: client.invoke('generate-quiz', body), done, failed)
    generate.connect('clicked', generate_ai)

    manual = Adw.PreferencesGroup()
    add_manual = Adw.ButtonRow(title='Adicionar questão manual', start_icon_name='list-add-symbolic')
    add_manual.connect('activated', lambda *_: question_editor(dialog, 'Questão manual', lambda question, _extra: add([question], 'Manual')))
    manual.add(add_manual)
    page.add(manual)
    render_chosen()
    load_bank()

    def submit(*_):
        if not title.get_text().strip():
            dialog.show_error('Escreva o título do quiz.')
            return
        if not questions:
            dialog.show_error('Adicione pelo menos uma pergunta com enunciado e gabarito.')
            return
        content = model.quiz_content([question for question, _source in questions], model.MAX_ATTEMPTS[attempts.get_selected()][0],
                                     model.REVEAL[reveal.get_selected()][0])
        values = {'teacher_id': window.profile['id'], 'student_id': ids[student.get_selected()], 'material_id': material_ids[material.get_selected()] or None,
                  'title': title.get_text().strip(), 'instructions': instructions(), 'due_date': due_value().isoformat(), 'status': 'pending',
                  'assignment_type': 'interactive', 'interactive_content': content}
        save.set_sensitive(False)

        def work():
            client.insert('assignments', values)
            if values['material_id']:
                client.upsert('material_assignments', {'material_id': values['material_id'], 'student_id': values['student_id']}, on_conflict='material_id,student_id')

        def done(_r) -> None:
            dialog.close()
            window.toast('Quiz criado. O aluno já pode responder.')
            on_done()

        def failed(error: Exception) -> None:
            save.set_sensitive(True)
            dialog.show_error(str(error))
        run_async(work, done, failed)
    save.connect('clicked', submit)
    dialog.present(window)


# ---------------------------------------------------------------------- question bank
def question_bank(window) -> None:
    client = window.client
    dialog = Adw.Dialog(title='Banco de questões', content_width=680, content_height=720)
    toolbar = Adw.ToolbarView()
    header = Adw.HeaderBar()
    new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova questão')
    new.add_css_class('suggested-action')
    header.pack_start(new)
    toolbar.add_top_bar(header)
    page = Adw.PreferencesPage()
    filters = Adw.PreferencesGroup(description='Itens reutilizáveis com metadados pedagógicos. Os do banco piloto CEFR não podem ser excluídos.')
    level = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(model.QUESTION_BANK_LEVELS))
    category = Adw.ComboRow(title='Categoria', model=Gtk.StringList.new(model.QUESTION_CATEGORIES))
    filters.add(level)
    filters.add(category)
    page.add(filters)
    state: dict = {'group': None}
    toolbar.set_content(page)
    dialog.set_child(toolbar)

    def current() -> tuple[str, str]:
        return model.QUESTION_BANK_LEVELS[level.get_selected()], model.QUESTION_CATEGORIES[category.get_selected()]

    def load(*_):
        chosen_level, chosen_category = current()

        def loaded(rows: list[dict]) -> None:
            if state['group']:
                page.remove(state['group'])
            group = Adw.PreferencesGroup(title=f'{chosen_level} · {chosen_category}', description=f'{len(rows)} questão(ões) cadastrada(s).')
            state['group'] = group
            if not rows:
                group.add(Adw.ActionRow(title=f'Nenhuma questão em {chosen_level}', subtitle=f'Crie o primeiro item de {chosen_category} para este nível.'))
            for index, row in enumerate(rows, 1):
                question = {'type': row.get('question_type'), 'prompt': row.get('prompt'), 'options': row.get('options') or [], 'answer': row.get('answer') or '',
                            'explanation': row.get('explanation')}
                details = [row.get('external_id') or '', row.get('skill') or 'sem skill', row.get('subskill') or 'sem subskill',
                           row.get('quality_status') or 'draft', f'uso {row.get("usage_count") or 0}']
                remove = None
                if row.get('source_origin') != 'cefr_pilot':
                    remove = (lambda item=row: confirm(dialog, 'Excluir esta questão?', 'Ela sai do banco; quizzes já criados não mudam.', 'Excluir',
                                                       lambda: delete(item), destructive=True))
                item = question_row(index, question, source=' · '.join(part for part in details if part), on_remove=remove)
                group.add(item)
            page.add(group)
        run_async(lambda: client.select('question_bank', select=BANK_COLUMNS, level=f'eq.{chosen_level}', category=f'eq.{chosen_category}',
                                        order='created_at.desc'), loaded, lambda error: window.toast(str(error)))

    def delete(row: dict) -> None:
        def done(_r) -> None:
            window.toast('Questão excluída.')
            load()
        run_async(lambda: client.delete('question_bank', id=f'eq.{row["id"]}', teacher_id=f'eq.{window.profile["id"]}'), done,
                  lambda error: window.toast(str(error)))

    def create(question: dict, extra: dict) -> None:
        values = model.bank_values(extra['level'], extra['category'], question, skill=extra.get('skill'), subskill=extra.get('subskill', ''),
                                   difficulty=extra.get('difficulty', 5), task_type=extra.get('task_type', ''), topic=extra.get('topic', ''),
                                   genre=extra.get('genre', ''), descriptor=extra.get('descriptor', ''), quality=extra.get('quality', 'draft'),
                                   restricted=extra.get('restricted', False))

        def done(_r) -> None:
            window.toast('Questão salva no banco.')
            level.set_selected(model.QUESTION_BANK_LEVELS.index(extra['level']))
            category.set_selected(model.QUESTION_CATEGORIES.index(extra['category']))
            load()
        run_async(lambda: client.insert('question_bank', {'teacher_id': window.profile['id'], **values}), done, lambda error: window.toast(str(error)))

    level.connect('notify::selected', load)
    category.connect('notify::selected', load)
    new.connect('clicked', lambda *_: question_editor(dialog, 'Nova questão', create, metadata=True, level=current()[0], category=current()[1]))
    load()
    dialog.present(window)
    return dialog


def result_group(result: dict | None) -> Adw.PreferencesGroup | None:
    if not result:
        return None
    group = Adw.PreferencesGroup(title='Resultado do aluno')
    row = Adw.ActionRow(title=model.quiz_summary(result))
    level = Gtk.LevelBar(min_value=0, max_value=100, value=float(result.get('percentage') or 0), valign=Gtk.Align.CENTER, width_request=160)
    row.add_suffix(level)
    group.add(row)
    attempts = result.get('attempts') or []
    if attempts:
        group.add(Adw.ActionRow(title=f'{len(attempts)} tentativa(s) registrada(s)'))
    return group

