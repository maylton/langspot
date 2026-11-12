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
