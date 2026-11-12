"""Agenda: week and month calendar (as on the website) plus a list, with every lesson action.

- Week / Month / List views, previous / today / next, student and status filters.
- Lesson: join the room, add to Google Calendar, complete (attendance, notes, strengths, improvements,
  homework, skill scores), edit, cancel; completed lessons: edit or delete the record.
- New lesson on any day; students' cancellation requests (approve / reject with a reply).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk, Pango

from langspot_linux import model
from langspot_linux.ui.common import (Page, confirm, date_row, empty_state, form_dialog, label, open_uri, pill, scrolled,
                                      student_names, vbox)
from langspot_linux.ui.lesson_forms import duration_row, lesson_defaults, record_lesson, time_rows
from langspot_linux.worker import run_async

STATUS_KIND = {'scheduled': 'accent', 'completed': 'success', 'cancelled': 'error'}
STATUS_FILTERS = [('Todas as situações', None), ('Agendadas', 'scheduled'), ('Concluídas', 'completed'), ('Canceladas', 'cancelled')]


class AgendaPage(Page):
    key = 'agenda'
    title = 'Agenda'
    icon = 'x-office-calendar-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.view = window.app.prefs.get('calendarView', 'week')
        self.anchor = date.today()
        self.selected_day: date | None = None
        self.lessons: list[model.Lesson] = []
        self.students: dict[str, dict] = {}
        self.requests: list[dict] = []
        self.student_filter: str | None = None
        self.status_filter: str | None = None

        toggle = Adw.ToggleGroup()
        for name, title in (('week', 'Semana'), ('month', 'Mês'), ('list', 'Lista')):
            toggle.add(Adw.Toggle(label=title, name=name))
        toggle.set_active_name(self.view)
        toggle.connect('notify::active-name', self._view_changed)
        self.header.set_title_widget(toggle)
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova aula')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.edit_lesson(None, self.selected_day or date.today()))
        self.header.pack_start(new)
        self.requests_button = Gtk.Button(tooltip_text='Pedidos de cancelamento', visible=False)
        self.requests_button.add_css_class('flat')
        self.requests_button.connect('clicked', lambda *_: self.show_requests())
        self.header.pack_end(self.requests_button)

    # ------------------------------------------------------------------ data
    def _view_changed(self, toggle, _param) -> None:
        self.view = toggle.get_active_name()
        self.window.app.prefs['calendarView'] = self.view
        self.window.app._save_prefs()
        self.render()

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        since = (datetime.now(timezone.utc) - timedelta(days=400)).isoformat()

        def work():
            students = student_names(client)
            names = {key: value['name'] for key, value in students.items()}
            lessons = model.lessons_from_rows(client.select('lessons', starts_at=f'gte.{since}', order='starts_at.asc'), names)
            requests = client.select('cancellation_requests', select='*,lessons(starts_at,topic),student:profiles!cancellation_requests_student_id_fkey(full_name)',
                                     status='eq.pending', order='created_at.asc')
            return students, lessons, requests

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.students, self.lessons, self.requests = result
        self.window.app.calendar_lessons(self.lessons)
        count = len(self.requests)
        self.requests_button.set_visible(count > 0)
        self.requests_button.set_child(self._badge_label(f'{count} pedido' + ('' if count == 1 else 's') + ' de cancelamento'))
        self.render()

    @staticmethod
    def _badge_label(text: str) -> Gtk.Widget:
        box = Gtk.Box(spacing=6)
        box.append(Gtk.Image(icon_name='mail-unread-symbolic'))
        box.append(Gtk.Label(label=text))
        return box

    def filtered(self) -> list[model.Lesson]:
        return [lesson for lesson in self.lessons
                if (not self.student_filter or lesson.student_id == self.student_filter) and (not self.status_filter or lesson.status == self.status_filter)]

    # ------------------------------------------------------------------ layout
    def render(self) -> None:
        box = vbox(16)
        box.append(self._toolbar())
        lessons = self.filtered()
        if self.view == 'week':
            box.append(self._week(lessons))
        elif self.view == 'month':
            box.append(self._month(lessons))
            if self.selected_day:
                box.append(self._day_group(self.selected_day, [lesson for lesson in lessons if lesson.starts_at.date() == self.selected_day]))
        else:
            box.append(self._list(lessons))
        self.show_content(scrolled(box, maximum=1400))

    def _toolbar(self) -> Gtk.Widget:
        bar = Gtk.Box(spacing=8)
        if self.view != 'list':
            previous = Gtk.Button(icon_name='go-previous-symbolic', tooltip_text='Semana anterior' if self.view == 'week' else 'Mês anterior')
            previous.connect('clicked', lambda *_: self._move(-1))
            today = Gtk.Button(label='Hoje')
            today.connect('clicked', lambda *_: self._go_today())
            following = Gtk.Button(icon_name='go-next-symbolic', tooltip_text='Próxima semana' if self.view == 'week' else 'Próximo mês')
            following.connect('clicked', lambda *_: self._move(1))
            linked = Gtk.Box(css_classes=['linked'])
            for widget in (previous, today, following):
                linked.append(widget)
            bar.append(linked)
            bar.append(label(model.period_label(self.view, self.anchor), css=('title-3',), wrap=False))
        else:
            bar.append(label('Próximas aulas', css=('title-3',), wrap=False))
        spacer = Gtk.Box(hexpand=True)
        bar.append(spacer)
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        students = Gtk.DropDown.new_from_strings(['Todos os alunos'] + [self.students[key]['name'] for key in ids])
        students.set_selected(ids.index(self.student_filter) + 1 if self.student_filter in ids else 0)
        students.connect('notify::selected', lambda drop, _p: self._set_filters(ids[drop.get_selected() - 1] if drop.get_selected() else None, self.status_filter))
        statuses = Gtk.DropDown.new_from_strings([title for title, _value in STATUS_FILTERS])
        statuses.set_selected(next((index for index, (_t, value) in enumerate(STATUS_FILTERS) if value == self.status_filter), 0))
        statuses.connect('notify::selected', lambda drop, _p: self._set_filters(self.student_filter, STATUS_FILTERS[drop.get_selected()][1]))
        bar.append(students)
        bar.append(statuses)
        return bar

    def _set_filters(self, student: str | None, status: str | None) -> None:
        if (student, status) != (self.student_filter, self.status_filter):
            self.student_filter, self.status_filter = student, status
            GLib.idle_add(lambda: (self.render(), GLib.SOURCE_REMOVE)[1])

    def _move(self, direction: int) -> None:
        self.anchor = model.shift_period(self.view, self.anchor, direction)
        self.selected_day = None
        self.render()

    def _go_today(self) -> None:
        self.anchor = date.today()
        self.selected_day = date.today() if self.view == 'month' else None
        self.render()

    # ------------------------------------------------------------------ week
    def _week(self, lessons: list[model.Lesson]) -> Gtk.Widget:
        grid = Gtk.Grid(column_homogeneous=True, column_spacing=8)
        today = date.today()
        for column, day in enumerate(model.week_days(self.anchor)):
            day_box = vbox(6)
            day_box.set_size_request(104, -1)
            head = vbox(0)
            head.add_css_class('ls-day-head')
            if day == today:
                head.add_css_class('today')
            head.append(label(model.WEEKDAY_SHORT[day.weekday()], css=('caption-heading',), xalign=0.5))
            head.append(label(str(day.day), css=('title-2',), xalign=0.5))
            day_box.append(head)
            day_lessons = [lesson for lesson in lessons if lesson.starts_at.date() == day]
            for lesson in day_lessons:
                day_box.append(self._card(lesson))
            if not day_lessons:
                day_box.append(label('Livre', css=('dim-label', 'caption'), xalign=0.5))
            add = Gtk.Button(icon_name='list-add-symbolic', tooltip_text=f'Nova aula em {day:%d/%m}', halign=Gtk.Align.CENTER)
            add.add_css_class('flat')
            add.add_css_class('circular')
            add.connect('clicked', lambda _b, d=day: self.edit_lesson(None, d))
            day_box.append(add)
            grid.attach(day_box, column, 0, 1, 1)
        return Gtk.ScrolledWindow(child=grid, vscrollbar_policy=Gtk.PolicyType.NEVER, propagate_natural_height=True)

    def _card(self, lesson: model.Lesson) -> Gtk.Widget:
        student = self.students.get(lesson.student_id, {})
        button = Gtk.Button()
        button.add_css_class('ls-lesson')
        button.add_css_class(lesson.status)
        content = vbox(2)
        content.append(label(f'{lesson.starts_at:%H:%M} · {lesson.duration} min', css=('caption', 'dim-label')))
        name = label(lesson.student_name, css=('heading',))
        name.set_ellipsize(Pango.EllipsizeMode.END)
        content.append(name)
        topic = label(' · '.join(filter(None, [student.get('level'), lesson.topic])), css=('caption',))
        topic.set_ellipsize(Pango.EllipsizeMode.END)
        topic.set_lines(2)
        content.append(topic)
        if lesson.status != 'scheduled':
            content.append(pill(lesson.status_label, STATUS_KIND[lesson.status]))
        button.set_child(content)
        button.set_tooltip_text(f'{lesson.student_name} · {lesson.topic}')
        button.connect('clicked', lambda *_: self.show_lesson(lesson))
        return button

    # ------------------------------------------------------------------ month
    def _month(self, lessons: list[model.Lesson]) -> Gtk.Widget:
        grid = Gtk.Grid(column_homogeneous=True, column_spacing=6, row_spacing=6)
        for column, name in enumerate(model.WEEKDAY_SHORT):
            grid.attach(label(name, css=('caption-heading', 'dim-label'), xalign=0.5), column, 0, 1, 1)
        today = date.today()
        by_day: dict[date, list[model.Lesson]] = {}
        for lesson in lessons:
            by_day.setdefault(lesson.starts_at.date(), []).append(lesson)
        for index, day in enumerate(model.month_grid(self.anchor)):
            cell = Gtk.Button()
            cell.add_css_class('ls-month-cell')
            if day.month != self.anchor.month:
                cell.add_css_class('other-month')
            if day == today:
                cell.add_css_class('today')
            if day == self.selected_day:
                cell.add_css_class('selected')
            content = vbox(2)
            content.append(label(str(day.day), css=('heading',)))
            day_lessons = by_day.get(day, [])
            for lesson in day_lessons[:3]:
                line = label(f'{lesson.starts_at:%H:%M} {lesson.student_name.split(" ")[0]}', css=('caption', f'ls-dot-{lesson.status}'), wrap=False)
                line.set_ellipsize(Pango.EllipsizeMode.END)
                content.append(line)
            if len(day_lessons) > 3:
                content.append(label(f'+{len(day_lessons) - 3} mais', css=('caption', 'dim-label')))
            cell.set_child(content)
            cell.connect('clicked', lambda _b, d=day: self._select_day(d))
            grid.attach(cell, index % 7, index // 7 + 1, 1, 1)
        return grid

    def _select_day(self, day: date) -> None:
        self.selected_day = None if self.selected_day == day else day
        if day.month != self.anchor.month:
            self.anchor = day.replace(day=1)
        self.render()

    def _day_group(self, day: date, lessons: list[model.Lesson]) -> Gtk.Widget:
        group = Adw.PreferencesGroup(title=f'Aulas de {model.day_label(day).lower() if model.day_label(day) in ("Hoje", "Amanhã", "Ontem") else model.day_label(day)}')
        for lesson in lessons:
            group.add(self._row(lesson))
        add = Adw.ButtonRow(title='Nova aula neste dia', start_icon_name='list-add-symbolic')
        add.connect('activated', lambda *_: self.edit_lesson(None, day))
        group.add(add)
        return group

    # ------------------------------------------------------------------ list
    def _list(self, lessons: list[model.Lesson]) -> Gtk.Widget:
        now = datetime.now().astimezone()
        upcoming = [lesson for lesson in lessons if lesson.ends_at >= now and (self.status_filter or lesson.status != 'cancelled')]
        box = vbox(18)
        if not upcoming:
            box.append(empty_state('x-office-calendar-symbolic', 'Nenhuma aula agendada', 'Use o botão + para agendar uma aula.'))
        for day, day_lessons in model.group_by_day(upcoming):
            group = Adw.PreferencesGroup(title=model.day_label(day))
            for lesson in day_lessons:
                group.add(self._row(lesson))
            box.append(group)
        return box

    def _row(self, lesson: model.Lesson) -> Adw.ActionRow:
        now = datetime.now().astimezone()
        student = self.students.get(lesson.student_id, {})
        row = Adw.ActionRow(title=GLib.markup_escape_text(f'{lesson.starts_at:%H:%M} · {lesson.student_name}'),
                            subtitle=GLib.markup_escape_text(' · '.join(filter(None, [student.get('level'), lesson.topic, f'{lesson.duration} min']))), activatable=True)
        row.add_prefix(Adw.Avatar(size=36, text=lesson.student_name, show_initials=True))
        happening = lesson.starts_at - timedelta(minutes=15) <= now <= lesson.ends_at and lesson.status == 'scheduled'
        if happening:
            row.add_suffix(pill('Agora', 'success'))
        elif lesson.status != 'scheduled':
            row.add_suffix(pill(lesson.status_label, STATUS_KIND.get(lesson.status, '')))
        if lesson.online_url and lesson.status == 'scheduled':
            join = Gtk.Button(label='Entrar', valign=Gtk.Align.CENTER)
            join.add_css_class('suggested-action' if happening else 'flat')
            join.connect('clicked', lambda *_: open_uri(self, lesson.online_url))
            row.add_suffix(join)
        row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
        row.connect('activated', lambda *_: self.show_lesson(lesson))
        return row

    # ------------------------------------------------------------------ lesson dialog
    def show_lesson(self, lesson: model.Lesson) -> None:
        student = self.students.get(lesson.student_id, {})
        dialog = Adw.Dialog(title=lesson.topic, content_width=480)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        info = Adw.PreferencesGroup()
        rows = [('Aluno', ' · '.join(filter(None, [lesson.student_name, f'Nível {student["level"]}' if student.get('level') else '']))),
                ('Quando', f'{model.day_label(lesson.starts_at.date())}, {lesson.starts_at:%H:%M}–{lesson.ends_at:%H:%M}'),
                ('Duração', f'{lesson.duration} minutos'), ('Situação', lesson.status_label)]
        if lesson.attendance:
            rows.append(('Presença', model.ATTENDANCE_LABELS.get(lesson.attendance, lesson.attendance)))
        for title, value in rows:
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value))
            row.add_css_class('property')
            info.add(row)
        page.add(info)
        if lesson.status == 'completed' and any((lesson.notes, lesson.strengths, lesson.improvements, lesson.homework)):
            record = Adw.PreferencesGroup(title='Registro da aula')
            for title, text in (('Resumo da aula', lesson.notes), ('Pontos fortes', lesson.strengths), ('Pontos a melhorar', lesson.improvements), ('Tarefa de casa', lesson.homework)):
                if text.strip():
                    row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(text), subtitle_selectable=True)
                    row.add_css_class('property')
                    record.add(row)
            page.add(record)

        actions = Adw.PreferencesGroup()

        def add_action(title: str, icon: str, callback, *, destructive: bool = False, external: bool = False) -> None:
            row = Adw.ButtonRow(title=title, start_icon_name=icon)
            if external:
                row.set_end_icon_name('adw-external-link-symbolic')
            if destructive:
                row.add_css_class('destructive-action')
            row.connect('activated', lambda *_: callback())
            actions.add(row)

        if lesson.status != 'cancelled':
            if lesson.online_url:
                add_action('Abrir sala online', 'camera-video-symbolic', lambda: open_uri(self, lesson.online_url), external=True)
            add_action('Adicionar ao Google Agenda', 'x-office-calendar-symbolic', lambda: open_uri(self, model.google_calendar_url(lesson)), external=True)
        if lesson.status == 'scheduled':
            add_action('Concluir aula', 'object-select-symbolic', lambda: (dialog.close(), self.record_lesson(lesson)))
            add_action('Editar aula', 'document-edit-symbolic', lambda: (dialog.close(), self.edit_lesson(lesson, lesson.starts_at.date())))
            def cancel() -> None:
                run = lambda: self._update(lesson, {'status': 'cancelled'}, 'Aula cancelada.', dialog)  # noqa: E731
                if self.window.app.prefs.get('confirmCancellations', True):
                    confirm(dialog, 'Cancelar esta aula?', f'{lesson.student_name} será avisado do cancelamento.', 'Cancelar aula', run, destructive=True)
                else:
                    run()
            add_action('Cancelar aula', 'action-unavailable-symbolic', cancel, destructive=True)
        elif lesson.status == 'completed':
            add_action('Editar registro', 'document-edit-symbolic', lambda: (dialog.close(), self.record_lesson(lesson)))
            add_action('Excluir registro', 'user-trash-symbolic', lambda: confirm(dialog, f'Excluir “{lesson.topic}”?',
                                                                                 'O registro será removido do histórico do aluno. Esta ação não pode ser desfeita.',
                                                                                 'Excluir registro', lambda: self._delete(lesson, dialog), destructive=True), destructive=True)
        page.add(actions)
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    def _update(self, lesson: model.Lesson, values: dict, message: str, dialog=None) -> None:
        def done(_r) -> None:
            if dialog:
                dialog.close()
            self.window.toast(message)
            self.refresh()
        run_async(lambda: self.client.update('lessons', values, id=f'eq.{lesson.id}'), done, lambda error: self.window.toast(str(error)))

    def _delete(self, lesson: model.Lesson, dialog) -> None:
        def done(_r) -> None:
            dialog.close()
            self.window.toast('Registro excluído.')
            self.refresh()
        run_async(lambda: self.client.delete('lessons', id=f'eq.{lesson.id}'), done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ new / edit lesson
    def _student_combo(self, selected: str | None) -> tuple[Adw.ComboRow, list[str]]:
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        names = [f'{self.students[key]["name"]} · {self.students[key]["level"]}' if self.students[key]['level'] else self.students[key]['name'] for key in ids]
        combo = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new(names), enable_search=True)
        if selected in ids:
            combo.set_selected(ids.index(selected))
        elif self.student_filter in ids:
            combo.set_selected(ids.index(self.student_filter))
        return combo, ids

    def edit_lesson(self, lesson: model.Lesson | None, day: date) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno antes de agendar aulas.')
            return
        dialog, page, save = form_dialog(self.window, 'Editar aula' if lesson else 'Nova aula', 'Salvar' if lesson else 'Agendar')
        group = Adw.PreferencesGroup()
        student, ids = self._student_combo(lesson.student_id if lesson else None)
        topic = Adw.EntryRow(title='Tema da aula', text=lesson.topic if lesson else '')
        when, when_value = date_row('Data', day)
        hour, minute = time_rows(lesson.starts_at if lesson else None)
        default_duration, default_link = lesson_defaults(self.window)
        duration = duration_row(lesson.duration if lesson else default_duration)
        link = Adw.EntryRow(title='Link da sala online (opcional)', text=lesson.online_url if lesson else default_link, input_purpose=Gtk.InputPurpose.URL)
        for row in (student, topic, when, hour, minute, duration, link):
            group.add(row)
        page.add(group)

        def submit(*_):
            if not topic.get_text().strip():
                dialog.show_error('Escreva o tema da aula.')
                return
            chosen = when_value()
            starts = datetime(chosen.year, chosen.month, chosen.day, int(hour.get_value()), int(minute.get_value())).astimezone()
            values = {'student_id': ids[student.get_selected()], 'starts_at': starts.isoformat(), 'duration_minutes': duration.options[duration.get_selected()],
                      'topic': topic.get_text().strip(), 'online_url': link.get_text().strip() or None}
            save.set_sensitive(False)

            def work():
                if lesson:
                    self.client.update('lessons', values, id=f'eq.{lesson.id}')
                else:
                    self.client.insert('lessons', {**values, 'teacher_id': self.window.profile['id'], 'status': 'scheduled'})

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Aula atualizada.' if lesson else 'Aula agendada.')
                self.anchor = chosen
                self.refresh()
            run_async(work, done, lambda error: dialog.show_error(str(error)))
        save.connect('clicked', submit)
        dialog.present(self.window)

    # ------------------------------------------------------------------ complete / edit record
    def record_lesson(self, lesson: model.Lesson) -> None:
        record_lesson(self.window, lesson, self.students.get(lesson.student_id, {}), self.refresh)

    # ------------------------------------------------------------------ cancellation requests
    def show_requests(self) -> None:
        dialog = Adw.Dialog(title='Pedidos de cancelamento', content_width=520)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        for request in self.requests:
            lesson = request.get('lessons') or {}
            starts = model.parse_time(lesson.get('starts_at'))
            when = f'{model.day_label(model.local(starts).date())}, {model.local(starts):%H:%M}' if starts else ''
            group = Adw.PreferencesGroup(title=GLib.markup_escape_text((request.get('student') or {}).get('full_name') or 'Aluno'),
                                         description=GLib.markup_escape_text(f'{lesson.get("topic") or "Aula"} · {when}'))
            reason = Adw.ActionRow(title='Motivo', subtitle=GLib.markup_escape_text(request.get('reason') or ''), subtitle_selectable=True)
            reason.add_css_class('property')
            group.add(reason)
            reply = Adw.EntryRow(title='Resposta ao aluno (opcional)')
            group.add(reply)
            buttons = Gtk.Box(spacing=8, halign=Gtk.Align.END, margin_top=8)
            reject = Gtk.Button(label='Recusar')
            reject.add_css_class('pill')
            approve = Gtk.Button(label='Aprovar e cancelar a aula')
            approve.add_css_class('pill')
            approve.add_css_class('destructive-action')
            reject.connect('clicked', lambda _b, r=request, e=reply: self._resolve(r, 'rejected', e.get_text().strip(), dialog))
            approve.connect('clicked', lambda _b, r=request, e=reply: self._resolve(r, 'approved', e.get_text().strip(), dialog))
            buttons.append(reject)
            buttons.append(approve)
            group.add(buttons)
            page.add(group)
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    def _resolve(self, request: dict, status: str, response: str, dialog) -> None:
        def work():
            self.client.update('cancellation_requests', {'status': status, 'teacher_response': response, 'resolved_at': datetime.now(timezone.utc).isoformat()},
                               id=f'eq.{request["id"]}')
            if status == 'approved':
                self.client.update('lessons', {'status': 'cancelled'}, id=f'eq.{request["lesson_id"]}')

        def done(_r) -> None:
            dialog.close()
            self.window.toast('Pedido aprovado e aula cancelada.' if status == 'approved' else 'Pedido recusado.')
            self.refresh()
        run_async(work, done, lambda error: self.window.toast(str(error)))
