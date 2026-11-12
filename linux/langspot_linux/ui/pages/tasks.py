"""Tasks (regular assignments): to review, waiting for the student, reviewed; review, create, delete.

Interactive quizzes stay on the website.
"""
from __future__ import annotations

from datetime import date, timedelta

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import (Page, confirm, date_row, empty_state, form_dialog, label, open_uri, pill, scrolled,
                                      student_names, text_card, text_view, vbox)
from langspot_linux.worker import run_async


class TasksPage(Page):
    key = 'tasks'
    title = 'Tarefas'
    icon = 'checkbox-checked-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.tasks: list[dict] = []
        self.students: dict[str, dict] = {}
        self.materials: dict[str, dict] = {}
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova tarefa')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_task())
        self.header.pack_start(new)

    def refresh(self) -> None:
        self.show_loading()
        client = self.client

        def work():
            students = student_names(client)
            tasks = [row for row in client.select('assignments', order='due_date.asc') if row.get('assignment_type') != 'interactive']
            materials = {row['id']: row for row in client.select('materials', select='id,title,url,storage_path')}
            return students, tasks, materials

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.students, self.tasks, self.materials = result
        to_review = [task for task in self.tasks if task.get('status') == 'submitted']
        self.window.set_count('tasks', len(to_review))
        box = vbox(18)
        counts = Gtk.Box(spacing=12, homogeneous=True)
        for title, value in (('Para corrigir', len(to_review)), ('Aguardando o aluno', sum(1 for task in self.tasks if task.get('status') == 'pending')),
                             ('Corrigidas', sum(1 for task in self.tasks if task.get('status') == 'reviewed'))):
            card = vbox(2)
            card.add_css_class('card')
            card.add_css_class('ls-card')
            card.append(label(str(value), css=('ls-big-number',)))
            card.append(label(title, css=('dim-label',)))
            counts.append(card)
        box.append(counts)
        if not self.tasks:
            box.append(empty_state('checkbox-checked-symbolic', 'Nenhuma tarefa criada', 'Use o botão + para criar uma tarefa com prazo.'))
        today = date.today().isoformat()
        sections = (('Para corrigir', to_review),
                    ('Aguardando o aluno', [task for task in self.tasks if task.get('status') == 'pending']),
                    ('Corrigidas', list(reversed([task for task in self.tasks if task.get('status') == 'reviewed']))))
        for title, tasks in sections:
            if not tasks:
                continue
            group = Adw.PreferencesGroup(title=title)
            for task in tasks:
                name = self.students.get(task['student_id'], {}).get('name', 'Aluno')
                row = Adw.ActionRow(title=GLib.markup_escape_text(task.get('title') or 'Tarefa'),
                                    subtitle=GLib.markup_escape_text(f'{name} · prazo {model.short_date(task.get("due_date"))}'), activatable=True)
                row.add_prefix(Adw.Avatar(size=34, text=name, show_initials=True))
                if task.get('status') == 'pending' and (task.get('due_date') or '') < today:
                    row.add_suffix(pill('Atrasada', 'error'))
                elif task.get('status') == 'reviewed' and task.get('grade') is not None:
                    row.add_suffix(pill(f'Nota {round(float(task["grade"]))}', 'success'))
                elif task.get('status') == 'submitted':
                    row.add_suffix(pill('Entregue', 'accent'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=task: self.show_task(item))
                group.add(row)
            box.append(group)
        quiz = Gtk.Button(label='Quizzes interativos ficam no site', halign=Gtk.Align.CENTER)
        quiz.add_css_class('flat')
        quiz.connect('clicked', lambda *_: open_uri(self, self.window.app.config.web_url))
        box.append(quiz)
        self.show_content(scrolled(box))

    # ------------------------------------------------------------------ detail and review
    def show_task(self, task: dict) -> None:
        student = self.students.get(task['student_id'], {})
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        delete = Gtk.Button(icon_name='user-trash-symbolic', tooltip_text='Excluir tarefa')
        delete.connect('clicked', lambda *_: confirm(self.window, 'Excluir esta tarefa?', 'A entrega e a correção também serão apagadas.', 'Excluir',
                                                     lambda: self._delete(task), destructive=True))
        header.pack_end(delete)
        toolbar.add_top_bar(header)
        box = vbox(18)
        head = Gtk.Box(spacing=12)
        head.append(Adw.Avatar(size=44, text=student.get('name', '?'), show_initials=True))
        titles = vbox(2)
        titles.append(label(task.get('title') or 'Tarefa', css=('title-3',)))
        titles.append(label(f'{student.get("name", "Aluno")} · prazo {model.short_date(task.get("due_date"))} · {model.TASK_LABELS.get(task.get("status"), "")}', css=('dim-label',)))
        head.append(titles)
        box.append(head)
        if task.get('instructions'):
            box.append(text_card('Instruções', task['instructions']))
        material = self.materials.get(task.get('material_id') or '')
        if material:
            button = Gtk.Button(label=f'Material: {material.get("title")}', halign=Gtk.Align.START)
            button.add_css_class('flat')
            button.connect('clicked', lambda *_: self._open_material(material))
            box.append(button)

        answer = task.get('submission_text') or ''
        card = vbox(8)
        card.add_css_class('card')
        card.add_css_class('ls-card')
        card.append(label('Entrega do aluno', css=('caption-heading', 'dim-label')))
        if task.get('status') == 'pending':
            card.append(label('O aluno ainda não entregou.', css=('dim-label',)))
        else:
            card.append(label(answer or 'Sem texto.', selectable=True, css=() if answer else ('dim-label',)))
            if answer:
                count = pill(f'{model.word_count(answer)} palavras · entregue {model.relative_time(task.get("submitted_at"))}')
                count.set_halign(Gtk.Align.START)
                card.append(count)
            if task.get('submission_file_path'):
                file_button = Gtk.Button(label=f'Abrir arquivo: {task.get("submission_file_name") or "entrega"}', halign=Gtk.Align.START)
                file_button.connect('clicked', lambda *_: self._open_signed('assignment-submissions', task['submission_file_path']))
                card.append(file_button)
        box.append(card)

        comments = task.get('text_comments') or []
        if comments:
            group = Adw.PreferencesGroup(title='Comentários no texto', description='Feitos no site.')
            for comment in comments:
                row = Adw.ActionRow(title=GLib.markup_escape_text(f'“{comment.get("text", "")}”'), subtitle=GLib.markup_escape_text(comment.get('comment', '')))
                group.add(row)
            box.append(group)

        if task.get('status') != 'pending':
            group = Adw.PreferencesGroup(title='Correção')
            grade = Adw.SpinRow.new_with_range(0, 100, 1)
            grade.set_title('Nota (0 a 100)')
            grade.set_subtitle('Opcional')
            graded = Adw.SwitchRow(title='Dar nota', active=task.get('grade') is not None)
            grade.set_value(float(task.get('grade') or 0))
            grade.set_sensitive(graded.get_active())
            graded.connect('notify::active', lambda row, _p: grade.set_sensitive(row.get_active()))
            group.add(graded)
            group.add(grade)
            box.append(group)
            feedback_group = Adw.PreferencesGroup(title='Comentário para o aluno')
            frame, feedback = text_view(task.get('feedback') or '')
            feedback_group.add(frame)
            box.append(feedback_group)
            save = Gtk.Button(label='Salvar correção' if task.get('status') == 'submitted' else 'Atualizar correção', halign=Gtk.Align.END)
            save.add_css_class('suggested-action')
            save.add_css_class('pill')

            def submit(*_):
                values = {'feedback': feedback(), 'grade': round(grade.get_value()) if graded.get_active() else None, 'status': 'reviewed'}
                save.set_sensitive(False)

                def done(_r) -> None:
                    self.window.toast('Correção salva. O aluno já pode ver.')
                    self.nav.pop()
                    self.refresh()

                def failed(error: Exception) -> None:
                    save.set_sensitive(True)
                    self.window.toast(str(error))
                run_async(lambda: self.client.update('assignments', values, id=f'eq.{task["id"]}'), done, failed)
            save.connect('clicked', submit)
            box.append(save)
        toolbar.set_content(scrolled(box))
        self.nav.push(Adw.NavigationPage(title=task.get('title') or 'Tarefa', child=toolbar))

    def _open_signed(self, bucket: str, path: str) -> None:
        run_async(lambda: self.client.signed_url(bucket, path, 3600), lambda url: open_uri(self, url), lambda error: self.window.toast(str(error)))

    def _open_material(self, material: dict) -> None:
        if material.get('storage_path'):
            self._open_signed('materials', material['storage_path'])
        elif material.get('url'):
            open_uri(self, material['url'])

    def _delete(self, task: dict) -> None:
        def work():
            if task.get('submission_file_path'):
                self.client.remove_files('assignment-submissions', [task['submission_file_path']])
            self.client.delete('assignments', id=f'eq.{task["id"]}')

        def done(_r) -> None:
            self.window.toast('Tarefa excluída.')
            self.nav.pop_to_tag('root')
            self.refresh()
        run_async(work, done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ new task
    def new_task(self) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno no site antes de criar tarefas.')
            return
        dialog, page, save = form_dialog(self.window, 'Nova tarefa', 'Criar')
        group = Adw.PreferencesGroup()
        ids = sorted(self.students, key=lambda student_id: self.students[student_id]['name'].lower())
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[i]['name'] for i in ids]), enable_search=True)
        title = Adw.EntryRow(title='Título')
        due, due_value = date_row('Prazo', date.today() + timedelta(days=7))
        material_ids = [''] + sorted(self.materials, key=lambda material_id: (self.materials[material_id].get('title') or '').lower())
        material = Adw.ComboRow(title='Material (opcional)', model=Gtk.StringList.new(['Nenhum'] + [self.materials[i].get('title') or 'Material' for i in material_ids[1:]]))
        for row in (student, title, due, material):
            group.add(row)
        page.add(group)
        instructions_group = Adw.PreferencesGroup(title='Instruções')
        frame, instructions = text_view('', 120)
        instructions_group.add(frame)
        page.add(instructions_group)

        def submit(*_):
            if not title.get_text().strip():
                dialog.show_error('Escreva o título da tarefa.')
                return
            values = {'teacher_id': self.window.profile['id'], 'student_id': ids[student.get_selected()], 'material_id': material_ids[material.get_selected()] or None,
                      'title': title.get_text().strip(), 'instructions': instructions(), 'due_date': due_value().isoformat(), 'status': 'pending'}
            save.set_sensitive(False)

            def work():
                self.client.insert('assignments', values)
                if values['material_id']:
                    # Same as the web app: the task's material is shared with the student.
                    self.client.upsert('material_assignments', {'material_id': values['material_id'], 'student_id': values['student_id']}, on_conflict='material_id,student_id')

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Tarefa criada. O aluno foi avisado.')
                self.refresh()
            run_async(work, done, lambda error: dialog.show_error(str(error)))
        save.connect('clicked', submit)
        dialog.present(self.window)
