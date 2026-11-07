"""Reading options for Pilot Bank v0.5 (see docs/cefr/ITEM_WRITING_GUIDELINES.md).

item id -> the four options in A–D order. The key keeps its letter, so the answer-key distribution of
v0.4 is unchanged. Distractors reuse real material from the text with the wrong relation (wrong
reason or result, wrong person or moment, true but not the answer, over-generalisation); keys
paraphrase the text instead of copying it; no option relies on absolute words the text does not use.
"""

OPTIONS = {
    # R-B1-001 — The Repair Café
    'R-B1-001-Q1': [
        'how a retired electrician repaired the writer\'s broken old toaster',
        'why repair cafés help local people to save money on new appliances',
        'how a community event changed the writer\'s view of broken things',
        'why some modern appliances are difficult to open safely',
    ],
    'R-B1-001-Q2': [
        'leave their objects with a volunteer and come back later',
        'remain with the volunteer and help with the work if they could',
        'watch the volunteers carefully without touching the tools',
        'explain to the volunteers how the object had been damaged',
    ],
    'R-B1-001-Q3': [
        'Many of the objects that people bring cannot be repaired.',
        'The volunteers are not trained to do professional repairs.',
        'It suggests a business that sells coffee or fixes things for customers.',
        'Visitors have to bring their own tools to use at the volunteers\' tables.',
    ],
    'R-B1-001-Q4': [
        'to show that making each object work again was not the point',
        'to show that some volunteers needed more practical training',
        'to explain why several visitors left the event disappointed',
        'to suggest that modern appliances are often too difficult to fix',
    ],
    # R-B1-002 — A School Without Bells
    'R-B1-002-Q1': [
        'why teachers wanted lessons to end in a more natural way',
        'how a school managed to reduce the number of late arrivals',
        'why some younger students prefer a day organised by bells',
        'what happened after a school stopped using lesson bells',
    ],
    'R-B1-002-Q2': [
        'Some students arrived late because they forgot to check the time.',
        'Some teachers had to finish their lessons earlier than they planned.',
        'Many students complained that the corridors had become too crowded.',
        'Some students could not find the new digital clocks around the school.',
    ],
    'R-B1-002-Q3': [
        'It is too much to expect from the youngest students.',
        'It matters less than making sure students arrive at lessons on time.',
        'It depends on having enough clocks around the school.',
        'It is an advantage of the system, even though it is demanding.',
    ],
    'R-B1-002-Q4': [
        'to suggest that the school may bring the bells back',
        'to give a balanced picture of opinions about the change',
        'to explain why the number of late arrivals did not fall',
        'to show that younger students find it hard to organise their day',
    ],
    # R-B1-003 — The One-Week Phone Drawer
    'R-B1-003-Q1': [
        'why the class voted to keep their phones away for a month',
        'how students became more hardworking during group activities',
        'why some students needed to be allowed exceptions to a rule',
        'how keeping phones out of reach changed the way a class worked',
    ],
    'R-B1-003-Q2': [
        'by letting those students keep their phones for class tasks',
        'by giving them other ways to calculate and to keep notes',
        'by asking them to photograph their notes during the break',
        'by moving the phone drawer closer to the students\' desks',
    ],
    'R-B1-003-Q3': [
        'Students understood the tasks more easily than before.',
        'Students had become more hardworking than they were before.',
        'Fewer short interruptions meant that less time was lost.',
        'Students talked to each other less while they were working.',
    ],
    'R-B1-003-Q4': [
        'It made a real difference in lessons, although it had limits.',
        'It should be extended to the students\' time outside school.',
        'It was less successful because some students needed exceptions.',
        'It has changed the way the writer uses a phone outside lessons.',
    ],
    # R-B1-004 — Leave What You Find (NPS, authentic)
    'R-B1-004-Q1': [
        'Dead plants and sticks are more useful than they first appear.',
        'Things found outdoors should be left in place, for several reasons.',
        'Taking objects from federal lands can be against the law for visitors.',
        'Flowers matter because they provide food for pollinators.',
    ],
    'R-B1-004-Q2': [
        'They turn into seeds that can grow into new plants.',
        'They provide pollen for insects that pollinate flowers.',
        'They offer shelter to small animals and nest material to birds.',
        'They help visitors to understand the story of the whole landscape.',
    ],
    'R-B1-004-Q3': [
        'The place where it was found is also part of the evidence.',
        'Removing it from federal lands is against the law.',
        'Cultural objects tell us less than natural objects do.',
        'Visitors cannot enjoy an object without disturbing it.',
    ],
    'R-B1-004-Q4': [
        'to explain how rangers protect cultural heritage sites',
        'to show that the rule matters more for objects than for plants',
        'to warn that visitors may enjoy their trips less than before',
        'to show that leaving items is a duty, not just good manners',
    ],
    # R-B2-001 — When Convenience Becomes a Default
    'R-B2-001-Q1': [
        'Efficiency is good as long as the technology stays invisible to the people using it.',
        'Inconvenient activities are valuable and should be kept wherever possible.',
        'Recommendation systems mainly stop people from discovering new interests.',
        'Assistance is useful, provided people stay aware of the choices made for them.',
    ],
    'R-B2-001-Q2': [
        'to show that navigation apps sometimes choose a slower route',
        'to give an example of a hidden benefit of not taking the quickest option',
        'to argue that people understand a city better when they travel through it on foot',
        'to suggest that walking should replace other ways of getting around',
    ],
    'R-B2-001-Q3': [
        'People tend to spend the time they save on things they value more.',
        'Saving twenty minutes is rarely worth losing the habit of deliberate choice.',
        'Its benefit depends on whether the time is used for something people value.',
        'Time recovered from automation is mostly spent waiting for the next task.',
    ],
    'R-B2-001-Q4': [
        'Being aware now and then of automated influence keeps other options in mind.',
        'Technology should deliberately make decisions a little harder for its users.',
        'Designers should stop trying to make their products disappear from view.',
        'Users should check regularly how much time each application saves them.',
    ],
    # R-B2-002 — The Case for Slow Expertise
    'R-B2-002-Q1': [
        'Organisations should slow down decision-making so that experts can think.',
        'Fast decisions usually reflect pressure to appear decisive, not expertise.',
        'Careful hesitation by experts can reflect knowledge rather than a lack of it.',
        'Experts should learn to speak with the kind of confidence that organisations expect.',
    ],
    'R-B2-002-Q2': [
        'as impressive language that organisations tend to reward',
        'as a sign that the speaker has not checked the assumptions',
        'as suitable for routine questions but not for complex ones',
        'as more accurate, even if it sounds less convincing',
    ],
    'R-B2-002-Q3': [
        'to argue that emergency teams need more time for their decisions',
        'to acknowledge that rapid judgement can also be a form of expertise',
        'to show that technicians are more reliable than doctors and editors',
        'to explain why organisations prefer confident answers to careful ones',
    ],
    'R-B2-002-Q4': [
        'The damage done by a confident mistake can be harder to notice than a delay.',
        'Meetings that end without a clear conclusion are a sign of poor management.',
        'Confident mistakes cost less than delays because they are noticed sooner.',
        'Delays are worth accepting when their financial cost can be measured.',
    ],
    # R-B2-003 — What Salary Ranges Change
    'R-B2-003-Q1': [
        'Making pay visible is useful, but it does not guarantee fair decisions.',
        'Salary ranges remove the advantage that confident negotiators used to have.',
        'Transparency fails when it makes existing employees uncomfortable.',
        'Salary ranges mislead because jobs with the same title can differ.',
    ],
    'R-B2-003-Q2': [
        'to argue that current staff should be paid the advertised salary',
        'to show that transparency has failed when managers feel uncomfortable',
        'to show that publishing ranges can reveal unequal pay among current staff',
        'to explain why employers prefer to keep their vacancies private',
    ],
    'R-B2-003-Q3': [
        'It is useful because it gives employers room to negotiate.',
        'It is fair because applicants see the same numbers before they apply.',
        'It stops applicants from asking for more than the top of the range.',
        'It may look transparent while giving applicants little real guidance.',
    ],
    'R-B2-003-Q4': [
        'between confident negotiators and less confident ones',
        'between salaries and benefits that are difficult to compare',
        'between making pay decisions visible and making them fair',
        'between existing employees and applicants from outside',
    ],
    # R-B2-004 — Soda Leaves High Schools (Wikinews, CC BY 2.5)
    'R-B2-004-Q1': [
        'A health alliance agreed to pay for healthier drinks in schools.',
        'High schools must replace soda with sports drinks by 2008.',
        'Bill Clinton asked lawmakers to ban soda in public schools.',
        'Major drink companies agreed to remove soda from high schools.',
    ],
    'R-B2-004-Q2': [
        'regular sodas, as long as they are sold in smaller sizes',
        'diet sodas, unsweetened teas and flavored water',
        'low-calorie sports drinks but not regular sports drinks',
        'drinks that schools ordered before the agreement',
    ],
    'R-B2-004-Q3': [
        'how many students choose diet drinks instead of soda',
        'how quickly distributors can take out vending machines',
        'how willing school districts are to revise their agreements',
        'whether the 75 percent target is met in public schools',
    ],
    # R-C1-001 — The Productivity of Not Knowing
    'R-C1-001-Q1': [
        'Uncertainty is valuable in itself and institutions should learn to preserve it.',
        'Institutions should resolve uncertainty before acting on important questions.',
        'Uncertainty should be communicated mainly through the language of probability.',
        'Precisely located uncertainty can be a sign of knowledge, not its absence.',
    ],
    'R-C1-001-Q2': [
        'to show that experts are less sure than novices about the basic facts',
        'to argue that experts should simplify their answers for organisations',
        'to suggest that novices are more honest about the limits of what they really know',
        'to illustrate that knowing more can mean describing the unknown more exactly',
    ],
    'R-C1-001-Q3': [
        'Forecasts would be clearer if they were shown as traffic-light indicators.',
        'Numerical forecasts are inherently less reliable than qualitative judgements.',
        'Figures can suggest a level of certainty that the evidence does not support.',
        'Extra decimal places make forecasts harder for decision-makers to follow.',
    ],
    'R-C1-001-Q4': [
        'It prevents the case for uncertainty from becoming an excuse for vagueness.',
        'It argues that doctors should discuss probabilities more openly with patients.',
        'It identifies demands for certainty as the main cause of poor decisions.',
        'It introduces the teaching of probability as the solution to the problem.',
    ],
    # R-C1-002 — The Problem with Perfect Preservation
    'R-C1-002-Q1': [
        'Preserving the past means choosing, and the reasons should be open to question.',
        'Digital storage has largely solved the old problem of limited space in archives.',
        'Objects are better preserved through continued use than by being sealed away.',
        'Restoration should aim to return objects to their original, authentic state.',
    ],
    'R-C1-002-Q2': [
        'Digital copies lose quality each time storage formats are updated.',
        'Keeping everything digitally ends up costing more than physical conservation.',
        'Files may still exist and yet be impossible to use without organisation.',
        'Unlabelled images are deleted once servers are no longer maintained.',
    ],
    'R-C1-002-Q3': [
        'to argue that later additions should normally be removed from old buildings and objects',
        'to challenge the idea that an object has one obvious authentic past to restore',
        'to point out that restorers rarely agree on how old an object actually is',
        'to suggest that authenticity can settle disagreements about restoration',
    ],
    'R-C1-002-Q4': [
        'Conservation should keep objects as close as possible to their condition when acquired.',
        'Institutions should explain which values and compromises guide their conservation choices.',
        'Since preservation reflects present values, decisions about it are essentially arbitrary.',
        'Institutions should give priority to whatever later generations are most likely to research.',
    ],
    # R-C1-003 — The Case for Reversible Decisions
    'R-C1-003-Q1': [
        'Institutions should avoid decisions that would be difficult to reverse later.',
        'Reversible choices can be used to gather evidence before full commitment.',
        'Temporary policies avoid most of the risks that permanent policies create.',
        'Leaders should state publicly when they intend to reverse a previous decision.',
    ],
    'R-C1-003-Q2': [
        'to show that being willing to revise a decision can be disciplined, not weak',
        'to argue that organisational policies should be tested with laboratory methods',
        'to suggest that trials can produce evidence that is free from political values',
        'to show that scientists admit failure more readily than organisational leaders',
    ],
    'R-C1-003-Q3': [
        'to argue that trials remove disagreements about values from policy debates',
        'to show that predictions are an unreliable basis for most policy decisions',
        'to explain why temporary measures are easier to present than permanent ones',
        'to add a practical benefit of trials while noting that evidence choices involve values',
    ],
    # R-C1-004 — Reading Lost Classics with Infrared Light (Wikinews, public domain)
    'R-C1-004-Q1': [
        'the rediscovery of a buried Egyptian town by Oxford researchers',
        'a new imaging method that makes unreadable ancient texts legible',
        'the discovery of parts of the Gospel of Thomas at Oxyrhynchus',
        'how the Herculaneum Scrolls were finally read in 1999',
    ],
    'R-C1-004-Q2': [
        'It photographs the papyrus in ultraviolet as well as visible light.',
        'It removes the charred surface layer to reveal the text beneath.',
        'It compares each damaged fragment with other copies of the same work.',
        'It filters light so that the ink reacts but the background does not.',
    ],
    'R-C1-004-Q3': [
        'Rainless conditions kept the discarded material safe under sand.',
        'They were stored in the town library, which was a centre of learning.',
        'Papyrus made from Nile reeds lasts longer than most writing materials.',
        'Volcanic ash sealed them, just as it did at Herculaneum.',
    ],
    'R-C1-004-Q4': [
        'It consists mainly of literary works that were thrown away by mistake.',
        'It is too badly damaged to tell historians much about daily life.',
        'Most of it is everyday documents rather than literature.',
        'Scholars gathered the documents over a period of seven centuries.',
    ],
    # R-C2-001 — Against the Tyranny of the Representative Example
    'R-C2-001-Q1': [
        'They are most useful for communicating findings once the analysis is complete.',
        'They should be balanced by statistics so that public debate stays calm and unemotional.',
        'They become reliable evidence of frequency when they are carefully selected.',
        'They can reveal what data miss, but cannot alone show how common something is.',
    ],
    'R-C2-001-Q2': [
        'Statistics tend to show that exceptional stories are rarer than people assume.',
        'Ordinary outcomes seldom have the shape that makes a story compelling.',
        'Readers struggle to follow averages unless they are given a human example.',
        'Researchers prefer results that cluster in the middle because they are easier to explain.',
    ],
    'R-C2-001-Q3': [
        'It shows that institutions rely too heavily on personal testimony.',
        'It argues that qualitative knowledge is more trustworthy than statistical data.',
        'It explains why anecdotes belong at the communication stage of an analysis.',
        'It complicates the critique: dismissing lived experience is another error.',
    ],
    'R-C2-001-Q4': [
        'Vivid examples are usually exceptions to the general pattern.',
        'Memorable stories have no place in serious public debate.',
        'Memorable stories may escape the scrutiny normally applied to evidence.',
        'Vivid stories spread faster than the corrections that follow them.',
    ],
    # R-C2-002 — The Useful Friction of Translation
    'R-C2-002-Q1': [
        'Translation succeeds when readers no longer notice that a translator was involved.',
        'Translators should keep unfamiliar features even when they obscure the meaning.',
        'Good translation decides on principle which differences to keep, adapt or reveal.',
        'Most of what is lost in translation could be avoided with better technique.',
    ],
    'R-C2-002-Q2': [
        'Unavoidable compromises force the translator to decide which features matter most to keep.',
        'Translators should spread unavoidable losses evenly across rhythm, tone and overall meaning.',
        'Most of what disappears in translation can be prevented by careful choices.',
        'Features such as puns cannot be translated and are best explained in notes.',
    ],
    'R-C2-002-Q3': [
        'to show that interpretive variation can coexist with recognisable fidelity to a source',
        'to show that, like a musical performance, translation involves no real loss of meaning',
        'to argue that readers should judge translations as they judge performances',
        'to show that translators have as little freedom as musicians reading a score',
    ],
    'R-C2-002-Q4': [
        'the belief that fidelity matters more than fluency in a translation',
        'the impression that the reader is meeting the original work directly',
        'the hope that most readers will pay attention to notes and prefaces',
        'the assumption that the receiving language brings no associations of its own',
    ],
    # R-C2-003 — The Authority of the First Draft
    'R-C2-003-Q1': [
        'Later versions are usually more authentic because they reflect experience.',
        'First versions deserve special weight because they are the closest to the maker\'s intention.',
        'Versions offer different evidence, so being earliest does not settle authenticity.',
        'Authenticity is best judged by the version the creator finally chose.',
    ],
    'R-C2-003-Q2': [
        'Digital archives keep so many versions that the first is hard to identify.',
        'Archivists sometimes damage early drafts while trying to preserve them.',
        'Creators conceal failed attempts so that later work looks spontaneous.',
        'What happens to survive can make a later stage look like the beginning.',
    ],
    'R-C2-003-Q3': [
        'to show that revision must be judged on its effects, not on chronology',
        'to argue that artists revise for better reasons than institutions do',
        'to show that revision tends to remove the energy of an early version',
        'to suggest preferring later versions when experience exposes ambiguities',
    ],
    'R-C2-003-Q4': [
        'Creators often lose sight of what they originally aimed for during long revisions.',
        'A work\'s purpose can develop through making and revision, not exist from the start.',
        'Version histories reveal the single intention behind each change.',
        'Intentions can no longer be studied once several versions exist.',
    ],
    # R-C2-004 — On Silencing an Opinion (Mill, public domain)
    'R-C2-004-Q1': [
        'A majority may silence an opinion once almost everyone agrees it is false.',
        'Governments may suppress opinions that the public largely rejects.',
        'Silencing any opinion wrongs everyone, since it assumes a certainty no one has.',
        'Since opinions belong to individuals, silencing one is merely a private injury.',
    ],
    'R-C2-004-Q2': [
        'to show that people\'s certainties often reflect where they happen to live',
        'to show that religious belief is stronger in some countries than in others',
        'to argue that people should travel in order to understand other beliefs',
        'to show that individuals trust their own judgment more than their society\'s',
    ],
    'R-C2-004-Q3': [
        'the opportunity of exchanging an error for the truth itself',
        'the chance for the minority to persuade the generations that come after them',
        'little of value, since the error is simply removed from debate',
        'a clearer, livelier grasp of the truth that collision with error gives',
    ],
    'R-C2-004-Q4': [
        'They no longer assume that their own views are infallible.',
        'They still treat the views shared by their own circle as beyond doubt.',
        'They trust their solitary judgment more than absolute princes do.',
        'They rely more on their own judgment than on the views of the people around them.',
    ],
    # R-A2-001 — Community Garden Volunteers
    'R-A2-001-Q1': [
        'to ask people to give vegetables to a food centre',
        'to tell volunteers that a session is cancelled',
        'to invite people to help in a garden',
        'to explain what clothes to wear in the garden',
    ],
    'R-A2-001-Q4': [
        'to give vegetables to the volunteers',
        'to help a food centre in the area',
        'to sell them at the Saturday meeting',
        'to show new volunteers what to do',
    ],
    # R-A2-002 — A Change of Plans
    'R-A2-002-Q2': [
        'Her parents want her to collect her cousin.',
        'She is travelling to Recife that afternoon.',
        'She has football practice on Friday.',
        'Her cousin wants to go to the cinema with her.',
    ],
    'R-A2-002-Q3': [
        'She wants to have dinner after the film.',
        'The 9:45 film is not on that Saturday.',
        'Her cousin is arriving late on Saturday.',
        'She has an early activity the next morning.',
    ],
    # R-A2-003 — A First Morning at the Market
    'R-A2-003-Q4': [
        'arrive at the market after ten',
        'stay on the bus for one more stop',
        'take bus 16 instead of walking',
        'go to the market with her sister',
    ],
    # R-A2-004 — Making Healthy Choices (VOA, public domain)
    'R-A2-004-Q2': [
        'to a very large supermarket',
        'to a fruit and vegetable shop',
        'to an ice cream shop nearby',
        'to a café that sells junk food',
    ],
    'R-A2-004-Q3': [
        'two people who work at the supermarket',
        'two voices in Anna\'s mind about food',
        'Ashley and one of her friends',
        'two people talking on the web',
    ],
    # R-A1-001 — Saturday at the Library
    'R-A1-001-Q2': ['10 minutes', 'four hours', '30 minutes', 'one hour'],
    'R-A1-001-Q3': ['people who use the computers', 'people who come on Sunday', 'people who bring food', 'children'],
    # R-A1-002 — Message from Diego
    'R-A1-002-Q2': ['at the pool in the sports centre', 'at the café opposite the centre', 'at the café inside the centre', 'at the swimming class'],
    'R-A1-002-Q4': ['a blue swimming cap', 'a black jacket', 'his sports bag', 'his blue jacket'],
    # R-A1-003 — After-School Art Club
    'R-A1-003-Q4': ['bring paper and paint', 'come to Room 12 at 3:30', 'speak to Ms Green before Tuesday', 'bring a friend from another school'],
    # R-A1-004 — Grand Canyon Visitor Centers (NPS, public domain)
    'R-A1-004-Q3': ['every day', 'on Saturday and Sunday', 'from Monday to Friday', 'in the summer'],
}
