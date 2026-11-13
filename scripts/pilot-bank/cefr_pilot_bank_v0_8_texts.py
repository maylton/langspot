"""Reading tasklets added in Pilot Bank v0.8 (two per level: R-*-005 and R-*-006).

Written with docs/cefr/ITEM_AUTHORING_PROMPT.md and docs/cefr/ITEM_WRITING_GUIDELINES.md:
- external texts are public domain or CC BY, with ABNT reference, licence, credit and adaptation
  (docs/cefr/AUTHENTIC_TEXT_SOURCES.md); LangSpot-authored texts have no source fields;
- topics new to each level; text lengths per level (A1 30–80 … C2 600–900 words);
- distractors reuse text material with the wrong relation, keys paraphrase (from A2), no absolute words
  a text does not use; key letters rotate so that each letter is the key of 12 of the 48 new items.
Each item: (subskill, difficulty, prompt, [A, B, C, D], key letter).
"""
import json
from pathlib import Path

_AUTHENTIC = Path(__file__).resolve().parent / 'cefr_pilot_bank_v0_8_authentic_texts.json'
T = json.loads(_AUTHENTIC.read_text(encoding='utf-8'))
ACCESS = 'Acesso em: 10 nov. 2026.'

TASKLETS = [
    # ------------------------------------------------------------------ A1
    {
        'id': 'R-A1-005', 'level': 'A1', 'title': 'City Park Bike Hire', 'topic': 'transport', 'genre': 'notice', 'audience': 'general',
        'text': 'CITY PARK BIKE HIRE\n\nOpen: Monday to Sunday, 8:00–18:00\nAdult bike: R$10 an hour\nChild bike: R$5 an hour\nHelmets: free\n\nPlease bring the bike back to the blue kiosk by 17:30.\nRide on the paths, not on the grass.',
        'items': [
            ('specific_information', 1, 'How much is a child bike for one hour?', ['R$5', 'R$10', 'R$18', 'R$17'], 'A'),
            ('specific_information', 1, 'What is free?', ['a child bike', 'a helmet', 'an adult bike', 'one hour on a bike'], 'B'),
            ('specific_information', 2, 'When must you bring the bike back?', ['by 8:00', 'by 18:00', 'by 17:30', 'by 10:00'], 'C'),
            ('specific_information', 2, 'Where can you ride the bikes?', ['on the grass', 'at the blue kiosk', 'next to the helmets', 'on the paths'], 'D'),
        ],
    },
    {
        'id': 'R-A1-006', 'level': 'A1', 'title': 'Lost Cat', 'topic': 'animals', 'genre': 'poster', 'audience': 'general',
        'text': 'LOST CAT\n\nHave you seen Mimi? She is a small grey cat with white feet. She has a red collar.\nMimi is shy and she does not like dogs.\nWe live at 24 Rose Street, next to the bakery. Our house has a green door.\nPlease call Ana: 98765-4321.\nThank you!',
        'items': [
            ('specific_information', 1, 'What colour is Mimi’s collar?', ['grey', 'red', 'white', 'green'], 'B'),
            ('specific_information', 1, 'Where does Ana live?', ['in the bakery', 'at 42 Rose Street', 'at 24 Rose Street', 'on Bakery Street'], 'C'),
            ('specific_information', 2, 'What does Mimi not like?', ['cats', 'the bakery', 'Ana', 'dogs'], 'D'),
            ('basic_gist', 2, 'Why did Ana write this notice?', ['to find her cat', 'to sell a cat', 'to give away a collar', 'to ask about the bakery'], 'A'),
        ],
    },
    # ------------------------------------------------------------------ A2
    {
        'id': 'R-A2-005', 'level': 'A2', 'title': 'What Can You Do?', 'topic': 'work', 'genre': 'dialogue', 'audience': 'general',
        'source': f'VOICE OF AMERICA. Let’s Learn English: lesson 20: what can you do? Washington, DC: VOA Learning English, 18 jan. 2019. Disponível em: https://learningenglish.voanews.com/a/lets-learn-english-lesson-20-what-can-you-do/3384429.html. {ACCESS}',
        'license': 'Domínio público — obra do governo dos Estados Unidos produzida pela VOA (17 U.S.C. § 105).',
        'credit': 'Texto: VOA Learning English (EUA), domínio público.',
        'adaptation': 'Trecho do diálogo; falas omitidas indicadas por […].',
        'text': T['voa'],
        'items': [
            ('basic_gist', 2, 'What is Pete’s problem at the start of the conversation?', ['He is too tired to drive a taxi.', 'He cannot find a good coffee shop.', 'He has no job and thinks he has no skills.', 'He has too many people reading his blog each day.'], 'C'),
            ('specific_information', 2, 'Why can’t Pete work as a driver?', ['He does not have a car of his own.', 'He prefers to take the bus to work.', 'He thinks driving is too difficult to learn.', 'He goes to sleep when he is driving.'], 'D'),
            ('simple_inference', 3, 'Why is Anna surprised about Pete’s blog?', ['A lot of people read what he writes.', 'He writes about his feelings.', 'He writes his blog in a coffee shop.', 'He already makes money from it.'], 'A'),
            ('speaker_opinion', 3, 'What does Anna think about writing?', ['It is an easy job that anyone can do.', 'Writing well is a skill that not everyone has.', 'Writing a blog pays more than writing code for apps.', 'It is the best way to talk about feelings.'], 'B'),
        ],
    },
    {
        'id': 'R-A2-006', 'level': 'A2', 'title': 'My First Cooking Class', 'topic': 'food', 'genre': 'blog_post', 'audience': 'general',
        'text': 'Last Saturday I went to my first cooking class at the community centre. There were eight students, and our teacher, Carlos, is a chef at a restaurant near the river.\n\nFirst, Carlos showed us how to cut onions without crying: he puts them in the fridge for ten minutes before he cuts them. Then we made fresh tomato soup and some simple bread. My bread was too hard because I left it in the oven for too long, but the soup was delicious.\n\nAt the end, we ate together and shared our recipes. I met Paula, who lives on my street, and we are going to cook dinner together next Friday.\n\nThe class costs R$40, and you need to bring an apron. I’m going to take the next class in two weeks — it’s about Italian pasta!',
        'items': [
            ('main_idea', 2, 'What is the text mainly about?', ['how to make fresh tomato soup and bread at home', 'a new restaurant near the river', 'why the writer’s bread was hard', 'the writer’s experience at a cooking class'], 'D'),
            ('specific_information', 2, 'Why does Carlos put onions in the fridge?', ['so that cutting them does not make him cry', 'so that the soup tastes fresher', 'so that they are quicker to cook', 'so that they stay fresh in the fridge for ten days'], 'A'),
            ('specific_information', 3, 'What went wrong in the class?', ['The soup was too cold to eat.', 'The writer baked her bread for too long.', 'Carlos arrived ten minutes late.', 'Some students forgot their aprons.'], 'B'),
            ('simple_inference', 3, 'What will the writer do next Friday?', ['take a class about Italian pasta', 'eat at Carlos’s restaurant', 'make a meal with a neighbour', 'teach Paula how to make bread'], 'C'),
        ],
    },
    # ------------------------------------------------------------------ B1
    {
        'id': 'R-B1-005', 'level': 'B1', 'title': 'Staying Safe Around Wildlife', 'topic': 'animals', 'genre': 'safety_guidance', 'audience': 'general',
        'source': f'NATIONAL PARK SERVICE (Estados Unidos). Yellowstone National Park: safety. Mammoth, WY: NPS, 28 jul. 2026. Disponível em: https://www.nps.gov/yell/planyourvisit/safety.htm. {ACCESS}',
        'license': 'Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105).',
        'credit': 'Texto: National Park Service (EUA), domínio público.',
        'adaptation': 'Trecho da seção “All Wildlife”; subtítulos omitidos.',
        'text': T['yellowstone'],
        'items': [
            ('main_idea', 3, 'What is the main purpose of the text?', ['to explain how visitors can stay safe around wild animals', 'to describe which animals live in Yellowstone', 'to recommend the best cameras and lenses for watching wildlife', 'to warn visitors about diseases in the park'], 'A'),
            ('detail', 3, 'How close may visitors get to bison?', ['no closer than 100 yards', 'no closer than 25 yards', 'close enough to take a photo with a phone', 'as close as they like if they stay in a car'], 'B'),
            ('inference', 4, 'Why does the text recommend binoculars and long lenses?', ['Animals are attracted by the sound of cameras.', 'The park sells them at its visitor centres.', 'They give a good view without going nearer.', 'Taking photos near wildlife is against the law.'], 'C'),
            ('cause_effect', 4, 'What can happen to animals that start depending on human food?', ['They pass diseases on to other animals.', 'They move to new parts of the park.', 'They stop being afraid of cars.', 'They may attack people and then be killed.'], 'D'),
        ],
    },
    {
        'id': 'R-B1-006', 'level': 'B1', 'title': 'A Marathon Under Two Hours', 'topic': 'sport', 'genre': 'news_report', 'audience': 'general',
        'source': f'ELIUD Kipchoge of Kenya runs marathon under two hours. In: WIKINEWS. [S. l.]: Wikimedia Foundation, 13 out. 2019. Disponível em: https://en.wikinews.org/wiki/Eliud_Kipchoge_of_Kenya_runs_marathon_under_two_hours. {ACCESS}',
        'license': 'Creative Commons Atribuição 2.5 (CC BY 2.5).',
        'credit': 'Texto: Wikinews, “Eliud Kipchoge of Kenya runs marathon under two hours”, CC BY 2.5.',
        'adaptation': 'Texto integral da notícia, sem a legenda da imagem e a lista de fontes.',
        'text': T['kipchoge'],
        'items': [
            ('main_idea', 3, 'What is the main news?', ['Kipchoge set a new official world record when he ran the marathon in Vienna.', 'He was the first person recorded running a marathon in under two hours.', 'Kipchoge won an Olympic race with the help of 42 runners.', 'Kipchoge improved on the time he ran in Berlin.'], 'B'),
            ('detail', 3, 'Why is his time not an official world record?', ['The race did not take place in Berlin.', 'He ran less than the full marathon distance.', 'The event was not an open race.', 'Other runners finished the race for him.'], 'C'),
            ('detail', 4, 'What was the role of the 42 pacemakers?', ['to decide whether the run was official', 'to race against Kipchoge and try to win first place', 'to give him water during the race', 'to run around him and help him keep his speed'], 'D'),
            ('speaker_attitude', 4, 'How did Kipchoge feel about the other runners?', ['grateful to them for sharing the work', 'surprised that they agreed to run so fast', 'worried that they might be faster than him', 'sorry that they did not get a record too'], 'A'),
        ],
    },
    # ------------------------------------------------------------------ B2
    {
        'id': 'R-B2-005', 'level': 'B2', 'title': 'Our Moon in Numbers', 'topic': 'space', 'genre': 'informative_article', 'audience': 'general',
        'source': f'NASA. Earth’s Moon: facts. Washington, DC: NASA Science, 15 nov. 2017. Disponível em: https://science.nasa.gov/moon/facts/. {ACCESS}',
        'license': 'Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105).',
        'credit': 'Texto: NASA (EUA), domínio público.',
        'adaptation': 'Trecho; parágrafos selecionados das seções sobre tamanho, órbita, formação e superfície.',
        'text': T['nasa'],
        'items': [
            ('main_idea', 3, 'What is the text mainly about?', ['how astronauts explored the Moon’s surface', 'why the Moon has no atmosphere', 'the Moon’s size, movement and origin', 'the history of volcanoes on the Moon'], 'C'),
            ('detail', 4, 'Why is it misleading to call the far side of the Moon “dark”?', ['The Sun never shines on that side.', 'That side has no volcanoes at all, unlike the near side.', 'That side is covered in dark rock.', 'It is simply the side we cannot see from Earth.'], 'D'),
            ('inference', 4, 'Why does the Moon seem to take 29 days to go around Earth rather than 27?', ['Earth is also moving while the Moon travels around it.', 'The Moon is slowly moving farther away each year.', 'The Moon spins at a different speed from its orbit.', 'Different parts of the Moon are lit at different times.'], 'A'),
            ('text_organisation', 3, 'What does the comparison with a nickel and a coffee bean show?', ['how far the Moon is from Earth', 'how big the Moon is compared with Earth', 'how much the Moon weighs compared with Earth', 'how quickly the Moon moves away from Earth'], 'B'),
        ],
    },
    {
        'id': 'R-B2-006', 'level': 'B2', 'title': 'Pianos in the Station', 'topic': 'arts', 'genre': 'feature_article', 'audience': 'general',
        'text': 'When the first public pianos appeared in railway stations, many people expected them to last a few weeks. Surely, critics said, they would be damaged, played badly, or simply ignored by commuters in a hurry. More than a decade later, pianos with signs reading “Play me” can be found in stations, airports and squares in dozens of cities, and the idea has proved surprisingly durable.\n\nPart of the explanation is practical. A second-hand upright piano costs relatively little, and local organisations often take turns looking after it: a music school tunes it, a café nearby covers it at night, volunteers report damage. When responsibility is shared in this way, the instrument becomes a small piece of common property rather than an object nobody owns.\n\nThe more interesting explanation, however, is social. A public piano changes the behaviour of a space that is usually designed for moving through as quickly as possible. A teenager tries out a song she has only played at home; a retired engineer sits down and plays a waltz from memory; strangers stop, listen, and occasionally start a conversation. Some organisers describe these scenes as small interruptions that make people notice one another.\n\nNot everyone is convinced. Some station staff complain about noise during busy hours, and musicians point out that an out-of-tune piano can discourage beginners rather than inspire them. These criticisms are reasonable, and the most successful projects respond to them by limiting playing times and keeping the instruments in good condition.\n\nWhat the station piano suggests, in the end, is that public space does not have to be either purely functional or carefully programmed. Sometimes it only needs an invitation.',
        'items': [
            ('main_idea', 3, 'What is the writer’s main point?', ['Public pianos are mainly useful for training young musicians.', 'Stations should remove public pianos because of the noise they make at busy times.', 'Public pianos last longer when cities pay for repairs.', 'Public pianos have lasted because they change how people use shared spaces.'], 'D'),
            ('detail', 3, 'What practical reason does the writer give for the pianos’ survival?', ['Different local groups share the work of looking after them.', 'The pianos are built to resist damage.', 'Cities replace them after a few weeks.', 'Musicians are paid by the city to play them in the late evenings.'], 'A'),
            ('inference', 4, 'What does the writer suggest about railway stations?', ['They are designed to make strangers talk.', 'They are normally planned for people to pass through quickly.', 'They are the best place to learn the piano.', 'They are too noisy for musicians to enjoy playing there for long.'], 'B'),
            ('writer_attitude', 4, 'How does the writer treat the criticisms of public pianos?', ['as proof that the idea has failed', 'as complaints made mostly by musicians', 'as fair points that good projects take into account', 'as problems that are impossible to solve'], 'C'),
        ],
    },
    # ------------------------------------------------------------------ C1
    {
        'id': 'R-C1-005', 'level': 'C1', 'title': 'Rising Seas', 'topic': 'climate', 'genre': 'explanatory_article', 'audience': 'general',
        'source': f'LINDSEY, Rebecca. Climate change: global sea level. [Washington, DC]: NOAA Climate.gov, 22 ago. 2023. Disponível em: https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level. {ACCESS}',
        'license': 'Domínio público — conteúdo creditado à NOAA Climate.gov, reutilização livre com atribuição (17 U.S.C. § 105; FAQ do Climate.gov).',
        'credit': 'Texto: Rebecca Lindsey, NOAA Climate.gov (EUA), domínio público.',
        'adaptation': 'Trecho; legendas de gráficos e fotos omitidas, remissão a ferramenta on-line indicada por […].',
        'text': T['climate'],
        'items': [
            ('main_idea', 4, 'What is the main focus of the text?', ['how much the sea is rising, why, and what is at risk', 'why sea level is falling in parts of Alaska', 'how satellites measure the height of the ocean', 'which coastal cities have been abandoned because of floods'], 'A'),
            ('detail', 4, 'What does the text say about the speed of sea level rise?', ['It has stayed roughly the same since 1880.', 'It was much faster in 2006–2015 than in most of the twentieth century.', 'It will stop if emissions follow a low pathway.', 'It is exactly the same on each coast, since the world’s oceans are connected.'], 'B'),
            ('implicit_meaning', 5, 'Why is high-tide flooding called “nuisance flooding”?', ['It happens mainly in small towns on low-lying coasts.', 'Storm surges push it farther inland.', 'It causes disruption and cost rather than danger.', 'It contaminates supplies of drinking water.'], 'C'),
            ('text_organisation', 4, 'According to the final paragraph, which factor contributes least to rising seas?', ['the melting of glaciers and ice sheets', 'the expansion of ocean water as it warms', 'storm surges during major hurricanes', 'people removing water stored underground'], 'D'),
        ],
    },
    {
        'id': 'R-C1-006', 'level': 'C1', 'title': 'Holding a Class’s Attention', 'topic': 'education', 'genre': 'lecture', 'audience': 'general',
        'source': f'JAMES, William. Talks to teachers on psychology: and to students on some of life’s ideals. New York: Henry Holt, 1899. Cap. XI, Attention. Disponível em: https://www.gutenberg.org/ebooks/16287. {ACCESS}',
        'license': 'Domínio público — autor falecido em 1910 (Lei 9.610/1998, art. 41); publicada nos EUA antes de 1930.',
        'credit': 'Texto: William James, Talks to Teachers on Psychology (1899), domínio público.',
        'adaptation': 'Trecho: três parágrafos consecutivos do capítulo XI; itálicos do original removidos.',
        'text': T['james'],
        'items': [
            ('main_argument', 4, 'What is James’s central claim about attention in the classroom?', ['Firm commands can hold pupils’ attention for long periods.', 'Effort can capture attention only briefly, so the subject itself must keep it.', 'Dull material should be removed from the curriculum.', 'Pupils lose attention mainly because they have to sit in one position for too long.'], 'B'),
            ('rhetorical_purpose', 5, 'Why does James describe trying to stare at a dot?', ['to show that pupils need better eyesight', 'to prove that drawing improves concentration', 'to illustrate that attention drifts from anything that does not change', 'to suggest a simple exercise that teachers could use with their classes'], 'C'),
            ('inference', 5, 'What does James suggest about the “external methods” of keeping attention?', ['They make it unnecessary for teachers to find interesting material.', 'They were invented by Mr. Fitch.', 'They work best with very young pupils.', 'They help, now and then, with material that is unavoidably dull.'], 'D'),
            ('writer_attitude', 4, 'What is the tone of the final paragraph?', ['a frank admission of what psychology cannot supply', 'an attack on teachers who lack talent', 'a confident promise that the skill can be taught', 'a complaint about the dullness of school subjects'], 'A'),
        ],
    },
    # ------------------------------------------------------------------ C2
    {
        'id': 'R-C2-005', 'level': 'C2', 'title': 'Modern Fiction', 'topic': 'literature', 'genre': 'critical_essay', 'audience': 'general',
        'source': f'WOOLF, Virginia. Modern fiction. In: WOOLF, Virginia. The common reader. London: Hogarth Press, 1925. Disponível em: https://www.gutenberg.org/ebooks/64457. {ACCESS}',
        'license': 'Domínio público — autora falecida em 1941 (Lei 9.610/1998, art. 41); publicada em 1925.',
        'credit': 'Texto: Virginia Woolf, “Modern Fiction” (1925), domínio público.',
        'adaptation': 'Trecho: três parágrafos consecutivos do ensaio.',
        'text': T['woolf'],
        'items': [
            ('nuanced_stance', 5, 'What is Woolf’s central criticism of the novelists she calls “materialists”?', ['They write too little about ordinary life.', 'They lack the technical skill that earlier novelists clearly possessed.', 'Their skill is spent making trivial surfaces look essential.', 'They imitate the classics too closely.'], 'C'),
            ('figurative_meaning', 5, 'What does the contrast between “gig lamps symmetrically arranged” and “a luminous halo” suggest?', ['Life should be told as a clear, orderly sequence.', 'Novels should concentrate on the brightest and most memorable moments of life.', 'Modern life is more confusing than life in the past.', 'Experience is continuous and diffuse, not a neat row of events.'], 'D'),
            ('implicit_meaning', 5, 'What does Woolf imply about plot, comedy and tragedy “in the accepted style”?', ['They can force a novel to leave out what life is actually like.', 'Readers cannot enjoy a novel unless these familiar elements are present.', 'They were introduced by modern writers.', 'They make novels shorter and more focused.'], 'A'),
            ('rhetorical_purpose', 5, 'Why does Woolf ask “Is it worth while? What is the point of it all?”', ['to criticise readers who give up on long novels', 'to voice the dissatisfaction felt after finishing such books', 'to argue that novels serve no purpose', 'to introduce a defence of the very writers she has been criticising'], 'B'),
        ],
    },
    {
        'id': 'R-C2-006', 'level': 'C2', 'title': 'On Running After One’s Hat', 'topic': 'everyday_life', 'genre': 'humorous_essay', 'audience': 'general',
        'source': f'CHESTERTON, G. K. On running after one’s hat. In: CHESTERTON, G. K. All things considered. London: Methuen, 1908. Disponível em: https://www.gutenberg.org/ebooks/11505. {ACCESS}',
        'license': 'Domínio público — autor falecido em 1936 (Lei 9.610/1998, art. 41); publicada em 1908.',
        'credit': 'Texto: G. K. Chesterton, “On Running After One’s Hat” (1908), domínio público.',
        'adaptation': 'Trecho; parágrafos omitidos indicados por […].',
        'text': T['chesterton'],
        'items': [
            ('nuanced_stance', 5, 'Which statement best captures Chesterton’s position?', ['Floods in London cause less damage than people fear.', 'Running after a hat is good exercise for people who live in the city.', 'Londoners would be happier living in the country.', 'Everyday inconveniences can be enjoyed if we change how we see them.'], 'D'),
            ('tone', 5, 'What is the tone of the opening paragraph about the flood?', ['playfully exaggerated envy', 'serious concern for the flood victims', 'nostalgic regret for country life', 'angry criticism of the city authorities'], 'A'),
            ('detail', 4, 'Why, according to Chesterton, do people dislike running after their hats?', ['Running makes them too tired.', 'They feel that it makes them look comic.', 'Hats are expensive to replace.', 'It usually happens in bad weather.'], 'B'),
            ('implicit_meaning', 5, 'What is meant by calling an inconvenience “an adventure wrongly considered”?', ['Inconveniences are usually more dangerous than adventures.', 'People lack imagination about real danger.', 'The same event could be experienced as an adventure.', 'Adventures tend to end in some inconvenience.'], 'C'),
        ],
    },
]
