"""Settings: teacher profile (photo, name, e-mail, WhatsApp, school), account status, lesson defaults,
appearance, desktop options, administration (invite and manage teachers, for the platform owner) and backup."""
from __future__ import annotations

import base64
import json
import urllib.parse
from datetime import date, datetime, timezone
from pathlib import Path

from gi.repository import Adw, Gdk, GdkPixbuf, Gio, GLib, Gtk

from langspot_linux import VERSION, model
from langspot_linux.ui.common import Page, confirm, confirm_typed, copy_text, form_dialog, label, pill, scrolled, vbox
from langspot_linux.worker import run_async

THEMES = [('system', 'Seguir o sistema', Adw.ColorScheme.DEFAULT), ('light', 'Claro', Adw.ColorScheme.FORCE_LIGHT), ('dark', 'Escuro', Adw.ColorScheme.FORCE_DARK)]
AVATAR_SIZE = 320
MAX_AVATAR = 5 * 1024 * 1024


def apply_theme(name: str) -> None:
    scheme = next((value for key, _title, value in THEMES if key == name), Adw.ColorScheme.DEFAULT)
    Adw.StyleManager.get_default().set_color_scheme(scheme)


def avatar_data_url(path: Path) -> str:
    """Square-crop and resize to 320×320 JPEG as a data URL (same as the website's resizeProfileImage)."""
    pixbuf = GdkPixbuf.Pixbuf.new_from_file(str(path))
    pixbuf = pixbuf.apply_embedded_orientation() or pixbuf
    side = min(pixbuf.get_width(), pixbuf.get_height())
    square = pixbuf.new_subpixbuf((pixbuf.get_width() - side) // 2, (pixbuf.get_height() - side) // 2, side, side)
    scaled = square.scale_simple(AVATAR_SIZE, AVATAR_SIZE, GdkPixbuf.InterpType.BILINEAR)
    ok, data = scaled.save_to_bufferv('jpeg', ['quality'], ['80'])
    if not ok:
        raise ValueError('Não foi possível processar a imagem.')
    return 'data:image/jpeg;base64,' + base64.b64encode(data).decode()


def avatar_texture(data_url: str) -> Gdk.Texture | None:
    """Texture for an avatar stored as a data URL (http URLs are left to the initials)."""
    if not data_url or not data_url.startswith('data:') or ',' not in data_url:
        return None
    try:
        return Gdk.Texture.new_from_bytes(GLib.Bytes.new(base64.b64decode(data_url.split(',', 1)[1])))
    except (GLib.Error, ValueError):
        return None


class SettingsPage(Page):
    key = 'settings'
    title = 'Configurações'
    icon = 'emblem-system-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.profile: dict = {}
        self.subscription: dict | None = None
        self.counts = (0, 0, 0)

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        user = self.window.profile['id']

        def work():
            rows = client.select('profiles', select='id,full_name,email,whatsapp_phone,school_name,avatar_url', id=f'eq.{user}')
            try:
                subscription = client.rpc('ensure_teacher_subscription')
            except Exception:
                subscription = None
            counts = (len(client.select('student_records', select='student_id')), len(client.select('lessons', select='id')),
                      len(client.select('materials', select='id')))
            return (rows[0] if rows else {}), subscription, counts

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.profile, self.subscription, self.counts = result
        if isinstance(self.subscription, list):
            self.subscription = self.subscription[0] if self.subscription else None
        self.render()

    @property
    def is_owner(self) -> bool:
        return bool(self.subscription and self.subscription.get('plan') == 'owner' and model.subscription_active(self.subscription))

    def render(self) -> None:
        box = vbox(20)
        box.append(self._profile_group())
        access = model.account_access(self.subscription)
        if access:
            title, description, kind = access
            group = Adw.PreferencesGroup(title='Conta')
            row = Adw.ActionRow(title='Status da conta', subtitle=description, subtitle_lines=3)
            row.add_suffix(pill(title, kind))
            group.add(row)
            box.append(group)
        box.append(self._lessons_group())
        box.append(self._desktop_group())
        if self.is_owner:
            box.append(self._admin_group())
        box.append(self._data_group())
        self.show_content(scrolled(box))

    # ------------------------------------------------------------------ profile
    def _profile_group(self) -> Gtk.Widget:
        group = Adw.PreferencesGroup(title='Perfil do professor', description='Aparece no site, no portal dos alunos e nos relatórios.')
        state = {'avatar': self.profile.get('avatar_url') or ''}
        name = self.profile.get('full_name') or ''
        avatar = Adw.Avatar(size=72, text=name or 'Professor', show_initials=True)
        avatar.set_custom_image(avatar_texture(state['avatar']))
        photo = Adw.ActionRow(title='Foto de perfil', subtitle='JPG, PNG ou WebP de até 5 MB.')
        photo.add_prefix(avatar)
        choose = Gtk.Button(label='Escolher…', valign=Gtk.Align.CENTER)
        remove = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Remover foto', visible=bool(state['avatar']))
        remove.add_css_class('flat')
        photo.add_suffix(choose)
        photo.add_suffix(remove)
        group.add(photo)
        fields = {'full_name': Adw.EntryRow(title='Nome', text=name),
                  'email': Adw.EntryRow(title='E-mail', text=self.profile.get('email') or '', input_purpose=Gtk.InputPurpose.EMAIL),
                  'whatsapp_phone': Adw.EntryRow(title='WhatsApp', text=self.profile.get('whatsapp_phone') or '', input_purpose=Gtk.InputPurpose.PHONE),
                  'school_name': Adw.EntryRow(title='Nome da escola ou marca', text=self.profile.get('school_name') or '')}
        for row in fields.values():
            group.add(row)
        save = Gtk.Button(label='Salvar perfil', halign=Gtk.Align.END, margin_top=10, sensitive=False)
        save.add_css_class('suggested-action')
        save.add_css_class('pill')

        def dirty(*_):
            changed = any(row.get_text().strip() != (self.profile.get(key) or '') for key, row in fields.items()) or state['avatar'] != (self.profile.get('avatar_url') or '')
            save.set_sensitive(changed and bool(fields['full_name'].get_text().strip()))
        for row in fields.values():
            row.connect('changed', dirty)

        def set_avatar(value: str) -> None:
            state['avatar'] = value
            avatar.set_custom_image(avatar_texture(value))
            remove.set_visible(bool(value))
            dirty()

        def pick(*_):
            dialog = Gtk.FileDialog(title='Escolher foto de perfil')
            filters = Gio.ListStore.new(Gtk.FileFilter)
            images = Gtk.FileFilter(name='Imagens')
            images.add_mime_type('image/*')
            filters.append(images)
            dialog.set_filters(filters)

            def finished(dlg, result):
                try:
                    path = Path(dlg.open_finish(result).get_path())
                except GLib.Error:
                    return
                if path.stat().st_size > MAX_AVATAR:
                    self.window.toast('A imagem deve ter no máximo 5 MB.')
                    return
                try:
                    set_avatar(avatar_data_url(path))
                    self.window.toast('Foto pronta. Salve o perfil para aplicar.')
                except (GLib.Error, ValueError):
                    self.window.toast('Não foi possível processar esta imagem.')
            dialog.open(self.window, None, finished)
        choose.connect('clicked', pick)
        remove.connect('clicked', lambda *_: set_avatar(''))

        def submit(*_):
            values = {key: row.get_text().strip() for key, row in fields.items()}
            values['avatar_url'] = state['avatar']
            save.set_sensitive(False)

            def done(_r) -> None:
                self.profile.update(values)
                self.window.profile.update({key: values[key] for key in ('full_name', 'email', 'school_name', 'avatar_url', 'whatsapp_phone')})
                self.window.update_identity()
                self.window.toast('Perfil salvo.')

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                self.window.toast(str(error))
            run_async(lambda: self.client.update('profiles', values, id=f'eq.{self.window.profile["id"]}'), done, failed)
        save.connect('clicked', submit)
        box = vbox(0)
        box.append(group)
        box.append(save)
        return box

    # ------------------------------------------------------------------ preferences
    def _set_pref(self, key: str, value) -> None:
        self.window.app.prefs[key] = value
        self.window.app.save_prefs()

    def _lessons_group(self) -> Gtk.Widget:
        prefs = self.window.app.prefs
        group = Adw.PreferencesGroup(title='Padrões das aulas', description='Valores preenchidos ao agendar ou registrar uma aula.')
        current = prefs.get('defaultDuration', 60)
        options = model.DURATIONS if current in model.DURATIONS else sorted({*model.DURATIONS, current})
        duration = Adw.ComboRow(title='Duração padrão', model=Gtk.StringList.new([f'{value} minutos' for value in options]))
        duration.set_selected(options.index(current))
        duration.connect('notify::selected', lambda row, _p: self._set_pref('defaultDuration', options[row.get_selected()]))
        link = Adw.EntryRow(title='Link padrão da aula online', text=prefs.get('defaultOnlineUrl', ''), input_purpose=Gtk.InputPurpose.URL,
                            show_apply_button=True)
        link.connect('apply', lambda row: (self._set_pref('defaultOnlineUrl', row.get_text().strip()), self.window.toast('Link padrão salvo.')))
        cancel = Adw.SwitchRow(title='Confirmar cancelamentos', subtitle='Evita cancelamentos acidentais na agenda.', active=prefs.get('confirmCancellations', True))
        cancel.connect('notify::active', lambda row, _p: self._set_pref('confirmCancellations', row.get_active()))
        for row in (duration, link, cancel):
            group.add(row)
        return group

    def _desktop_group(self) -> Gtk.Widget:
        prefs = self.window.app.prefs
        group = Adw.PreferencesGroup(title='Aplicativo')
        theme = Adw.ComboRow(title='Tema', model=Gtk.StringList.new([title for _key, title, _value in THEMES]))
        keys = [key for key, _title, _value in THEMES]
        theme.set_selected(keys.index(prefs.get('theme', 'system')) if prefs.get('theme', 'system') in keys else 0)

        def chosen(row, _p) -> None:
            self._set_pref('theme', keys[row.get_selected()])
            apply_theme(keys[row.get_selected()])
        theme.connect('notify::selected', chosen)
        group.add(theme)
        for title, subtitle, action in (('Continuar em segundo plano ao fechar', 'Avisos de provas e notificações com a janela fechada.', 'app.background'),
                                        ('Mostrar as aulas no calendário do sistema', 'GNOME, KDE, Caelestia ou qualquer app que leia arquivos .ics.', 'app.calendar-sync')):
            row = Adw.ActionRow(title=title, subtitle=subtitle)
            switch = Gtk.Switch(valign=Gtk.Align.CENTER, action_name=action)
            row.add_suffix(switch)
            row.set_activatable_widget(switch)
            group.add(row)
        return group

    # ------------------------------------------------------------------ administration
    def _admin_group(self) -> Gtk.Widget:
        group = Adw.PreferencesGroup(title='Administração', description='Convide professores e controle o acesso à plataforma.')
        invite = Adw.ButtonRow(title='Convidar professor', start_icon_name='mail-send-symbolic')
        invite.connect('activated', lambda *_: self.invite_teacher())
        manage = Adw.ButtonRow(title='Gerenciar professores', start_icon_name='system-users-symbolic')
        manage.connect('activated', lambda *_: self.manage_teachers())
        group.add(invite)
        group.add(manage)
        return group

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

    # ------------------------------------------------------------------ data
    def _data_group(self) -> Gtk.Widget:
        students, lessons, materials = self.counts
        group = Adw.PreferencesGroup(title='Dados e segurança', description='Alunos, aulas e materiais ficam no Supabase do LangSpot.')
        summary = Adw.ActionRow(title=f'{students} alunos · {lessons} aulas · {materials} materiais', subtitle=f'LangSpot para Linux {VERSION}')
        export = Gtk.Button(label='Exportar backup', valign=Gtk.Align.CENTER)
        export.connect('clicked', lambda *_: self.export_backup())
        summary.add_suffix(export)
        group.add(summary)
        return group

    def export_backup(self) -> None:
        dialog = Gtk.FileDialog(title='Salvar backup', initial_name=f'langspot-backup-{date.today().isoformat()}.json')

        def finished(dlg, result):
            try:
                target = Path(dlg.save_finish(result).get_path())
            except GLib.Error:
                return
            client = self.client

            def work():
                data = {'exportedAt': datetime.now(timezone.utc).isoformat(), 'profile': self.profile,
                        'students': client.select('student_records', select='*,student:profiles!student_records_student_id_fkey(full_name,email,whatsapp_phone)'),
                        'lessons': client.select('lessons', order='starts_at.asc'), 'materials': client.select('materials'),
                        'assignments': client.select('assignments'), 'payments': client.select('payments'),
                        'settings': {key: self.window.app.prefs.get(key) for key in ('defaultDuration', 'defaultOnlineUrl', 'confirmCancellations', 'theme')}}
                target.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
                return target
            run_async(work, lambda path: self.window.toast(f'Backup salvo em {path.name}.'), lambda error: self.window.toast(str(error)))
        dialog.save(self.window, None, finished)
