"""Platform administration in Configurações (owner only): invite teachers and manage their access."""
from __future__ import annotations

import urllib.parse
from datetime import datetime, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import confirm, confirm_typed, copy_text, form_dialog, pill
from langspot_linux.worker import run_async


class TeacherAdminMixin:
    """Platform administration in Configurações (owner only): invite teachers and manage their access."""

    def _invitation_link(self, invitation: dict) -> str:
        query = urllib.parse.urlencode({'token': invitation['token'], 'email': invitation['email']})
        return f'{self.window.app.config.web_url.rstrip("/")}/accept-invite?{query}'

    def invite_teacher(self) -> None:
        dialog, page, save = form_dialog(self.window, 'Convidar professor', 'Gerar convite', width=520)
        group = Adw.PreferencesGroup(description='O link vale por 24 horas. Envie para o professor criar a conta.')
        name = Adw.EntryRow(title='Nome completo')
        email = Adw.EntryRow(title='E-mail', input_purpose=Gtk.InputPurpose.EMAIL)
        group.add(name)
        group.add(email)
        page.add(group)
        pending = Adw.PreferencesGroup(title='Convites pendentes')
        page.add(pending)
        rows: list[Gtk.Widget] = []

        def load() -> None:
            def loaded(invitations: list[dict]) -> None:
                for row in rows:
                    pending.remove(row)
                rows.clear()
                if not invitations:
                    rows.append(Adw.ActionRow(title='Nenhum convite pendente.'))
                for invitation in invitations:
                    expires = model.parse_time(invitation.get('expires_at'))
                    expired = bool(expires and expires < datetime.now(timezone.utc))
                    row = Adw.ActionRow(title=GLib.markup_escape_text(invitation.get('full_name') or invitation['email']),
                                        subtitle=GLib.markup_escape_text(f'{invitation["email"]} · ' + ('expirado' if expired else f'vale até {model.short_datetime(invitation.get("expires_at"))}')))
                    copy = Gtk.Button(icon_name='edit-copy-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Copiar link')
                    copy.add_css_class('flat')
                    copy.connect('clicked', lambda _b, item=invitation: (copy_text(self, self._invitation_link(item)), self.window.toast('Link do convite copiado.')))
                    cancel = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Cancelar convite')
                    cancel.add_css_class('flat')
                    cancel.connect('clicked', lambda _b, item=invitation: confirm(dialog, 'Cancelar este convite?', 'O link enviado deixará de funcionar.',
                                                                                  'Cancelar convite', lambda: delete(item), destructive=True))
                    row.add_suffix(copy)
                    row.add_suffix(cancel)
                    rows.append(row)
                for row in rows:
                    pending.add(row)
            run_async(lambda: self.client.select('teacher_invitations', used='eq.false', order='created_at.desc'), loaded, lambda error: dialog.show_error(str(error)))

        def delete(invitation: dict) -> None:
            run_async(lambda: self.client.delete('teacher_invitations', id=f'eq.{invitation["id"]}'), lambda _r: load(), lambda error: dialog.show_error(str(error)))

        def submit(*_):
            if not name.get_text().strip() or '@' not in email.get_text():
                dialog.show_error('Preencha o nome e o e-mail.')
                return
            save.set_sensitive(False)

            def done(result: dict) -> None:
                save.set_sensitive(True)
                link = result.get('invitation_link') or ''
                if link:
                    copy_text(self, link)
                self.window.toast('Convite criado. O link foi copiado.' if link else 'Convite criado.')
                name.set_text('')
                email.set_text('')
                dialog.show_error('')
                load()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(str(error))
            run_async(lambda: self.client.invoke('invite-teacher', {'email': email.get_text().strip(), 'full_name': name.get_text().strip()},
                                                 origin=self.window.app.config.web_url), done, failed)
        save.connect('clicked', submit)
        load()
        dialog.present(self.window)

    def manage_teachers(self) -> None:
        dialog = Adw.Dialog(title='Professores cadastrados', content_width=640, content_height=620)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        state: dict = {'group': None}

        def invoke(body: dict):
            return self.client.invoke('admin-teachers', body)

        def load() -> None:
            def loaded(result: dict) -> None:
                if state['group']:
                    page.remove(state['group'])
                teachers = result.get('teachers') or []
                group = Adw.PreferencesGroup(description=f'{len(teachers)} professor(es). Controle os acessos da plataforma.')
                state['group'] = group
                for teacher in teachers:
                    group.add(row_for(teacher))
                page.add(group)
            run_async(lambda: invoke({'action': 'list'}), loaded, lambda error: self.window.toast(str(error)))

        def act(body: dict, message: str) -> None:
            def done(_r) -> None:
                self.window.toast(message)
                load()
            run_async(lambda: invoke(body), done, lambda error: self.window.toast(str(error)))

        def row_for(teacher: dict) -> Gtk.Widget:
            active = teacher.get('is_owner') or model.teacher_active(teacher)
            name = teacher.get('full_name') or 'Professor sem nome'
            created = model.short_datetime(teacher.get('created_at'))[:10]
            row = Adw.ActionRow(title=GLib.markup_escape_text(name),
                                subtitle=GLib.markup_escape_text(f'{teacher.get("email") or "E-mail não informado"}\n{teacher.get("school_name") or "Sem escola informada"} · '
                                                                 f'{teacher.get("student_count", 0)} aluno(s) · desde {created}'), subtitle_lines=2)
            row.add_prefix(Adw.Avatar(size=36, text=name, show_initials=True))
            if teacher.get('is_owner'):
                row.add_suffix(pill('Administrador', 'accent'))
                return row
            row.add_suffix(pill('Acesso ativo' if active else 'Acesso suspenso', 'success' if active else 'error'))
            toggle = Gtk.Button(label='Suspender' if active else 'Liberar', valign=Gtk.Align.CENTER)
            if not active:
                toggle.add_css_class('suggested-action')
            toggle.connect('clicked', lambda *_: act({'action': 'set-access', 'teacher_id': teacher['id'], 'enabled': not active},
                                                    f'Acesso de {name} ' + ('suspenso.' if active else 'liberado.')))
            delete = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Excluir professor')
            delete.add_css_class('flat')
            delete.connect('clicked', lambda *_: confirm_typed(dialog, f'Excluir {name}?', 'Esta ação exclui permanentemente o professor, seus alunos e todos os dados vinculados.',
                                                               'EXCLUIR', 'Excluir permanentemente',
                                                               lambda: act({'action': 'delete', 'teacher_id': teacher['id']}, f'{name} foi excluído.')))
            row.add_suffix(toggle)
            row.add_suffix(delete)
            return row

        load()
        dialog.present(self.window)
