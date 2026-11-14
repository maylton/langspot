#!/usr/bin/env python3
"""Builds docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.7.md from v0.6.

Applies scripts/pilot-bank/cefr_pilot_bank_v0_7_productive.py to Writing, Speaking and Mediation tasks. Handles
both task formats of the bank: the original sections (prompt as free text after the metadata) and the
v0.2 expansion (prompt on a **Prompt:** / **Task:** line). Original Mediation tasks get an explicit
**Task:** marker between the source and the instruction. Every edit asserts a single match.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.6.md'
DST = ROOT / 'docs/cefr/history/LangSpot_CEFR_Placement_Pilot_Bank_v0.7.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_7_productive import TASKS  # noqa: E402

text = SRC.read_text(encoding='utf-8')
TARGET_KEYS = ('Target', 'Target duration', 'Suggested duration', 'Target length', 'Target speaking time')
META = re.compile(r'^\*\*(?:Topic|Audience|Target|Target duration|Suggested duration|Target length|Target speaking time|Primary evidence):\*\* .+$', re.M)


def once(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, f'expected 1 occurrence: {old[:80]!r}'
    text = text.replace(old, new)


def block_span(item_id: str) -> tuple[int, int]:
    heading = re.compile(rf'^### {re.escape(item_id)} — [a-z0-9_]+$', re.M)
    found = list(heading.finditer(text))
    assert len(found) == 1, f'{item_id}: {len(found)} headings'
    start = found[0].end()
    end_match = re.compile(r'^(?:### |# |---$)', re.M).search(text, start + 1)
    return start, end_match.start() if end_match else len(text)


def edit_block(item_id: str, change) -> None:
    global text
    start, end = block_span(item_id)
    text = text[:start] + change(text[start:end]) + text[end:]


for item_id, task in TASKS.items():
    prompt = task['prompt']

    def change(block: str, item_id=item_id, task=task, prompt=prompt) -> str:
        if 'target' in task:
            keys = [key for key in TARGET_KEYS if re.search(rf'^\*\*{re.escape(key)}:\*\* .+$', block, re.M)]
            assert len(keys) == 1, f'{item_id}: target keys {keys}'
            block = re.sub(rf'^\*\*{re.escape(keys[0])}:\*\* .+$', lambda _: f'**{keys[0]}:** {task["target"]}', block, count=1, flags=re.M)
        line = re.search(r'^\*\*(Prompt|Task):\*\* .+$', block, re.M)
        if line:  # v0.2 expansion format: one-line prompt
            assert '\n' not in prompt, f'{item_id}: expansion prompts must stay on one line'
            return block[:line.start()] + f'**{line.group(1)}:** {prompt}' + block[line.end():]
        metadata = list(META.finditer(block))
        assert metadata, f'{item_id}: metadata not found'
        head, content = block[:metadata[-1].end()], block[metadata[-1].end():]
        trailing = content[len(content.rstrip()):]
        if item_id.startswith('M-'):
            # Keep the source; replace the instruction that followed it.
            source = re.split(r'^(?:Your English-speaking|Explain the change|Explain to the club organiser|Explain this finding|Brief a manager|Prepare a concise briefing)', content.strip(), maxsplit=1, flags=re.M)[0].strip()
            assert source and source != content.strip(), f'{item_id}: source not separated'
            return f'{head}\n\n{source}\n\n**Task:** {prompt}{trailing or chr(10)}'
        return f'{head}\n\n{prompt}{trailing or chr(10)}'

    edit_block(item_id, change)

once('# LangSpot CEFR Placement Pilot Bank v0.6 — Revised Language Use Options',
     '# LangSpot CEFR Placement Pilot Bank v0.7 — Revised Productive Tasks')
once('**Versão:** 0.6 — 0.5 com as alternativas de Language Use revisadas segundo docs/cefr/ITEM_WRITING_GUIDELINES.md (2026-11-07)  ',
     '**Versão:** 0.7 — 0.6 com as tarefas de Writing, Speaking e Mediation revisadas segundo docs/cefr/ITEM_WRITING_GUIDELINES.md (2026-11-07)  ')
DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)} ({len(TASKS)} tasks revised)')
