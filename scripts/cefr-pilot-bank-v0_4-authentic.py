#!/usr/bin/env python3
"""Builds docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.4.md from v0.3.

Adds one authentic Reading tasklet per CEFR level (scripts/cefr_pilot_bank_v0_4_authentic.py) to
section 21, after the existing expansion tasklet of the same level. Every edit asserts that its
anchor is found exactly once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.3.md'
DST = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.4.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_4_authentic import TASKLETS  # noqa: E402

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
text = SRC.read_text(encoding='utf-8')


def once(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, f'expected 1 occurrence of {old[:70]!r}, found {text.count(old)}'
    text = text.replace(old, new)


def block(tasklet: dict) -> str:
    lines = [
        f"### {tasklet['id']} — {tasklet['title']}",
        f"**Topic:** {tasklet['topic']}  ",
        f"**Genre:** {tasklet['genre']}  ",
        f"**Audience:** {tasklet['audience']}  ",
        f"**Input length:** ~{len(tasklet['text'].split())} words  ",
        f"**Source:** {tasklet['source']}  ",
        f"**License:** {tasklet['license']}  ",
        f"**Credit:** {tasklet['credit']}  ",
        f"**Adaptation:** {tasklet['adaptation']}",
        '',
        '#### Input',
        '',
        tasklet['text'],
        '',
        '#### Items',
        '',
    ]
    keys = []
    for number, (subskill, difficulty, prompt, options, key) in enumerate(tasklet['items'], start=1):
        item_id = f"{tasklet['id']}-Q{number}"
        lines += [f'{number}. **{item_id} — {subskill} (difficulty {difficulty}/5)**', '', prompt, '']
        lines += [f'- **{letter}.** {option}' for letter, option in zip('ABCD', options)]
        lines.append('')
        keys.append(f'| `{item_id}` | **{key}** | {subskill} | {difficulty}/5 |')
    lines += ['#### Answer key & metadata', '', '| Item | Key | Subskill | Difficulty |', '|---|:---:|---|:---:|', *keys, '', '---', '', '']
    return '\n'.join(lines)


once('# LangSpot CEFR Placement Pilot Bank v0.3 — Reviewed', '# LangSpot CEFR Placement Pilot Bank v0.4 — Authentic Reading Texts')
once('**Versão:** 0.3 — Reviewed Real Placement Pilot (revisão de 2026-11-06 aplicada sobre a 0.2)  ',
     '**Versão:** 0.4 — 0.3 + um texto autêntico de Reading por nível, com fonte, licença e crédito (2026-11-06)  ')

start = text.index('## 21. Additional Reading tasklets')
end = text.index('# 22. Additional Listening tasklets', start)
by_level = {tasklet['level']: tasklet for tasklet in TASKLETS}
assert sorted(by_level) == LEVELS
# Insert from the last level backwards so earlier offsets stay valid.
for index in reversed(range(len(LEVELS))):
    level = LEVELS[index]
    span = text[start:end]
    if index + 1 < len(LEVELS):
        anchor = f'## {LEVELS[index + 1]} — Expansion'
        assert span.count(anchor) == 1, anchor
        position = start + span.index(anchor)
    else:
        position = end
    text = text[:position] + block(by_level[level]) + text[position:]
    end += len(block(by_level[level]))

DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)}')
