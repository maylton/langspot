"""Notifications: unread first, mark as read, open the related page."""
from __future__ import annotations

from datetime import datetime, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, empty_state, scrolled, vbox
from langspot_linux.worker import run_async

ICONS = {'lesson': 'x-office-calendar-symbolic', 'assignment': 'checkbox-checked-symbolic', 'quiz': 'dialog-question-symbolic',
         'assessment': 'document-properties-symbolic', 'payment': 'wallet-symbolic', 'mission': 'starred-symbolic',
         'cancellation': 'dialog-warning-symbolic', 'system': 'preferences-system-notifications-symbolic'}
TARGET_PAGES = {'Avaliações': 'review', 'Agenda': 'agenda', 'Aulas': 'agenda', 'Alunos': 'students'}


class NotificationsPage(Page):
    key = 'notifications'
    title = 'Notificações'
    icon = 'preferences-system-notifications-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.items: list[dict] = []
        self.mark_all = Gtk.Button(icon_name='object-select-symbolic', tooltip_text='Marcar todas como lidas')
        self.mark_all.connect('clicked', lambda *_: self.read_all())
        self.header.pack_start(self.mark_all)

    def refresh(self) -> None:
        self.show_loading()
        now = datetime.now(timezone.utc).isoformat()
        run_async(lambda: self.client.select('notifications', scheduled_for=f'lte.{now}', order='scheduled_for.desc', limit='60'),
                  self._loaded, self.show_error)

    def _loaded(self, items: list[dict]) -> None:
        self.items = items
        self.render()

    def render(self) -> None:
        unread = [item for item in self.items if not item.get('read_at')]
        self.window.set_count('notifications', len(unread))
        self.mark_all.set_sensitive(bool(unread))
        box = vbox(18)
        if not self.items:
            box.append(empty_state('preferences-system-notifications-symbolic', 'Tudo em dia', 'Nenhuma notificação por enquanto.'))
        for title, items in (('Não lidas', unread), ('Anteriores', [item for item in self.items if item.get('read_at')])):
            if not items:
                continue
            group = Adw.PreferencesGroup(title=title)
            for item in items:
                group.add(self._row(item))
            box.append(group)
        self.show_content(scrolled(box))

    def _row(self, item: dict) -> Adw.ActionRow:
        unread = not item.get('read_at')
        row = Adw.ActionRow(title=GLib.markup_escape_text(item.get('title') or 'Notificação'),
                            subtitle=GLib.markup_escape_text(item.get('description') or ''), activatable=True, subtitle_lines=3)
        if unread:
            row.add_css_class('ls-unread')
        icon = Gtk.Image(icon_name=ICONS.get(item.get('kind') or '', 'preferences-system-notifications-symbolic'), pixel_size=20)
        if item.get('urgent'):
            icon.add_css_class('error')
        row.add_prefix(icon)
        when = Gtk.Label(label=model.relative_time(item.get('scheduled_for')), valign=Gtk.Align.CENTER)
        when.add_css_class('caption')
        when.add_css_class('dim-label')
        row.add_suffix(when)
        if unread:
            dot = Gtk.Box(valign=Gtk.Align.CENTER)
            dot.add_css_class('ls-dot')
            row.add_suffix(dot)
        row.connect('activated', lambda *_: self.open(item))
        return row

    def open(self, item: dict) -> None:
        if not item.get('read_at'):
            item['read_at'] = datetime.now(timezone.utc).isoformat()
            run_async(lambda: self.client.update('notifications', {'read_at': item['read_at']}, id=f'eq.{item["id"]}'),
                      None, lambda error: self.window.toast(str(error)))
            self.render()
        page = TARGET_PAGES.get(item.get('target') or '')
        if page:
            self.window.open_page(page)

    def read_all(self) -> None:
        unread = [item for item in self.items if not item.get('read_at')]
        if not unread:
            return
        stamp = datetime.now(timezone.utc).isoformat()
        ids = ','.join(item['id'] for item in unread)
        for item in unread:
            item['read_at'] = stamp
        self.render()
        run_async(lambda: self.client.update('notifications', {'read_at': stamp}, id=f'in.({ids})'),
                  lambda _r: self.window.toast('Notificações marcadas como lidas.'), lambda error: self.window.toast(str(error)))
