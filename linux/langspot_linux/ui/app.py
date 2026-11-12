"""Application: session restore, background refresh, desktop notifications."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import gi

gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Adw, Gdk, Gio, GLib, Gtk  # noqa: E402

from langspot_linux import APP_ID, VERSION, calendar_sync, model, session_store  # noqa: E402
from langspot_linux.config import ConfigError, config_path, load_config  # noqa: E402
from langspot_linux.supabase import AuthError, Session, SupabaseClient  # noqa: E402
from langspot_linux.ui.common import action, open_uri  # noqa: E402
from langspot_linux.worker import run_async  # noqa: E402

POLL_SECONDS = 60
CALENDAR_EVERY = 5  # polls between calendar file refreshes
DATA_DIR = Path(__file__).resolve().parent.parent.parent / 'data'


class LangSpotApp(Adw.Application):
    def __init__(self) -> None:
        super().__init__(application_id=APP_ID, flags=Gio.ApplicationFlags.DEFAULT_FLAGS)
        self.window = None
        self.client: SupabaseClient | None = None
        self.config = None
        self.profile: dict | None = None
        self._seen_notifications: set[str] | None = None
        self._seen_attempts: set[str] | None = None
        self._poll_source = 0
        self._held = False
        self._polls = 0
        self.prefs = self._load_prefs()

    # ------------------------------------------------------------------ setup
    def do_startup(self) -> None:
        Adw.Application.do_startup(self)
        GLib.set_application_name('LangSpot')
        provider = Gtk.CssProvider()
        provider.load_from_path(str(Path(__file__).with_name('style.css')))
        Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
        icons = DATA_DIR / 'icons'
        if icons.is_dir():
            Gtk.IconTheme.get_for_display(Gdk.Display.get_default()).add_search_path(str(icons))
        Gtk.Window.set_default_icon_name(APP_ID)

        self.add_action(action('open-web', lambda *_: self.window and open_uri(self.window, self.config.web_url)))
        self.add_action(action('logout', lambda *_: self.logout()))
        self.add_action(action('about', lambda *_: self.about()))
        self.add_action(action('open-page', lambda _a, value: self.open_page(value.get_string()), 's'))
        background = Gio.SimpleAction.new_stateful('background', None, GLib.Variant.new_boolean(self.prefs.get('background', False)))
        background.connect('activate', self._toggle_background)
        self.add_action(background)
        calendar = Gio.SimpleAction.new_stateful('calendar-sync', None, GLib.Variant.new_boolean(self.prefs.get('calendarSync', False)))
        calendar.connect('activate', self._toggle_calendar)
        self.add_action(calendar)
        self.set_accels_for_action('app.quit', ['<Control>q'])
        self.add_action(action('quit', lambda *_: self.quit()))
        self.set_accels_for_action('win.refresh', ['F5', '<Control>r'])

    def do_activate(self) -> None:
        if self.window:
            self.window.present()
            return
        from langspot_linux.ui.window import MainWindow

        try:
            self.config = load_config()
        except ConfigError as error:
            dialog = Adw.AlertDialog(heading='LangSpot não configurado', body=str(error))
            dialog.add_response('close', 'Fechar')
            window = Adw.ApplicationWindow(application=self, default_width=480, default_height=320)
            window.present()
            dialog.connect('response', lambda *_: self.quit())
            dialog.present(window)
            return
        self.client = SupabaseClient(self.config.url, self.config.anon_key, on_session=self._store_session)
        self.window = MainWindow(self)
        refresh = Gio.SimpleAction.new('refresh', None)
        refresh.connect('activate', lambda *_: self._refresh_current())
        self.window.add_action(refresh)
        self._apply_background()
        self.window.present()
        self._restore()

    # ------------------------------------------------------------------ session
    @staticmethod
    def _store_session(session: Session | None) -> None:
        if session:
            session_store.save_refresh_token(session.refresh_token)
        else:
            session_store.clear_refresh_token()

    def _restore(self) -> None:
        token = session_store.load_refresh_token()
        if not token:
            self.window.show_login()
            return

        def work():
            session = self.client.refresh(token)
            return self.load_profile(session)

        def failed(error: Exception) -> None:
            if isinstance(error, AuthError):
                session_store.clear_refresh_token()
                self.window.show_login()
            else:
                self.window.show_login(str(error))

        run_async(work, self.signed_in, failed)

    def load_profile(self, session: Session) -> dict:
        rows = self.client.select('profiles', select='id,role,full_name,email', id=f'eq.{session.user_id}')
        profile = rows[0] if rows else {}
        if profile.get('role') not in ('teacher', 'admin'):
            self.client.sign_out()
            raise AuthError('Esta versão do LangSpot é para professores. Alunos usam o site ou o app do celular.')
        return profile

    def signed_in(self, profile: dict) -> None:
        self.profile = profile
        self._seen_notifications = None
        self._seen_attempts = None
        self.window.show_main(profile)
        self.poll()
        if self.prefs.get('calendarSync'):
            self._sync_calendar(connect=True)
        if not self._poll_source:
            self._poll_source = GLib.timeout_add_seconds(POLL_SECONDS, self._poll_tick)

    def logout(self) -> None:
        if self._poll_source:
            GLib.source_remove(self._poll_source)
            self._poll_source = 0
        client = self.client
        run_async(client.sign_out, lambda _r: None, lambda _e: None)
        session_store.clear_refresh_token()
        self.profile = None
        if self.prefs.get('calendarSync'):
            # Another teacher may sign in next: leave the calendar empty, not with these lessons.
            run_async(lambda: calendar_sync.write_ics([]), lambda _r: None, lambda _e: None)
        self.window.show_login('Você saiu da conta.', error=False)

    def open_page(self, key: str) -> None:
        if self.window:
            self.window.present()
            self.window.open_page(key)

    def _refresh_current(self) -> None:
        if self.window and self.window.split:
            page = self.window.content.get_child()
            if hasattr(page, 'refresh'):
                page.refresh()

    # ------------------------------------------------------------------ background refresh
    def _poll_tick(self) -> bool:
        if self.profile:
            self.poll()
            self._polls += 1
            if self.prefs.get('calendarSync') and self._polls % CALENDAR_EVERY == 0:
                self._sync_calendar()
        return GLib.SOURCE_CONTINUE

    def poll(self) -> None:
        client = self.client
        now = datetime.now(timezone.utc).isoformat()

        def work():
            notifications = client.select('notifications', select='id,title,description,target,read_at,scheduled_for',
                                          read_at='is.null', scheduled_for=f'lte.{now}', order='scheduled_for.desc', limit='50')
            active = client.rpc('list_active_teacher_attempts') or []
            queue = client.rpc('list_assessment_review_queue') or {}
            submitted = client.select('assignments', select='id', status='eq.submitted', assignment_type='neq.interactive')
            return notifications, active, queue, submitted

        run_async(work, self._polled, lambda _error: None)

    def _polled(self, result) -> None:
        notifications, active, queue, submitted = result
        if not self.window or not self.window.split:
            return
        self.window.set_count('notifications', len(notifications))
        self.window.set_count('live', len(active))
        self.window.set_count('review', len(queue.get('items') or []) + len(queue.get('readyToFinalize') or []))
        self.window.set_count('tasks', len(submitted))
        if self._seen_notifications is not None:
            for item in notifications:
                if item['id'] not in self._seen_notifications:
                    self._notify(f'notification-{item["id"]}', item.get('title') or 'LangSpot', item.get('description') or '', 'notifications')
        if self._seen_attempts is not None:
            for attempt in active:
                if attempt['attemptId'] not in self._seen_attempts:
                    self._notify(f'attempt-{attempt["attemptId"]}', f'{attempt.get("studentName") or "Um aluno"} começou uma prova',
                                 attempt.get('assessmentTitle') or '', 'live')
        self._seen_notifications = {item['id'] for item in notifications}
        self._seen_attempts = {attempt['attemptId'] for attempt in active}

    def _notify(self, notification_id: str, title: str, body: str, page: str) -> None:
        notification = Gio.Notification.new(title)
        notification.set_body(body)
        notification.set_icon(Gio.ThemedIcon.new(APP_ID))
        notification.set_default_action_and_target_value('app.open-page', GLib.Variant.new_string(page))
        self.send_notification(notification_id, notification)

    # ------------------------------------------------------------------ desktop calendar
    def _fetch_lessons(self) -> list[model.Lesson]:
        from langspot_linux.ui.common import student_names
        since = (datetime.now(timezone.utc) - timedelta(days=calendar_sync.PAST_DAYS)).isoformat()
        names = {key: value['name'] for key, value in student_names(self.client).items()}
        return model.lessons_from_rows(self.client.select('lessons', starts_at=f'gte.{since}', status='neq.cancelled', order='starts_at.asc'), names)

    def _sync_calendar(self, connect: bool = False, announce: bool = False) -> None:
        """Refresh the calendar file; with connect=True also (re)attach GNOME/KDE."""
        instance = self.prefs.get('akonadiResource')

        def work():
            lessons = self._fetch_lessons()
            if connect:
                return calendar_sync.enable(lessons, instance)
            calendar_sync.write_ics(lessons)
            return None

        def done(result) -> None:
            if result is None:
                return
            connected, akonadi = result
            if akonadi != instance:
                self.prefs['akonadiResource'] = akonadi
                self._save_prefs()
            if announce and self.window:
                where = ', '.join(connected)
                self.window.toast(f'Aulas no calendário do sistema ({where}).' if connected else
                                  f'Calendário salvo em {calendar_sync.ics_path()}. Adicione-o ao seu app de calendário.')

        def failed(error: Exception) -> None:
            if announce and self.window:
                self.window.toast(f'Não foi possível sincronizar o calendário: {error}')
        run_async(work, done, failed)

    def calendar_lessons(self, lessons: list[model.Lesson]) -> None:
        """Called by the agenda after it loads: keeps the desktop calendar in step right away."""
        if self.prefs.get('calendarSync') and self.profile:
            run_async(lambda: calendar_sync.write_ics(lessons), lambda _r: None, lambda _e: None)

    def _toggle_calendar(self, item: Gio.SimpleAction, _param) -> None:
        enabled = not item.get_state().get_boolean()
        item.set_state(GLib.Variant.new_boolean(enabled))
        self.prefs['calendarSync'] = enabled
        self._save_prefs()
        if enabled:
            if self.profile:
                self._sync_calendar(connect=True, announce=True)
            return
        instance = self.prefs.pop('akonadiResource', None)
        self._save_prefs()

        def done(_r) -> None:
            if self.window:
                self.window.toast('As aulas saíram do calendário do sistema.')
        run_async(lambda: calendar_sync.disable(instance), done, lambda error: self.window and self.window.toast(str(error)))

    # ------------------------------------------------------------------ preferences
    @staticmethod
    def _prefs_path() -> Path:
        return config_path().with_name('prefs.json')

    def _load_prefs(self) -> dict:
        try:
            return json.loads(self._prefs_path().read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return {}

    def _save_prefs(self) -> None:
        path = self._prefs_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.prefs), encoding='utf-8')

    def _toggle_background(self, item: Gio.SimpleAction, _param) -> None:
        enabled = not item.get_state().get_boolean()
        item.set_state(GLib.Variant.new_boolean(enabled))
        self.prefs['background'] = enabled
        self._save_prefs()
        self._apply_background()
        if self.window:
            self.window.toast('O LangSpot continua avisando você com a janela fechada.' if enabled else 'Fechar a janela encerra o LangSpot.')

    def _apply_background(self) -> None:
        enabled = bool(self.prefs.get('background'))
        if self.window:
            self.window.set_hide_on_close(enabled)
        if enabled and not self._held:
            self.hold()
            self._held = True
        elif not enabled and self._held:
            self.release()
            self._held = False

    def about(self) -> None:
        dialog = Adw.AboutDialog(application_name='LangSpot', application_icon=APP_ID, version=VERSION,
                                 developer_name='Maylton Fernandes', website=self.config.web_url if self.config else '',
                                 comments='Aplicativo nativo do LangSpot para professores no Linux: agenda, alunos, tarefas, correção, '
                                          'provas ao vivo, materiais, financeiro, relatórios e notificações.',
                                 license_type=Gtk.License.CUSTOM, license='Uso interno do LangSpot.')
        dialog.present(self.window)


def main() -> int:
    return LangSpotApp().run(sys.argv)
