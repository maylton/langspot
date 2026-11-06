"""Authentic Reading tasklets added in Pilot Bank v0.4 (one per CEFR level).

Every text is public domain or openly licensed for reuse with attribution, and carries its
ABNT (NBR 6023:2018) reference, licence, the credit shown to students and the extent of
adaptation. Items are original LangSpot items; answer keys keep A–D balance (6 each).
"""

TASKLETS = [{'id': 'R-A1-004',
  'level': 'A1',
  'title': 'Grand Canyon Visitor Centers',
  'topic': 'travel',
  'genre': 'notice',
  'audience': 'general',
  'source': 'NATIONAL PARK SERVICE (Estados Unidos). Visitor centers, information desks, and museums. Grand Canyon National Park, 12 out. 2026. '
            'Disponível em: https://www.nps.gov/grca/planyourvisit/visitorcenters.htm. Acesso em: 6 nov. 2026.',
  'license': 'Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403).',
  'credit': 'Texto: National Park Service (EUA), domínio público.',
  'adaptation': 'Trecho com informações de dois centros de visitantes; texto original, diagramado como aviso.',
  'items': [('specific_information', 2, 'What time does the Grand Canyon Visitor Center open?', ['8 am', '4 pm', '9 am', '6 pm'], 'C'),
            ('specific_information', 2, "What time does Verkamp's Visitor Center close?", ['9 am', '4 pm', '8 am', '6 pm'], 'D'),
            ('basic_gist',
             2,
             'When are the two visitor centers open?',
             ['every day', 'only on weekends', 'only in summer', 'only in the morning'],
             'A'),
            ('specific_information',
             3,
             'Where can you learn about the history of Grand Canyon Village?',
             ['at the Grand Canyon Visitor Center', "at Verkamp's Visitor Center", 'at the Junior Ranger office', 'at the South Rim train station'],
             'B')],
  'text': 'GRAND CANYON VISITOR CENTER (SOUTH RIM)\n'
          'Open daily, 9 am–4 pm.\n'
          'Junior Ranger books/badges\n'
          '\n'
          "VERKAMP'S VISITOR CENTER\n"
          'Located in the Village Historic District: Open daily, 8 am–6 pm\n'
          "Verkamp's features exhibits about the history of Grand Canyon Village and a museum store."},
 {'id': 'R-A2-004',
  'level': 'A2',
  'title': 'Making Healthy Choices',
  'topic': 'health',
  'genre': 'dialogue',
  'audience': 'general',
  'source': "VOICE OF AMERICA. Lesson 44: making healthy choices. In: LET'S LEARN English: level 1. Washington, DC: VOA Learning English, 13 jul. "
            '2019. Disponível em: https://learningenglish.voanews.com/a/lets-learn-english-lesson-44-making-healthy-choices/3688552.html. Acesso em: '
            '6 nov. 2026.',
  'license': 'Domínio público — conteúdo produzido pela Voice of America (VOA Terms of Use; Request Our Content).',
  'credit': 'Texto: VOA Learning English, domínio público.',
  'adaptation': 'Trecho inicial do diálogo, sem alterações; inclui a nota original sobre “Healthy” e “Junky”.',
  'items': [('basic_gist',
             2,
             "What is Anna's problem at the start of the conversation?",
             ['She cannot find the Giant supermarket today.',
              'She does not like fruit or vegetables.',
              'She has no money to buy food today.',
              'She wants junk food but knows it is bad.'],
             'D'),
            ('specific_information',
             2,
             'Where does Ashley tell Anna to go?',
             ['to a big supermarket', 'to a café near her home', 'to a bakery on her street', 'to a restaurant with friends'],
             'A'),
            ('reference',
             3,
             "Who are 'Healthy' and 'Junky'?",
             ['two people who work at the supermarket',
              "two voices in Anna's mind about food",
              "Anna's friends from her new office",
              "Ashley's younger brother and sister"],
             'B'),
            ('detail',
             3,
             'What does Junky say about celery?',
             ['It is very expensive.', 'It is good for her heart.', 'It is mostly water.', "It is Anna's favourite food."],
             'C')],
  'text': 'Anna: Hi there, Ashley!\n'
          'Ashley: Anna! Hi! Where are you going?\n'
          '(Anna’s stomach growls loudly)\n'
          'Ashley: What was that?\n'
          'Anna: I’m hungry. When I’m hungry, I only want to eat junk food! But I know I should eat healthy food. So, I fight with myself. One side '
          'says, ‘You should eat healthy food.’ The other side says, ‘But I want to eat junk food!’\n'
          'Ashley: Well, Anna, go to the Giant supermarket. You should be able to find all kinds of food there - for all of you.\n'
          'Anna: Good idea, Ashley. See you later!\n'
          "Ashley: 'Bye, Anna.\n"
          'Anna: Wow! This supermarket is huge! Look at all of these fruits and vegetables! I should eat more vegetables.\n'
          'Healthy: Good idea, Anna. You must eat more vegetables … like celery!\n'
          'Junky: Celery?! Do you know what the web says about celery?\n'
          'Anna: No, what?\n'
          'Junky: “Celery is 95 percent water - 100 percent NOT ice cream. I love the web!”\n'
          '\n'
          'Note: "Healthy" and "Junky" are Anna\'s thoughts about what she should eat.'},
 {'id': 'R-B1-004',
  'level': 'B1',
  'title': 'Leave What You Find',
  'topic': 'environment',
  'genre': 'informative_article',
  'audience': 'general',
  'source': "NATIONAL PARK SERVICE (Estados Unidos). I didn't know that!: Leave No Trace principle #4 – leave what you find. [S. l.]: NPS, 23 dez. "
            '2024. Disponível em: https://www.nps.gov/articles/000/idkt_lnt4.htm. Acesso em: 6 nov. 2026.',
  'license': 'Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403).',
  'credit': 'Texto: National Park Service (EUA), domínio público.',
  'adaptation': 'Trecho; frases originais, omissões indicadas por […].',
  'items': [('main_idea',
             3,
             'What is the main message of the text?',
             ['Visitors may take natural items if they collect them carefully.',
              'Natural and cultural items should stay where people find them.',
              'Rangers should remove dead plants to keep the parks clean.',
              'Old objects should go to museums so they are protected.'],
             'B'),
            ('detail',
             3,
             'According to the text, why are dead leaves and sticks useful?',
             ['They make the park look neater for visitors.',
              'They stop people from walking off the main trails.',
              'They give animals cover and material for nests.',
              'They are the main food for most park birds.'],
             'C'),
            ('inference',
             4,
             "Why is the 'story' of an artifact harder to understand after someone takes it?",
             ['Where it was found also tells us about the past.',
              'Park rangers lose the records of who visited the place.',
              'The artifact becomes too valuable for scientists to study.',
              'Photographs of artifacts are not allowed in the parks.'],
             'A'),
            ('writer_purpose',
             4,
             'Why does the text mention the law?',
             ['to explain how visitors can get permission to collect rocks',
              "to warn that rangers check every visitor's bag at the exit",
              'to list the fines for taking flowers from national parks',
              'to show that leaving items is a duty, not just good manners'],
             'D')],
  'text': 'Leave what you find is one of the 7 Leave No Trace Principles. These Principles empower you to leave nature as unchanged by your presence '
          'as possible. […]\n'
          '\n'
          'The items we find in nature have a role to play, either in the ecosystem or the story of the landscape. Leaving what we find in place '
          'helps to preserve both.\n'
          '\n'
          'All natural items play a role in their ecosystems. For example, flowers are more than just beautiful. They are also important sources of '
          'pollen for pollinators. And, if fertilized, they become seeds or fruit, which could be food for other animals or become new flowers!\n'
          '\n'
          'Even dead things have a role to play! For example, dead leaves and sticks might seem to have no purpose, but they actually play a big '
          'role. They can provide cover for amphibians, reptiles, insects, and even pollinators. Birds can use them to build their nests. […]\n'
          '\n'
          'Just as with natural items, it is important to leave cultural items and artifacts where you find them. These items, and their original '
          'locations, tell us a story of our shared heritage. When they are taken, that story is harder to piece together. […]\n'
          '\n'
          'Leaving what you find isn’t just good etiquette, it’s also the law—especially on federal lands. […]\n'
          '\n'
          'Leaving what you find doesn’t have to put a damper on your outdoor experience. There are many ways to appreciate and enjoy found items '
          'without disturbing them or taking them with you.'},
 {'id': 'R-B2-004',
  'level': 'B2',
  'title': 'Soda Leaves High Schools',
  'topic': 'health',
  'genre': 'news_report',
  'audience': 'teen_adult',
  'source': 'SOFT drink companies to stop high school soda sales. Wikinews, [s. l.], 4 maio 2006. Disponível em: '
            'https://en.wikinews.org/wiki/Soft_drink_companies_to_stop_high_school_soda_sales. Acesso em: 6 nov. 2026.',
  'license': 'Creative Commons Atribuição 2.5 Genérica (CC BY 2.5) — https://creativecommons.org/licenses/by/2.5/ — crédito: Wikinews.',
  'credit': 'Texto: Wikinews, “Soft drink companies to stop high school soda sales”, CC BY 2.5.',
  'adaptation': 'Cinco primeiros parágrafos; texto sem alterações.',
  'items': [('main_idea',
             3,
             'What is the main news in the article?',
             ['California has banned every sugary drink for all children.',
              'High schools will stop selling any kind of drink to students.',
              'The Clinton Foundation will pay for healthier school meals.',
              'Drink companies agreed to stop selling soda in high schools.'],
             'D'),
            ('detail',
             3,
             'Which drinks will high schools still be able to sell?',
             ['regular sodas, as long as the cans are much smaller',
              'diet sodas, unsweetened teas and flavored water',
              'only milk and fruit juice with no added sugar',
              'any drinks the schools bought before the deal'],
             'B'),
            ('inference',
             4,
             'What will partly decide how quickly the changes happen?',
             ['how many students decide to switch to diet drinks',
              'the price that school vending machines charge for each drink',
              'whether school districts agree to change their contracts',
              'new laws that each state government must pass first'],
             'C'),
            ('speaker_attitude',
             4,
             'How does Bill Clinton present the agreement?',
             ['as a step forward, although much work is still needed',
              'as a complete solution to the problem of childhood obesity',
              'as a decision the law forced the companies to accept',
              "as a deal that mainly improves the drink industry's image"],
             'A')],
  'text': 'Most U.S. soft drink companies will stop selling their soda products at high schools across the nation as part of a soft drink industry '
          'deal that aims to reduce childhood obesity.\n'
          '\n'
          "The agreement, announced Wednesday morning by the William J. Clinton Foundation, means that the nation's biggest beverage distributors, "
          'Coca Cola Co., Pepsico, Cadbury Schweppes PLC, and the American Beverage Association, will pull their soda products from vending machines '
          'and cafeterias in schools serving about 35 million students, according to the Alliance for a Healthier Generation, a joint initiative '
          'between the Clinton Foundation and the American Heart Association.\n'
          '\n'
          '"This is an important announcement and a bold step forward in the struggle to help America\'s kids live healthier lives," said Bill '
          'Clinton, according to a press release from the foundation. "These industry leaders recognize that childhood obesity is a problem and have '
          'stepped up to help solve it. I commend them for being here today and for taking this important step. There is a lot of work to be done to '
          'turn this problem around but this is a big step in the right direction and it will help improve the diet of millions of students across '
          'the country."\n'
          '\n'
          'Under the agreement, high schools will still be able to purchase drinks such as diet and unsweetened teas, diet sodas, sports drinks, '
          'flavored water, seltzer, and low-calorie sports drinks for resale to students.\n'
          '\n'
          "The companies plan to stop soda sales at 75 percent of the nation's public schools by the 2008-2009 school year, and at all schools in "
          "the following school year. The speed of the changes will depend in part on school districts' willingness to change their contracts with "
          'the beverage distributors, the release said.'},
 {'id': 'R-C1-004',
  'level': 'C1',
  'title': 'Reading Lost Classics with Infrared Light',
  'topic': 'science',
  'genre': 'news_report',
  'audience': 'adult',
  'source': 'INFRARED technology enables recovery of lost classical writings. Wikinews, [s. l.], 20 abr. 2005. Disponível em: '
            'https://en.wikinews.org/wiki/Infrared_technology_enables_recovery_of_lost_classical_writings. Acesso em: 6 nov. 2026.',
  'license': 'Domínio público — artigo da Wikinews publicado antes de 25 set. 2005 (Wikinews:Copyright).',
  'credit': 'Texto: Wikinews, domínio público.',
  'adaptation': 'Trecho do início até a seção “Classical and Christian Writings”; intertítulos removidos, texto sem alterações.',
  'items': [('main_idea',
             4,
             'What is the article mainly about?',
             ['the rediscovery of a buried Egyptian town by Oxford researchers',
              'a new imaging method that makes unreadable ancient texts legible',
              "NASA's long search for written records on the surfaces of other planets",
              'a dispute among scholars over who should keep the papyri'],
             'B'),
            ('detail',
             4,
             'How does multi-spectral imaging make the writing visible?',
             ['It chemically restores ink that has faded over the centuries.',
              'It digitally rebuilds missing fragments from similar documents.',
              'It heats the papyrus slightly so that the letters grow darker.',
              'It uses infrared light that shows the ink but not the papyrus.'],
             'D'),
            ('inference',
             4,
             'Why have so many papyri survived at Oxyrhynchus?',
             ['Dry conditions preserved the discarded material under sand.',
              "They were kept safely in the town's library for many centuries.",
              'Monks copied them again and again over seven centuries.',
              'Volcanic ash sealed them, just as it did at Herculaneum.'],
             'A'),
            ('implicit_meaning',
             5,
             "What does the phrase 'the random waste-paper of seven centuries' suggest about the collection?",
             ['Its owners deliberately threw away the most valuable texts.',
              'It is too badly damaged to be of real use to historians.',
              'Most of it is everyday documents rather than literature.',
              'Its scribes were careless and made many copying errors.'],
             'C')],
  'text': 'Papyrologists at Oxford University in England last week reported major literary finds in examining old fragments of papyrus with a new '
          'technique: multi-spectral imaging (MSI). The fragments were unearthed near the buried town of Oxyrhynchus, Egypt in a major '
          'archaeological find a century ago. Many of the fragments were unable to be read until now.\n'
          '\n'
          'Multi-Spectral Imaging (MSI) is based on technology originally developed by NASA to photograph features of other worlds in bands beyond '
          'the visible spectrum, both infrared and ultraviolet. The technology was adapted by researchers at Brigham Young University to filter a '
          'narrow bandwidth of infrared light, which reacts with ink but not the surrounding material, making the writing stand out more easily and '
          'plainly than before and enabling non-destructive photographs of formerly invisible text to be taken.\n'
          '\n'
          'MSI was successfully used in 1999 to read many of the Herculaneum Scrolls, which were considered to be blank or charred beyond '
          'recognition until then. Herculaneum was a town in ancient Italy that was buried next to Pompeii in its volcanic eruption of 79 AD, '
          'leaving many scrolls damaged but naturally preserved.\n'
          '\n'
          'Oxyrhynchus, whose name means "sharp-nose", was a town located along a tributary of the Nile in ancient Egypt and populated largely by '
          "Greek immigrants. The name refers to a river-dwelling fish with a long snout that was worshiped as the town's patron deity by a local "
          'cult.\n'
          '\n'
          "In between the town's surrounding wall and the local farmlands, there developed a number of dumping sites for papyrus and other "
          'materials, many of which have survived to the present day buried under mounds of sand because of dry, rainless local conditions. Papyrus, '
          'a paper-like writing surface made from reeds along the Nile river, normally does not last and no actual books written on ancient papyri '
          'have been uncovered.\n'
          '\n'
          'The site was explored in the late 19th century by Bernard Grenfell and Arthur Hunt of Oxford University, during which about 100,000 '
          'fragments of papyrus were unearthed, which today are stored at Sackler Library, Oxford, in the largest collection of its kind in the '
          'world.\n'
          '\n'
          'Oxyrhynchus was not noted as a center of learning, and 90% of the fragments found there are expected to be mundane yet useful in '
          'reconstructing ancient daily life, including such things as "codes, edicts, registers, official correspondence, census-returns, '
          'tax-assessments, petitions, court-records; sales, leases, wills, bills, accounts, inventories, horoscopes, [and] private letters". '
          'According to researchers on the project, "the mass of unedited material represents the random waste-paper of seven centuries of '
          'Greco-Egyptian life."\n'
          '\n'
          'The remaining 10% could possibly contain unknown portions of literary classics of Greek and Roman antiquity, or even lost Christian '
          'gospel copies or apocryphal writings. Among the items currently being worked on are parts of a play by Sophocles, a lost novel by Lucian, '
          'mythological poetry by Parthenius of Nicaea, an elegiac poem by Archilochus, and other writings by Euripides and Hesiod.\n'
          '\n'
          'Given that Oxyrhynchus was also the site of a discovery of portions of the Gospel of Thomas (although that discovery was later '
          'overshadowed by the discovery of a more complete copy among the Dead Sea Scrolls), many classical scholars are excited by the new '
          'discoveries.'},
 {'id': 'R-C2-004',
  'level': 'C2',
  'title': 'On Silencing an Opinion',
  'topic': 'society',
  'genre': 'philosophical_essay',
  'audience': 'adult',
  'source': 'MILL, John Stuart. On liberty. London: The Walter Scott Publishing, [1901]. Obra publicada originalmente em 1859. Disponível em: '
            'https://www.gutenberg.org/ebooks/34901. Acesso em: 6 nov. 2026.',
  'license': 'Domínio público — autor falecido em 1873 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.',
  'credit': 'Texto: John Stuart Mill, On Liberty (1859), cap. II, domínio público.',
  'adaptation': 'Trecho do capítulo II; texto sem alterações (itálicos do original não reproduzidos).',
  'items': [('main_argument',
             5,
             "Which statement best captures Mill's central claim in this passage?",
             ['A majority may silence an opinion once almost everyone agrees it is false.',
              'Governments may suppress an opinion only when public opinion supports it.',
              'Silencing any opinion wrongs everyone, since it assumes a certainty no one has.',
              'Since opinions belong to individuals, silencing one is merely a private injury.'],
             'C'),
            ('rhetorical_purpose',
             5,
             "Why does Mill mention a man who would be 'a Churchman in London' but 'a Buddhist or a Confucian in Pekin'?",
             ['to show that what people feel sure of often depends on accident',
              'to praise the variety of religious belief found in large cities',
              'to argue that Western beliefs are more reliable than Eastern ones',
              'to describe how religious ideas travelled between England and China'],
             'A'),
            ('implicit_meaning',
             5,
             'According to Mill, what is lost when a false opinion is silenced?',
             ['the opportunity of exchanging an error for the truth itself',
              'the right of minorities to vote on contested questions of public policy',
              'nothing of real value, since a false opinion can never teach us anything',
              'a clearer, livelier grasp of the truth that collision with error gives'],
             'D'),
            ('nuanced_inference',
             5,
             "What does Mill imply about people who 'sometimes hear their opinions disputed'?",
             ['They are entirely free from any assumption of their own infallibility.',
              'They still treat the views shared by their own circle as beyond doubt.',
              'They trust their solitary judgment more than absolute princes do.',
              'They refuse to defer to the opinions of any group around them.'],
             'B')],
  'text': 'If all mankind minus one, were of one opinion, and only one person were of the contrary opinion, mankind would be no more justified in '
          'silencing that one person, than he, if he had the power, would be justified in silencing mankind. Were an opinion a personal possession '
          'of no value except to the owner; if to be obstructed in the enjoyment of it were simply a private injury, it would make some difference '
          'whether the injury was inflicted only on a few persons or on many. But the peculiar evil of silencing the expression of an opinion is, '
          'that it is robbing the human race; posterity as well as the existing generation; those who dissent from the opinion, still more than '
          'those who hold it. If the opinion is right, they are deprived of the opportunity of exchanging error for truth: if wrong, they lose, what '
          'is almost as great a benefit, the clearer perception and livelier impression of truth, produced by its collision with error.\n'
          '\n'
          'It is necessary to consider separately these two hypotheses, each of which has a distinct branch of the argument corresponding to it. We '
          'can never be sure that the opinion we are endeavouring to stifle is a false opinion; and if we were sure, stifling it would be an evil '
          'still.\n'
          '\n'
          'First: the opinion which it is attempted to suppress by authority may possibly be true. Those who desire to suppress it, of course deny '
          'its truth; but they are not infallible. They have no authority to decide the question for all mankind, and exclude every other person '
          'from the means of judging. To refuse a hearing to an opinion, because they are sure that it is false, is to assume that their certainty '
          'is the same thing as absolute certainty. All silencing of discussion is an assumption of infallibility. Its condemnation may be allowed '
          'to rest on this common argument, not the worse for being common.\n'
          '\n'
          'Unfortunately for the good sense of mankind, the fact of their fallibility is far from carrying the weight in their practical judgment, '
          'which is always allowed to it in theory; for while every one well knows himself to be fallible, few think it necessary to take any '
          'precautions against their own fallibility, or admit the supposition that any opinion, of which they feel very certain, may be one of the '
          'examples of the error to which they acknowledge themselves to be liable. Absolute princes, or others who are accustomed to unlimited '
          'deference, usually feel this complete confidence in their own opinions on nearly all subjects. People more happily situated, who '
          'sometimes hear their opinions disputed, and are not wholly unused to be set right when they are wrong, place the same unbounded reliance '
          "only on such of their opinions as are shared by all who surround them, or to whom they habitually defer: for in proportion to a man's "
          'want of confidence in his own solitary judgment, does he usually repose, with implicit trust, on the infallibility of "the world" in '
          'general. And the world, to each individual, means the part of it with which he comes in contact; his party, his sect, his church, his '
          'class of society: the man may be called, by comparison, almost liberal and large-minded to whom it means anything so comprehensive as his '
          'own country or his own age. Nor is his faith in this collective authority at all shaken by his being aware that other ages, countries, '
          'sects, churches, classes, and parties have thought, and even now think, the exact reverse. He devolves upon his own world the '
          'responsibility of being in the right against the dissentient worlds of other people; and it never troubles him that mere accident has '
          'decided which of these numerous worlds is the object of his reliance, and that the same causes which make him a Churchman in London, '
          'would have made him a Buddhist or a Confucian in Pekin. Yet it is as evident in itself as any amount of argument can make it, that ages '
          'are no more infallible than individuals; every age having held many opinions which subsequent ages have deemed not only false but absurd; '
          'and it is as certain that many opinions, now general, will be rejected by future ages, as it is that many, once general, are rejected by '
          'the present.'}]
