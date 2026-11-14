"""Reports: period summary and individual report (same formulas as the web app), copy summary."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, copy_text, date_row, empty_state, label, open_uri, scrolled, stat_card, stat_row, student_names, vbox
from langspot_linux.worker import run_async

PRESETS = [('Este mês', None), ('Últimos 30 dias', 30), ('Últimos 90 dias', 90), ('Semestre', 180)]
ATTENDANCE = {'presente': 'Presente', 'ausente': 'Ausente', 'remarcada': 'Remarcada'}


class ReportsPage(Page):
    key = 'reports'
    title = 'Relatórios'
    icon = 'x-office-document-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.mode = 'summary'
        self.start, self.end = model.month_range()
        self.lessons: list[model.Lesson] = []
        self.tasks: list[dict] = []
        self.students: dict[str, dict] = {}
        self.student_id: str | None = None
        toggle = Adw.ToggleGroup()
        toggle.add(Adw.Toggle(label='Resumo do período', name='summary'))
        toggle.add(Adw.Toggle(label='Individual', name='individual'))
        toggle.set_active_name('summary')
        toggle.connect('notify::active-name', lambda group, _p: self._set_mode(group.get_active_name()))
        self.header.set_title_widget(toggle)

    def _set_mode(self, mode: str) -> None:
        self.mode = mode
        self.render()

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        since = (datetime.now(timezone.utc) - timedelta(days=400)).isoformat()

        def work():
            students = student_names(client)
            names = {key: value['name'] for key, value in students.items()}
            lessons = model.lessons_from_rows(client.select('lessons', starts_at=f'gte.{since}', order='starts_at.asc'), names)
            tasks = [row for row in client.select('assignments', select='id,student_id,title,status,grade,due_date,created_at,assignment_type')]
            return students, lessons, tasks

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.students, self.lessons, self.tasks = result
        if self.student_id not in self.students:
            self.student_id = min(self.students, key=lambda key: self.students[key]['name'].lower()) if self.students else None
        self.render()

    # ------------------------------------------------------------------ controls
    def _controls(self) -> Adw.PreferencesGroup:
        group = Adw.PreferencesGroup(title='Período')
        preset = Adw.ComboRow(title='Período rápido', model=Gtk.StringList.new([title for title, _days in PRESETS] + ['Personalizado']))
        preset.set_selected(len(PRESETS))
        start_row, _ = date_row('De', self.start, lambda day: self._set_period(day, self.end))
        end_row, _ = date_row('Até', self.end, lambda day: self._set_period(self.start, day))

        def chosen(row, _p) -> None:
            index = row.get_selected()
            if index >= len(PRESETS):
                return
            days = PRESETS[index][1]
            if days is None:
                self._set_period(*model.month_range())
            else:
                self._set_period(date.today() - timedelta(days=days - 1), date.today())
        preset.connect('notify::selected', chosen)
        group.add(preset)
        group.add(start_row)
        group.add(end_row)
        if self.mode == 'individual' and self.students:
            ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
            student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[key]['name'] for key in ids]), enable_search=True)
            student.set_selected(ids.index(self.student_id) if self.student_id in ids else 0)
            student.connect('notify::selected', lambda row, _p: self._set_student(ids[row.get_selected()]))
            group.add(student)
        return group

    def _set_period(self, start: date, end: date) -> None:
        if end < start:
            start, end = end, start
        self.start, self.end = start, end
        self.render()

    def _set_student(self, student_id: str) -> None:
        if student_id != self.student_id:
            self.student_id = student_id
            self.render()

    # ------------------------------------------------------------------ views
    def render(self) -> None:
        box = vbox(18)
        box.append(self._controls())
        lessons = model.lessons_in_period(self.lessons, self.start, self.end)
        tasks = model.tasks_in_period(self.tasks, self.start, self.end)
        if self.mode == 'summary':
            self._summary(box, lessons, tasks)
        elif self.student_id:
            self._individual(box, [lesson for lesson in lessons if lesson.student_id == self.student_id],
                             [task for task in tasks if task.get('student_id') == self.student_id])
        else:
            box.append(empty_state('system-users-symbolic', 'Nenhum aluno', 'Os relatórios individuais aparecem quando você tiver alunos.'))
        self.show_content(scrolled(box))

    def _metrics(self, items: list[tuple[str, str]]) -> Gtk.Widget:
        return stat_row([stat_card(title, value, value_first=True) for title, value in items], wrap=True)

    def _summary(self, box: Gtk.Box, lessons: list[model.Lesson], tasks: list[dict]) -> None:
        stats = model.period_stats(lessons, tasks)
        box.append(label(f'Resumo de {self.start:%d/%m/%Y} a {self.end:%d/%m/%Y}', css=('title-3',)))
        box.append(self._metrics([('Aulas no período', str(stats.lessons)), ('Conclusão de aulas', f'{stats.completion_rate}%'),
                                  ('Frequência', f'{stats.attendance_rate}%'), ('Entrega de tarefas', f'{stats.task_rate}%'),
                                  ('Média das tarefas', str(stats.average_grade) if stats.average_grade is not None else '—'),
                                  ('Tempo de aula', model.study_time(stats.study_minutes))]))
        status = Adw.PreferencesGroup(title='Aulas por situação')
        total = max(1, stats.lessons)
        for title, value in (('Concluídas', stats.completed), ('Agendadas', stats.scheduled), ('Canceladas', stats.cancelled)):
            row = Adw.ActionRow(title=title)
            row.add_suffix(Gtk.LevelBar(min_value=0, max_value=total, value=value, valign=Gtk.Align.CENTER, width_request=180))
            row.add_suffix(label(str(value), css=('numeric',), wrap=False))
            status.add(row)
        box.append(status)
        activity = Adw.PreferencesGroup(title='Atividade por aluno')
        rows = sorted(self.students.items(), key=lambda item: -sum(1 for lesson in lessons if lesson.student_id == item[0]))
        for student_id, student in rows:
            count = sum(1 for lesson in lessons if lesson.student_id == student_id)
            done = sum(1 for lesson in lessons if lesson.student_id == student_id and lesson.status == 'completed')
            student_tasks = [task for task in tasks if task.get('student_id') == student_id]
            delivered = sum(1 for task in student_tasks if (task.get('status') or 'pending') != 'pending')
            row = Adw.ActionRow(title=GLib.markup_escape_text(student['name']),
                                subtitle=f'{done} de {count} aulas concluídas · {delivered}/{len(student_tasks)} tarefas entregues', activatable=True)
            row.add_prefix(Adw.Avatar(size=32, text=student['name'], show_initials=True))
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda _row, key=student_id: self._open_individual(key))
            activity.add(row)
        if rows:
            box.append(activity)

    def _open_individual(self, student_id: str) -> None:
        self.student_id = student_id
        self.header.get_title_widget().set_active_name('individual')

    def _individual(self, box: Gtk.Box, lessons: list[model.Lesson], tasks: list[dict]) -> None:
        student = self.students[self.student_id]
        stats = model.period_stats(lessons, tasks)
        head = Gtk.Box(spacing=14)
        head.append(Adw.Avatar(size=56, text=student['name'], show_initials=True))
        titles = vbox(2)
        titles.append(label(student['name'], css=('title-2',)))
        titles.append(label(' · '.join(filter(None, [f'Nível {student["level"]}' if student['level'] else '', student['goal'], student['email']])), css=('dim-label',)))
        head.append(titles)
        box.append(head)
        box.append(self._metrics([('Aulas concluídas', str(stats.completed)), ('Frequência', f'{stats.attendance_rate}%'),
                                  ('Tempo de aula', model.study_time(stats.study_minutes)), ('Tarefas entregues', f'{stats.delivered}/{stats.tasks}'),
                                  ('Média das tarefas', str(stats.average_grade) if stats.average_grade is not None else '—')]))
        extremes = model.skill_extremes(student['skills'])
        if extremes:
            skills = Adw.PreferencesGroup(title='Habilidades')
            best, attention = extremes
            for title, skill in (('Destaque', best), ('Ponto de atenção', attention)):
                row = Adw.ActionRow(title=title, subtitle=skill)
                row.add_suffix(label(f'{round(float(student["skills"][skill]))}%', css=('heading',), wrap=False))
                skills.add(row)
            box.append(skills)
        history = Adw.PreferencesGroup(title='Aulas no período')
        if not lessons:
            history.add(Adw.ActionRow(title='Nenhuma aula neste período.'))
        for lesson in reversed(lessons):
            parts = [lesson.status_label, ATTENDANCE.get(lesson.attendance, '')]
            row = Adw.ActionRow(title=GLib.markup_escape_text(f'{lesson.starts_at:%d/%m} · {lesson.topic}'),
                                subtitle=GLib.markup_escape_text(' · '.join(filter(None, parts + [lesson.notes]))), subtitle_lines=2)
            history.add(row)
        box.append(history)
        notes = [lesson.notes for lesson in lessons if lesson.status == 'completed' and lesson.notes]
        text = model.report_text(student['name'], student['level'], student['goal'], student['skills'], self.start, self.end, stats, notes)
        actions = Gtk.Box(spacing=12, halign=Gtk.Align.CENTER)
        copy = Gtk.Button(label='Copiar resumo')
        copy.add_css_class('suggested-action')
        copy.add_css_class('pill')
        copy.connect('clicked', lambda *_: (copy_text(self, text), self.window.toast('Resumo copiado. Cole no WhatsApp ou no e-mail.')))
        actions.append(copy)
        if student.get('phone'):
            send = Gtk.Button(label='Enviar pelo WhatsApp')
            send.add_css_class('pill')
            import urllib.parse
            send.connect('clicked', lambda *_: open_uri(self, f'https://wa.me/{student["phone"]}?text={urllib.parse.quote(text)}'))
            actions.append(send)
        pdf = Gtk.Button(label='PDF no site')
        pdf.add_css_class('pill')
        pdf.connect('clicked', lambda *_: open_uri(self, self.window.app.config.web_url))
        actions.append(pdf)
        box.append(actions)
