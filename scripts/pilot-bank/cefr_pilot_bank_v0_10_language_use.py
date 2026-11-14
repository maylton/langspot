"""Language Use items added in Pilot Bank v0.10 (LU-*-016 to LU-*-025: 25 items per level).

Written with docs/cefr/ITEM_AUTHORING_PROMPT.md and docs/cefr/ITEM_WRITING_GUIDELINES.md:
- every option is a real English form, wrong only in its context; one key in British and American English;
- distractors use typical errors of Brazilian learners when they are real forms (lose the bus, make
  homework, borrow/lend, bored/boring, despite/although);
- options of an item belong to the same class and fill the same slot; functional items offer coherent
  replies to the wrong function; register items differ in one or two features, without caricature;
- B1/B2 items add evidence on conditionals, collocations, contrast connectors, phrasal verbs and register;
- the key is rarely the longest option, and key letters balance the level's answer keys.
Each item: (id suffix, subskill, difficulty, prompt, key, [three distractors], key letter).
"""

ITEMS = {
    'A1': [
        ('016', 'grammar', 1, '___ your teacher from Canada?', 'Is', ['Does', 'Are', 'Do'], 'C'),
        ('017', 'grammar', 2, 'He ___ coffee. He only drinks tea.', "doesn't drink", ["don't drink", "didn't drink", "isn't drinking"], 'B'),
        ('018', 'vocabulary', 1, 'I wash my hands in the ___.', 'bathroom', ['living room', 'garden', 'garage'], 'C'),
        ('019', 'grammar', 2, 'Look! The children ___ in the park.', 'are playing', ['play', 'were playing', 'plays'], 'D'),
        ('020', 'functional_language', 1, 'A: How are you? B: ___', 'Fine, thanks. And you?', ["I'm twenty.", "I'm from Recife, in Brazil.", 'Nice to meet you.'], 'A'),
        ('021', 'grammar', 2, 'This is my friend. ___ name is Leo.', 'His', ['He', "He's", 'Him'], 'C'),
        ('022', 'vocabulary', 1, 'There are seven days in a ___.', 'week', ['month', 'year', 'weekend'], 'D'),
        ('023', 'grammar', 2, 'We ___ to the cinema yesterday.', 'went', ['go', 'goes', 'going'], 'B'),
        ('024', 'functional_language', 2, 'A: What time is it? B: ___', 'Half past three.', ['On Monday morning.', 'For about two hours.', 'Every day at school.'], 'C'),
        ('025', 'grammar', 2, 'How ___ apples do you want?', 'many', ['much', 'any', 'often'], 'D'),
    ],
    'A2': [
        ('016', 'grammar', 3, '___ you ever eaten sushi?', 'Have', ['Did', 'Do', 'Would'], 'A'),
        ('017', 'grammar', 3, 'If it rains tomorrow, we ___ at home.', 'will stay', ['would stay', 'stayed', 'staying'], 'C'),
        ('018', 'collocation', 2, 'I need to ___ my homework before dinner.', 'do', ['make', 'take', 'have'], 'B'),
        ('019', 'vocabulary', 2, "I can't hear you. Can you speak more ___?", 'loudly', ['quietly', 'slowly', 'carefully'], 'A'),
        ('020', 'grammar', 3, 'She ___ English since she was ten.', 'has studied', ['studied', 'is studying', 'has been studied'], 'D'),
        ('021', 'functional_language', 2, 'A: Shall we go to the beach on Sunday? B: ___', 'Good idea! What time?', ['Yes, I went last Sunday.', "No, it isn't.", "I'm going to the beach."], 'C'),
        ('022', 'discourse_markers', 2, "We didn't go out ___ it was raining.", 'because', ['but', 'so', 'although'], 'B'),
        ('023', 'collocation', 3, 'I ___ my bus this morning, so I was late for school.', 'missed', ['lost', 'left', 'dropped'], 'A'),
        ('024', 'vocabulary', 3, 'The film was so ___ that I fell asleep.', 'boring', ['bored', 'interesting', 'exciting'], 'C'),
        ('025', 'functional_language', 3, 'A: Can you help me with my bags? B: ___', 'Sure, no problem.', ["Yes, I can't.", "No, you can't.", 'Sure, help yourself.'], 'D'),
    ],
    'B1': [
        ('016', 'grammar', 3, "I'm used to ___ up early for work.", 'getting', ['get', 'got', 'have got'], 'B'),
        ('017', 'grammar', 3, 'He asked me where I ___.', 'lived', ['do live', 'did I live', 'am living'], 'A'),
        ('018', 'collocation', 3, 'Please ___ attention: this part will be in the exam.', 'pay', ['do', 'make', 'take'], 'D'),
        ('019', 'phrasal_verbs', 3, 'The concert was ___ because of the storm.', 'called off', ['called up', 'put on', 'brought about'], 'B'),
        ('020', 'discourse_markers', 3, 'I wanted to go to the party. ___, I had to work late.', 'However', ['Therefore', 'Moreover', 'For example'], 'C'),
        ('021', 'grammar', 4, 'If I ___ more time, I would learn to play the guitar.', 'had', ['have', 'would have', 'will have'], 'B'),
        ('022', 'lexical_choice', 3, "Can you ___ me your charger? Mine isn't working.", 'lend', ['borrow', 'rent', 'give back'], 'A'),
        ('023', 'word_formation', 3, 'There was a ___ improvement in his English after the trip.', 'noticeable', ['notice', 'noticed', 'notification'], 'D'),
        ('024', 'functional_language', 3, 'A: I failed my driving test again. B: ___', "Oh no, I'm sorry to hear that.", ["Well done, that's great news!", 'Never mind, it was an easy test.', 'Good for you!'], 'B'),
        ('025', 'grammar', 3, 'This is the café ___ we first met.', 'where', ['which', 'who', 'wherever'], 'C'),
    ],
    'B2': [
        ('016', 'grammar', 4, 'By next June, I ___ here for five years.', 'will have worked', ['will be working', 'have been working', 'work'], 'A'),
        ('017', 'grammar', 4, 'She denied ___ the documents.', 'taking', ['to take', 'that she take', 'take'], 'C'),
        ('018', 'collocation', 4, 'The company has ___ steps to reduce its carbon emissions.', 'taken', ['made', 'done', 'brought'], 'A'),
        ('019', 'phrasal_verbs', 4, 'We need to ___ a solution before the client arrives.', 'come up with', ['come down with', 'put up with', 'get on with'], 'B'),
        ('020', 'discourse_markers', 4, '___ the heavy traffic, we arrived on time.', 'Despite', ['Although', 'However', 'Even though'], 'A'),
        ('021', 'lexical_choice', 4, 'The new manager is very ___; she always listens to our suggestions.', 'approachable', ['unapproachable', 'applicable', 'apprehensive'], 'D'),
        ('022', 'register', 4, 'Which sentence is most appropriate in a formal email to a client?', 'Please find attached the documents you requested.', ["I've attached the stuff you wanted.", 'Here are the documents you asked for.', 'The documents you wanted are attached, as you asked.'], 'C'),
        ('023', 'grammar', 4, 'Not only ___ late, but he also forgot the tickets.', 'was he', ['he was', 'he has been', 'has he been'], 'A'),
        ('024', 'lexical_choice', 4, 'The two studies reached ___ conclusions: one found a benefit, the other found none.', 'conflicting', ['conflicted', 'confusing', 'complementary'], 'D'),
        ('025', 'grammar', 4, "I'd rather you ___ smoke in the car.", "didn't", ["don't", "won't", "shouldn't"], 'B'),
    ],
    'C1': [
        ('016', 'grammar', 5, 'Little ___ that the decision would cost him his job.', 'did he realise', ['he realised', 'he had realised', 'he did realise'], 'C'),
        ('017', 'idiomatic_control', 5, 'Who is going to ___ the bill for the repairs?', 'foot', ['leg', 'toe', 'finger'], 'A'),
        ('018', 'lexical_precision', 5, "The government's response was widely criticised as ___ to the scale of the crisis.", 'inadequate', ['incompetent', 'inaccessible', 'inconsistent'], 'B'),
        ('019', 'grammar', 5, 'Should you ___ any difficulties, please contact the help desk.', 'encounter', ['encountered', 'to encounter', 'encountering'], 'D'),
        ('020', 'register', 5, 'Which sentence is most appropriate for the conclusion of an academic essay?', 'On balance, the evidence suggests that the benefits outweigh the costs.', ['In conclusion, the benefits clearly beat the costs, as everyone can see.', 'Overall, the benefits are much bigger than the costs in every single case.', 'To conclude, the evidence proves that the benefits are greater than the costs.'], 'B'),
        ('021', 'discourse_markers', 5, 'The policy reduced costs; ___, it led to longer waiting times.', 'at the same time', ['in the same way', 'by the same token', 'for the same reason'], 'C'),
        ('022', 'word_formation', 5, 'The report highlights the ___ of the current regulations.', 'inadequacy', ['inadequate', 'inadequately', 'adequacy'], 'D'),
        ('023', 'lexical_precision', 5, 'His argument rests on the ___ assumption that all users behave rationally.', 'questionable', ['questioning', 'questioned', 'unquestionable'], 'B'),
        ('024', 'grammar', 5, '___ the rain, the match would have finished by now.', 'But for', ['Except', 'Instead of', 'Unless'], 'C'),
        ('025', 'idiomatic_control', 5, 'The negotiations ___ when neither side was willing to compromise.', 'broke down', ['broke out', 'broke in', 'broke through'], 'D'),
    ],
    'C2': [
        ('016', 'lexical_precision', 5, "The report's conclusions are ___ by the very data it cites.", 'undermined', ['underlined', 'underpinned', 'understated'], 'A'),
        ('017', 'idiomatic_control', 5, "The minister's resignation was the ___ that broke the camel's back.", 'straw', ['feather', 'stone', 'needle'], 'C'),
        ('018', 'grammar', 5, 'Had it not been for her intervention, the talks ___ collapsed.', 'would have', ['will have', 'would', 'should have been'], 'D'),
        ('019', 'lexical_precision', 5, 'Far from being a ___ issue, the question goes to the heart of the debate.', 'peripheral', ['perfunctory', 'perennial', 'perpetual'], 'A'),
        ('020', 'pragmatic_appropriacy', 5, "Which reply most diplomatically declines a colleague's proposal?", "I can see the appeal, but I'm not sure now is the time.", ["It's an interesting idea, but frankly it won't work for us.", "I don't think that's a good idea, to be honest with you.", "Thanks, but we've already decided against it, so it's a no."], 'C'),
        ('021', 'collocation', 5, 'The decision was taken in ___ disregard of expert advice.', 'blatant', ['flamboyant', 'bare', 'loud'], 'B'),
        ('022', 'grammar', 5, 'Such ___ the demand that tickets sold out within minutes.', 'was', ['did', 'had', 'were'], 'D'),
        ('023', 'lexical_precision', 5, 'Her remarks were ___ rather than offensive: provocative, but never cruel.', 'pointed', ['pointless', 'sharpened', 'acute'], 'C'),
        ('024', 'idiomatic_control', 5, 'The new policy ___ lip service to inclusion but changes very little in practice.', 'pays', ['gives', 'makes', 'does'], 'D'),
        ('025', 'discourse_control', 5, 'The theory is elegant; ___, it has yet to be tested against real-world data.', 'be that as it may', ['so to speak', 'as it were', 'as luck would have it'], 'A'),
    ],
}


def options(key, distractors, letter):
    result = list(distractors)
    result.insert('ABCD'.index(letter), key)
    return result
