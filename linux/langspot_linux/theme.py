"""Facts about the user's GTK theme that need no GTK (tested in CI)."""
from __future__ import annotations

import os
import re
from pathlib import Path


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
