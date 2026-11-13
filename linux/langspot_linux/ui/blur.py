"""Compositor blur behind the window, as Harmonia Player does on Hyprland (Caelestia).

Compositors with ext-background-effect-v1 (Hyprland 0.56) blur behind a window
where GTK 4.24 asks them to, and GTK asks from CSS backdrop-filter. The request
sits on an empty layer under the whole window (window.py), so GTK does not redraw
everything whenever something in the window changes; the window then turns
translucent and its surfaces get a tint of their own colours.

Elsewhere (no Wayland, older GTK, a compositor without the protocol) nothing
changes: the option stays off and unavailable in Configurações.
"""
from __future__ import annotations

import ctypes
import ctypes.util
import logging
import os
import re
from pathlib import Path
from ctypes import CFUNCTYPE, POINTER, Structure, byref, c_char_p, c_int, c_uint32, c_void_p

import gi

gi.require_version('Gdk', '4.0')
gi.require_version('Gtk', '4.0')
from gi.repository import Gdk, Gtk  # noqa: E402

LOGGER = logging.getLogger(__name__)
BACKGROUND_EFFECT = b'ext_background_effect_manager_v1'
CSS_CLASS = 'ls-blur'
LAYER_CLASS = 'ls-blur-layer'
# Below 10 px GTK keeps the blur to itself instead of handing it to the compositor.
CSS = '''
window.ls-blur { background: transparent; }
window.ls-blur .ls-blur-layer { backdrop-filter: blur(24px); }
window.ls-blur .ls-side, window.ls-blur .sidebar-pane { background: alpha(@sidebar_bg_color, .74); }
window.ls-blur .ls-main { background: alpha(@window_bg_color, .70); }
window.ls-blur .content-pane, window.ls-blur toolbarview, window.ls-blur navigation-view,
window.ls-blur navigation-view > *, window.ls-blur .navigation-sidebar { background: transparent; }
window.ls-blur headerbar { background: transparent; box-shadow: none; }
window.ls-blur list.boxed-list, window.ls-blur .card { background-color: alpha(@window_fg_color, .07); }
window.ls-blur list.boxed-list > row { background-color: transparent; }
window.ls-blur list.boxed-list > row:hover { background-color: alpha(@window_fg_color, .05); }
'''

# Cards a step lighter than the window, for user themes that paint them with the window colour.
FLAT_CARDS_CSS = '''
list.boxed-list, .card { background-color: mix(@window_bg_color, @window_fg_color, .07); box-shadow: 0 0 0 1px alpha(@window_fg_color, .07); }
list.boxed-list > row { background-color: transparent; }
list.boxed-list > row:hover { background-color: alpha(@window_fg_color, .04); }
'''


def theme_flattens_cards(path: Path | None = None) -> bool:
    """Whether the user's GTK 4 theme (e.g. Caelestia's generated gtk.css) gives cards the window's colour."""
    path = path or Path(os.environ.get('XDG_CONFIG_HOME') or Path.home() / '.config') / 'gtk-4.0' / 'gtk.css'
    try:
        text = path.read_text(encoding='utf-8')
    except OSError:
        return False
    colors = dict(re.findall(r'@define-color\s+(\w+)\s+([^;]+);', text))
    card, window = colors.get('card_bg_color', '').strip().lower(), colors.get('window_bg_color', '').strip().lower()
    return bool(card) and (card == window or card == '@window_bg_color')


def lift_flat_cards(display: Gdk.Display) -> bool:
    """Only in LangSpot: lighter cards when the theme makes them invisible. Other apps keep the theme as it is."""
    if not theme_flattens_cards():
        return False
    provider = Gtk.CssProvider()
    provider.load_from_string(FLAT_CARDS_CSS)
    Gtk.StyleContext.add_provider_for_display(display, provider, Gtk.STYLE_PROVIDER_PRIORITY_USER + 1)
    return True


class _WlMessage(Structure):
    _fields_ = (('name', c_char_p), ('signature', c_char_p), ('types', POINTER(c_void_p)))


class _WlInterface(Structure):
    _fields_ = (('name', c_char_p), ('version', c_int), ('method_count', c_int), ('methods', POINTER(_WlMessage)),
                ('event_count', c_int), ('events', POINTER(_WlMessage)))


_GLOBAL = CFUNCTYPE(None, c_void_p, c_void_p, c_uint32, c_char_p, c_uint32)
_GLOBAL_REMOVE = CFUNCTYPE(None, c_void_p, c_void_p, c_uint32)


class _RegistryListener(Structure):
    _fields_ = (('global_', _GLOBAL), ('global_remove', _GLOBAL_REMOVE))


def wayland_globals() -> set[bytes]:
    """Names of the protocols the Wayland compositor announces, on a short connection of our own."""
    if not os.environ.get('WAYLAND_DISPLAY'):
        return set()
    lib = ctypes.CDLL(ctypes.util.find_library('wayland-client') or 'libwayland-client.so.0')
    lib.wl_display_connect.restype = c_void_p
    lib.wl_display_connect.argtypes = (c_char_p,)
    lib.wl_proxy_marshal_flags.restype = c_void_p
    lib.wl_proxy_get_version.restype = c_uint32
    lib.wl_proxy_get_version.argtypes = (c_void_p,)
    display = lib.wl_display_connect(None)
    if not display:
        return set()
    names: set[bytes] = set()
    try:
        registry_interface = ctypes.addressof(_WlInterface.in_dll(lib, 'wl_registry_interface'))
        version = lib.wl_proxy_get_version(c_void_p(display))
        # wl_display.get_registry is request 1 of wl_display.
        registry = lib.wl_proxy_marshal_flags(c_void_p(display), c_uint32(1), c_void_p(registry_interface), c_uint32(version), c_uint32(0),
                                              c_void_p(None))
        listener = _RegistryListener(_GLOBAL(lambda _data, _registry, _name, interface, _version: names.add(interface)),
                                     _GLOBAL_REMOVE(lambda *_: None))
        lib.wl_proxy_add_listener(c_void_p(registry), byref(listener), None)
        lib.wl_display_roundtrip(c_void_p(display))
        lib.wl_proxy_destroy(c_void_p(registry))
    finally:
        lib.wl_display_disconnect(c_void_p(display))
    return names


def _gtk_knows_backdrop_filter() -> bool:
    """GTK before 4.24 rejects the property and asks for no blur."""
    errors = []
    provider = Gtk.CssProvider()
    provider.connect('parsing-error', lambda *args: errors.append(args))
    provider.load_from_string('window { backdrop-filter: blur(1px); }')
    return not errors


_AVAILABLE: bool | None = None


def available() -> bool:
    """Whether the compositor will blur behind the window (cached for the session)."""
    global _AVAILABLE
    if _AVAILABLE is None:
        try:
            display = Gdk.Display.get_default()
            _AVAILABLE = (display is not None and 'Wayland' in type(display).__name__ and _gtk_knows_backdrop_filter()
                          and BACKGROUND_EFFECT in wayland_globals())
        except (OSError, ValueError, AttributeError):
            LOGGER.debug('ext-background-effect indisponível', exc_info=True)
            _AVAILABLE = False
    return _AVAILABLE


_PROVIDER: Gtk.CssProvider | None = None


def apply(window: Gtk.Window, enabled: bool) -> bool:
    """Turn the blur on or off for the window; True when it is on."""
    global _PROVIDER
    on = bool(enabled) and available()
    if on and _PROVIDER is None:
        _PROVIDER = Gtk.CssProvider()
        _PROVIDER.load_from_string(CSS)
        # Above the user's GTK theme (Caelestia's gtk.css), which paints the window colour.
        Gtk.StyleContext.add_provider_for_display(window.get_display(), _PROVIDER, Gtk.STYLE_PROVIDER_PRIORITY_USER + 1)
    if on:
        window.add_css_class(CSS_CLASS)
    else:
        window.remove_css_class(CSS_CLASS)
    return on
