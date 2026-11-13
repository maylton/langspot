#!/usr/bin/env python3
"""Builds docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.8.md from v0.7.

Adds two Reading tasklets per CEFR level (scripts/cefr_pilot_bank_v0_8_texts.py) at the end of each
level in section 21, so every level has six texts. Every edit asserts that its anchor is found once.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.7.md'
DST = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.8.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_8_texts import TASKLETS  # noqa: E402

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
text = SRC.read_text(encoding='utf-8')


def once(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, f'expected 1 occurrence of {old[:70]!r}, found {text.count(old)}'
    text = text.replace(old, new)


def block(tasklet: dict) -> str:
    meta = [
        f"**Topic:** {tasklet['topic']}",
        f"**Genre:** {tasklet['genre']}",
        f"**Audience:** {tasklet['audience']}",
        f"**Input length:** ~{len(tasklet['text'].split())} words",
    ]
    if tasklet.get('source'):
        meta += [f"**Source:** {tasklet['source']}", f"**License:** {tasklet['license']}",
                 f"**Credit:** {tasklet['credit']}", f"**Adaptation:** {tasklet['adaptation']}"]
    lines = [f"### {tasklet['id']} — {tasklet['title']}", *[line + '  ' for line in meta[:-1]], meta[-1], '', '#### Input', '', tasklet['text'], '', '#### Items', '']
    keys = []
    for number, (subskill, difficulty, prompt, options, key) in enumerate(tasklet['items'], start=1):
        assert len(options) == 4 and len(set(options)) == 4, tasklet['id']
        item_id = f"{tasklet['id']}-Q{number}"
        lines += [f'{number}. **{item_id} — {subskill} (difficulty {difficulty}/5)**', '', prompt, '']
        lines += [f'- **{letter}.** {option}' for letter, option in zip('ABCD', options)]
        lines.append('')
        keys.append(f'| `{item_id}` | **{key}** | {subskill} | {difficulty}/5 |')
    lines += ['#### Answer key & metadata', '', '| Item | Key | Subskill | Difficulty |', '|---|:---:|---|:---:|', *keys, '', '---', '', '']
    return '\n'.join(lines)


once('# LangSpot CEFR Placement Pilot Bank v0.7 — Revised Productive Tasks',
     '# LangSpot CEFR Placement Pilot Bank v0.8 — Six Reading Texts per Level')
once('**Versão:** 0.7 — 0.6 com as tarefas de Writing, Speaking e Mediation revisadas segundo docs/cefr/ITEM_WRITING_GUIDELINES.md (2026-11-07)  ',
     '**Versão:** 0.8 — 0.7 + dois textos de Reading por nível (seis por nível), seguindo docs/cefr/ITEM_AUTHORING_PROMPT.md (2026-11-10)  ')

start = text.index('## 21. Additional Reading tasklets')
end = text.index('# 22. Additional Listening tasklets', start)
by_level = {level: [t for t in TASKLETS if t['level'] == level] for level in LEVELS}
assert all(len(by_level[level]) == 2 for level in LEVELS)
for index in reversed(range(len(LEVELS))):
    level = LEVELS[index]
    span = text[start:end]
    if index + 1 < len(LEVELS):
        anchor = f'## {LEVELS[index + 1]} — Expansion'
        assert span.count(anchor) == 1, anchor
        position = start + span.index(anchor)
    else:
        position = end
    added = ''.join(block(t) for t in by_level[level])
    text = text[:position] + added + text[position:]
    end += len(added)

DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)} ({len(TASKLETS)} tasklets added)')
