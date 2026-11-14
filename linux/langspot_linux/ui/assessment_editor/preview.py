"""The assessment as the student sees it, marking what a chosen student has already seen."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import label, pill, rich_markup
from langspot_linux.worker import run_async
from .fields import combo


def preview(editor) -> None:
    draft = editor.draft
    dialog = Adw.Dialog(title='Pré-visualização · como o aluno vê', content_width=720, content_height=760)
    toolbar = Adw.ToolbarView()
    header = Adw.HeaderBar()
    key = Gtk.ToggleButton(label='Mostrar gabarito')
    header.pack_start(key)
    toolbar.add_top_bar(header)
    page = Adw.PreferencesPage()
    intro = Adw.PreferencesGroup(title=GLib.markup_escape_text(draft.get('title') or 'Avaliação sem título'),
                                 description=GLib.markup_escape_text(draft.get('description') or 'Sem instruções gerais.'))
    ids = sorted(editor.students, key=lambda item: editor.students[item]['name'].lower())
    options = [('', 'Nenhum aluno')] + [(item, editor.students[item]['name']) for item in ids]
    state: dict = {'student': editor.preview_student or '', 'seen': ({}, {})}
    intro.add(combo('Marcar o que este aluno já viu', options, state['student'], lambda value: (state.update(student=value), load_seen())))
    page.add(intro)
    holder: list[Gtk.Widget] = []

    def fill() -> None:
        for group in holder:
            page.remove(group)
        holder.clear()
        items, texts = state['seen']
        name = editor.students.get(state['student'], {}).get('name', 'O aluno')
        for index, section in enumerate(draft['sections'], 1):
            questions = section['questions']
            description = section.get('instructions') or ''
            if section.get('drawCount'):
                description = f'Sorteia {section["drawCount"]} de {len(questions)} questões. ' + description
            group = Adw.PreferencesGroup(title=GLib.markup_escape_text(f'Parte {index} · {section.get("title")}'), description=GLib.markup_escape_text(description))
            shown_texts = set()
            for number, question in enumerate(questions, 1):
                snapshot = question['snapshot']
                tasklet = snapshot.get('taskletId')
                if snapshot.get('sourceMaterial') and snapshot.get('type') != 'mediation' and tasklet not in shown_texts:
                    shown_texts.add(tasklet)
                    text_mark = texts.get(tasklet) if tasklet else None
                    text_row = Adw.ExpanderRow(title='Texto' + (f' · {snapshot.get("taskletTitle")}' if snapshot.get('taskletTitle') else ''),
                                               subtitle=GLib.markup_escape_text(f'{name} já viu em “{text_mark["assessmentTitle"]}” ({A.local_date(text_mark["seenAt"])})')
                                               if text_mark else GLib.markup_escape_text(snapshot.get('sourceCredit') or ''))
                    body = label('', selectable=True)
                    body.set_markup(rich_markup(snapshot['sourceMaterial']))
                    body.set_margin_start(12)
                    body.set_margin_end(12)
                    body.set_margin_top(8)
                    body.set_margin_bottom(8)
                    text_row.add_row(body)
                    group.add(text_row)
                group.add(preview_question(number, snapshot, key.get_active(), items.get(snapshot.get('externalId')) if snapshot.get('externalId') else None, name))
            holder.append(group)
            page.add(group)

    def load_seen() -> None:
        if not state['student']:
            state['seen'] = ({}, {})
            fill()
            return
        run_async(lambda: editor.client.rpc('list_student_seen_items', p_student_id=state['student']) or [],
                  lambda seen: (state.update(seen=A.seen_index(seen)), fill()), lambda error: editor.window.toast(str(error)))
    key.connect('toggled', lambda *_: fill())
    load_seen()
    toolbar.set_content(page)
    dialog.set_child(toolbar)
    dialog.present(editor.window)


def preview_question(number: int, snapshot: dict, show_key: bool, seen: dict | None, name: str) -> Gtk.Widget:
    live = A.is_live(snapshot)
    kind = snapshot.get('type')
    lines = []
    if live:
        lines.append('Você conduz e pontua esta tarefa na sessão ao vivo.')
    elif kind in ('writing', 'mediation'):
        lines.append('O aluno escreve a resposta.')
    elif kind == 'speaking':
        extra = f' ({snapshot.get("preparationSeconds")}s de preparação, {snapshot.get("recordingSeconds")}s de gravação)' if snapshot.get('preparationSeconds') else ''
        lines.append(f'O aluno grava a resposta em áudio{extra}.')
    elif kind in ('fill_blank', 'short_answer'):
        lines.append('Resposta curta digitada pelo aluno.' + (f' Gabarito: {snapshot.get("answer")}' if show_key and snapshot.get('answer') else ''))
    target = (snapshot.get('responseConstraints') or {}).get('label')
    if target:
        lines.append(('Duração esperada: ' if kind == 'speaking' else 'Extensão esperada: ') + target)
    if seen:
        lines.insert(0, f'👁 {name} já viu em “{seen["assessmentTitle"]}” ({A.local_date(seen["seenAt"])})')
    row = Adw.ExpanderRow(title=rich_markup(f'{number}. {snapshot.get("prompt") or ""}'), subtitle=GLib.markup_escape_text('\n'.join(lines)), title_lines=0,
                          subtitle_lines=0)
    if kind == 'mediation' and snapshot.get('sourceMaterial'):
        source = Adw.ActionRow(title='Material-fonte', subtitle=rich_markup(snapshot['sourceMaterial']), subtitle_selectable=True)
        source.add_css_class('property')
        row.add_row(source)
    if snapshot.get('options') and kind not in A.PRODUCTIVE_TYPES:
        answers = A.split_ordering(snapshot.get('answer') or '') if kind == 'multiple_response' else [snapshot.get('answer')]
        for index, option in enumerate(snapshot['options']):
            option_row = Adw.ActionRow(title=GLib.markup_escape_text(f'{"ABCDEFGH"[index] if index < 8 else index + 1}  {option}'))
            if show_key and option in answers:
                option_row.add_suffix(pill('correta', 'success'))
            row.add_row(option_row)
    if show_key and kind in ('ordering', 'matching') and snapshot.get('answer'):
        key_row = Adw.ActionRow(title='Gabarito', subtitle=GLib.markup_escape_text(' · '.join(A.split_ordering(snapshot['answer']))))
        key_row.add_css_class('property')
        row.add_row(key_row)
    row.set_expanded(bool(snapshot.get('options')) and kind not in A.PRODUCTIVE_TYPES)
    return row
