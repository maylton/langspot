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
    (1500, shot('01-agenda')),
    (1500, page('students')), (1200, shot('02-alunos')),
    (1500, first_row_of('students', '3 alunos')), (1500, shot('03-aluno-detalhe')), (300, back('students')),
    (1500, page('review')), (1200, shot('04-correcao-fila')),
    (2000, first_row_of('review', 'Aguardando correção')), (2500, shot('05-correcao-writing')), (300, back('review')),
    (300, lambda: app.window.pages['review'].refresh()),
    (1500, lambda: app.window.pages['review'].open_item(app.window.pages['review'].queue['items'][1])), (3000, shot('06-correcao-speaking')), (300, back('review')),
    (1500, page('live')), (1500, shot('07-ao-vivo')),
    (1500, first_row_of('live', 'Provas em andamento')), (2500, shot('08-ao-vivo-detalhe')), (300, back('live')),
    (1500, page('notifications')), (1200, shot('09-notificacoes')),
    (800, logout), (1200, shot('10-login')),
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
