"""End-to-end UI flow against the fake Supabase (run under a display, e.g. xvfb-run).

Grades Writing and Speaking with the rubric, finalises the attempt, marks notifications read, then
schedules, cancels and completes lessons, approves a cancellation request, reviews and creates tasks,
saves and shares materials, registers and settles charges, opens a report and toggles the desktop
calendar, checking the fake server's state after each step.
"""
from __future__ import annotations

import os
import sys

from tests import fake_supabase

server = fake_supabase.serve()
os.environ.update({'LANGSPOT_SUPABASE_URL': f'http://127.0.0.1:{server.server_port}', 'LANGSPOT_SUPABASE_ANON_KEY': 'demo',
                   'LANGSPOT_DISABLE_KEYRING': '1', 'LANGSPOT_REFRESH_TOKEN': 'refresh-1', 'XDG_CONFIG_HOME': '/tmp/langspot-ui-test',
                   'XDG_CACHE_HOME': '/tmp/langspot-ui-test/cache', 'XDG_DATA_HOME': '/tmp/langspot-ui-test/data'})

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


def last_dialog():
    return walk(app.window, Adw.Dialog)[-1]


def entry(widget, title):
    return next(row for row in walk(widget, Adw.EntryRow) if row.get_title() == title)


def button_row(widget, title):
    return next(row for row in walk(widget, Adw.ButtonRow) if row.get_title() == title)


def agenda():
    return app.window.pages['agenda']


def lesson_named(topic):
    return next(item for item in agenda().lessons if item.topic == topic)


def fill_lesson():
    dialog = last_dialog()
    entry(dialog, 'Tema da aula').set_text('Phrasal verbs for plans')
    buttons(dialog, 'Agendar')[0].emit('clicked')


def open_lesson(topic):
    return lambda: agenda().show_lesson(lesson_named(topic))


def lesson_action(title):
    return lambda: button_row(last_dialog(), title).emit('activated')


def complete_lesson():
    dialog = last_dialog()
    attendance = next(row for row in walk(dialog, Adw.ComboRow) if row.get_title() == 'Presença')
    attendance.set_selected(0)
    scales = walk(dialog, Gtk.Scale)
    for scale in scales:
        scale.set_value(70)
    buttons(dialog, 'Concluir e registrar')[0].emit('clicked')


def approve_request():
    buttons(last_dialog(), 'Aprovar e cancelar a aula')[0].emit('clicked')


def row_with(rows, key, value):
    return next((row for row in rows if row.get(key) == value), {})


def review_task():
    tasks = app.window.pages['tasks']
    tasks.show_task(next(task for task in tasks.tasks if task['id'] == 'a1'))


def grade_task():
    page = visible_page('tasks')
    next(row for row in walk(page, Adw.SwitchRow) if row.get_title() == 'Dar nota').set_active(True)
    walk(page, Adw.SpinRow)[0].set_value(90)
    walk(page, Gtk.TextView)[0].get_buffer().set_text('Good use of the past simple.')
    buttons(page, 'Salvar correção')[0].emit('clicked')


def fill_task():
    dialog = last_dialog()
    entry(dialog, 'Título').set_text('Describe your city')
    material = next(row for row in walk(dialog, Adw.ComboRow) if row.get_title() == 'Material (opcional)')
    material.set_selected(1)
    buttons(dialog, 'Criar')[0].emit('clicked')


def fill_link_material():
    dialog = last_dialog()
    walk(dialog, Adw.ToggleGroup)[0].set_active_name('link')
    entry(dialog, 'Título').set_text('Podcast: daily routines')
    entry(dialog, 'Link (https://…)').set_text('https://www.example.com/podcast')
    buttons(dialog, 'Salvar')[0].emit('clicked')


def share_material():
    materials = app.window.pages['materials']
    materials.show_material(next(item for item in materials.materials if item['id'] == 'm2'))


def toggle_share():
    dialog = last_dialog()
    next(row for row in walk(dialog, Adw.SwitchRow) if row.get_title() == 'Bruno Lima').set_active(True)
    buttons(dialog, 'Salvar')[0].emit('clicked')


def fill_payment():
    dialog = last_dialog()
    entry(dialog, 'Descrição').set_text('Aula avulsa')
    walk(dialog, Adw.SpinRow)[0].set_value(150)
    buttons(dialog, 'Registrar')[0].emit('clicked')


def mark_first_paid():
    menu = walk(app.window.pages['finance'].nav, Gtk.MenuButton)[0]
    menu.activate_action('payment.paid', None)


def individual_report():
    app.window.pages['reports'].header.get_title_widget().set_active_name('individual')


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
    # Agenda
    (500, lambda: app.window.open_page('agenda')),
    (1500, lambda: check(app.window.rows['tasks'].badge.get_text() == '1', 'Task badge counts only regular submitted tasks')),
    (100, lambda: agenda().edit_lesson(None, agenda().anchor)), (800, fill_lesson),
    (1500, lambda: check(any(row.get('topic') == 'Phrasal verbs for plans' and row['status'] == 'scheduled' for row in STATE.lessons), 'Lesson scheduled')),
    (300, open_lesson('Phrasal verbs for plans')), (500, lesson_action('Cancelar aula')), (500, confirm_dialog),
    (1500, lambda: check(any(row.get('topic') == 'Phrasal verbs for plans' and row['status'] == 'cancelled' for row in STATE.lessons), 'Lesson cancelled')),
    (300, open_lesson('Conditionals in real life')), (500, lesson_action('Concluir aula')), (800, complete_lesson),
    (1500, lambda: check(row_with(STATE.lessons, 'id', 'l1').get('status') == 'completed' and row_with(STATE.lessons, 'id', 'l1').get('attendance') == 'presente'
                         and row_with(STATE.lessons, 'id', 'l1').get('skill_scores', {}).get('Speaking') == 70, 'Lesson completed with attendance and skills')),
    (100, lambda: check(row_with(STATE.students, 'student_id', 'st-ana')['skills'].get('Writing') == 70, 'Student skills updated from the lesson record')),
    (300, lambda: agenda().show_requests()), (500, approve_request),
    (1500, lambda: check(row_with(STATE.cancellation_requests, 'id', 'cr1').get('status') == 'approved'
                         and row_with(STATE.lessons, 'id', 'l3').get('status') == 'cancelled', 'Cancellation request approved, lesson cancelled')),
    # Tasks
    (300, lambda: app.window.open_page('tasks')), (1500, review_task), (800, grade_task),
    (1500, lambda: check(row_with(STATE.assignments, 'id', 'a1').get('status') == 'reviewed' and row_with(STATE.assignments, 'id', 'a1').get('grade') == 90,
                         'Task reviewed with grade 90')),
    (300, lambda: app.window.pages['tasks'].new_task()), (800, fill_task),
    (1500, lambda: check(any(row.get('title') == 'Describe your city' and row.get('material_id') for row in STATE.assignments), 'Task created with material')),
    (100, lambda: check(len(STATE.material_assignments) >= 2, 'Task material shared with the student')),
    # Materials
    (300, lambda: app.window.open_page('materials')), (1500, lambda: app.window.pages['materials'].new_material()), (800, fill_link_material),
    (1500, lambda: check(any(row.get('url') == 'https://www.example.com/podcast' and row.get('material_source') == 'link' for row in STATE.materials), 'Link material saved')),
    (300, share_material), (800, toggle_share),
    (1500, lambda: check({'material_id': 'm2', 'student_id': 'st-bruno'} in STATE.material_assignments, 'Material shared with Bruno')),
    # Finance
    (300, lambda: app.window.open_page('finance')), (1500, lambda: app.window.pages['finance'].new_payment()), (800, fill_payment),
    (1500, lambda: check(any(row.get('description') == 'Aula avulsa' and row.get('amount') == 150 for row in STATE.payments), 'Charge registered')),
    (300, mark_first_paid),
    (1500, lambda: check(row_with(STATE.payments, 'id', 'p2').get('status') == 'paid' and row_with(STATE.payments, 'id', 'p2').get('paid_at'), 'Overdue charge marked paid')),
    # Reports
    (300, lambda: app.window.open_page('reports')), (1500, individual_report),
    (800, lambda: check(bool(buttons(app.window.pages['reports'].nav, 'Copiar resumo')), 'Individual report rendered')),
    # Desktop calendar
    (100, lambda: app.activate_action('calendar-sync', None)),
    (2500, lambda: check(calendar_file().exists() and 'UID:lesson-l2@langspot.app' in calendar_file().read_text()
                         and 'lesson-l3@' not in calendar_file().read_text(), 'Lessons written to the desktop calendar (cancelled left out)')),
    (100, lambda: app.activate_action('calendar-sync', None)),
    (1500, lambda: check(not calendar_file().exists(), 'Desktop calendar removed when the option is turned off')),
]


def calendar_file():
    from langspot_linux import calendar_sync
    return calendar_sync.ics_path()


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
