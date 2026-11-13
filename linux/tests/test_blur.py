from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import gi

gi.require_version('Gtk', '4.0')
from langspot_linux.ui import blur  # noqa: E402


class FlatCardsTest(unittest.TestCase):
    def check(self, text: str) -> bool:
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'gtk.css'
            path.write_text(text)
            return blur.theme_flattens_cards(path)

    def test_detects_cards_painted_with_the_window_colour(self) -> None:
        self.assertTrue(self.check('@define-color window_bg_color #121317;\n@define-color card_bg_color #121317;\n'))
        self.assertTrue(self.check('@define-color window_bg_color #121317;\n@define-color card_bg_color @window_bg_color;\n'))
        self.assertFalse(self.check('@define-color window_bg_color #121317;\n@define-color card_bg_color #1e1f25;\n'))
        self.assertFalse(self.check(''))
        self.assertFalse(blur.theme_flattens_cards(Path('/nonexistent/gtk.css')))


if __name__ == '__main__':
    unittest.main()
