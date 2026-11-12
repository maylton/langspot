"""Agenda: lessons by day, join the online room, lesson details, cancel, schedule a new lesson."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, confirm, empty_state, label, open_uri, pill, scrolled, vbox
from langspot_linux.worker import run_async

STATUS_KIND = {'scheduled': 'accent', 'completed': 'success', 'cancelled': 'error'}


class AgendaPage(Page):
    key = 'agenda'
    title = 'Agenda'
    icon = 'x-office-calendar-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.mode = 'upcoming'
        self.lessons: list[model.Lesson] = []
        self.students: dict[str, str] = {}
        toggle = Adw.ToggleGroup()
        toggle.add(Adw.Toggle(label='Próximas', name='upcoming'))
        toggle.add(Adw.Toggle(label='Anteriores', name='past'))
        toggle.set_active_name('upcoming')
        toggle.connect('notify::active-name', self._mode_changed)
        self.header.set_title_widget(toggle)
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova aula')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_lesson())
        self.header.pack_start(new)

    def _mode_changed(self, toggle, _param) -> None:
        self.mode = toggle.get_active_name()
        self.render()

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        since = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()

        def work():
            records = client.select('student_records', select='student_id,student:profiles!student_records_student_id_fkey(full_name)')
            names = {row['student_id']: (row.get('student') or {}).get('full_name') or 'Aluno' for row in records}
            rows = client.select('lessons', starts_at=f'gte.{since}', order='starts_at.asc')
            return names, model.lessons_from_rows(rows, names)

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.students, self.lessons = result
        self.render()

    def render(self) -> None:
        now = datetime.now().astimezone()
        if self.mode == 'upcoming':
            lessons = [lesson for lesson in self.lessons if lesson.ends_at >= now and lesson.status != 'cancelled']
        else:
            lessons = list(reversed([lesson for lesson in self.lessons if lesson.ends_at < now or lesson.status == 'cancelled']))
        box = vbox(18)
        if not lessons:
            box.append(empty_state('x-office-calendar-symbolic', 'Nenhuma aula por aqui',
                                   'Use o botão + para agendar uma aula.' if self.mode == 'upcoming' else 'As aulas dos últimos 45 dias aparecem aqui.'))
        groups = model.group_by_day(lessons)
        if self.mode == 'past':
            groups = list(reversed(groups))
        for day, day_lessons in groups:
            group = Adw.PreferencesGroup(title=model.day_label(day))
            for lesson in day_lessons:
                group.add(self._row(lesson, now))
            box.append(group)
        self.show_content(scrolled(box))

    def _row(self, lesson: model.Lesson, now: datetime) -> Adw.ActionRow:
        row = Adw.ActionRow(title=GLib.markup_escape_text(f'{lesson.starts_at:%H:%M} · {lesson.student_name}'),
                            subtitle=GLib.markup_escape_text(f'{lesson.topic} · {lesson.duration} min'), activatable=True)
        row.add_prefix(Adw.Avatar(size=36, text=lesson.student_name, show_initials=True))
        happening = lesson.starts_at - timedelta(minutes=15) <= now <= lesson.ends_at and lesson.status == 'scheduled'
        if happening:
            row.add_suffix(pill('Agora', 'success'))
        elif lesson.status != 'scheduled':
            row.add_suffix(pill(lesson.status_label, STATUS_KIND.get(lesson.status, '')))
        if lesson.online_url and lesson.status == 'scheduled' and lesson.starts_at.date() <= date.today() + timedelta(days=1):
            join = Gtk.Button(label='Entrar', valign=Gtk.Align.CENTER)
            join.add_css_class('suggested-action' if happening else 'flat')
            join.connect('clicked', lambda *_: open_uri(self, lesson.online_url))
            row.add_suffix(join)
        row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
        row.connect('activated', lambda *_: self.show_lesson(lesson))
        return row

    # ------------------------------------------------------------------ lesson details
    def show_lesson(self, lesson: model.Lesson) -> None:
        dialog = Adw.Dialog(title=lesson.topic, content_width=460)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        info = Adw.PreferencesGroup()
        for title, value in (('Aluno', lesson.student_name),
                             ('Quando', f'{model.day_label(lesson.starts_at.date())}, {lesson.starts_at:%H:%M}–{lesson.ends_at:%H:%M}'),
                             ('Duração', f'{lesson.duration} minutos'), ('Situação', lesson.status_label)):
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value))
            row.add_css_class('property')
            info.add(row)
        page.add(info)
        if lesson.notes or lesson.homework:
            record = Adw.PreferencesGroup(title='Registro da aula')
            if lesson.notes:
                record.add(self._text_row('Observações', lesson.notes))
            if lesson.homework:
                record.add(self._text_row('Tarefa de casa', lesson.homework))
            page.add(record)
        actions = Adw.PreferencesGroup()
        if lesson.online_url:
            link = Adw.ButtonRow(title='Entrar na sala online', start_icon_name='camera-video-symbolic')
            link.connect('activated', lambda *_: open_uri(self, lesson.online_url))
            actions.add(link)
        if lesson.status == 'scheduled' and lesson.starts_at > datetime.now().astimezone():
            cancel = Adw.ButtonRow(title='Cancelar aula', start_icon_name='edit-delete-symbolic')
            cancel.add_css_class('destructive-action')
            cancel.connect('activated', lambda *_: confirm(dialog, 'Cancelar esta aula?', f'{lesson.student_name} será avisado do cancelamento.',
                                                           'Cancelar aula', lambda: self._cancel(lesson, dialog), destructive=True))
            actions.add(cancel)
        record_row = Adw.ButtonRow(title='Registrar a aula no site', end_icon_name='adw-external-link-symbolic')
        record_row.connect('activated', lambda *_: open_uri(self, self.window.app.config.web_url))
        actions.add(record_row)
        page.add(actions)
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    @staticmethod
    def _text_row(title: str, text: str) -> Adw.ActionRow:
        row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(text), subtitle_selectable=True)
        row.add_css_class('property')
        return row

    def _cancel(self, lesson: model.Lesson, dialog: Adw.Dialog) -> None:
        client = self.client

        def done(_result) -> None:
            dialog.close()
            self.window.toast('Aula cancelada.')
            self.refresh()

        run_async(lambda: client.update('lessons', {'status': 'cancelled'}, id=f'eq.{lesson.id}'), done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ new lesson
    def new_lesson(self) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno no site antes de agendar aulas.')
            return
        dialog = Adw.Dialog(title='Nova aula', content_width=460)
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar(show_end_title_buttons=False, show_start_title_buttons=False)
        cancel = Gtk.Button(label='Cancelar')
        cancel.connect('clicked', lambda *_: dialog.close())
        header.pack_start(cancel)
        save = Gtk.Button(label='Agendar')
        save.add_css_class('suggested-action')
        header.pack_end(save)
        toolbar.add_top_bar(header)

        page = Adw.PreferencesPage()
        group = Adw.PreferencesGroup()
        ids = sorted(self.students, key=lambda student_id: self.students[student_id].lower())
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[student_id] for student_id in ids]), enable_search=True)
        group.add(student)

        chosen = {'day': date.today() + timedelta(days=1)}
        day_row = Adw.ActionRow(title='Data', subtitle=model.day_label(chosen['day']))
        calendar = Gtk.Calendar()
        popover = Gtk.Popover(child=calendar)
        day_button = Gtk.MenuButton(icon_name='x-office-calendar-symbolic', popover=popover, valign=Gtk.Align.CENTER, tooltip_text='Escolher a data')
        day_button.add_css_class('flat')

        def picked(cal):
            value = cal.get_date()
            chosen['day'] = date(value.get_year(), value.get_month(), value.get_day_of_month())
            day_row.set_subtitle(model.day_label(chosen['day']))
            popover.popdown()
        calendar.connect('day-selected', picked)
        tomorrow = GLib.DateTime.new_local(chosen['day'].year, chosen['day'].month, chosen['day'].day, 0, 0, 0)
        calendar.select_day(tomorrow)
        day_row.add_suffix(day_button)
        day_row.set_activatable_widget(day_button)
        group.add(day_row)

        hour = Adw.SpinRow.new_with_range(6, 23, 1)
        hour.set_title('Hora')
        hour.set_value(19)
        minute = Adw.SpinRow.new_with_range(0, 55, 5)
        minute.set_title('Minutos')
        duration = Adw.SpinRow.new_with_range(15, 180, 15)
        duration.set_title('Duração (minutos)')
        duration.set_value(60)
        topic = Adw.EntryRow(title='Tema da aula')
        link = Adw.EntryRow(title='Link da sala online (opcional)', input_purpose=Gtk.InputPurpose.URL)
        for row in (hour, minute, duration, topic, link):
            group.add(row)
        page.add(group)
        error = label('', css=('error',))
        error.set_visible(False)
        error.set_margin_start(12)
        page_box = vbox(6)
        page_box.append(page)
        page_box.append(error)
        toolbar.set_content(page_box)
        dialog.set_child(toolbar)

        def submit(*_):
            if not topic.get_text().strip():
                error.set_text('Escreva o tema da aula.')
                error.set_visible(True)
                return
            day = chosen['day']
            starts = datetime(day.year, day.month, day.day, int(hour.get_value()), int(minute.get_value())).astimezone()
            values = {'teacher_id': self.window.profile['id'], 'student_id': ids[student.get_selected()], 'starts_at': starts.isoformat(),
                      'duration_minutes': int(duration.get_value()), 'topic': topic.get_text().strip(),
                      'online_url': link.get_text().strip() or None, 'status': 'scheduled'}
            save.set_sensitive(False)

            def done(_row) -> None:
                dialog.close()
                self.window.toast('Aula agendada.')
                self.refresh()

            def failed(problem: Exception) -> None:
                save.set_sensitive(True)
                error.set_text(str(problem))
                error.set_visible(True)

            run_async(lambda: self.client.insert('lessons', values), done, failed)

        save.connect('clicked', submit)
        dialog.present(self.window)
