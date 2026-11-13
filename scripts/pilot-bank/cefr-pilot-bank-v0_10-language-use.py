#!/usr/bin/env python3
"""Builds docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.10.md from v0.9.

Adds ten Language Use items per CEFR level (scripts/cefr_pilot_bank_v0_10_language_use.py) at the end of
each level in section 23, so every level has 25 items, and their rows in the level's answer key.
Every edit asserts that its anchor is found once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.9.md'
DST = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.10.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_10_language_use import ITEMS, options  # noqa: E402

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
text = SRC.read_text(encoding='utf-8')


def once(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, f'expected 1 occurrence of {old[:70]!r}, found {text.count(old)}'
    text = text.replace(old, new)


once('# LangSpot CEFR Placement Pilot Bank v0.9 — Eight Reading Texts per Level',
     '# LangSpot CEFR Placement Pilot Bank v0.10 — 25 Language Use Items per Level')
once('**Versão:** 0.9 — 0.8 + dois textos de Reading por nível (oito por nível), seguindo docs/cefr/ITEM_AUTHORING_PROMPT.md (2026-11-11)  ',
     '**Versão:** 0.10 — 0.9 + dez itens de Language Use por nível (25 por nível), seguindo docs/cefr/ITEM_AUTHORING_PROMPT.md (2026-11-11)  ')

for level in LEVELS:
    items = ITEMS[level]
    assert len(items) == 10, level
    heading = f'## {level} — Additional Language Use Items'
    start = text.index(heading)
    table = text.index('### Answer key & metadata', start)
    blocks = []
    for suffix, subskill, difficulty, prompt, key, distractors, letter in items:
        item_id = f'LU-{level}-{suffix}'
        assert f'`{item_id}`' not in text, item_id
        opts = options(key, distractors, letter)
        assert len(set(opts)) == 4, item_id
        blocks.append('\n'.join([f'{int(suffix)}. **{item_id} — {subskill} (difficulty {difficulty}/5)**', '', prompt, '',
                                 *[f'- **{l}.** {o}' for l, o in zip('ABCD', opts)], '', '']))
    text = text[:table] + ''.join(blocks) + text[table:]
    # Key rows go after the level's last row (LU-<level>-015).
    last_row_start = text.index(f'| `LU-{level}-015` |')
    last_row_end = text.index('\n', last_row_start)
    rows = ''.join(f'\n| `LU-{level}-{s}` | **{l}** | {sub} | {d}/5 |' for s, sub, d, _p, _k, _ds, l in items)
    text = text[:last_row_end] + rows + text[last_row_end:]

DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)} (60 Language Use items added)')
