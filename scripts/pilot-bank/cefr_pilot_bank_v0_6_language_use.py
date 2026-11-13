"""Language Use options for Pilot Bank v0.6 (see docs/cefr/ITEM_WRITING_GUIDELINES.md, "Language Use").

item id -> the four options in A–D order. Keys keep their letter and their text.
Every option is a real English word, form or sentence that is wrong only in the context of the item;
distractors come from typical learner errors (many of them Portuguese-speaker errors), same-class
near-synonyms and wrong grammatical patterns. No option is acceptable in standard British or
American English.
"""

OPTIONS = {
    # A1
    'LU-A1-002': ['studying', 'study', 'to study', 'studies'],
    'LU-A1-008': ['has', 'having', 'are having', 'have'],
    'LU-A1-011': ['goes', 'go', 'going', 'has gone'],
    'LU-A1-014': ["It's very big.", 'Yes, there is.', "No, it isn't.", 'It’s next to the kitchen.'],
    'LU-A1-015': ['any', 'some', 'a', 'no'],
    # A2
    'LU-A2-002': ['heaviest', 'heavy', 'the heaviest', 'heavier'],
    'LU-A2-004': ['must', 'can', 'might', 'has to'],
    'LU-A2-006': ['available', 'comfortable', 'crowded', 'empty'],
    'LU-A2-007': ['on next', 'in next', 'at next', 'next'],
    'LU-A2-010': ['Yes, I am.', "That's all right.", 'It starts at eight o’clock.', "I'm sorry too."],
    'LU-A2-011': ['lose', 'lost', 'have lost', 'was losing'],
    'LU-A2-012': ['Yes, I drink it every day.', "No, I don't.", 'No, thanks. I’ve had enough.', 'Yes, I like coffee.'],
    'LU-A2-013': ['more popular', 'mostly popular', 'popular than', 'most popular'],
    'LU-A2-014': ['catch', 'lose', 'win', 'reach'],
    'LU-A2-015': ['mustn’t', 'don’t have to', 'can’t', 'aren’t able to'],
    # B1
    'LU-B1-001': ["haven't finished", "hadn't finished", 'wasn’t finishing', "don't finish"],
    'LU-B1-003': ['was opened', 'has been opened', 'opened', 'was opening'],
    'LU-B1-005': ['do', 'make', 'put', 'set'],
    'LU-B1-007': ['which', 'whose', 'who', 'whom'],
    'LU-B1-008': ['Not at all. Go ahead.', 'Yes, please do.', 'Yes, I do. Go ahead.', "I'm sorry, I can't open it."],
    'LU-B1-010': ['Because', 'Unless', 'For example', 'However'],
    'LU-B1-011': ['starts', 'has started', 'had started', 'started'],
    'LU-B1-013': ['You may have a point.', "I'm sure it will work.", "I'm afraid I disagree.", "Don't worry about it."],
    'LU-B1-015': ['win', 'make', 'gain', 'do'],
    # B2
    'LU-B2-002': ['raises', 'rises', 'lifts', 'grows'],
    'LU-B2-004': ['that it hires', 'to have hired', 'to be hiring', 'hiring'],
    'LU-B2-006': [
        'Confirm the revised deadline for this project at your earliest convenience.',
        'I want to know the revised deadline as soon as possible.',
        'Would you mind telling me the new deadline? Thanks!',
        'I would be grateful if you could confirm the revised deadline.',
    ],
    'LU-B2-007': ['Whereas', 'Nevertheless', 'Despite', 'Consequently'],
    'LU-B2-008': ['will introduce', 'introduced', 'introduce', 'have introduced'],
    'LU-B2-009': ['extract', 'make', 'draw', 'take'],
    'LU-B2-014': [
        'A large number of the respondents said that they did not like the revised timetable at all.',
        'Quite a lot of respondents were unhappy about the changes to the timetable.',
        'A substantial number of respondents expressed dissatisfaction with the revised timetable.',
        'Many respondents felt that the new timetable was not really working for them.',
    ],
    # C1
    'LU-C1-002': ['we have seen', 'have we seen', 'we saw', 'we had seen'],
    'LU-C1-003': ['lit', 'made', 'gave rise', 'sparked'],
    'LU-C1-004': [
        'The findings show that this interpretation is correct, although other explanations exist.',
        'It seems quite obvious from these findings that this interpretation is preferable to the other available alternatives.',
        'The findings appear to support this interpretation, although alternative explanations cannot be excluded.',
        'The findings prove this interpretation, but alternative explanations may also be possible.',
    ],
    'LU-C1-005': ['entrenched', 'enclosed', 'engraved', 'enlisted'],
    'LU-C1-009': ['cuts', 'draws', 'sets', 'opens'],
    'LU-C1-010': ['melted', 'blended', 'blurred', 'faded'],
    'LU-C1-012': ['the public understood', 'did the public understand', 'the public did understand', 'the public had understood'],
    'LU-C1-014': [
        "I'm afraid that's simply not right; the figures don't support it at all.",
        "I disagree, because the figures don't support that view.",
        "With respect, you haven't looked at the figures closely.",
        "I see your point, although I'm not convinced the figures support it.",
    ],
    'LU-C1-015': ['weight', 'pressure', 'volume', 'mass'],
    # C2
    'LU-C2-001': ['cancels', 'circumscribes', 'circulates', 'interrupts'],
    'LU-C2-002': ['heightened', 'sharpened', 'tempered', 'hardened'],
    'LU-C2-003': [
        'The actors did not actually intend this outcome, whatever the evidence may appear to suggest about it.',
        'The evidence shows that the actors intended this outcome, at least in part.',
        "The evidence is consistent with that interpretation, but it does not establish the actors' intention.",
        'The evidence proves the actors probably intended this outcome.',
    ],
    'LU-C2-005': ['implicate', 'complicate', 'duplicate', 'replicate'],
    'LU-C2-013': [
        'The analysis is illuminating in parts, though its central distinction is asserted rather than demonstrated.',
        'The analysis is interesting in places, but its central distinction is simply wrong.',
        'Parts of the analysis are genuinely useful, and its central distinction is, on the whole, broadly convincing.',
        'The analysis fails to demonstrate anything, least of all the distinction at its centre.',
    ],
    'LU-C2-008': [
        'Could we examine what evidence leads us to treat that assumption as settled?',
        'Before we continue, you will need to demonstrate that this assumption is actually correct.',
        'That assumption is plainly unsupported by anything that has been presented so far.',
        'Could we pause there? I have to say that assumption makes very little sense to me.',
    ],
}
