"""Runs the app against the fake Supabase and saves PNGs of every page (in-process render, any GDK backend).

    python3 -m tests.screenshots OUTPUT_DIR [--dark]
Use with GDK_BACKEND=broadway (gtk4-broadwayd) to render without a visible window.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from tests import fake_supabase

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'screenshots')
DARK = '--dark' in sys.argv
server = fake_supabase.serve()
os.environ.update({'LANGSPOT_SUPABASE_URL': f'http://127.0.0.1:{server.server_port}', 'LANGSPOT_SUPABASE_ANON_KEY': 'demo',
                   'LANGSPOT_DISABLE_KEYRING': '1', 'LANGSPOT_REFRESH_TOKEN': 'refresh-1', 'XDG_CONFIG_HOME': str(OUT / 'config')})

import gi  # noqa: E402

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Adw, GLib, Graphene, Gtk  # noqa: E402

from langspot_linux.ui.app import LangSpotApp  # noqa: E402

app = LangSpotApp()
steps: list = []
errors: list[str] = []


def shot(name: str):
    def take() -> None:
        window = app.window
        width, height = window.get_width(), window.get_height()
        paintable = Gtk.WidgetPaintable.new(window)
        snapshot = Gtk.Snapshot.new()
        paintable.snapshot(snapshot, width, height)
        node = snapshot.to_node()
        if node is None:
            errors.append(f'{name}: nothing rendered')
            return
        texture = window.get_renderer().render_texture(node, Graphene.Rect().init(0, 0, width, height))
        OUT.mkdir(parents=True, exist_ok=True)
        texture.save_to_png(str(OUT / f'{name}.png'))
        print('saved', name)
    return take


def page(key: str):
    return lambda: app.window.open_page(key)


def first_row_of(key: str, title: str):
    """Activates the first row in a page's group with the given title."""
    def run() -> None:
        target = app.window.pages[key]
        found = _find_group(target, title)
        if not found:
            errors.append(f'{key}: group {title!r} not found')
            return
        rows = []
        _collect_rows(found, rows)
        if not rows:
            errors.append(f'{key}: no rows in {title!r}')
            return
        rows[0].emit('activated')
    return run


def _find_group(widget, title):
    if isinstance(widget, Adw.PreferencesGroup) and widget.get_title() == title:
        return widget
    child = widget.get_first_child()
    while child:
        found = _find_group(child, title)
        if found:
            return found
        child = child.get_next_sibling()
    return None


def _collect_rows(widget, rows):
    if isinstance(widget, Adw.ActionRow) and widget.get_activatable():
        rows.append(widget)
        return
    child = widget.get_first_child()
    while child:
        _collect_rows(child, rows)
        child = child.get_next_sibling()


def close_dialogs():
    from gi.repository import Adw as _Adw
    stack = [app.window]
    while stack:
        current = stack.pop()
        if isinstance(current, _Adw.Dialog):
            current.force_close()
            continue
        child = current.get_first_child()
        while child:
            stack.append(child)
            child = child.get_next_sibling()


def back(key: str):
    return lambda: app.window.pages[key].nav.pop_to_tag('root')


def logout():
    app.logout()


def run_steps() -> bool:
    if not steps:
        app.quit()
        return GLib.SOURCE_REMOVE
    delay, step = steps.pop(0)
    try:
        step()
    except Exception as error:  # report and continue
        errors.append(f'{getattr(step, "__name__", step)}: {error!r}')
    GLib.timeout_add(delay, run_steps)
    return GLib.SOURCE_REMOVE


steps += [
    (2500, lambda: None),
    (1500, shot('00-visao-geral')),
    (500, page('agenda')), (1500, shot('01-agenda-semana')),
    (500, lambda: app.window.pages['agenda'].header.get_title_widget().set_active_name('month')), (1200, shot('02-agenda-mes')),
    (500, lambda: app.window.pages['agenda']._select_day(__import__('datetime').date.today())), (1200, shot('03-agenda-mes-dia')),
    (500, lambda: app.window.pages['agenda'].record_lesson(app.window.pages['agenda'].lessons[0])), (1500, shot('04-agenda-concluir-aula')),
    (300, close_dialogs),
    (500, lambda: app.window.pages['agenda'].show_requests()), (1200, shot('05-agenda-pedidos-cancelamento')), (300, close_dialogs),
    (500, lambda: app.window.pages['agenda'].header.get_title_widget().set_active_name('week')),
    (1500, page('students')), (1200, shot('06-alunos')),
    (1500, first_row_of('students', '3 alunos')), (1500, shot('07-aluno-detalhe')), (300, back('students')),
    (500, lambda: app.window.pages['students'].create_student()), (1200, shot('07b-aluno-novo')), (300, close_dialogs),
    (500, lambda: app.window.pages['students'].show_access('Diego Rocha', 'diego@exemplo.com', 'Temp-1234')), (1200, shot('07c-aluno-acesso')), (300, close_dialogs),
    (1500, page('tasks')), (1500, shot('08-tarefas')),
    (1500, first_row_of('tasks', 'Para corrigir')), (1500, shot('09-tarefa-correcao')), (300, back('tasks')),
    (1500, page('quiz')), (1500, shot('09b-quiz')),
    (1500, first_row_of('quiz', 'Realizados')), (1500, shot('09c-quiz-detalhe')), (300, back('quiz')),
    (500, lambda: app.window.pages['quiz'].new_task()), (2000, shot('09d-quiz-novo')), (300, close_dialogs),
    (500, lambda: __import__('langspot_linux.ui.quiz_builder', fromlist=['x']).question_bank(app.window)), (1500, shot('09e-banco-de-questoes')), (300, close_dialogs),
    (1500, page('assessments')), (2000, shot('09f-avaliacoes')),
    (500, lambda: app.window.pages['assessments'].new_assessment()), (1200, shot('09g-avaliacao-nova')), (300, close_dialogs),
    (500, lambda: app.window.pages['assessments'].edit(app.window.pages['assessments'].by_id('as-d1'))), (2000, shot('09h-avaliacao-editor')),
    (300, lambda: app.window.pages['assessments'].nav.pop_to_tag('root')),
    (800, lambda: app.window.pages['assessments'].assign(app.window.pages['assessments'].by_id('as-1'))), (2000, shot('09i-avaliacao-atribuir')), (300, close_dialogs),
    (500, lambda: app.window.pages['assessments'].open_attempt('at-1')), (2500, shot('09j-avaliacao-relatorio')),
    (300, back('assessments')),
    (500, lambda: __import__('langspot_linux.ui.assessment_results', fromlist=['x']).LiveSession(app.window.pages['assessments'], 'at-ls')), (2000, shot('09k-avaliacao-ao-vivo')),
    (300, back('assessments')),
    (500, lambda: __import__('langspot_linux.ui.assessment_results', fromlist=['x']).show_progress(app.window.pages['assessments'], app.window.pages['assessments'].students, [])),
    (2000, shot('09l-avaliacao-evolucao')), (300, back('assessments')),
    (1500, page('review')), (1200, shot('10-correcao-fila')),
    (2000, first_row_of('review', 'Aguardando correção')), (2500, shot('11-correcao-writing')), (300, back('review')),
    (300, lambda: app.window.pages['review'].refresh()),
    (1500, lambda: app.window.pages['review'].open_item(app.window.pages['review'].queue['items'][1])), (3000, shot('12-correcao-speaking')), (300, back('review')),
    (1500, page('live')), (1500, shot('13-ao-vivo')),
    (1500, first_row_of('live', 'Provas em andamento')), (2500, shot('14-ao-vivo-detalhe')), (300, back('live')),
    (1500, page('materials')), (1500, shot('15-materiais')),
    (500, lambda: app.window.pages['materials'].new_material()), (1200, shot('16-material-novo')), (300, close_dialogs),
    (1500, page('finance')), (1500, shot('17-financeiro')),
    (1500, page('reports')), (1500, shot('18-relatorio-resumo')),
    (500, lambda: app.window.pages['reports']._open_individual('st-ana')), (1500, shot('19-relatorio-individual')),
    (1500, page('progress')), (1500, shot('19b-progresso')),
    (1500, page('notifications')), (1200, shot('20-notificacoes')),
    (1500, page('settings')), (1500, shot('20b-configuracoes')),
    (500, lambda: app.window.pages['settings'].manage_teachers()), (1500, shot('20c-gerenciar-professores')), (300, close_dialogs),
    (800, logout), (1200, shot('21-login')),
]


def started(*_args) -> None:
    Adw.StyleManager.get_default().set_color_scheme(Adw.ColorScheme.FORCE_DARK if DARK else Adw.ColorScheme.FORCE_LIGHT)
    GLib.timeout_add(500, run_steps)


app.connect('activate', started)
status = app.run([sys.argv[0]])
for line in errors:
    print('ERROR', line)
server.shutdown()
sys.exit(1 if errors else status)
