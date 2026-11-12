"""Students: search, profile, contact, skills, upcoming lessons and assessment history."""
from __future__ import annotations

from datetime import datetime, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, copy_text, empty_state, label, open_uri, pill, scrolled, vbox
from langspot_linux.worker import run_async

SKILLS = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation']


class StudentsPage(Page):
    key = 'students'
    title = 'Alunos'
    icon = 'system-users-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.students: list[dict] = []
        self.next_lessons: dict[str, datetime] = {}
        self.search = Gtk.SearchEntry(placeholder_text='Buscar aluno', hexpand=True, max_width_chars=28)
        self.search.connect('search-changed', lambda *_: self.render())
        self.header.set_title_widget(self.search)

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        now = datetime.now(timezone.utc).isoformat()

        def work():
            records = client.select('student_records', select='*,student:profiles!student_records_student_id_fkey(id,full_name,email,whatsapp_phone)',
                                    order='created_at.desc')
            upcoming = client.select('lessons', select='student_id,starts_at', status='eq.scheduled', starts_at=f'gte.{now}', order='starts_at.asc')
            return records, upcoming

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        records, upcoming = result
        self.students = sorted(records, key=lambda row: ((row.get('student') or {}).get('full_name') or '').lower())
        self.next_lessons = {}
        for row in upcoming:
            moment = model.parse_time(row['starts_at'])
            if moment and row['student_id'] not in self.next_lessons:
                self.next_lessons[row['student_id']] = model.local(moment)
        self.render()

    def render(self) -> None:
        query = self.search.get_text().strip().lower()
        box = vbox(18)
        visible = [row for row in self.students if query in ((row.get('student') or {}).get('full_name') or '').lower()]
        if not visible:
            box.append(empty_state('system-users-symbolic', 'Nenhum aluno encontrado' if query else 'Nenhum aluno ainda',
                                   '' if query else 'Convide alunos pelo site para eles aparecerem aqui.'))
        else:
            group = Adw.PreferencesGroup(title=f'{len(visible)} aluno' + ('' if len(visible) == 1 else 's'))
            for record in visible:
                group.add(self._row(record))
            box.append(group)
        self.show_content(scrolled(box))

    def _row(self, record: dict) -> Adw.ActionRow:
        student = record.get('student') or {}
        name = student.get('full_name') or 'Aluno sem nome'
        subtitle = ' · '.join(part for part in (f'Nível {record.get("level") or "—"}', record.get('goal') or '') if part)
        row = Adw.ActionRow(title=GLib.markup_escape_text(name), subtitle=GLib.markup_escape_text(subtitle), activatable=True)
        row.add_prefix(Adw.Avatar(size=40, text=name, show_initials=True))
        upcoming = self.next_lessons.get(record['student_id'])
        if upcoming:
            row.add_suffix(label(f'Próxima aula\n{model.day_label(upcoming.date())}, {upcoming:%H:%M}', css=('caption', 'dim-label'), xalign=1))
        row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
        row.connect('activated', lambda *_: self.show_student(record))
        return row

    # ------------------------------------------------------------------ detail
    def show_student(self, record: dict) -> None:
        student = record.get('student') or {}
        name = student.get('full_name') or 'Aluno'
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
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
            whatsapp = Adw.ActionRow(title='WhatsApp', subtitle=student['whatsapp_phone'], activatable=True)
            whatsapp.add_css_class('property')
            whatsapp.add_suffix(Gtk.Image(icon_name='adw-external-link-symbolic'))
            whatsapp.connect('activated', lambda *_: open_uri(self, f'https://wa.me/{phone}'))
            contact.add(whatsapp)
        if student.get('email') or phone:
            box.append(contact)

        profile = Adw.PreferencesGroup(title='Perfil')
        for title, value in (('Idade', str(record['age']) if record.get('age') else '—'), ('Observações', record.get('notes') or '—')):
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value), subtitle_selectable=True)
            row.add_css_class('property')
            profile.add(row)
        box.append(profile)

        skills = record.get('skills') or {}
        if skills:
            group = Adw.PreferencesGroup(title='Habilidades', description='Registradas por você nas aulas (0 a 100).')
            for skill in SKILLS:
                if skill not in skills:
                    continue
                value = max(0, min(100, float(skills[skill])))
                row = Adw.ActionRow(title=skill)
                bar = Gtk.LevelBar(min_value=0, max_value=100, value=value, valign=Gtk.Align.CENTER, width_request=180)
                row.add_suffix(bar)
                row.add_suffix(label(f'{round(value)}', css=('numeric',), wrap=False))
                group.add(row)
            box.append(group)

        upcoming = self.next_lessons.get(record['student_id'])
        if upcoming:
            group = Adw.PreferencesGroup(title='Próxima aula')
            group.add(Adw.ActionRow(title=f'{model.day_label(upcoming.date())}, {upcoming:%H:%M}'))
            box.append(group)

        history = Adw.PreferencesGroup(title='Avaliações', description='Avaliações concluídas e revisadas.')
        history_spinner = Adw.Spinner(height_request=24)
        history.add(history_spinner)
        box.append(history)

        site = Gtk.Button(label='Abrir o perfil completo no site', halign=Gtk.Align.CENTER)
        site.add_css_class('pill')
        site.connect('clicked', lambda *_: open_uri(self, self.window.app.config.web_url))
        box.append(site)

        toolbar.set_content(scrolled(box))
        self.nav.push(Adw.NavigationPage(title=name, child=toolbar))

        def loaded(progress: dict) -> None:
            history.remove(history_spinner)
            items = list(reversed(progress.get('history') or []))
            if not items:
                history.add(Adw.ActionRow(title='Nenhuma avaliação concluída ainda.'))
            for item in items:
                completed = model.short_datetime(item.get('completedAt'))
                row = Adw.ActionRow(title=GLib.markup_escape_text(item.get('title') or 'Avaliação'),
                                    subtitle=GLib.markup_escape_text(f'{completed} · resultado {item.get("score") if item.get("score") is not None else "—"}%'))
                if item.get('estimatedCefr'):
                    row.add_suffix(pill(item['estimatedCefr'], 'accent'))
                history.add(row)

        def failed(error: Exception) -> None:
            history.remove(history_spinner)
            history.add(Adw.ActionRow(title='Não foi possível carregar as avaliações.', subtitle=GLib.markup_escape_text(str(error))))

        run_async(lambda: self.client.rpc('get_assessment_progress', p_student_id=record['student_id']), loaded, failed)
