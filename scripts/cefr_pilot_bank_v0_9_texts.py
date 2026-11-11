"""Reading tasklets added in Pilot Bank v0.9 (two per level: R-*-007 and R-*-008).

Written with docs/cefr/ITEM_AUTHORING_PROMPT.md and docs/cefr/ITEM_WRITING_GUIDELINES.md:
- external texts are public domain or CC BY, with ABNT reference, licence, credit and adaptation
  (docs/cefr/AUTHENTIC_TEXT_SOURCES.md); the literal excerpts are in
  scripts/cefr_pilot_bank_v0_9_authentic_texts.json; LangSpot-authored texts have no source fields;
- topics new to each level; text lengths per level (A1 30–80 … C2 600–900 words);
- distractors reuse text material with the wrong relation, keys paraphrase (from A2), no absolute words
  a text does not use; the keys of each tasklet are a permutation of A–D, so each letter is the key of
  12 of the 48 new items.
Each item is written as (subskill, difficulty, prompt, key text, [three distractors], key letter);
`item()` places the key at its letter, giving the v0.8 tuple (subskill, difficulty, prompt, [A, B, C, D], key).
"""
import json
from pathlib import Path

_AUTHENTIC = Path(__file__).resolve().parent / 'cefr_pilot_bank_v0_9_authentic_texts.json'
T = json.loads(_AUTHENTIC.read_text(encoding='utf-8'))
ACCESS = 'Acesso em: 11 nov. 2026.'


def item(subskill, difficulty, prompt, key_text, distractors, letter):
    assert len(distractors) == 3, prompt
    options = list(distractors)
    options.insert('ABCD'.index(letter), key_text)
    return (subskill, difficulty, prompt, options, letter)


TASKLETS = [
    # ------------------------------------------------------------------ A1
    {
        'id': 'R-A1-007', 'level': 'A1', 'title': 'Weather This Weekend', 'topic': 'weather', 'genre': 'forecast', 'audience': 'general',
        'text': 'WEATHER THIS WEEKEND\n\nSaturday: Sunny and hot. 30°C. A good day for the beach!\nSunday morning: Cloudy. 22°C.\nSunday afternoon: Rain from 2 p.m. Take an umbrella.\nMonday: Windy and cold. 15°C.\n\nThe park café is closed on Sunday.',
        'items': [
            item('specific_information', 1, 'What is the weather like on Saturday?', 'sunny and hot', ['cloudy', 'windy and cold', 'rainy'], 'B'),
            item('specific_information', 1, 'When does the rain start?', 'on Sunday at 2 p.m.', ['on Saturday afternoon', 'on Monday morning', 'on Sunday morning'], 'D'),
            item('specific_information', 2, 'Which day is windy and cold?', 'Monday', ['Saturday', 'Sunday morning', 'Sunday afternoon'], 'A'),
            item('basic_gist', 2, 'What do you need on Sunday afternoon?', 'an umbrella', ['sunglasses', 'a warm jacket', 'a swimsuit'], 'C'),
        ],
    },
    {
        'id': 'R-A1-008', 'level': 'A1', 'title': 'Party Invitation', 'topic': 'celebrations', 'genre': 'message', 'audience': 'general',
        'text': 'Hi Leo,\n\nIt’s my birthday on Friday! Come to my party.\n\nWhere: my flat, 15 Lake Road, flat 3\nWhen: Friday, 7 p.m. to 11 p.m.\n\nPlease bring a drink. I have pizza and cake.\nMy sister Rosa is coming, with her dog, Max!\n\nText me: 91234-5678\nBia',
        'items': [
            item('specific_information', 1, 'When does the party start?', 'at 7 p.m.', ['at 11 p.m.', 'at 3 p.m.', 'at 5 p.m.'], 'C'),
            item('specific_information', 1, 'What does Leo need to bring?', 'a drink', ['a cake', 'some pizza', 'a dog'], 'A'),
            item('specific_information', 2, 'Who is Max?', 'Rosa’s dog', ['Bia’s brother', 'Rosa’s friend', 'Leo’s cat'], 'D'),
            item('basic_gist', 2, 'Why did Bia write this message?', 'to invite Leo to her party', ['to ask Leo for his number', 'to give Leo her sister’s dog', 'to tell Leo about a pizza place'], 'B'),
        ],
    },
    # ------------------------------------------------------------------ A2
    {
        'id': 'R-A2-007', 'level': 'A2', 'title': 'Find Your Joy!', 'topic': 'everyday_problems', 'genre': 'dialogue', 'audience': 'general',
        'source': f'VOICE OF AMERICA. Let’s Learn English: level 2: lesson 16: find your joy! Washington, DC: VOA Learning English, 12 jan. 2019. Disponível em: https://learningenglish.voanews.com/a/lets-learn-english-level-2-lesson-16/4198066.html. {ACCESS}',
        'license': 'Domínio público — obra do governo dos Estados Unidos produzida pela VOA (17 U.S.C. § 105).',
        'credit': 'Texto: VOA Learning English (EUA), domínio público.',
        'adaptation': 'Trechos do diálogo, sem alterações; falas e explicações de gramática omitidas indicadas por […].',
        'text': T['voa'],
        'items': [
            item('specific_information', 2, 'Where is the Lost & Found office now?', 'down near the elevators', ['across from the cafeteria', 'next to the ladies’ room', 'in Serenity’s office'], 'D'),
            item('simple_inference', 3, 'What does Serenity think Anna has lost?', 'her joy in life', ['the key to her apartment', 'a very important job', 'a lot of money'], 'B'),
            item('detail', 3, 'What does Serenity say about her old job?', 'It paid well, but it hurt her.', ['It made her rich and very happy.', 'It was not a very important job.', 'It was at the Lost & Found office.'], 'C'),
            item('basic_inference', 3, 'What does Anna understand at the end?', 'She is in the wrong office.', ['Serenity has found her key.', 'She should look for a new job.', 'She left her key in the basement.'], 'A'),
        ],
    },
    {
        'id': 'R-A2-008', 'level': 'A2', 'title': 'Greetings from the Mountains', 'topic': 'travel', 'genre': 'personal_email', 'audience': 'general',
        'text': 'Hi Marta,\n\nGreetings from the mountains! We arrived in Campos on Thursday night after a long bus journey – six hours! The town is small, but it’s very pretty, with lots of old wooden houses and chocolate shops.\n\nYesterday we walked to the top of Pedra do Baú. It took three hours, and my legs still hurt today. The view was amazing, but it was very cold at the top, so I was happy that I had my jacket.\n\nToday it’s raining, so we’re staying in the hotel. Dani is reading and I’m writing postcards. Tonight we want to try fondue at a restaurant near the square – everyone says it’s the best in town.\n\nWe’re coming home on Monday. I’ll bring you some chocolate!\n\nLove,\nJúlia',
        'items': [
            item('specific_information', 2, 'How did Júlia travel to Campos?', 'by bus', ['by car', 'by train', 'on foot'], 'A'),
            item('detail', 2, 'Why was Júlia happy that she had her jacket?', 'The top of the mountain was cold.', ['Her legs hurt after the long walk.', 'It was raining in the town.', 'The hotel was cold at night.'], 'C'),
            item('sequence', 2, 'What are Júlia and Dani doing today?', 'spending the day indoors', ['walking to the top of the mountain', 'eating fondue near the square', 'travelling home on the bus'], 'D'),
            item('simple_purpose', 2, 'What is the main reason Júlia wrote this email?', 'to tell Marta about her trip', ['to invite Marta to the mountains', 'to ask Marta about a restaurant', 'to say the bus journey was long'], 'B'),
        ],
    },
    # ------------------------------------------------------------------ B1
    {
        'id': 'R-B1-007', 'level': 'B1', 'title': 'A New Bridge Opens', 'topic': 'infrastructure', 'genre': 'news_report', 'audience': 'general',
        'source': f'NEW I-35W Minneapolis bridge opens. Wikinews, [s. l.], 18 set. 2008. Disponível em: https://en.wikinews.org/wiki/New_I-35W_Minneapolis_bridge_opens. {ACCESS}',
        'license': 'Creative Commons Atribuição 2.5 Genérica (CC BY 2.5) — https://creativecommons.org/licenses/by/2.5/ — crédito: Wikinews.',
        'credit': 'Texto: Wikinews, CC BY 2.5.',
        'adaptation': 'Texto integral da notícia; links, imagens e predefinições removidos, texto sem alterações.',
        'text': T['bridge'],
        'items': [
            item('main_idea', 2, 'What is the report mainly about?', 'the opening of a replacement bridge', ['why the old bridge in Minneapolis fell down', 'the traffic jams caused by building work', 'a company that finished its work too late'], 'C'),
            item('detail', 3, 'Which vehicles crossed the bridge first?', 'emergency vehicles', ['police cars', 'construction trucks', 'honking private cars'], 'A'),
            item('inference', 3, 'Why did the contractor receive extra money?', 'It finished well before the deadline.', ['It installed 323 sensors on the bridge.', 'It lifted the sections with a river crane.', 'It built the concrete parts in heated barns.'], 'B'),
            item('detail', 3, 'What are the electronic sensors for?', 'to watch for strain and movement', ['to light up the bridge at night', 'to count the cars crossing each day', 'to warm the concrete during building'], 'D'),
        ],
    },
    {
        'id': 'R-B1-008', 'level': 'B1', 'title': 'Sharing a Flat with Strangers', 'topic': 'housing', 'genre': 'personal_article', 'audience': 'general',
        'text': 'When I moved to Porto Alegre for my first job, I couldn’t afford a flat of my own, so I answered an advert for a room in a shared flat. My new flatmates were Lucas, a nurse who worked nights, and Hana, an architecture student from Japan. I had never lived with strangers before, and I was nervous.\n\nThe first month was not easy. Lucas slept during the day, so Hana and I had to keep quiet until three in the afternoon. Hana cooked late at night, and the smell of garlic sometimes woke Lucas up. And I, I have to admit, rarely washed my dishes straight away.\n\nThings changed after a small argument about the kitchen. Instead of leaving angry notes on the fridge, we decided to have dinner together every Sunday and talk about anything that was bothering us. We made a simple cleaning timetable, and Lucas suggested buying earplugs for everyone – he paid for them himself.\n\nTwo years later, I have my own flat, but those Sunday dinners are still the best part of my week. Hana taught me to make miso soup, and Lucas taught me how to stay calm when things go wrong. Living with strangers wasn’t always comfortable, but it taught me more about people than any course could. If you’re thinking of sharing a flat, my advice is simple: talk before small problems become big ones.',
        'items': [
            item('detail', 2, 'Why did the writer look for a room in a shared flat?', 'Living alone was too expensive.', ['Lucas needed help paying the rent.', 'Hana was looking for a flatmate.', 'The job came with a free room.'], 'B'),
            item('detail', 3, 'What caused problems during the first month?', 'The flatmates’ routines clashed.', ['Hana did not like the smell of garlic.', 'Lucas made too much noise at night.', 'The writer cooked too late in the evening.'], 'D'),
            item('inference', 3, 'What does the writer suggest about the Sunday dinners?', 'They became the way to deal with problems.', ['They were Lucas’s idea, and he paid for the food.', 'They stopped when the writer moved out.', 'They were mainly a chance to learn to cook.'], 'A'),
            item('writer_purpose', 3, 'What is the writer’s main purpose in the final paragraph?', 'to show what they gained and give a piece of advice', ['to explain why they moved out of the shared flat', 'to complain about how uncomfortable flat-sharing was', 'to recommend a cookery course for new flatmates'], 'C'),
        ],
    },
    # ------------------------------------------------------------------ B2
    {
        'id': 'R-B2-007', 'level': 'B2', 'title': 'The First Flight', 'topic': 'aviation_history', 'genre': 'informative_article', 'audience': 'general',
        'source': f'NATIONAL PARK SERVICE (Estados Unidos). 1903: the first flight. Wright Brothers National Memorial, 14 abr. 2015. Disponível em: https://www.nps.gov/wrbr/learn/historyculture/thefirstflight.htm. {ACCESS}',
        'license': 'Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403).',
        'credit': 'Texto: National Park Service (EUA), domínio público.',
        'adaptation': 'Trechos; frases originais, omissões indicadas por […].',
        'text': T['nps'],
        'items': [
            item('writer_stance', 3, 'According to the first paragraph, what set the Wrights apart from Langley?', 'They saw that pilots had to control the machine.', ['They received more money from the government.', 'They built heavier and more stable flying machines.', 'Their work was followed closely by newspapers.'], 'D'),
            item('detail', 3, 'Why did Wilbur’s attempt on December 14th fail?', 'He made the machine climb too steeply.', ['The engine stopped soon after take-off.', 'He lost the coin toss to Orville.', 'The wind was too strong that day.'], 'C'),
            item('inference', 4, 'Why does the writer mention the 27-mph wind?', 'to explain why the first flight covered so little ground', ['to show why the brothers decided to wait three more days', 'to suggest that Orville was a more careful pilot than Wilbur', 'to explain why the volunteers were signalled with a sheet'], 'A'),
            item('implication', 4, 'What does the final paragraph suggest about the four flights that day?', 'They covered more distance as the day went on.', ['Orville made the longest flight of the day.', 'The brothers needed repairs after each flight.', 'The camera captured each flight from the start.'], 'B'),
        ],
    },
    {
        'id': 'R-B2-008', 'level': 'B2', 'title': 'Free Images, Paid Permissions', 'topic': 'digital_heritage', 'genre': 'news_report', 'audience': 'general',
        'source': f'NEW York Public Library opens collection of 275,000 digital images. Wikinews, [s. l.], 5 mar. 2005. Disponível em: https://en.wikinews.org/wiki/New_York_Public_Library_opens_collection_of_275,000_digital_images. {ACCESS}',
        'license': 'Domínio público — artigo da Wikinews publicado antes de 25 set. 2005 (Wikinews:Copyright).',
        'credit': 'Texto: Wikinews, domínio público.',
        'adaptation': 'Texto integral da notícia; links, imagens e predefinições removidos, texto sem alterações.',
        'text': T['nypl'],
        'items': [
            item('main_idea', 3, 'What is the main issue raised in the report?', 'whether fees for public domain images are justified', ['how the library paid outside contractors to scan its collection', 'why most of the images are more than a century old', 'how users can download the images for personal use'], 'A'),
            item('detail', 3, 'According to Tom Lisanti, what is the usage fee for?', 'It supports the library’s collecting work.', ['It pays for the copyright the library holds.', 'It stops people from sharing the images.', 'It covers the cost of the outside contractors.'], 'B'),
            item('implication', 4, 'What does Lisanti suggest when he says the images can be obtained “from a source other than NYPL”?', 'The library is not claiming the images as its own.', ['Other libraries offer better copies than the NYPL.', 'The images will soon be removed from the website.', 'People who pay the fee may share the images freely.'], 'D'),
            item('speaker_attitude', 4, 'How does Lessig see the legal question?', 'as open, with no simple answer yet', ['as clearly giving the library a new copyright', 'as proof that the fee is illegal', 'as easy to solve by extracting the public domain part'], 'C'),
        ],
    },
    # ------------------------------------------------------------------ C1
    {
        'id': 'R-C1-007', 'level': 'C1', 'title': 'On a Piece of Chalk', 'topic': 'geology', 'genre': 'lecture', 'audience': 'general',
        'source': f'HUXLEY, Thomas Henry. On a piece of chalk. In: HUXLEY, Thomas Henry. Lay sermons, addresses and reviews. London: Macmillan, 1870. Palestra proferida em 1868. Disponível em: https://www.gutenberg.org/ebooks/16729. {ACCESS}',
        'license': 'Domínio público — autor falecido em 1895 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.',
        'credit': 'Texto: T. H. Huxley (1868), domínio público.',
        'adaptation': 'Trechos do início da palestra; texto sem alterações, omissões indicadas por […].',
        'text': T['huxley'],
        'items': [
            item('rhetorical_purpose', 3, 'Why does Huxley begin by describing where chalk can be found?', 'to show how common it is before asking his question', ['to suggest the chalk cliffs are England’s finest scenery', 'to explain why digging wells in Norfolk is so difficult', 'to show how England came to be called Albion by sailors'], 'C'),
            item('implicit_meaning', 4, 'What objection does Huxley expect from his audience?', 'that the question cannot be answered with any certainty', ['that a piece of chalk is too ordinary to deserve a lecture', 'that Latin is needed to understand the evidence', 'that a microscope adds little to the evidence'], 'A'),
            item('main_argument', 4, 'Why, according to Huxley, did he choose chalk as his subject?', 'It shows how firmly some scientific conclusions are supported.', ['It can be burnt and tested easily in front of a lecture audience.', 'It matters more than the history of humanity itself.', 'Its history can be learnt faster than the grammar of Latin.'], 'B'),
            item('detail', 4, 'What does the microscope reveal, according to the final paragraph?', 'Tiny bodies of definite shape lie among the granules.', ['Chalk consists of loose granules with no particular shape.', 'Chalk turns into quicklime when it is heated.', 'Each cubic inch contains a few hundred larger bodies.'], 'D'),
        ],
    },
    {
        'id': 'R-C1-008', 'level': 'C1', 'title': 'The Public Kitchen', 'topic': 'nutrition', 'genre': 'memoir', 'audience': 'general',
        'source': f'ADDAMS, Jane. Twenty years at Hull-House: with autobiographical notes. New York: Macmillan, 1910. Disponível em: https://www.gutenberg.org/ebooks/1325. {ACCESS}',
        'license': 'Domínio público — autora falecida em 1935 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.',
        'credit': 'Texto: Jane Addams (1910), domínio público.',
        'adaptation': 'Trecho do capítulo VII; texto sem alterações, omissões indicadas por […].',
        'text': T['addams'],
        'items': [
            item('detail', 3, 'Why did Hull-House open a public kitchen?', 'Overworked sewing women were feeding their families poorly.', ['Mrs. Richards wanted a branch of her Boston kitchen in Chicago.', 'There were no shops near the settlement that sold ready food.', 'Factory owners asked for cheap soups and stews for workers.'], 'D'),
            item('implicit_meaning', 4, 'What does the woman’s remark that she liked to eat “what she’d ruther” show?', 'Taste and habit mattered more to her than nutrition.', ['The kitchen’s food was too expensive for local families.', 'She did not believe the food was really nutritious.', 'She preferred the food sold in the factories.'], 'C'),
            item('nuanced_stance', 4, 'How does Addams present the kitchen project overall?', 'as a careful plan that misjudged local tastes', ['as a failure that the settlement quickly gave up', 'as a scientific success that changed local eating habits', 'as a business set up mainly to make money for Hull-House'], 'B'),
            item('inference', 4, 'What does the final paragraph suggest about the saloon halls?', 'Owners made money from people’s wish to gather.', ['They were too expensive for most immigrant families.', 'They were often closed for weddings and christenings.', 'They were managed by the residents of Hull-House.'], 'A'),
        ],
    },
    # ------------------------------------------------------------------ C2
    {
        'id': 'R-C2-007', 'level': 'C2', 'title': 'An Apology for Idlers', 'topic': 'leisure', 'genre': 'critical_essay', 'audience': 'general',
        'source': f'STEVENSON, Robert Louis. An apology for idlers. In: STEVENSON, Robert Louis. Virginibus puerisque, and other papers. London: C. Kegan Paul, 1881. Ensaio publicado originalmente em 1877. Disponível em: https://www.gutenberg.org/ebooks/386. {ACCESS}',
        'license': 'Domínio público — autor falecido em 1894 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.',
        'credit': 'Texto: Robert Louis Stevenson (1877), domínio público.',
        'adaptation': 'Trecho do início do ensaio; epígrafe e segundo parágrafo omitidos, texto sem alterações (itálicos do original não reproduzidos).',
        'text': T['stevenson'],
        'items': [
            item('nuanced_stance', 4, 'How does Stevenson define “idleness” in the first paragraph?', 'as activity that society refuses to call work', ['as a principled refusal to do anything useful whatsoever', 'as a privilege available to the wealthy ruling class', 'as a form of protest against a particular profession'], 'B'),
            item('figurative_meaning', 4, 'What is the point of the reference to Alexander and Diogenes?', 'Achievers resent indifference to their success.', ['Great conquerors secretly envied philosophers.', 'Military glory is worthless in the eyes of history.', 'The idle are usually wiser than the powerful.'], 'D'),
            item('implicit_meaning', 5, 'What does Stevenson imply about the “foolish old gentleman” at Oxford?', 'He forgot that age makes far more than reading difficult.', ['He was right that study becomes tiresome in old age.', 'He thought young people read too much and thought too little.', 'He believed Johnson would become a famous scholar.'], 'C'),
            item('rhetorical_purpose', 4, 'What is the function of the final rhetorical question?', 'to claim the truant’s wandering as real education', ['to admit that truancy cannot replace formal lectures', 'to ask readers to decide whether streets are dangerous', 'to mock Dickens and Balzac for their lack of schooling'], 'A'),
        ],
    },
    {
        'id': 'R-C2-008', 'level': 'C2', 'title': 'On the Pleasure of Hating', 'topic': 'human_nature', 'genre': 'philosophical_essay', 'audience': 'general',
        'source': f'HAZLITT, William. On the pleasure of hating. In: HAZLITT, William. The collected works of William Hazlitt. Edição de A. R. Waller e Arnold Glover. London: J. M. Dent, 1903. v. 7. Ensaio publicado originalmente em The Plain Speaker (1826). Disponível em: https://www.gutenberg.org/ebooks/58408. {ACCESS}',
        'license': 'Domínio público — autor falecido em 1830 e editores falecidos em 1905 e 1922 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.',
        'credit': 'Texto: William Hazlitt (1826), domínio público.',
        'adaptation': 'Dois primeiros parágrafos do ensaio, com cortes indicados por […]; texto sem alterações (itálicos do original não reproduzidos).',
        'text': T['hazlitt'],
        'items': [
            item('main_argument', 4, 'What does the spider episode illustrate?', 'Our conduct changes long before our feelings do.', ['Educated people no longer feel any dislike for insects.', 'Kindness to animals is a sign of intellectual progress.', 'Fear of spiders is learnt from writers and moralists.'], 'A'),
            item('nuanced_inference', 5, 'What does Hazlitt mean by “The spirit of malevolence survives the practical exertion of it”?', 'Hostile feelings remain even when we stop acting on them.', ['Cruel actions continue long after the feeling behind them has gone.', 'Malice is necessary for survival in the natural world.', 'People who act cruelly are eventually punished.'], 'B'),
            item('analogy_function', 4, 'Why does Hazlitt mention the rainbow on the cloud?', 'to show that brightness depends on contrast', ['to show that nature is fundamentally peaceful', 'to suggest that hatred is as beautiful as nature', 'to argue that pain is preferable to pleasure'], 'D'),
            item('subtle_implication', 5, 'What does the example of the town running to a fire suggest?', 'Excitement, rather than duty, draws the crowd.', ['Communities unite quickly in an emergency.', 'Spectators are disappointed when a fire spreads.', 'Newspapers encourage people to watch fires.'], 'C'),
        ],
    },
]
