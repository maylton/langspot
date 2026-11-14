"""Helpers shared by the results screens."""
from __future__ import annotations

from gi.repository import Adw, Gtk

from langspot_linux import model


STATUS_KIND = {'completed': 'success', 'grading': 'accent', 'submitted': 'accent', 'in_progress': 'warning'}


def _when(value: str | None) -> str:
    return model.short_datetime(value) if value else '—'


def _push(host, title: str, content: Gtk.Widget, header_end: list[Gtk.Widget] | None = None) -> Adw.NavigationPage:
    toolbar = Adw.ToolbarView()
    header = Adw.HeaderBar()
    for widget in header_end or []:
        header.pack_end(widget)
    toolbar.add_top_bar(header)
    toolbar.set_content(content)
    page = Adw.NavigationPage(title=title, child=toolbar)
    host.nav.push(page)
    return page


def _loading() -> Gtk.Widget:
    return Adw.Spinner(halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, width_request=32, height_request=32)
