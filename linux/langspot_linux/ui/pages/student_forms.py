"""Student forms of the Alunos page: register with a temporary password (and its first-access tutorial), invite by e-mail, edit, delete."""
from __future__ import annotations

from datetime import date, datetime, timedelta

from gi.repository import Adw, GLib, Gtk

from langspot_linux.ui.common import confirm, copy_text, date_row, form_dialog, text_view
from langspot_linux.ui.lesson_forms import duration_row, lesson_defaults, time_rows
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


class StudentFormsMixin:
    """Student forms of the Alunos page: register with a temporary password (and its first-access tutorial), invite by e-mail, edit, delete."""

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
