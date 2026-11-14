"""Pick questions from the question bank for a section (the website's "Adicionar do banco")."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import rich_markup
from .fields import combo


def bank_dialog(editor, section: dict) -> None:
    dialog = Adw.Dialog(title=f'Banco · {section.get("title")}', content_width=680, content_height=720)
    toolbar = Adw.ToolbarView()
    toolbar.add_top_bar(Adw.HeaderBar())
    page = Adw.PreferencesPage()
    filters = Adw.PreferencesGroup(description='Mostra os itens compatíveis com a skill da seção. Clique em + para adicionar.')
    state = {'level': 'all', 'status': 'all', 'search': ''}
    level = combo('Nível CEFR', [('all', 'Todos')] + [(item, item) for item in A.CEFR_LEVELS], 'all', lambda value: (state.update(level=value), fill()))
    status = combo('Status', [('all', 'Todos')] + A.QUALITY, 'all', lambda value: (state.update(status=value), fill()))
    search = Adw.EntryRow(title='Buscar (subskill, tipo, tópico, enunciado)')
    search.connect('changed', lambda row: (state.update(search=row.get_text()), fill()))
    for row in (level, status, search):
        filters.add(row)
    page.add(filters)
    results: dict = {'group': None}
    used = {question.get('questionBankId') for question in section['questions']}

    def fill() -> None:
        if results['group']:
            page.remove(results['group'])
        matches = [question for question in editor.bank or [] if A.bank_matches(question, section, editor.draft['framework'], listening_enabled=editor.listening,
                                                                                level=state['level'], status=state['status'], search=state['search'])]
        group = Adw.PreferencesGroup(title=f'{len(matches)} questão(ões)', description='Mostrando as 60 primeiras; refine a busca.' if len(matches) > 60 else '')
        results['group'] = group
        for question in matches[:60]:
            details = ' · '.join(part for part in (question.get('externalId') or '', question.get('cefr') or '', A.label_of(A.QUESTION_TYPES, question.get('type')),
                                                    question.get('subskill') or '', question.get('qualityStatus') or '') if part)
            row = Adw.ActionRow(title=rich_markup(question.get('prompt') or ''), subtitle=GLib.markup_escape_text(details), title_lines=2)
            add = Gtk.Button(icon_name='object-select-symbolic' if question['bankId'] in used else 'list-add-symbolic', valign=Gtk.Align.CENTER,
                             sensitive=question['bankId'] not in used, tooltip_text='Adicionar à seção')
            add.add_css_class('flat')

            def added(button, item=question) -> None:
                section['questions'].append(A.draft_question(item, item['bankId']))
                used.add(item['bankId'])
                button.set_icon_name('object-select-symbolic')
                button.set_sensitive(False)
                editor.changed(rebuild=True)
            add.connect('clicked', added)
            row.add_suffix(add)
            group.add(row)
        page.add(group)
    fill()
    toolbar.set_content(page)
    dialog.set_child(toolbar)
    dialog.present(editor.window)
