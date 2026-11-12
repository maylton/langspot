"""Students: list with progress and streaks; register (temporary password) or invite by e-mail; profile with
contact, details, editable skills, lesson history (register / edit / delete records), assessments; edit and
delete the student. Same tables and functions as the website."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, Gio, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import (Page, confirm, copy_text, date_row, empty_state, form_dialog, label, open_uri, pill, scrolled,
                                      text_view, vbox)
from langspot_linux.ui.lesson_forms import duration_row, lesson_defaults, record_lesson, time_rows
from langspot_linux.worker import run_async

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


def access_message(name: str, email: str, password: str, url: str) -> str:
    """The web app's first-access tutorial (TemporaryAccessModal), ready to paste on WhatsApp."""
    return f'''Olá, {name}! Tudo bem?

Seu acesso ao LangSpot já foi criado. A plataforma será nosso espaço para acompanhar aulas, materiais, tarefas, metas, flashcards e seu progresso nos estudos.

Acesse por aqui:
{url}

Dados de acesso:
E-mail: {email}
Senha temporária: {password}

Como entrar pela primeira vez:
1. Acesse o link acima.
2. Clique em entrar.
3. Use o e-mail e a senha temporária.
4. No primeiro acesso, você poderá atualizar seus dados e trocar sua foto de perfil.
5. Depois disso, use o menu do portal para acompanhar suas aulas, tarefas, materiais, metas e flashcards.

Dica:
Salve o link nos favoritos ou na tela inicial do celular para acessar mais rápido.

Se tiver qualquer dificuldade para entrar, me avise que eu te ajudo.'''


class StudentsPage(Page):
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
        menu = Gio.Menu()
        menu.append('Cadastrar aluno (senha temporária)', 'students.create')
        menu.append('Convidar por e-mail', 'students.invite')
        actions = Gio.SimpleActionGroup()
        for name, callback in (('create', self.create_student), ('invite', self.invite_student)):
            item = Gio.SimpleAction.new(name, None)
            item.connect('activate', lambda *_a, run=callback: run())
            actions.add_action(item)
        self.insert_action_group('students', actions)
        add = Gtk.MenuButton(icon_name='list-add-symbolic', menu_model=menu, tooltip_text='Novo aluno')
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
        menu = Gio.Menu()
        menu.append('Editar perfil', 'student.edit')
        menu.append('Ver o portal do aluno no site', 'student.portal')
        danger = Gio.Menu()
        danger.append('Excluir aluno', 'student.delete')
        menu.append_section(None, danger)
        actions = Gio.SimpleActionGroup()
        for action_name, callback in (('edit', lambda: self.edit_student(record)), ('delete', lambda: self.delete_student(record)),
                                      ('portal', lambda: open_uri(self, self.window.app.config.web_url))):
            item = Gio.SimpleAction.new(action_name, None)
            item.connect('activate', lambda *_a, run=callback: run())
            actions.add_action(item)
        more = Gtk.MenuButton(icon_name='view-more-symbolic', menu_model=menu, tooltip_text='Ações do aluno')
        more.insert_action_group('student', actions)
        header.pack_end(more)
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
                row = Adw.ActionRow(title=GLib.markup_escape_text(item.get('title') or 'Avaliação'),
                                    subtitle=GLib.markup_escape_text(f'{completed} · resultado {item.get("score") if item.get("score") is not None else "—"}%'))
                if item.get('estimatedCefr'):
                    row.add_suffix(pill(item['estimatedCefr'], 'accent'))
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
    def edit_student(self, record: dict) -> None:
        student = record.get('student') or {}
        dialog, page, save = form_dialog(self.window, f'Editar perfil · {self.name(record)}', 'Salvar')
        group = Adw.PreferencesGroup()
        name = Adw.EntryRow(title='Nome completo', text=self.name(record))
        email = Adw.ActionRow(title='E-mail de acesso', subtitle=GLib.markup_escape_text(student.get('email') or '—'))
        email.add_css_class('property')
        phone = Adw.EntryRow(title='WhatsApp', text=student.get('whatsapp_phone') or '', input_purpose=Gtk.InputPurpose.PHONE)
        age = Adw.SpinRow.new_with_range(0, 120, 1)
        age.set_title('Idade')
        age.set_subtitle('0 = não informada')
        age.set_value(float(record.get('age') or 0))
        level = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(LEVELS))
        level.set_selected(LEVELS.index(record.get('level')) if record.get('level') in LEVELS else 0)
        goal = Adw.EntryRow(title='Objetivo', text=record.get('goal') or '')
        for row in (name, email, phone, age, level, goal):
            group.add(row)
        page.add(group)
        notes_group = Adw.PreferencesGroup(title='Observações')
        frame, notes = text_view(record.get('notes') or '', 100)
        notes_group.add(frame)
        page.add(notes_group)

        def submit(*_):
            if not name.get_text().strip() or not goal.get_text().strip():
                dialog.show_error('Preencha o nome e o objetivo.')
                return
            teacher = self.window.profile['id']
            student_id = record['student_id']
            profile_values = {'full_name': name.get_text().strip(), 'whatsapp_phone': phone.get_text().strip()}
            record_values = {'age': int(age.get_value()) or None, 'level': LEVELS[level.get_selected()], 'goal': goal.get_text().strip(), 'notes': notes()}
            save.set_sensitive(False)

            def work():
                self.client.update('profiles', profile_values, id=f'eq.{student_id}', teacher_id=f'eq.{teacher}')
                self.client.update('student_records', record_values, student_id=f'eq.{student_id}', teacher_id=f'eq.{teacher}')

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Perfil atualizado.')
                self.refresh()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(str(error))
            run_async(work, done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)

    def delete_student(self, record: dict) -> None:
        student_id = record['student_id']
        history = len(self.history(student_id))
        scheduled = sum(1 for lesson in self.lessons if lesson.student_id == student_id and lesson.status == 'scheduled')

        def run() -> None:
            def done(_r) -> None:
                self.open_student = None
                self.window.toast(f'{self.name(record)} foi excluído.')
                self.nav.pop_to_tag('root')
                self.refresh()
            run_async(lambda: self.client.delete('student_records', student_id=f'eq.{student_id}', teacher_id=f'eq.{self.window.profile["id"]}'),
                      done, lambda error: self.window.toast(str(error)))
        confirm(self.window, f'Excluir {self.name(record)} permanentemente?',
                f'O perfil, {history} aula(s) do histórico e {scheduled} aula(s) agendada(s) serão removidos. Esta ação não pode ser desfeita.',
                'Excluir aluno', run, destructive=True)

    # ------------------------------------------------------------------ new students
    def _student_fields(self, page: Adw.PreferencesPage, *, extended: bool) -> dict:
        group = Adw.PreferencesGroup()
        fields = {'name': Adw.EntryRow(title='Nome completo'), 'email': Adw.EntryRow(title='E-mail', input_purpose=Gtk.InputPurpose.EMAIL),
                  'phone': Adw.EntryRow(title='WhatsApp (opcional)', input_purpose=Gtk.InputPurpose.PHONE)}
        if extended:
            age = Adw.SpinRow.new_with_range(0, 120, 1)
            age.set_title('Idade')
            age.set_subtitle('0 = não informada')
            fields['age'] = age
        fields['level'] = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(LEVELS))
        fields['goal'] = Adw.EntryRow(title='Objetivo' if extended else 'Objetivo (opcional)')
        for row in fields.values():
            group.add(row)
        page.add(group)
        return fields

    def create_student(self) -> None:
        dialog, page, save = form_dialog(self.window, 'Cadastrar novo aluno', 'Criar acesso', width=540)
        intro = Adw.PreferencesGroup(description='O aluno recebe uma conta com senha temporária para acessar o portal.')
        page.add(intro)
        fields = self._student_fields(page, extended=True)
        notes_group = Adw.PreferencesGroup(title='Observações')
        frame, notes = text_view('', 80)
        notes_group.add(frame)
        page.add(notes_group)

        duration_default, link_default = lesson_defaults(self.window)
        first = Adw.PreferencesGroup(title='Primeira aula (opcional)', description='Ao preencher, a aula entra na agenda.')
        enabled = Adw.SwitchRow(title='Agendar a primeira aula')
        when, when_value = date_row('Data', date.today() + timedelta(days=1))
        hour, minute = time_rows(None)
        duration = duration_row(duration_default)
        topic = Adw.EntryRow(title='Tema da aula', text='Aula de diagnóstico')
        link = Adw.EntryRow(title='Link da sala online', text=link_default, input_purpose=Gtk.InputPurpose.URL)
        lesson_rows = (when, hour, minute, duration, topic, link)
        first.add(enabled)
        for row in lesson_rows:
            row.set_visible(False)
            first.add(row)
        enabled.connect('notify::active', lambda row, _p: [item.set_visible(row.get_active()) for item in lesson_rows])
        page.add(first)

        def submit(*_):
            name, email, goal = fields['name'].get_text().strip(), fields['email'].get_text().strip(), fields['goal'].get_text().strip()
            if not name or '@' not in email or not goal:
                dialog.show_error('Preencha nome, e-mail e objetivo.')
                return
            if enabled.get_active() and not topic.get_text().strip():
                dialog.show_error('Escreva o tema da primeira aula.')
                return
            body = {'action': 'create-with-password', 'email': email, 'fullName': name, 'age': int(fields['age'].get_value()) or None,
                    'level': LEVELS[fields['level'].get_selected()], 'goal': goal, 'notes': notes(), 'whatsappPhone': fields['phone'].get_text().strip()}
            lesson = None
            if enabled.get_active():
                chosen = when_value()
                starts = datetime(chosen.year, chosen.month, chosen.day, int(hour.get_value()), int(minute.get_value())).astimezone()
                lesson = {'starts_at': starts.isoformat(), 'duration_minutes': duration.options[duration.get_selected()], 'topic': topic.get_text().strip(),
                          'online_url': link.get_text().strip() or None, 'status': 'scheduled', 'teacher_id': self.window.profile['id']}
            save.set_sensitive(False)

            def work():
                account = self.client.invoke('invite-student', body)
                if lesson:
                    try:
                        self.client.insert('lessons', {**lesson, 'student_id': account['studentId']})
                    except Exception:
                        account['lessonFailed'] = True
                return account

            def done(account: dict) -> None:
                dialog.close()
                self.open_student = account.get('studentId')
                self.refresh()
                self.show_access(name, email, str(account.get('temporaryPassword') or ''))
                if account.get('lessonFailed'):
                    self.window.toast('Aluno criado, mas a primeira aula não foi agendada. Agende pela Agenda.')

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(f'Não foi possível criar a conta do aluno: {error}')
            run_async(work, done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)

    def show_access(self, name: str, email: str, password: str) -> None:
        message = access_message(name, email, password, self.window.app.config.web_url)
        dialog = Adw.Dialog(title='Acesso do aluno criado', content_width=520, content_height=640)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        info = Adw.PreferencesGroup(description=f'Envie este tutorial para {name}. A senha só é pedida no primeiro acesso e não ficará disponível de novo.')
        for title, value in (('E-mail', email), ('Senha temporária', password)):
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value), subtitle_selectable=True)
            row.add_css_class('property')
            info.add(row)
        page.add(info)
        preview = Adw.PreferencesGroup(title='Mensagem que será copiada')
        text = Gtk.TextView(editable=False, wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=10, bottom_margin=10, left_margin=12, right_margin=12)
        text.get_buffer().set_text(message)
        text.add_css_class('card')
        preview.add(text)
        page.add(preview)
        actions = Gtk.Box(spacing=8, halign=Gtk.Align.CENTER, margin_top=12)
        copy = Gtk.Button(label='Copiar tutorial de acesso')
        copy.add_css_class('suggested-action')
        copy.add_css_class('pill')
        copy.connect('clicked', lambda *_: (copy_text(self, message), self.window.toast('Tutorial copiado. Cole no WhatsApp ou no e-mail.')))
        actions.append(copy)
        done = Gtk.Button(label='Concluir')
        done.add_css_class('pill')
        done.connect('clicked', lambda *_: dialog.close())
        actions.append(done)
        group = Adw.PreferencesGroup()
        group.add(actions)
        page.add(group)
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    def invite_student(self) -> None:
        dialog, page, save = form_dialog(self.window, 'Convidar aluno', 'Enviar convite')
        page.add(Adw.PreferencesGroup(description='O aluno recebe um e-mail com um link para definir a própria senha.'))
        fields = self._student_fields(page, extended=False)

        def submit(*_):
            name, email = fields['name'].get_text().strip(), fields['email'].get_text().strip()
            if not name or '@' not in email:
                dialog.show_error('Preencha o nome e o e-mail.')
                return
            body = {'email': email, 'fullName': name, 'whatsappPhone': fields['phone'].get_text().strip(),
                    'level': LEVELS[fields['level'].get_selected()], 'goal': fields['goal'].get_text().strip()}
            save.set_sensitive(False)

            def done(_r) -> None:
                dialog.close()
                self.window.toast(f'Convite enviado para {email}.')
                self.refresh()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(f'Não foi possível enviar o convite: {error}')
            run_async(lambda: self.client.invoke('invite-student', body, origin=self.window.app.config.web_url), done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)
