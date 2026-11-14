"""Students: list with progress and streaks; register (temporary password) or invite by e-mail; profile with
contact, details, editable skills, lesson history (register / edit / delete records), assessments; edit and
delete the student. Same tables and functions as the website."""
from __future__ import annotations

from datetime import datetime

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, action_menu, confirm, copy_text, empty_state, label, open_uri, pill, scrolled, vbox
from langspot_linux.ui.pages.student_forms import StudentFormsMixin
from langspot_linux.ui.lesson_forms import lesson_defaults, record_lesson
from langspot_linux.worker import run_async

class StudentsPage(StudentFormsMixin, Page):
    key = 'students'
    title = 'Alunos'
    icon = 'system-users-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.students: list[dict] = []
        self.lessons: list[model.Lesson] = []
        self.streaks: dict[str, tuple[int, int]] = {}
        self.open_student: str | None = None
        self.search = Gtk.SearchEntry(placeholder_text='Nome, nível ou objetivo', hexpand=True, max_width_chars=28)
        self.search.connect('search-changed', lambda *_: self.render())
        self.header.set_title_widget(self.search)
        add = action_menu([('Cadastrar aluno (senha temporária)', self.create_student), ('Convidar por e-mail', self.invite_student)],
                          icon='list-add-symbolic', tooltip='Novo aluno', flat=False)
        add.add_css_class('suggested-action')
        self.header.pack_start(add)

    # ------------------------------------------------------------------ data
    def refresh(self) -> None:
        self.show_loading()
        client = self.client

        def work():
            records = client.select('student_records', select='*,student:profiles!student_records_student_id_fkey(id,full_name,email,whatsapp_phone)',
                                    order='created_at.desc')
            names = {row['student_id']: (row.get('student') or {}).get('full_name') or 'Aluno' for row in records}
            lessons = model.lessons_from_rows(client.select('lessons', order='starts_at.asc'), names)
            activity = client.select('study_activities', select='student_id,activity_date')
            try:
                freezes = client.select('streak_freezes', select='student_id,protected_date')
            except Exception:  # older databases without streak freezes, as on the website
                freezes = []
            return records, lessons, activity, freezes

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        records, self.lessons, activity, freezes = result
        self.students = sorted(records, key=lambda row: self.name(row).lower())
        dates: dict[str, list[str]] = {}
        for row in activity:
            dates.setdefault(row['student_id'], []).append(row['activity_date'])
        for row in freezes:
            dates.setdefault(row['student_id'], []).append(row['protected_date'])
        self.streaks = {student_id: model.calculate_streak(values) for student_id, values in dates.items()}
        self.render()
        if self.open_student:
            record = self.record(self.open_student)
            self.nav.pop_to_tag('root')
            if record:
                self.show_student(record)

    @staticmethod
    def name(record: dict) -> str:
        return (record.get('student') or {}).get('full_name') or 'Aluno sem nome'

    def record(self, student_id: str) -> dict | None:
        return next((row for row in self.students if row['student_id'] == student_id), None)

    def next_lesson(self, student_id: str) -> model.Lesson | None:
        now = datetime.now().astimezone()
        return next((lesson for lesson in self.lessons if lesson.student_id == student_id and lesson.status == 'scheduled' and lesson.starts_at >= now), None)

    def history(self, student_id: str) -> list[model.Lesson]:
        """Lessons in the student's history: completed, or already past (same rule as the website)."""
        now = datetime.now().astimezone()
        return [lesson for lesson in self.lessons if lesson.student_id == student_id and (lesson.status == 'completed' or lesson.starts_at < now)]

    # ------------------------------------------------------------------ list
    def render(self) -> None:
        query = self.search.get_text().strip().lower()
        box = vbox(18)

        def matches(row: dict) -> bool:
            return not query or any(query in (value or '').lower() for value in (self.name(row), row.get('level'), row.get('goal')))

        visible = [row for row in self.students if matches(row)]
        if not visible:
            box.append(empty_state('system-users-symbolic', 'Nenhum aluno encontrado' if query else 'Nenhum aluno ainda',
                                   'Tente outra busca.' if query else 'Use o botão + para cadastrar ou convidar um aluno.'))
        else:
            group = Adw.PreferencesGroup(title=f'{len(visible)} aluno' + ('' if len(visible) == 1 else 's'))
            for record in visible:
                group.add(self._row(record))
            box.append(group)
        self.show_content(scrolled(box))

    def _row(self, record: dict) -> Adw.ActionRow:
        name = self.name(record)
        current, _best = self.streaks.get(record['student_id'], (0, 0))
        parts = [record.get('level') or '—', record.get('goal') or '']
        if current:
            parts.append(f'{current} dia(s) de sequência')
        row = Adw.ActionRow(title=GLib.markup_escape_text(name), subtitle=GLib.markup_escape_text(' · '.join(part for part in parts if part)), activatable=True)
        row.add_prefix(Adw.Avatar(size=40, text=name, show_initials=True))
        upcoming = self.next_lesson(record['student_id'])
        if upcoming:
            row.add_suffix(label(f'Próxima aula\n{model.day_label(upcoming.starts_at.date())}, {upcoming.starts_at:%H:%M}', css=('caption', 'dim-label'), xalign=1))
        progress = model.progress_of(record.get('skills'))
        bar = Gtk.LevelBar(min_value=0, max_value=100, value=progress, valign=Gtk.Align.CENTER, width_request=90)
        row.add_suffix(bar)
        row.add_suffix(label(f'{progress}%', css=('numeric', 'caption'), wrap=False))
        row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
        row.connect('activated', lambda *_: self.show_student(record))
        return row

    # ------------------------------------------------------------------ profile
    def show_student(self, record: dict) -> None:
        student_id = record['student_id']
        self.open_student = student_id
        student = record.get('student') or {}
        name = self.name(record)
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        header.pack_end(action_menu([('Editar perfil', lambda: self.edit_student(record)),
                                     ('Ver o portal do aluno no site', lambda: open_uri(self, self.window.app.config.web_url))],
                                    [('Excluir aluno', lambda: self.delete_student(record))], tooltip='Ações do aluno', flat=False))
        toolbar.add_top_bar(header)
        box = vbox(18)

        top = Gtk.Box(spacing=16)
        top.append(Adw.Avatar(size=72, text=name, show_initials=True))
        titles = vbox(4)
        titles.set_valign(Gtk.Align.CENTER)
        titles.append(label(name, css=('title-2',)))
        titles.append(label(record.get('goal') or 'Sem objetivo cadastrado', css=('dim-label',)))
        top.append(titles)
        level = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, hexpand=True, halign=Gtk.Align.END, valign=Gtk.Align.CENTER)
        level.append(label(record.get('level') or '—', css=('ls-big-number',), xalign=1))
        level.append(label('nível atual', css=('caption', 'dim-label'), xalign=1))
        top.append(level)
        box.append(top)

        current, best = self.streaks.get(student_id, (0, 0))
        upcoming = self.next_lesson(student_id)
        details = Adw.PreferencesGroup(title='Perfil')
        for title, value in (('Idade', str(record['age']) if record.get('age') else '—'),
                             ('Sequência atual', f'{current} dia(s)'), ('Melhor sequência', f'{best} dia(s)'),
                             ('Conquistas', f'{model.achievements(best)}/{len(model.STREAK_MILESTONES)}'),
                             ('Próxima aula', f'{model.day_label(upcoming.starts_at.date())}, {upcoming.starts_at:%H:%M} · {upcoming.topic}' if upcoming else 'Não agendada'),
                             ('Observações', record.get('notes') or 'Nenhuma observação adicionada.')):
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value), subtitle_selectable=True)
            row.add_css_class('property')
            details.add(row)
        box.append(details)

        contact = Adw.PreferencesGroup(title='Contato')
        if student.get('email'):
            email = Adw.ActionRow(title='E-mail', subtitle=GLib.markup_escape_text(student['email']))
            email.add_css_class('property')
            copy = Gtk.Button(icon_name='edit-copy-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Copiar e-mail')
            copy.add_css_class('flat')
            copy.connect('clicked', lambda *_: (copy_text(self, student['email']), self.window.toast('E-mail copiado.')))
            email.add_suffix(copy)
            contact.add(email)
        phone = ''.join(ch for ch in (student.get('whatsapp_phone') or '') if ch.isdigit())
        if phone:
            whatsapp = Adw.ActionRow(title='WhatsApp', subtitle=GLib.markup_escape_text(student['whatsapp_phone']), activatable=True)
            whatsapp.add_css_class('property')
            whatsapp.add_suffix(Gtk.Image(icon_name='adw-external-link-symbolic'))
            whatsapp.connect('activated', lambda *_: open_uri(self, f'https://wa.me/{phone}'))
            contact.add(whatsapp)
        if student.get('email') or phone:
            box.append(contact)

        box.append(self._skills_group(record))
        box.append(self._history_group(record))

        assessments = Adw.PreferencesGroup(title='Avaliações', description='Avaliações concluídas e revisadas.')
        spinner = Adw.Spinner(height_request=24)
        assessments.add(spinner)
        box.append(assessments)

        toolbar.set_content(scrolled(box))
        page = Adw.NavigationPage(title=name, child=toolbar)
        page.connect('hidden', lambda *_: setattr(self, 'open_student', None) if self.nav.get_visible_page().get_tag() == 'root' else None)
        self.nav.push(page)

        def loaded(progress: dict) -> None:
            assessments.remove(spinner)
            items = list(reversed(progress.get('history') or []))
            if not items:
                assessments.add(Adw.ActionRow(title='Nenhuma avaliação concluída ainda.'))
            for item in items:
                completed = model.short_datetime(item.get('completedAt'))
                row = Adw.ActionRow(title=GLib.markup_escape_text(item.get('title') or 'Avaliação'), activatable=True,
                                    subtitle=GLib.markup_escape_text(f'{completed} · resultado {item.get("score") if item.get("score") is not None else "—"}%'))
                if item.get('estimatedCefr'):
                    row.add_suffix(pill(item['estimatedCefr'], 'accent'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, attempt=item['attemptId']: self.window.open_attempt(attempt))
                assessments.add(row)

        def failed(error: Exception) -> None:
            assessments.remove(spinner)
            assessments.add(Adw.ActionRow(title='Não foi possível carregar as avaliações.', subtitle=GLib.markup_escape_text(str(error))))

        run_async(lambda: self.client.rpc('get_assessment_progress', p_student_id=student_id), loaded, failed)

    def _skills_group(self, record: dict) -> Gtk.Widget:
        skills = model.normalize_skills(record.get('skills'))
        group = Adw.PreferencesGroup(title='Progresso por habilidade', description='0 a 100. As aulas registradas também atualizam estes valores.')
        overall = label(f'{model.progress_of(skills)}%', css=('title-3',), wrap=False)
        group.set_header_suffix(overall)
        scales: dict[str, Gtk.Scale] = {}
        save = Gtk.Button(label='Salvar habilidades', halign=Gtk.Align.END, sensitive=False, margin_top=8)
        save.add_css_class('suggested-action')
        save.add_css_class('pill')

        def changed(*_):
            values = {skill: round(scale.get_value()) for skill, scale in scales.items()}
            overall.set_text(f'{model.progress_of(values)}%')
            save.set_sensitive(values != {skill: round(value) for skill, value in skills.items()})

        for skill in model.SKILLS:
            row = Adw.ActionRow(title=skill)
            scale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1)
            scale.set_value(skills[skill])
            scale.set_size_request(240, -1)
            scale.set_draw_value(True)
            scale.set_digits(0)
            scale.set_value_pos(Gtk.PositionType.RIGHT)
            scale.connect('value-changed', changed)
            row.add_suffix(scale)
            scales[skill] = scale
            group.add(row)

        def submit(*_):
            values = {skill: round(scale.get_value()) for skill, scale in scales.items()}
            save.set_sensitive(False)

            def done(_r) -> None:
                record['skills'] = values
                skills.update({key: float(value) for key, value in values.items()})
                self.window.toast('Habilidades atualizadas.')
                self.render()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                self.window.toast(str(error))
            run_async(lambda: self.client.update('student_records', {'skills': values}, student_id=f'eq.{record["student_id"]}',
                                                 teacher_id=f'eq.{self.window.profile["id"]}'), done, failed)
        save.connect('clicked', submit)
        box = vbox(0)
        box.append(group)
        box.append(save)
        return box

    def _history_group(self, record: dict) -> Gtk.Widget:
        history = list(reversed(self.history(record['student_id'])))
        group = Adw.PreferencesGroup(title='Aulas registradas', description=f'{len(history)} aula(s) no histórico.')
        new = Gtk.Button(label='Registrar aula', valign=Gtk.Align.CENTER)
        new.add_css_class('pill')
        new.connect('clicked', lambda *_: self.new_record(record))
        group.set_header_suffix(new)
        if not history:
            group.add(Adw.ActionRow(title='Nenhuma aula registrada', subtitle='Registre a primeira aula deste aluno.'))
        for lesson in history:
            subtitle = ' · '.join(part for part in (f'{lesson.starts_at:%H:%M}', model.ATTENDANCE_LABELS.get(lesson.attendance, ''), lesson.status_label if lesson.status != 'completed' else '') if part)
            row = Adw.ExpanderRow(title=GLib.markup_escape_text(f'{lesson.starts_at:%d/%m/%Y} · {lesson.topic}'), subtitle=GLib.markup_escape_text(subtitle))
            for title, text in (('Resumo da aula', lesson.notes), ('Pontos fortes', lesson.strengths or 'Ainda não informado.'),
                                ('Pontos a melhorar', lesson.improvements or 'Ainda não informado.'), ('Tarefa de casa', lesson.homework)):
                if text.strip():
                    detail = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(text), subtitle_selectable=True)
                    detail.add_css_class('property')
                    row.add_row(detail)
            buttons = Gtk.Box(spacing=8, halign=Gtk.Align.END, margin_top=6, margin_bottom=6, margin_end=12)
            edit = Gtk.Button(label='Editar')
            edit.add_css_class('flat')
            edit.connect('clicked', lambda _b, item=lesson: record_lesson(self.window, item, {'skills': record.get('skills') or {}}, self.refresh))
            delete = Gtk.Button(label='Excluir')
            delete.add_css_class('flat')
            delete.add_css_class('error')
            delete.connect('clicked', lambda _b, item=lesson: self.delete_record(item))
            buttons.append(edit)
            buttons.append(delete)
            row.add_row(buttons)
            group.add(row)
        return group

    def new_record(self, record: dict) -> None:
        duration, link = lesson_defaults(self.window)
        now = datetime.now().astimezone().replace(hour=12, minute=0, second=0, microsecond=0)
        lesson = model.Lesson(id='', student_id=record['student_id'], student_name=self.name(record), starts_at=now, duration=duration, topic='',
                              online_url=link, status='completed', skill_scores=model.normalize_skills(record.get('skills')))
        record_lesson(self.window, lesson, record, self.refresh)

    def delete_record(self, lesson: model.Lesson) -> None:
        def run() -> None:
            def done(_r) -> None:
                self.window.toast('Registro excluído.')
                self.refresh()
            run_async(lambda: self.client.delete('lessons', id=f'eq.{lesson.id}'), done, lambda error: self.window.toast(str(error)))
        confirm(self.window, f'Excluir “{lesson.topic}”?', 'O registro será removido do histórico do aluno. Esta ação não pode ser desfeita.',
                'Excluir registro', run, destructive=True)

    # ------------------------------------------------------------------ edit / delete

    # ------------------------------------------------------------------ new students
