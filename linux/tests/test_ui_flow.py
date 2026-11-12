"""End-to-end UI flow against the fake Supabase (run under a display, e.g. xvfb-run).

Grades Writing and Speaking with the rubric, finalises the attempt, marks notifications read,
schedules a lesson and cancels it, checking the fake server's state after each step.
"""
from __future__ import annotations

import os
import sys

from tests import fake_supabase

server = fake_supabase.serve()
os.environ.update({'LANGSPOT_SUPABASE_URL': f'http://127.0.0.1:{server.server_port}', 'LANGSPOT_SUPABASE_ANON_KEY': 'demo',
                   'LANGSPOT_DISABLE_KEYRING': '1', 'LANGSPOT_REFRESH_TOKEN': 'refresh-1', 'XDG_CONFIG_HOME': '/tmp/langspot-ui-test',
                   'XDG_CACHE_HOME': '/tmp/langspot-ui-test/cache'})

import gi  # noqa: E402

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Adw, GLib, Gtk  # noqa: E402

from langspot_linux.ui.app import LangSpotApp  # noqa: E402

STATE = fake_supabase.STATE
app = LangSpotApp()
failures: list[str] = []
steps: list = []


def check(condition: bool, message: str) -> None:
    print(('ok   ' if condition else 'FAIL ') + message)
    if not condition:
        failures.append(message)


def walk(widget, kind):
    found = []
    stack = [widget]
    while stack:
        current = stack.pop()
        if isinstance(current, kind):
            found.append(current)
        child = current.get_last_child()
        while child:
            stack.append(child)
            child = child.get_prev_sibling()
    return found


def visible_page(key):
    return app.window.pages[key].nav.get_visible_page()


def buttons(widget, text):
    return [button for button in walk(widget, Gtk.Button) if button.get_label() == text]


def grade(level: int, feedback: str):
    def run():
        page = visible_page('review')
        combos = walk(page, Adw.ComboRow)
        for combo in combos:
            combo.set_selected(level)
        view = walk(page, Gtk.TextView)[0]
        view.get_buffer().set_text(feedback)
        buttons(page, 'Salvar correção')[0].emit('clicked')
    return run


def open_first_pending():
    review = app.window.pages['review']
    review.open_item(review.queue['items'][0])


def finalize():
    review = app.window.pages['review']
    review.show_attempt(review.queue['readyToFinalize'][0])


def click_finish():
    buttons(visible_page('review'), 'Concluir revisão')[0].emit('clicked')


def confirm_dialog():
    dialogs = [widget for widget in walk(app.window, Adw.AlertDialog)]
    if not dialogs:
        failures.append('no confirmation dialog')
        return
    dialogs[0].emit('response', 'ok')
    dialogs[0].force_close()


def mark_all_read():
    app.window.pages['notifications'].read_all()


def new_lesson():
    page = app.window.pages['agenda']
    page.new_lesson()


def fill_lesson():
    dialog = walk(app.window, Adw.Dialog)[-1]
    entries = walk(dialog, Adw.EntryRow)
    entries[-2].set_text('Phrasal verbs for plans')
    buttons(dialog, 'Agendar')[0].emit('clicked')


def cancel_new_lesson():
    page = app.window.pages['agenda']
    lesson = next(item for item in page.lessons if item.topic == 'Phrasal verbs for plans')
    page._cancel(lesson, type('Closed', (), {'close': lambda self: None})())


steps += [
    (3000, lambda: app.window.open_page('review')),
    (1500, open_first_pending),
    (1500, grade(5, 'Clear opinion and a good example; work on paragraphs.')),
    (1500, lambda: check(STATE.reviewed.get('r-w', {}).get('rubric') == {k: 5 for k in ('task_achievement', 'range', 'accuracy', 'organisation_cohesion', 'register_pragmatic_appropriacy')}
                         and abs(STATE.reviewed['r-w']['score'] - 25 / 55) < 1e-3, 'Writing graded B1 on every criterion, score 25/55')),
    (500, open_first_pending),
    (2000, grade(4, 'Fluent, vary your expressions.')),
    (1500, lambda: check('r-s' in STATE.reviewed and STATE.reviewed['r-s']['feedback'].startswith('Fluent'), 'Speaking graded with feedback')),
    (1500, lambda: check(len(app.window.pages['review'].queue.get('readyToFinalize') or []) == 1, 'Attempt is ready to finalise')),
    (500, finalize), (1500, click_finish), (500, confirm_dialog),
    (1500, lambda: check('at-1' in STATE.finalized, 'Review finalised')),
    (500, lambda: app.window.open_page('notifications')), (1500, mark_all_read),
    (1500, lambda: check(all(row['read_at'] for row in STATE.notifications), 'All notifications marked read')),
    (500, lambda: app.window.open_page('agenda')), (1500, new_lesson), (800, fill_lesson),
    (1500, lambda: check(any(row.get('topic') == 'Phrasal verbs for plans' and row['status'] == 'scheduled' for row in STATE.lessons), 'Lesson scheduled')),
    (500, cancel_new_lesson),
    (1500, lambda: check(any(row.get('topic') == 'Phrasal verbs for plans' and row['status'] == 'cancelled' for row in STATE.lessons), 'Lesson cancelled')),
]


def run_steps() -> bool:
    if not steps:
        app.quit()
        return GLib.SOURCE_REMOVE
    delay, step = steps.pop(0)
    try:
        step()
    except Exception as error:
        failures.append(f'{step}: {error!r}')
        print('FAIL', repr(error))
    GLib.timeout_add(delay, run_steps)
    return GLib.SOURCE_REMOVE


app.connect('activate', lambda *_: GLib.timeout_add(300, run_steps))
app.run([sys.argv[0]])
server.shutdown()
print('UI flow:', 'FAILED' if failures else 'passed')
sys.exit(1 if failures else 0)
