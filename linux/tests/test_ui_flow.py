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
PDF = __import__('pathlib').Path('/tmp/langspot-ui-test/relatorio.pdf')
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


def close_dialogs():
    for dialog in walk(app.window, Adw.Dialog):
        dialog.force_close()


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


def answer_alert(text):
    def run():
        dialog = walk(app.window, Adw.AlertDialog)[0]
        walk(dialog, Gtk.TextView)[0].get_buffer().set_text(text)
        dialog.emit('response', 'ok')
        dialog.force_close()
    return run


def select_in_submission():
    page = visible_page('tasks')
    view = next(item for item in walk(page, Gtk.Label) if item.has_css_class('ls-submission'))
    start = view.get_label().index('went to the beach')
    view.select_region(start, start + len('went to the beach'))
    buttons(page, 'Comentar trecho selecionado')[0].emit('clicked')


def grade_task():
    page = visible_page('tasks')
    next(row for row in walk(page, Adw.SwitchRow) if row.get_title() == 'Dar nota').set_active(True)
    walk(page, Adw.SpinRow)[0].set_value(90)
    walk(page, Gtk.TextView)[-1].get_buffer().set_text('Good use of the past simple.')
    buttons(page, 'Salvar correção')[0].emit('clicked')


def quiz_page():
    return app.window.pages['quiz']


def build_quiz():
    dialog = last_dialog()
    entry(dialog, 'Título (ex.: Present Perfect Quiz)').set_text('Present perfect check')
    level = next(row for row in walk(dialog, Adw.ComboRow) if row.get_title() == 'Nível')
    level.set_selected(2)  # A2: the bank has two Grammar items there


def add_bank_and_ai():
    dialog = last_dialog()
    buttons(dialog, 'Montar')[0].emit('clicked')
    entry(dialog, 'Tema para a IA (ex.: Present perfect with travel)').set_text('Travel')
    next(row for row in walk(dialog, Adw.SpinRow) if row.get_title() == 'Questões geradas com IA').set_value(2)
    buttons(dialog, 'Gerar com IA')[0].emit('clicked')


def open_manual_question():
    dialog = walk(app.window, Adw.Dialog)[-1]
    next(row for row in walk(dialog, Adw.ButtonRow) if row.get_title() == 'Adicionar questão manual').emit('activated')


def fill_manual_question(button_label='Adicionar'):
    def run():
        dialog = last_dialog()
        kind = next(row for row in walk(dialog, Adw.ComboRow) if row.get_title() == 'Tipo da pergunta')
        kind.set_selected(1)  # fill_blank
        entry(dialog, 'Enunciado').set_text('I have ___ (be) to Japan.')
        entry(dialog, 'Resposta correta').set_text('been')
        buttons(dialog, button_label)[0].emit('clicked')
    return run


def create_quiz():
    dialog = walk(app.window, Adw.Dialog)[-1]
    buttons(dialog, 'Criar quiz')[0].emit('clicked')


def new_bank_question():
    dialog = last_dialog()
    next(button for button in walk(dialog, Gtk.Button) if button.get_tooltip_text() == 'Nova questão').emit('clicked')


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


def students_page():
    return app.window.pages['students']


def fill_new_student():
    dialog = last_dialog()
    entry(dialog, 'Nome completo').set_text('Diego Rocha')
    entry(dialog, 'E-mail').set_text('diego@exemplo.com')
    entry(dialog, 'Objetivo').set_text('Conversação')
    next(row for row in walk(dialog, Adw.SwitchRow) if row.get_title() == 'Agendar a primeira aula').set_active(True)
    buttons(dialog, 'Criar acesso')[0].emit('clicked')


def fill_invite():
    dialog = last_dialog()
    entry(dialog, 'Nome completo').set_text('Elisa Prado')
    entry(dialog, 'E-mail').set_text('elisa@exemplo.com')
    buttons(dialog, 'Enviar convite')[0].emit('clicked')


def edit_bruno():
    students_page().edit_student(students_page().record('st-bruno'))


def fill_edit():
    dialog = last_dialog()
    entry(dialog, 'Nome completo').set_text('Bruno Lima Souza')
    entry(dialog, 'WhatsApp').set_text('5581999990002')
    buttons(dialog, 'Salvar')[0].emit('clicked')


def change_skills():
    page = visible_page('students')
    scales = walk(page, Gtk.Scale)
    scales[0].set_value(77)
    buttons(page, 'Salvar habilidades')[0].emit('clicked')


def fill_record():
    dialog = last_dialog()
    entry(dialog, 'Tema da aula').set_text('Small talk at work')
    buttons(dialog, 'Registrar aula')[0].emit('clicked')


def save_teacher_profile():
    page = app.window.pages['settings']
    entry(page.nav, 'Nome da escola ou marca').set_text('Maylton English')
    buttons(page.nav, 'Salvar perfil')[0].emit('clicked')


def fill_teacher_invite():
    dialog = last_dialog()
    entry(dialog, 'Nome completo').set_text('Paula Reis')
    entry(dialog, 'E-mail').set_text('paula@exemplo.com')
    buttons(dialog, 'Gerar convite')[0].emit('clicked')


def suspend_teacher():
    buttons(last_dialog(), 'Suspender')[0].emit('clicked')


def question_bank_dialog():
    from langspot_linux.ui.quiz_builder import question_bank
    question_bank(app.window)


def assessments_page():
    return app.window.pages['assessments']


def editor():
    return assessments_page().editor


def publish_draft():
    editor().publish()


def respond_alert(response='ok'):
    def run():
        dialog = walk(app.window, Adw.AlertDialog)[0]
        dialog.emit('response', response)
        dialog.force_close()
    return run


def submit_assign():
    dialog = last_dialog()
    buttons(dialog, 'Atribuir')[0].emit('clicked')


def type_title():
    page = editor().page
    entry(page, 'Título (ex.: Unit 4 Progress Test)').set_text('Phrasal verbs quiz')


def add_section():
    buttons(editor().page, 'Adicionar seção')[0].emit('clicked')


def open_manual():
    buttons(editor().page, 'Criar questão')[0].emit('clicked')


def fill_manual():
    dialog = last_dialog()
    entry(dialog, 'Enunciado').set_text('She ___ up early every day.')
    views = walk(dialog, Gtk.TextView)
    views[0].get_buffer().set_text('gets\ngoes')
    views[1].get_buffer().set_text('gets')
    buttons(dialog, 'Adicionar')[0].emit('clicked')


def save_note():
    page = visible_page('assessments')
    row = next(item for item in walk(page, Adw.ExpanderRow) if item.get_title() == 'Relatório para o aluno')
    row.set_expanded(True)
    views = walk(row, Gtk.TextView)
    views[0].get_buffer().set_text('Você evoluiu muito na leitura.')
    views[1].get_buffer().set_text('Revisar conectivos.')
    buttons(row, 'Salvar comentário')[0].emit('clicked')


def open_override():
    buttons(visible_page('assessments'), 'Revisar nível CEFR')[0].emit('clicked')


def fill_override():
    dialog = last_dialog()
    next(row for row in walk(dialog, Adw.ComboRow) if row.get_title() == 'Nível revisado').set_selected(5)  # B1+
    walk(dialog, Gtk.TextView)[0].get_buffer().set_text('Writing B1 na tarefa principal; leitura forte.')
    buttons(dialog, 'Registrar revisão')[0].emit('clicked')


def write_pdf():
    from langspot_linux.ui.assessment_results import write_report_pdf
    result = fake_supabase.STATE.result()
    result['cefrProfile'] = fake_supabase.PROFILE
    write_report_pdf(PDF, result, None, {'summary': 'Ótimo trabalho — continue assim.', 'nextSteps': 'Ler 10 min por dia.'})


def score_live():
    page = visible_page('assessments')
    for row in walk(page, Adw.ComboRow):
        row.set_selected(3)  # A2
    buttons(page, 'Salvar e avançar')[0].emit('clicked')


def complete_live():
    buttons(visible_page('assessments'), 'Concluir avaliação')[0].emit('clicked')


def confirm_level():
    page = visible_page('assessments')
    row = next(item for item in walk(page, Adw.ButtonRow) if item.get_title() == 'Confirmar nível B1')
    row.emit('activated')


def edit_assignment_due():
    dialog = last_dialog()
    due = next(row for row in walk(dialog, Adw.ExpanderRow) if row.get_title() == 'Prazo')
    due.set_enable_expansion(True)
    next(row for row in walk(dialog, Adw.SpinRow) if row.get_title() == 'Tentativas').set_value(3)
    buttons(dialog, 'Salvar')[0].emit('clicked')


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
    (300, lambda: app.window.open_page('tasks')), (1500, review_task), (800, select_in_submission), (600, answer_alert('Use "went to the beach" — good past simple!')), (500, grade_task),
    (1500, lambda: check(row_with(STATE.assignments, 'id', 'a1').get('status') == 'reviewed' and row_with(STATE.assignments, 'id', 'a1').get('grade') == 90,
                         'Task reviewed with grade 90')),
    (300, lambda: app.window.pages['tasks'].new_task()), (800, fill_task),
    (1500, lambda: check(any(row.get('title') == 'Describe your city' and row.get('material_id') for row in STATE.assignments), 'Task created with material')),
    (100, lambda: check(len(STATE.material_assignments) >= 2, 'Task material shared with the student')),
    (100, lambda: check(len(row_with(STATE.assignments, 'id', 'a1').get('text_comments') or []) == 1
                        and row_with(STATE.assignments, 'id', 'a1')['text_comments'][0]['text'] == 'went to the beach'
                        and row_with(STATE.assignments, 'id', 'a1')['text_comments'][0]['start'] == 15, 'Comment on part of the text saved with web offsets')),
    # Quiz
    (300, lambda: app.window.open_page('quiz')), (1500, lambda: check(app.window.rows['quiz'].badge.get_text() == '1', 'Quiz badge counts submitted quizzes')),
    (100, lambda: quiz_page().new_task()), (1500, build_quiz), (1500, add_bank_and_ai), (1500, open_manual_question), (800, fill_manual_question()),
    (800, create_quiz),
    (2000, lambda: check(any(row.get('title') == 'Present perfect check' and row.get('assignment_type') == 'interactive'
                             and len(row['interactive_content']['questions']) == 5
                             and row['interactive_content']['questions'][-1]['answer'] == 'been' for row in STATE.assignments),
                         'Quiz created from the bank (2), AI (2) and a manual question')),
    (300, lambda: question_bank_dialog()), (1500, new_bank_question), (800, fill_manual_question('Salvar questão')),
    (1500, lambda: check(any(row.get('prompt') == 'I have ___ (be) to Japan.' and row.get('teacher_id') == 'teacher-0001' and row.get('quality_status') == 'draft'
                             for row in STATE.question_bank), 'Question saved in the bank')),
    (300, close_dialogs),
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
    # Students
    (300, lambda: app.window.open_page('students')), (1500, lambda: students_page().create_student()), (800, fill_new_student),
    (2000, lambda: check(any(row['student'].get('email') == 'diego@exemplo.com' for row in STATE.students)
                         and any(row.get('student_id') == 'st-new-1' and row.get('status') == 'scheduled' for row in STATE.lessons),
                         'Student created with a temporary password and a first lesson')),
    (100, lambda: check(bool(buttons(app.window, 'Copiar tutorial de acesso')), 'Temporary access tutorial shown')),
    (300, close_dialogs), (300, lambda: students_page().invite_student()), (800, fill_invite),
    (1500, lambda: check(STATE.invites and STATE.invites[-1]['email'] == 'elisa@exemplo.com' and STATE.invites[-1]['origin'], 'Invitation sent with the site address')),
    (300, edit_bruno), (800, fill_edit),
    (1500, lambda: check(row_with(STATE.students, 'student_id', 'st-bruno')['student']['full_name'] == 'Bruno Lima Souza', 'Student profile edited')),
    (300, lambda: app.window.open_student('st-ana')), (1500, change_skills),
    (1500, lambda: check(row_with(STATE.students, 'student_id', 'st-ana')['skills'].get('Speaking') == 77, 'Skills saved from the profile')),
    (300, lambda: students_page().new_record(students_page().record('st-ana'))), (800, fill_record),
    (1500, lambda: check(any(row.get('topic') == 'Small talk at work' and row['status'] == 'completed' and row['student_id'] == 'st-ana' for row in STATE.lessons),
                         'Lesson registered from the profile')),
    (300, lambda: students_page().delete_student(students_page().record('st-new-1'))), (500, confirm_dialog),
    (1500, lambda: check(not row_with(STATE.students, 'student_id', 'st-new-1'), 'Student deleted')),
    # Settings
    (300, lambda: app.window.open_page('settings')), (1500, save_teacher_profile),
    (1500, lambda: check(STATE.profile['school_name'] == 'Maylton English' and app.window.footer_email.get_text() == 'Maylton English', 'Teacher profile saved')),
    (300, lambda: app.window.pages['settings'].invite_teacher()), (1000, fill_teacher_invite),
    (1500, lambda: check(STATE.teacher_invitations[0]['email'] == 'paula@exemplo.com', 'Teacher invitation created')),
    (300, close_dialogs), (300, lambda: app.window.pages['settings'].manage_teachers()), (1500, suspend_teacher),
    (1500, lambda: check(row_with(STATE.teachers, 'id', 'teacher-0002')['status'] == 'expired', 'Teacher access suspended')),
    (300, close_dialogs),
    # Assessments
    (300, lambda: app.window.open_page('assessments')), (2000, lambda: assessments_page().generate('pr-b1', None, 'st-ana')),
    (2500, lambda: check(STATE.generated and STATE.generated[-1]['p_student_id'] == 'st-ana' and STATE.generated[-1]['p_selection_seed'].startswith('ana-souza-')
                         and STATE.generated[-1]['p_bank_version'] == 'pilot-0.10', 'Ready-made level check generated for the student')),
    (100, lambda: check(editor().draft['framework'] == 'cefr' and len(editor().draft['sections']) == 2, 'Generated draft opened in the editor')),
    (300, publish_draft), (800, respond_alert()),
    (2500, lambda: check(STATE.published and STATE.published[-1].startswith('as-gen-'), 'Draft saved and published')),
    (300, submit_assign),
    (1500, lambda: check(STATE.assessment_assignments and STATE.assessment_assignments[-1]['student_id'] == 'st-ana'
                         and STATE.assessment_assignments[-1]['attempt_limit'] == 1, 'Published assessment assigned to Ana')),
    (300, lambda: assessments_page().refresh()),
    (1500, lambda: check(any(row.get_title().startswith('Carla Mendes · Speaking check A2') for row in walk(assessments_page().nav, Adw.ActionRow))
                         and any(row.get_title().startswith('Ana Souza · Level Check - B1') for row in walk(assessments_page().nav, Adw.ActionRow)),
                         'Assigned assessments listed, including ones not started')),
    (100, lambda: assessments_page().edit_assignment(row_with(STATE.assessment_assignments, 'id', 'aa-2'))), (800, edit_assignment_due),
    (1500, lambda: check(row_with(STATE.assessment_assignments, 'id', 'aa-2')['attempt_limit'] == 3 and row_with(STATE.assessment_assignments, 'id', 'aa-2')['due_at'],
                         'Not-started assignment changed')),
    (100, lambda: assessments_page().cancel_assignment(row_with(STATE.assessment_assignments, 'id', 'aa-3'))), (500, confirm_dialog),
    (1500, lambda: check(not row_with(STATE.assessment_assignments, 'id', 'aa-3'), 'Not-started assignment cancelled')),
    (100, lambda: assessments_page().cancel_assignment(row_with(STATE.assessment_assignments, 'id', 'aa-1'))), (500, confirm_dialog),
    (1500, lambda: check(bool(row_with(STATE.assessment_assignments, 'id', 'aa-1')), 'Started assignment kept (cannot be cancelled)')),
    (300, lambda: assessments_page().open_editor(__import__('langspot_linux.assessments', fromlist=['x']).empty_draft(), None)),
    (2500, type_title), (10, lambda: check(any(row.get('title') == 'Phrasal verbs quiz' for row in STATE.saved_drafts), 'Blank draft autosaved')),
    (300, add_section), (800, open_manual), (2500, fill_manual), (10,
     lambda: check(any(draft.get('title') == 'Phrasal verbs quiz' and draft['sections'] and draft['sections'][0]['questions']
                       and draft['sections'][0]['questions'][0]['snapshot']['answer'] == 'gets' for draft in STATE.saved_drafts), 'Manual question added and saved')),
    (300, lambda: assessments_page().nav.pop_to_tag('root')),
    (1500, lambda: assessments_page().delete(assessments_page().by_id('as-d1'))), (1000, respond_alert()),
    (1500, lambda: check('as-d1' in STATE.deleted_assessments, 'Draft deleted after the impact check')),
    (300, lambda: assessments_page().open_attempt('at-1')), (2500, save_note),
    (1500, lambda: check(STATE.report_notes.get('at-1', {}).get('nextSteps') == 'Revisar conectivos.', 'Report note saved')),
    (300, open_override), (800, fill_override),
    (1500, lambda: check(STATE.overrides and STATE.overrides[-1]['p_level'] == 'B1+', 'CEFR level overridden with a reason')),
    (100, write_pdf), (300, lambda: check(PDF.read_bytes()[:5] == b'%PDF-' and PDF.stat().st_size > 2000, 'Student report exported to PDF')),
    (300, lambda: assessments_page().nav.pop_to_tag('root')),
    (300, lambda: __import__('langspot_linux.ui.assessment_results', fromlist=['x']).LiveSession(assessments_page(), 'at-ls')), (1500, score_live),
    (1500, lambda: check(STATE.live_session['questions'][0]['gradingStatus'] == 'reviewed' and STATE.live_session['questions'][0]['rubricScores'].get('fluency') == 3,
                         'Live task scored with the rubric')),
    (300, complete_live), (1500, lambda: check(STATE.live_session['attempt']['status'] == 'completed', 'Live session completed')),
    (300, lambda: assessments_page().nav.pop_to_tag('root')),
    (300, lambda: __import__('langspot_linux.ui.assessment_results', fromlist=['x']).show_progress(assessments_page(), assessments_page().students, [], 'st-ana')),
    (1500, confirm_level), (800, confirm_dialog),
    (1500, lambda: check(STATE.confirmed_levels and STATE.confirmed_levels[-1] == {'p_student_id': 'st-ana', 'p_attempt_id': 'at-1', 'p_level': 'B1'},
                         'Level confirmed from the progress history')),
    (300, lambda: assessments_page().nav.pop_to_tag('root')),
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
