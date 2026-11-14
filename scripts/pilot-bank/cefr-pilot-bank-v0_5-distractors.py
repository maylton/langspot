#!/usr/bin/env python3
"""Builds docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.5.md from v0.4.

Rewrites Reading options following docs/cefr/ITEM_WRITING_GUIDELINES.md
(scripts/pilot-bank/cefr_pilot_bank_v0_5_options.py). Keys keep their letter. Every edit asserts that its
target is found exactly once, so a drifted source fails loudly.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.4.md'
DST = ROOT / 'docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.5.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_5_options import OPTIONS  # noqa: E402

text = SRC.read_text(encoding='utf-8')


def once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    assert count == 1, f'expected 1 occurrence, found {count}: {old[:80]!r}'
    text = text.replace(old, new)


def item_block(item_id: str) -> tuple[int, int]:
    start = text.index(f'**{item_id} — ')
    nxt = re.compile(r'^(?:\d+\. \*\*[A-Z]+-|#)', re.M).search(text, text.index('\n', start))
    return start, nxt.start() if nxt else len(text)


def set_option(item_id: str, letter: str, value: str) -> None:
    global text
    start, end = item_block(item_id)
    block = text[start:end]
    pattern = re.compile(rf'^- \*\*{letter}\.\*\* .+$', re.M)
    assert len(pattern.findall(block)) == 1, f'{item_id}: option {letter} not found'
    text = text[:start] + pattern.sub(lambda _: f'- **{letter}.** {value}', block) + text[end:]


once('# LangSpot CEFR Placement Pilot Bank v0.4 — Authentic Reading Texts',
     '# LangSpot CEFR Placement Pilot Bank v0.5 — Revised Reading Distractors')
once('**Versão:** 0.4 — 0.3 + um texto autêntico de Reading por nível, com fonte, licença e crédito (2026-11-06)  ',
     '**Versão:** 0.5 — 0.4 com as alternativas de Reading reescritas segundo docs/cefr/ITEM_WRITING_GUIDELINES.md (2026-11-07)  ')

for item_id, options in OPTIONS.items():
    assert len(options) == 4, item_id
    for letter, value in zip('ABCD', options):
        set_option(item_id, letter, value)

DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)} ({len(OPTIONS)} items revised)')
