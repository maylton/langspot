"""Preference rows bound to a callback, used by the editor's forms."""
from __future__ import annotations

from typing import Callable

from gi.repository import Adw, Gtk


def combo(title: str, pairs: list[tuple[str, str]], current, on_change: Callable[[str], None]) -> Adw.ComboRow:
    keys = [key for key, _label in pairs]
    row = Adw.ComboRow(title=title, model=Gtk.StringList.new([text for _key, text in pairs]))
    row.set_selected(keys.index(current) if current in keys else 0)
    row.connect('notify::selected', lambda item, _p: on_change(keys[item.get_selected()]))
    return row


def spin(title: str, low: float, high: float, step: float, value, on_change: Callable[[float], None], *, digits: int = 0, subtitle: str = '') -> Adw.SpinRow:
    row = Adw.SpinRow.new_with_range(low, high, step)
    row.set_title(title)
    if subtitle:
        row.set_subtitle(subtitle)
    row.set_digits(digits)
    row.set_value(float(value if value is not None else low))
    row.connect('notify::value', lambda item, _p: on_change(item.get_value()))
    return row


def entry(title: str, value: str, on_change: Callable[[str], None]) -> Adw.EntryRow:
    row = Adw.EntryRow(title=title, text=value or '')
    row.connect('changed', lambda item: on_change(item.get_text()))
    return row


def switch(title: str, active: bool, on_change: Callable[[bool], None], subtitle: str = '') -> Adw.SwitchRow:
    row = Adw.SwitchRow(title=title, subtitle=subtitle, active=bool(active))
    row.connect('notify::active', lambda item, _p: on_change(item.get_active()))
    return row
