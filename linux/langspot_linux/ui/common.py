"""Small helpers shared by the pages."""
from __future__ import annotations

import html
import re
from typing import Callable

from gi.repository import Adw, Gio, GLib, Gtk


def markup(text: str | None) -> str:
    """Plain text with **bold** (as written in the item bank) → Pango markup."""
    escaped = html.escape(text or '', quote=False)
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', escaped)


def label(text: str = '', *, css: tuple[str, ...] = (), wrap: bool = True, xalign: float = 0, use_markup: bool = False,
          selectable: bool = False) -> Gtk.Label:
    widget = Gtk.Label(xalign=xalign, wrap=wrap, selectable=selectable)
    widget.set_wrap_mode(2)  # Pango.WrapMode.WORD_CHAR
    if use_markup:
        widget.set_markup(text)
    else:
        widget.set_text(text)
    for name in css:
        widget.add_css_class(name)
    return widget


def pill(text: str, kind: str = '') -> Gtk.Label:
    widget = Gtk.Label(label=text, valign=Gtk.Align.CENTER)
    widget.add_css_class('ls-pill')
    if kind:
        widget.add_css_class(kind)
    return widget


def open_uri(parent: Gtk.Widget, uri: str) -> None:
    Gtk.UriLauncher.new(uri).launch(parent.get_root(), None, None, None)


def copy_text(widget: Gtk.Widget, text: str) -> None:
    widget.get_clipboard().set(text)


def confirm(parent: Gtk.Widget, heading: str, body: str, action: str, on_confirm: Callable[[], None], *,
            destructive: bool = False) -> None:
    dialog = Adw.AlertDialog(heading=heading, body=body)
    dialog.add_response('cancel', 'Cancelar')
    dialog.add_response('ok', action)
    dialog.set_response_appearance('ok', Adw.ResponseAppearance.DESTRUCTIVE if destructive else Adw.ResponseAppearance.SUGGESTED)
    dialog.set_default_response('cancel')
    dialog.connect('response', lambda _dialog, response: on_confirm() if response == 'ok' else None)
    dialog.present(parent)


def confirm_typed(parent: Gtk.Widget, heading: str, body: str, expected: str, action: str, on_confirm: Callable[[], None]) -> None:
    """Destructive confirmation that needs the user to type `expected` (the website's confirmByTyping)."""
    dialog = Adw.AlertDialog(heading=heading, body=f'{body}\n\nDigite {expected} para confirmar.')
    entry = Gtk.Entry(placeholder_text=expected)
    dialog.set_extra_child(entry)
    dialog.add_response('cancel', 'Cancelar')
    dialog.add_response('ok', action)
    dialog.set_response_appearance('ok', Adw.ResponseAppearance.DESTRUCTIVE)
    dialog.set_response_enabled('ok', False)
    dialog.set_default_response('cancel')
    entry.connect('changed', lambda item: dialog.set_response_enabled('ok', item.get_text().strip() == expected))
    dialog.connect('response', lambda _dialog, response: on_confirm() if response == 'ok' and entry.get_text().strip() == expected else None)
    dialog.present(parent)


def ask_long_text(parent: Gtk.Widget, heading: str, body: str, initial: str, action: str, on_text: Callable[[str], None]) -> None:
    """Alert with a multi-line text box (comments); calls on_text with the stripped text when not empty."""
    dialog = Adw.AlertDialog(heading=heading, body=body)
    view = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=8, bottom_margin=8, left_margin=10, right_margin=10)
    view.get_buffer().set_text(initial)
    frame = Gtk.ScrolledWindow(child=view, min_content_height=110, max_content_height=220, propagate_natural_height=True, width_request=360)
    frame.add_css_class('card')
    dialog.set_extra_child(frame)
    dialog.add_response('cancel', 'Cancelar')
    dialog.add_response('ok', action)
    dialog.set_response_appearance('ok', Adw.ResponseAppearance.SUGGESTED)
    dialog.set_default_response('ok')

    def response(_dialog, value):
        buffer = view.get_buffer()
        text = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False).strip()
        if value == 'ok' and text:
            on_text(text)
    dialog.connect('response', response)
    dialog.present(parent)
    view.grab_focus()


def ask_text(parent: Gtk.Widget, heading: str, body: str, placeholder: str, action: str, on_text: Callable[[str], None]) -> None:
    dialog = Adw.AlertDialog(heading=heading, body=body)
    entry = Gtk.Entry(placeholder_text=placeholder, activates_default=True)
    dialog.set_extra_child(entry)
    dialog.add_response('cancel', 'Cancelar')
    dialog.add_response('ok', action)
    dialog.set_response_appearance('ok', Adw.ResponseAppearance.DESTRUCTIVE)
    dialog.set_default_response('ok')

    def response(_dialog, value):
        if value == 'ok' and entry.get_text().strip():
            on_text(entry.get_text().strip())
    dialog.connect('response', response)
    dialog.present(parent)


class Page(Adw.Bin):
    """A sidebar destination: header bar with title and refresh, a navigation view for details."""

    title = ''
    icon = ''

    def __init__(self, window) -> None:
        super().__init__()
        self.window = window
        self.client = window.client
        self.nav = Adw.NavigationView()
        self.set_child(self.nav)
        self.toolbar = Adw.ToolbarView()
        self.header = Adw.HeaderBar()
        self.refresh_button = Gtk.Button(icon_name='view-refresh-symbolic', tooltip_text='Atualizar')
        self.refresh_button.connect('clicked', lambda *_: self.refresh())
        self.header.pack_end(self.refresh_button)
        self.toolbar.add_top_bar(self.header)
        self.stack = Gtk.Stack(transition_type=Gtk.StackTransitionType.CROSSFADE)
        spinner = Adw.Spinner(halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, width_request=32, height_request=32)
        self.stack.add_named(spinner, 'loading')
        self.error_page = Adw.StatusPage(icon_name='network-error-symbolic', title='Não foi possível carregar')
        retry = Gtk.Button(label='Tentar de novo', halign=Gtk.Align.CENTER)
        retry.add_css_class('pill')
        retry.connect('clicked', lambda *_: self.refresh())
        self.error_page.set_child(retry)
        self.stack.add_named(self.error_page, 'error')
        self.toolbar.set_content(self.stack)
        self.root_page = Adw.NavigationPage(title=self.title, tag='root', child=self.toolbar)
        self.nav.add(self.root_page)
        self.loaded = False

    # pages override
    def refresh(self) -> None:
        raise NotImplementedError

    def show_content(self, widget: Gtk.Widget) -> None:
        old = self.stack.get_child_by_name('content')
        if old:
            self.stack.remove(old)
        self.stack.add_named(widget, 'content')
        self.stack.set_visible_child_name('content')
        self.loaded = True

    def show_loading(self) -> None:
        if not self.loaded:
            self.stack.set_visible_child_name('loading')

    def show_error(self, error: Exception) -> None:
        if self.loaded:
            self.window.toast(str(error))
            return
        self.error_page.set_description(str(error))
        self.stack.set_visible_child_name('error')

    def on_shown(self) -> None:
        """Called when the page becomes visible."""
        if not self.loaded:
            self.refresh()


def scrolled(child: Gtk.Widget, *, maximum: int = 820) -> Gtk.ScrolledWindow:
    clamp = Adw.Clamp(maximum_size=maximum, tightening_threshold=maximum - 120, child=child)
    clamp.set_margin_top(18)
    clamp.set_margin_bottom(24)
    clamp.set_margin_start(12)
    clamp.set_margin_end(12)
    return Gtk.ScrolledWindow(child=clamp, hscrollbar_policy=Gtk.PolicyType.NEVER, vexpand=True)


def vbox(spacing: int = 18) -> Gtk.Box:
    return Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=spacing)


def empty_state(icon: str, title: str, description: str = '') -> Adw.StatusPage:
    page = Adw.StatusPage(icon_name=icon, title=title, description=description)
    page.add_css_class('compact')
    return page


def text_card(title: str, body: str, *, css: str = '') -> Gtk.Widget:
    box = vbox(6)
    box.add_css_class('card')
    box.add_css_class('ls-card')
    if css:
        box.add_css_class(css)
    if title:
        box.append(label(title, css=('caption-heading', 'dim-label')))
    box.append(label(markup(body), use_markup=True, selectable=True))
    return box


def idle(callback: Callable[[], None]) -> None:
    GLib.idle_add(lambda: (callback(), GLib.SOURCE_REMOVE)[1])


def action(name: str, callback: Callable[..., None], parameter: str | None = None) -> Gio.SimpleAction:
    item = Gio.SimpleAction.new(name, GLib.VariantType.new(parameter) if parameter else None)
    item.connect('activate', callback)
    return item


def date_row(title: str, initial, on_change: Callable | None = None):
    """Adw.ActionRow with a calendar popover. Returns (row, getter) where getter() → datetime.date."""
    from datetime import date as _date

    from langspot_linux import model

    chosen = {'day': initial}
    row = Adw.ActionRow(title=title, subtitle=model.day_label(initial) if abs((initial - _date.today()).days) < 7 else initial.strftime('%d/%m/%Y'))
    calendar = Gtk.Calendar()
    calendar.select_day(GLib.DateTime.new_local(initial.year, initial.month, initial.day, 0, 0, 0))
    popover = Gtk.Popover(child=calendar)
    button = Gtk.MenuButton(icon_name='x-office-calendar-symbolic', popover=popover, valign=Gtk.Align.CENTER, tooltip_text='Escolher a data')
    button.add_css_class('flat')

    def picked(cal) -> None:
        value = cal.get_date()
        chosen['day'] = _date(value.get_year(), value.get_month(), value.get_day_of_month())
        day = chosen['day']
        row.set_subtitle(model.day_label(day) if abs((day - _date.today()).days) < 7 else day.strftime('%d/%m/%Y'))
        popover.popdown()
        if on_change:
            on_change(day)
    calendar.connect('day-selected', picked)
    row.add_suffix(button)
    row.set_activatable_widget(button)
    return row, lambda: chosen['day']


def student_names(client) -> dict[str, dict]:
    """student_id → {'name', 'phone', 'level', 'goal', 'skills'} for the teacher's students."""
    rows = client.select('student_records', select='student_id,level,goal,skills,notes,student:profiles!student_records_student_id_fkey(full_name,email,whatsapp_phone)')
    result = {}
    for row in rows:
        profile = row.get('student') or {}
        result[row['student_id']] = {'name': profile.get('full_name') or 'Aluno', 'email': profile.get('email') or '',
                                     'phone': ''.join(ch for ch in (profile.get('whatsapp_phone') or '') if ch.isdigit()),
                                     'level': row.get('level') or '', 'goal': row.get('goal') or '', 'skills': row.get('skills') or {}, 'notes': row.get('notes') or ''}
    return result


def form_dialog(parent: Gtk.Widget, title: str, action_label: str, *, width: int = 480):
    """Dialog with Cancel / action buttons. Returns (dialog, page, action_button, error_label)."""
    dialog = Adw.Dialog(title=title, content_width=width)
    toolbar = Adw.ToolbarView()
    header = Adw.HeaderBar(show_end_title_buttons=False, show_start_title_buttons=False)
    cancel = Gtk.Button(label='Cancelar')
    cancel.connect('clicked', lambda *_: dialog.close())
    header.pack_start(cancel)
    action_button = Gtk.Button(label=action_label)
    action_button.add_css_class('suggested-action')
    header.pack_end(action_button)
    toolbar.add_top_bar(header)
    page = Adw.PreferencesPage()
    error = label('', css=('error',))
    error.set_visible(False)
    error.set_margin_start(18)
    error.set_margin_end(18)
    error.set_margin_bottom(12)
    box = vbox(0)
    box.append(page)
    box.append(error)
    page.set_vexpand(True)
    toolbar.set_content(box)
    dialog.set_child(toolbar)

    def show_error(message: str) -> None:
        error.set_text(message)
        error.set_visible(bool(message))
        action_button.set_sensitive(True)
    dialog.show_error = show_error  # type: ignore[attr-defined]
    return dialog, page, action_button


def text_view(text: str = '', height: int = 110) -> tuple[Gtk.Frame, Callable[[], str]]:
    view = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=10, bottom_margin=10, left_margin=12, right_margin=12, height_request=height)
    view.get_buffer().set_text(text)
    frame = Gtk.Frame(child=view)
    frame.add_css_class('card')

    def value() -> str:
        buffer = view.get_buffer()
        return buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False).strip()
    return frame, value
