"""Tasks and quizzes (assignments): to review, waiting for the student, reviewed; review with grade, feedback
and comments on parts of the student's text; create, delete. The Quiz page adds the quiz builder, the
question bank and the student-view preview."""
from __future__ import annotations

from datetime import date, timedelta

from gi.repository import Adw, GLib, Gtk, Pango

from langspot_linux import model
from langspot_linux.ui.common import (Page, ask_long_text, confirm, date_row, empty_state, form_dialog, label, open_uri, pill, scrolled,
                                      student_names, text_card, text_view, vbox)
from langspot_linux.ui.quiz_builder import new_quiz, question_bank, quiz_preview_groups, result_group
from langspot_linux.worker import run_async


class TasksPage(Page):
    key = 'tasks'
    title = 'Tarefas'
    icon = 'checkbox-checked-symbolic'
    interactive = False
    noun = 'tarefa'
    labels = {'review': 'Para corrigir', 'waiting': 'Aguardando o aluno', 'reviewed': 'Corrigidas', 'new': 'Nova tarefa',
              'empty': 'Nenhuma tarefa criada', 'empty_hint': 'Use o botão + para criar uma tarefa com prazo.'}

    def __init__(self, window) -> None:
        super().__init__(window)
        self.tasks: list[dict] = []
        self.students: dict[str, dict] = {}
        self.materials: dict[str, dict] = {}
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text=self.labels['new'])
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_task())
        self.header.pack_start(new)

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        interactive = self.interactive

        def work():
            students = student_names(client)
            tasks = [row for row in client.select('assignments', order='due_date.asc') if (row.get('assignment_type') == 'interactive') == interactive]
            materials = {row['id']: row for row in client.select('materials', select='id,title,url,storage_path')}
            return students, tasks, materials

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.students, self.tasks, self.materials = result
        to_review = [task for task in self.tasks if task.get('status') == 'submitted']
        self.window.set_count(self.key, len(to_review))
        box = vbox(18)
        waiting = [task for task in self.tasks if task.get('status') == 'pending']
        reviewed = [task for task in self.tasks if task.get('status') == 'reviewed']
        counts = Gtk.Box(spacing=12, homogeneous=True)
        for title, value in ((self.labels['review'], len(to_review)), (self.labels['waiting'], len(waiting)), (self.labels['reviewed'], len(reviewed))):
            card = vbox(2)
            card.add_css_class('card')
            card.add_css_class('ls-card')
            card.append(label(str(value), css=('ls-big-number',)))
            card.append(label(title, css=('dim-label',)))
            counts.append(card)
        box.append(counts)
        if not self.tasks:
            box.append(empty_state(self.icon, self.labels['empty'], self.labels['empty_hint']))
        today = date.today().isoformat()
        for title, tasks in ((self.labels['review'], to_review), (self.labels['waiting'], waiting), (self.labels['reviewed'], list(reversed(reviewed)))):
            if not tasks:
                continue
            group = Adw.PreferencesGroup(title=title)
            for task in tasks:
                name = self.students.get(task['student_id'], {}).get('name', 'Aluno')
                details = [name, f'prazo {model.short_date(task.get("due_date"))}']
                if self.interactive:
                    details.append(f'{len((task.get("interactive_content") or {}).get("questions") or [])} questões')
                row = Adw.ActionRow(title=GLib.markup_escape_text(task.get('title') or self.noun.capitalize()),
                                    subtitle=GLib.markup_escape_text(' · '.join(details)), activatable=True)
                row.add_prefix(Adw.Avatar(size=34, text=name, show_initials=True))
                if task.get('status') == 'pending' and (task.get('due_date') or '') < today:
                    row.add_suffix(pill('Atrasada', 'error'))
                elif task.get('status') == 'reviewed' and task.get('grade') is not None:
                    row.add_suffix(pill(f'Nota {round(float(task["grade"]))}', 'success'))
                elif task.get('interactive_result'):
                    row.add_suffix(pill(f'{task["interactive_result"].get("percentage", 0)}%', 'accent'))
                elif task.get('status') == 'submitted':
                    row.add_suffix(pill('Entregue', 'accent'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=task: self.show_task(item))
                group.add(row)
            box.append(group)
        self.show_content(scrolled(box))

    # ------------------------------------------------------------------ detail and review
    def show_task(self, task: dict) -> None:
        student = self.students.get(task['student_id'], {})
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        delete = Gtk.Button(icon_name='user-trash-symbolic', tooltip_text=f'Excluir {self.noun}')
        delete.connect('clicked', lambda *_: confirm(self.window, f'Excluir “{task.get("title")}”?', 'A entrega e a correção também serão apagadas.', 'Excluir',
                                                     lambda: self._delete(task), destructive=True))
        header.pack_end(delete)
        toolbar.add_top_bar(header)
        box = vbox(18)
        head = Gtk.Box(spacing=12)
        head.append(Adw.Avatar(size=44, text=student.get('name', '?'), show_initials=True))
        titles = vbox(2)
        titles.append(label(task.get('title') or self.noun.capitalize(), css=('title-3',)))
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

        if self.interactive:
            result = result_group(task.get('interactive_result'))
            if result:
                box.append(result)
            for group in quiz_preview_groups(task.get('interactive_content')):
                box.append(group)

        answer = task.get('submission_text') or ''
        comments: list[dict] = [dict(item) for item in task.get('text_comments') or []]
        reviewing = task.get('status') != 'pending'
        if not self.interactive or answer or task.get('submission_file_path'):
            box.append(self._submission(task, answer, comments, editable=reviewing))

        if reviewing:
            group = Adw.PreferencesGroup(title='Correção')
            grade = Adw.SpinRow.new_with_range(0, 100, 1)
            grade.set_title('Nota (0 a 100)')
            graded = Adw.SwitchRow(title='Dar nota', active=task.get('grade') is not None)
            grade.set_value(float(task.get('grade') or 0))
            grade.set_sensitive(graded.get_active())
            graded.connect('notify::active', lambda row, _p: grade.set_sensitive(row.get_active()))
            group.add(graded)
            group.add(grade)
            box.append(group)
            feedback_group = Adw.PreferencesGroup(title='Feedback geral')
            frame, feedback = text_view(task.get('feedback') or '')
            feedback_group.add(frame)
            box.append(feedback_group)
            save = Gtk.Button(label='Salvar correção' if task.get('status') == 'submitted' else 'Atualizar correção', halign=Gtk.Align.END)
            save.add_css_class('suggested-action')
            save.add_css_class('pill')

            def submit(*_):
                if not feedback():
                    self.window.toast('Escreva o feedback geral para o aluno.')
                    return
                values = {'feedback': feedback(), 'grade': round(grade.get_value()) if graded.get_active() else None, 'text_comments': comments,
                          'status': 'reviewed'}
                save.set_sensitive(False)

                def done(_r) -> None:
                    self.window.toast('Correção salva. O aluno já pode ver.')
                    self.nav.pop()
                    self.refresh()

                def failed(error: Exception) -> None:
                    save.set_sensitive(True)
                    self.window.toast(str(error))
                run_async(lambda: self.client.update('assignments', values, id=f'eq.{task["id"]}', teacher_id=f'eq.{self.window.profile["id"]}'), done, failed)
            save.connect('clicked', submit)
            box.append(save)
        toolbar.set_content(scrolled(box))
        self.nav.push(Adw.NavigationPage(title=task.get('title') or self.noun.capitalize(), child=toolbar))

    def _submission(self, task: dict, answer: str, comments: list[dict], *, editable: bool) -> Gtk.Widget:
        """The student's answer with highlighted comments; when reviewing, select text to comment on it."""
        container = vbox(12)
        card = vbox(8)
        card.add_css_class('card')
        card.add_css_class('ls-card')
        card.append(label('Resposta do aluno', css=('caption-heading', 'dim-label')))
        container.append(card)
        if task.get('status') == 'pending':
            card.append(label('O aluno ainda não entregou.', css=('dim-label',)))
            return container
        view = None
        if answer:
            view = Gtk.Label(label=answer, selectable=True, wrap=True, wrap_mode=Pango.WrapMode.WORD_CHAR, xalign=0)
            view.add_css_class('ls-submission')
            card.append(view)
            count = pill(f'{model.word_count(answer)} palavras · entregue {model.relative_time(task.get("submitted_at"))}')
            count.set_halign(Gtk.Align.START)
            card.append(count)
        else:
            card.append(label('Nenhuma resposta em texto.', css=('dim-label',)))
        if task.get('submission_file_path'):
            file_button = Gtk.Button(label=f'Abrir arquivo: {task.get("submission_file_name") or "entrega"}', halign=Gtk.Align.START)
            file_button.connect('clicked', lambda *_: self._open_signed('assignment-submissions', task['submission_file_path']))
            card.append(file_button)
        if not answer:
            return container

        group = Adw.PreferencesGroup(title='Comentários por trecho')
        container.append(group)
        rows: list[Gtk.Widget] = []
        add = Gtk.Button(label='Comentar trecho selecionado', halign=Gtk.Align.START, focus_on_click=False)
        add.add_css_class('pill')
        if editable:
            card.append(add)
            card.append(label('Selecione uma palavra, frase ou parágrafo da resposta para comentar.', css=('caption', 'dim-label')))

        def paint(active: str | None = None) -> None:
            attributes = Pango.AttrList()
            for comment in comments:
                span = model.comment_span(answer, comment)
                if not span:
                    continue
                start, end = (len(answer[:index].encode('utf-8')) for index in span)  # Pango indexes UTF-8 bytes
                for attribute in (Pango.attr_background_new(250 * 257, 204 * 257, 21 * 257),
                                  Pango.attr_background_alpha_new(int(65535 * (0.75 if comment['id'] == active else 0.35)))):
                    attribute.start_index, attribute.end_index = start, end
                    attributes.insert(attribute)
            view.set_attributes(attributes)

        def focus(comment: dict) -> None:
            span = model.comment_span(answer, comment)
            paint(comment['id'])
            if span:
                view.select_region(*span)

        def render() -> None:
            for row in rows:
                group.remove(row)
            rows.clear()
            comments.sort(key=lambda item: int(item.get('start') or 0))
            if not comments:
                rows.append(Adw.ActionRow(title='Nenhum comentário por trecho ainda.'))
            for index, comment in enumerate(comments, 1):
                row = Adw.ActionRow(title=GLib.markup_escape_text(f'{index}. “{comment.get("text", "")}”'),
                                    subtitle=GLib.markup_escape_text(comment.get('comment', '')), subtitle_lines=0, activatable=True)
                row.connect('activated', lambda _row, item=comment: focus(item))
                if editable:
                    edit = Gtk.Button(icon_name='document-edit-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Editar comentário')
                    edit.add_css_class('flat')
                    edit.connect('clicked', lambda _b, item=comment: ask_long_text(self.window, 'Editar comentário', f'“{item.get("text", "")}”',
                                                                                   item.get('comment', ''), 'Salvar', lambda text, target=item: (target.update(comment=text), render())))
                    remove = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Remover comentário')
                    remove.add_css_class('flat')
                    remove.connect('clicked', lambda _b, item=comment: (comments.remove(item), render()))
                    row.add_suffix(edit)
                    row.add_suffix(remove)
                rows.append(row)
            for row in rows:
                group.add(row)
            paint()

        def comment_selection(*_):
            selected, start, end = view.get_selection_bounds()
            if not selected or start == end:
                self.window.toast('Selecione um trecho da resposta primeiro.')
                return
            start, end = sorted((start, end))

            def created(text: str) -> None:
                comments.append(model.text_comment(answer, start, end, text))
                render()
            ask_long_text(self.window, 'Comentar trecho', f'“{answer[start:end]}”', '', 'Adicionar comentário', created)

        add.connect('clicked', comment_selection)
        render()
        if not comments and not editable:
            container.remove(group)
        return container

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
            self.client.delete('assignments', id=f'eq.{task["id"]}', teacher_id=f'eq.{self.window.profile["id"]}')

        def done(_r) -> None:
            self.window.toast(f'{self.noun.capitalize()} excluída.' if self.noun == 'tarefa' else 'Quiz excluído.')
            self.nav.pop_to_tag('root')
            self.refresh()
        run_async(work, done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ new task
    def new_task(self) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno antes de criar tarefas.')
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

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(str(error))
            run_async(work, done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)


class QuizPage(TasksPage):
    key = 'quiz'
    title = 'Quiz'
    icon = 'dialog-question-symbolic'
    interactive = True
    noun = 'quiz'
    labels = {'review': 'Realizados', 'waiting': 'Pendentes', 'reviewed': 'Corrigidos', 'new': 'Novo quiz',
              'empty': 'Nenhum quiz criado', 'empty_hint': 'Use o botão + para criar um quiz interativo para o aluno responder na plataforma.'}

    def __init__(self, window) -> None:
        super().__init__(window)
        bank = Gtk.Button(icon_name='folder-documents-symbolic', tooltip_text='Banco de questões')
        bank.connect('clicked', lambda *_: question_bank(self.window))
        self.header.pack_start(bank)

    def new_task(self) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno antes de criar quizzes.')
            return
        new_quiz(self.window, self.students, self.materials, self.refresh)
