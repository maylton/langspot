#!/usr/bin/env python3
"""Builds docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.3.md from v0.2.

Each change comes from docs/CEFR_CONTENT_AND_BUILDER_REVIEW.md. Every edit asserts that
the original text is found exactly once, so a drifted source fails loudly.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.2.md'
DST = ROOT / 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.3.md'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cefr_pilot_bank_v0_3_options import OPTIONS, PROMPTS  # noqa: E402

text = SRC.read_text(encoding='utf-8')


def once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    assert count == 1, f'expected 1 occurrence, found {count}: {old[:80]!r}'
    text = text.replace(old, new)


def item_block(item_id: str) -> tuple[int, int]:
    """Span from an objective item heading to the next item heading or section."""
    start = text.index(f'**{item_id} — ')
    nxt = re.compile(r'^(?:\d+\. \*\*[A-Z]+-|#)', re.M).search(text, text.index('\n', start))
    return start, nxt.start() if nxt else len(text)


def replace_in_item(item_id: str, old: str, new: str) -> None:
    global text
    start, end = item_block(item_id)
    block = text[start:end]
    assert block.count(old) == 1, f'{item_id}: {old!r} not found exactly once'
    text = text[:start] + block.replace(old, new) + text[end:]


def set_option(item_id: str, letter: str, value: str) -> None:
    global text
    start, end = item_block(item_id)
    block = text[start:end]
    pattern = re.compile(rf'^- \*\*{letter}\.\*\* .+$', re.M)
    assert len(pattern.findall(block)) == 1, f'{item_id}: option {letter} not found'
    text = text[:start] + pattern.sub(f'- **{letter}.** {value}', block) + text[end:]


# Version header.
once('# LangSpot CEFR Placement Pilot Bank v0.2 — Expanded', '# LangSpot CEFR Placement Pilot Bank v0.3 — Reviewed')
once('**Versão:** 0.2 — Expanded Real Placement Pilot  ', '**Versão:** 0.3 — Reviewed Real Placement Pilot (revisão de 2026-11-06 aplicada sobre a 0.2)  ')

# 1. Option text (length balance, above-level wording, implausible distractors).
for item_id, letters in OPTIONS.items():
    for letter, value in letters.items():
        set_option(item_id, letter, value)
for item_id, (old, new) in PROMPTS.items():
    replace_in_item(item_id, old, new)

# 2. Listening A1 input: a four-detail public announcement is an A2 descriptor; simplify.
once('Attention, please. The 9:20 train to Lakeside will now leave from platform four, not platform two. The train is about ten minutes late. Passengers for Lakeside should use the stairs beside the ticket office. The café on platform four is closed this morning.',
     'Attention, please. The 9:20 train to Lakeside is now on platform four. It is about ten minutes late. Please use the stairs beside the ticket office. The café on platform four is closed today.')

# 3. Writing length targets one level too high.
for task in ('W-A1-001', 'W-A1-002'):
    once(f'### {task} — ', f'### {task} — ')  # sanity
text = re.sub(r'(### W-A1-00[12] — [^\n]+\n(?:\*\*[^\n]+\n)*?)\*\*Target:\*\* 40–60 words', r'\1**Target:** 20–35 words', text)
once('### W-A1-003 — short_invitation\n**Target length:** 40–60 words', '### W-A1-003 — short_invitation\n**Target length:** 20–35 words')
text = re.sub(r'(### W-A2-00[12] — [^\n]+\n(?:\*\*[^\n]+\n)*?)\*\*Target:\*\* 60–100 words', r'\1**Target:** 40–70 words', text)
once('### W-A2-003 — informal_email\n**Target length:** 60–100 words', '### W-A2-003 — informal_email\n**Target length:** 40–70 words')
text = re.sub(r'(### W-B2-00[12] — [^\n]+\n(?:\*\*[^\n]+\n)*?)\*\*Target:\*\* 180–250 words', r'\1**Target:** 140–190 words', text)
once('### W-B2-003 — article\n**Target length:** 180–250 words', '### W-B2-003 — article\n**Target length:** 140–190 words')

# 4. Missing or single-value durations.
text = re.sub(r'(### SP-B2-00[12] — [^\n]+\n(?:\*\*[^\n]+\n)*?)\*\*Target duration:\*\* 2 minutes', r'\1**Target duration:** 2–3 minutes', text)
once('### SP-B2-003 — argument_long_turn\n**Target speaking time:** 2 minutes', '### SP-B2-003 — argument_long_turn\n**Target speaking time:** 2–3 minutes')
for task, duration in (('SI-A1-003 — guided_role_play', '2–3 minutes'), ('SI-A2-003 — planning_task', '3–4 minutes'), ('SI-B1-003 — collaborative_decision', '4–5 minutes'),
                       ('SI-B2-003 — collaborative_problem_solving', '5–6 minutes'), ('SI-C1-003 — advanced_discussion', '6–8 minutes'), ('SI-C2-003 — high_level_negotiation', '7–9 minutes')):
    once(f'### {task}\n\n**Task:**', f'### {task}\n**Suggested duration:** {duration}\n\n**Task:**')

for task, duration in (('M-A1-002', '30–45 seconds'), ('M-A2-002', '45–75 seconds'), ('M-B1-002', '1–2 minutes'),
                       ('M-B2-002', '2–3 minutes'), ('M-C1-002', '2–3 minutes'), ('M-C2-002', '3–4 minutes')):
    heading = re.search(rf'^### {task} — [^\n]+\n', text, re.M)
    assert heading, task
    text = text[:heading.end()] + f'**Suggested duration:** {duration}\n' + text[heading.end():]

# 5. Duplicated or overlapping productive tasks.
once('**Prompt:** Talk about your room or another room you use often. Say what is in it, where two or three things are, and what you usually do there.',
     '**Prompt:** Talk about your favourite food. Say what it is, when you eat it, who makes it and why you like it.')
once('**Task:** You are at a café. Ask the teacher/examiner for a drink and a snack, ask the price, and respond when one item is not available.',
     '**Task:** You are lost in town. Ask the teacher/examiner how to get to the bus station, ask how long it takes to walk there, and thank them.')
once('**Prompt:** Describe a weekend you enjoyed. Say where you went, who you were with, what you did, and why you enjoyed it.',
     '**Prompt:** Describe a person you admire. Say who they are, how you know them, what they are like and why you admire them.')
once('**Prompt:** Some people prefer learning a new skill alone; others prefer learning with a teacher or group. Compare the two approaches and explain which works better for you.',
     '**Prompt:** Some people prefer holidays in a big city; others prefer the countryside. Compare the two and explain which you prefer.')
once('A small company wants to reduce unnecessary meetings without harming communication. The learner and assessor evaluate four proposals and agree on a policy.',
     'A town wants to make its main shopping street more attractive. The learner and assessor evaluate four proposals — weekend markets, more green space, free parking or regular cultural events — and agree on a plan.')
once('**Task:** A public institution must publish information about an uncertain risk. Negotiate a communication strategy that is transparent about uncertainty without either alarming the public unnecessarily or creating false reassurance. Challenge and refine each other’s proposals.',
     '**Task:** A national museum must decide whether to return a historically contested object to its country of origin. Negotiate a position that weighs legal ownership, cultural significance, public access and precedent. Challenge and refine each other’s proposals.')

# 6. Currency consistency (the bank uses R$/reais elsewhere).
once('Guided tour: 4:30 p.m. — £3 per person.', 'Guided tour: 4:30 p.m. — R$15 per person.')

DST.write_text(text, encoding='utf-8')
print(f'wrote {DST.relative_to(ROOT)}')
