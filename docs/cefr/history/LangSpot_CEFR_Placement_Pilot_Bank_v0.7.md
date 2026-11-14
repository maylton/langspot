# LangSpot CEFR Placement Pilot Bank v0.7 — Revised Productive Tasks

**Documento:** Banco Piloto de Itens para o Sistema de Avaliação do LangSpot  
**Versão:** 0.7 — 0.6 com as tarefas de Writing, Speaking e Mediation revisadas segundo docs/cefr/ITEM_WRITING_GUIDELINES.md (2026-11-07)  
**Framework:** CEFR/QECR — A1 a C2  
**Finalidade:** placement pilot real no LangSpot, revisão vertical, coleta inicial de dados e preparação do banco operacional  
**Status de QA:** **VALIDADO INTERNAMENTE PARA PILOTAGEM**  
**Importante:** esta versão passou por revisão estrutural, linguística e pedagógica interna, mas **ainda não é psicometricamente calibrada**. Classificações CEFR operacionais só devem ganhar maior força após pilotagem com estudantes, análise dos itens, revisão de cut scores e standard setting.

---

## 1. Escopo do Placement Pilot Bank v0.2

O banco consolidado contém **300 unidades avaliativas**, com cobertura vertical de A1 a C2:

| Área | Quantidade por nível | Total |
|---|---:|---:|
| Reading | 3 tasklets × 4 itens = **12** | **72 itens** |
| Listening | 3 tasklets × 4 itens = **12** | **72 itens** |
| Language Use | **15 itens** | **90 itens** |
| Writing | **3 prompts** | **18 prompts** |
| Spoken Production | **3 prompts** | **18 prompts** |
| Spoken Interaction | **3 tasks** | **18 tasks** |
| Mediation | **2 tasks** | **12 tasks** |
| **Total** | **50 unidades por nível** | **300** |

O banco é maior do que qualquer aplicação individual. Os itens devem ser selecionados conforme o blueprint de `floor → target → ceiling` descrito na Parte II.

---

# 2. Política de alternativas e prevenção de padrões

As questões objetivas usam quatro alternativas (`A–D`). A chave desta versão foi deliberadamente auditada para evitar pistas não relacionadas à proficiência.

### Regras aplicadas

- distribuição global equilibrada de chaves;
- distribuição equilibrada dentro de Reading e Listening;
- distribuição quase uniforme de chaves dentro de Language Use;
- nenhuma sequência de três respostas corretas com a mesma letra no ordenamento consolidado;
- ausência de padrões cíclicos deliberados na montagem dos forms;
- QA de chave aplicado novamente a cada form exportado ou não embaralhado;
- distractors semanticamente plausíveis;
- ausência de alternativas do tipo “all of the above”;
- revisão de comprimento das alternativas para evitar que a correta seja sistematicamente a mais longa;
- quatro opções distintas em todos os itens;
- apenas uma resposta defensável em cada MCQ.

### Distribuição final da chave

| Resposta | Reading | Listening | Language Use | Total |
|:---:|---:|---:|---:|---:|
| A | 18 | 18 | 23 | **59** |
| B | 18 | 18 | 22 | **58** |
| C | 18 | 18 | 23 | **59** |
| D | 18 | 18 | 22 | **58** |

> Em produção, o LangSpot poderá embaralhar a posição das opções por tentativa quando isso não alterar o constructo. O balanceamento acima é uma medida de QA do banco, não um padrão que deve ser ensinado ao candidato.

---

# 3. Critérios de QA aplicados antes da entrega

Foram verificados:

1. IDs únicos;
2. quantidade correta por skill e nível;
3. quatro alternativas distintas em cada MCQ;
4. resposta correta presente exatamente uma vez;
5. chave equilibrada;
6. ausência de padrões longos previsíveis na chave;
7. ausência de duplicação exata de stems;
8. comprimento de Reading compatível com a especificação;
9. duração estimada de Listening compatível com a especificação;
10. progressão vertical A1→C2;
11. adequação do processo avaliado ao nível;
12. plausibilidade dos distractors;
13. ausência de conhecimento externo necessário;
14. adequação de tema e público;
15. separação entre Language Use e proficiência comunicativa;
16. Writing e Speaking avaliáveis por rubrica;
17. Mediation baseada em seleção/reformulação de informação, não mera tradução literal.

### Resultado

**300/300 unidades passaram pela revisão interna para uso em pilotagem de plataforma.**

Isso significa **aprovação pedagógica para pilotagem**, não validação psicométrica definitiva.

---

# 4. Reading Bank

## Orientação de aplicação

Cada tasklet contém um texto e quatro itens. Os quatro itens não devem medir exatamente o mesmo processo. Nos níveis mais altos, a dificuldade vem principalmente de inferência, posição, estrutura argumentativa, implicação e nuance — não apenas de vocabulário incomum.


## A1 — Basic User — Breakthrough

### R-A1-001 — Saturday at the Library
**Topic:** daily_life  
**Genre:** notice  
**Audience:** general  
**Input length:** 31 words

#### Input

LIBRARY NOTICE

Saturday opening: 9:00–13:00
Story time for children: 10:30
Computers are free for 30 minutes.
Please do not eat or drink near the computers.
The library is closed on Sunday.

#### Items

1. **R-A1-001-Q1 — specific_information (difficulty 2/5)**

What time does the library open on Saturday?

- **A.** 13:00
- **B.** 10:30
- **C.** 9:00
- **D.** 10:00

2. **R-A1-001-Q2 — specific_information (difficulty 2/5)**

How long can a person use a computer for free?

- **A.** 10 minutes
- **B.** four hours
- **C.** 30 minutes
- **D.** one hour

3. **R-A1-001-Q3 — basic_gist (difficulty 2/5)**

Who is the story time for?

- **A.** people who use the computers
- **B.** people who come on Sunday
- **C.** people who bring food
- **D.** children

4. **R-A1-001-Q4 — specific_information (difficulty 2/5)**

What is not allowed near the computers?

- **A.** eating or drinking
- **B.** reading books
- **C.** using the library on Saturday
- **D.** talking to children

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A1-001-Q1` | **C** | specific_information | 2/5 |
| `R-A1-001-Q2` | **C** | specific_information | 2/5 |
| `R-A1-001-Q3` | **D** | basic_gist | 2/5 |
| `R-A1-001-Q4` | **A** | specific_information | 2/5 |

### R-A1-002 — Message from Diego
**Topic:** relationships  
**Genre:** message  
**Audience:** general  
**Input length:** 32 words

#### Input

Hi Ana,
I’m at the sports centre. My swimming class finishes at 6:15. Can you meet me at the café opposite the centre at 6:30? I’m wearing my blue jacket today.
Diego

#### Items

1. **R-A1-002-Q1 — basic_gist (difficulty 3/5)**

Why does Diego write to Ana?

- **A.** to say where and when to meet
- **B.** to invite her to swim
- **C.** to cancel a swimming class
- **D.** to ask for a blue jacket

2. **R-A1-002-Q2 — specific_information (difficulty 2/5)**

Where should Ana meet Diego?

- **A.** at the pool in the sports centre
- **B.** at the café opposite the centre
- **C.** at the café inside the centre
- **D.** at the swimming class

3. **R-A1-002-Q3 — specific_information (difficulty 2/5)**

What time does Diego's class finish?

- **A.** 6:30
- **B.** 6:15
- **C.** 5:15
- **D.** 7:00

4. **R-A1-002-Q4 — reference (difficulty 3/5)**

What is Diego wearing?

- **A.** a blue swimming cap
- **B.** a black jacket
- **C.** his sports bag
- **D.** his blue jacket

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A1-002-Q1` | **A** | basic_gist | 3/5 |
| `R-A1-002-Q2` | **B** | specific_information | 2/5 |
| `R-A1-002-Q3` | **B** | specific_information | 2/5 |
| `R-A1-002-Q4` | **D** | reference | 3/5 |

---
## A2 — Basic User — Waystage

### R-A2-001 — Community Garden Volunteers
**Topic:** environment  
**Genre:** announcement  
**Audience:** general  
**Input length:** 107 words

#### Input

Green Street Community Garden is looking for new volunteers this spring. We meet every Saturday from 8:30 to 11:00. You do not need gardening experience because experienced volunteers will show you what to do.

Most Saturdays, we plant vegetables, water the garden and keep the paths clean. Once a month, we also prepare boxes of fresh vegetables for a local food centre.

Please wear old clothes and closed shoes. We provide gloves and all gardening tools. If it rains heavily, the Saturday session is cancelled and volunteers receive a message by 7:30 that morning.

To join, send your name and phone number to Marta by Thursday evening.

#### Items

1. **R-A2-001-Q1 — basic_gist (difficulty 2/5)**

What is the main purpose of the text?

- **A.** to ask people to give vegetables to a food centre
- **B.** to tell volunteers that a session is cancelled
- **C.** to invite people to help in a garden
- **D.** to explain what clothes to wear in the garden

2. **R-A2-001-Q2 — specific_information (difficulty 2/5)**

What do volunteers receive from the organisers?

- **A.** money for working on Saturdays
- **B.** gloves and gardening tools
- **C.** vegetable boxes to take home
- **D.** closed shoes and old clothes

3. **R-A2-001-Q3 — sequence (difficulty 3/5)**

When will volunteers learn that a session is cancelled because of heavy rain?

- **A.** on Thursday evening
- **B.** one month before the session
- **C.** by 7:30 on Saturday morning
- **D.** after 11:00 on Saturday

4. **R-A2-001-Q4 — simple_purpose (difficulty 3/5)**

Why does the garden prepare vegetable boxes once a month?

- **A.** to give vegetables to the volunteers
- **B.** to help a food centre in the area
- **C.** to sell them at the Saturday meeting
- **D.** to show new volunteers what to do

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A2-001-Q1` | **C** | basic_gist | 2/5 |
| `R-A2-001-Q2` | **B** | specific_information | 2/5 |
| `R-A2-001-Q3` | **C** | sequence | 3/5 |
| `R-A2-001-Q4` | **B** | simple_purpose | 3/5 |

### R-A2-002 — A Change of Plans
**Topic:** relationships  
**Genre:** email  
**Audience:** general  
**Input length:** 104 words

#### Input

Hi Leo,

I’m sorry, but I can’t go to the cinema with you on Friday. My cousin Beatriz is arriving from Recife that afternoon, and my parents asked me to meet her at the bus station.

Could we go on Saturday instead? The 7:20 film is probably better than the 9:45 one because I have football practice early on Sunday. We could have dinner at the small Italian place next to the cinema first. I went there last month and the pizza was really good.

If Saturday isn’t possible, I’m also free next Wednesday after six. Let me know what works for you.

Marina

#### Items

1. **R-A2-002-Q1 — basic_gist (difficulty 2/5)**

Why is Marina writing?

- **A.** to ask Leo to meet her cousin
- **B.** to invite Leo to a football match
- **C.** to recommend a film she saw last month
- **D.** to change plans for going to the cinema

2. **R-A2-002-Q2 — specific_information (difficulty 2/5)**

Why can't Marina go on Friday?

- **A.** Her parents want her to collect her cousin.
- **B.** She is travelling to Recife that afternoon.
- **C.** She has football practice on Friday.
- **D.** Her cousin wants to go to the cinema with her.

3. **R-A2-002-Q3 — simple_purpose (difficulty 3/5)**

Why does Marina prefer the 7:20 film on Saturday?

- **A.** She wants to have dinner after the film.
- **B.** The 9:45 film is not on that Saturday.
- **C.** Her cousin is arriving late on Saturday.
- **D.** She has an early activity the next morning.

4. **R-A2-002-Q4 — reference (difficulty 3/5)**

What does 'there' in 'I went there last month' refer to?

- **A.** the Italian restaurant
- **B.** Recife
- **C.** the cinema
- **D.** the bus station

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A2-002-Q1` | **D** | basic_gist | 2/5 |
| `R-A2-002-Q2` | **A** | specific_information | 2/5 |
| `R-A2-002-Q3` | **D** | simple_purpose | 3/5 |
| `R-A2-002-Q4` | **A** | reference | 3/5 |

---
## B1 — Independent User — Threshold

### R-B1-001 — The Repair Café
**Topic:** society  
**Genre:** personal_article  
**Audience:** general  
**Input length:** 238 words

#### Input

When my toaster stopped working, I was ready to throw it away. It had not been expensive, and buying a new one seemed easier than finding someone to repair it. Then a neighbour told me about a monthly “repair café” at our community centre.

The name was slightly misleading: nobody was selling coffee or running a normal repair shop. Instead, volunteers with different practical skills sat at tables with tools, and local people brought broken household objects. The volunteers did not simply take the objects away and return them later. They asked the owners to stay, watch and, when possible, help with the repair.

I took my toaster there on a rainy Saturday morning. A retired electrician called Hasan opened it carefully and showed me that a small wire had come loose. The repair itself took less than ten minutes, but we spent another twenty discussing why some modern appliances are difficult to open without damaging them.

What surprised me most was the atmosphere. People were helping one another with lamps, bicycles, clothes and even a very old radio. Some repairs failed, but nobody seemed disappointed. The organisers said the real aim was not to guarantee that every object would work again. They wanted people to learn practical skills, waste less and think differently about the things they own.

My toaster is still working. More importantly, I no longer assume that replacing something is always the simplest solution.

#### Items

1. **R-B1-001-Q1 — main_idea (difficulty 3/5)**

What is the writer mainly describing?

- **A.** how a retired electrician repaired the writer's broken old toaster
- **B.** why repair cafés help local people to save money on new appliances
- **C.** how a community event changed the writer's view of broken things
- **D.** why some modern appliances are difficult to open safely

2. **R-B1-001-Q2 — detail (difficulty 3/5)**

What were owners expected to do at the repair café?

- **A.** leave their objects with a volunteer and come back later
- **B.** remain with the volunteer and help with the work if they could
- **C.** watch the volunteers carefully without touching the tools
- **D.** explain to the volunteers how the object had been damaged

3. **R-B1-001-Q3 — inference (difficulty 4/5)**

Why does the writer call the name 'repair café' slightly misleading?

- **A.** Many of the objects that people bring cannot be repaired.
- **B.** The volunteers are not trained to do professional repairs.
- **C.** It suggests a business that sells coffee or fixes things for customers.
- **D.** Visitors have to bring their own tools to use at the volunteers' tables.

4. **R-B1-001-Q4 — writer_purpose (difficulty 4/5)**

Why does the writer mention repairs that failed?

- **A.** to show that making each object work again was not the point
- **B.** to show that some volunteers needed more practical training
- **C.** to explain why several visitors left the event disappointed
- **D.** to suggest that modern appliances are often too difficult to fix

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-001-Q1` | **C** | main_idea | 3/5 |
| `R-B1-001-Q2` | **B** | detail | 3/5 |
| `R-B1-001-Q3` | **C** | inference | 4/5 |
| `R-B1-001-Q4` | **A** | writer_purpose | 4/5 |

### R-B1-002 — A School Without Bells
**Topic:** education  
**Genre:** school_article  
**Audience:** teen  
**Input length:** 244 words

#### Input

Last year, Westbridge Secondary School stopped using bells to mark the beginning and end of lessons. The idea came from a group of teachers who felt that the loud sound created unnecessary stress and encouraged students to think of every lesson as something they should escape from as soon as possible.

At first, many students expected the new system to create chaos. Without a bell, they imagined that people would arrive late because they would lose track of time. For the first two weeks, this did happen occasionally. Teachers had to remind classes to check the clocks, and some students remained in the playground too long after break.

However, the school did not return to the old system. Instead, digital clocks were added to several shared spaces, and teachers were asked to finish activities in enough time for students to move calmly to their next classroom. After one term, the number of late arrivals was almost the same as it had been before the change.

The more interesting result was not punctuality. In a survey, many students said corridors felt less rushed, while teachers reported that endings of lessons had become more natural. They could finish a discussion rather than being interrupted by a sudden sound.

Not everyone prefers the change. Some younger students say the bell made the day easier to organise. The head teacher accepts that the system requires more personal responsibility, but believes that this is one reason to keep it.

#### Items

1. **R-B1-002-Q1 — main_idea (difficulty 3/5)**

What is the article mainly about?

- **A.** why teachers wanted lessons to end in a more natural way
- **B.** how a school managed to reduce the number of late arrivals
- **C.** why some younger students prefer a day organised by bells
- **D.** what happened after a school stopped using lesson bells

2. **R-B1-002-Q2 — detail (difficulty 3/5)**

What problem occurred during the first two weeks?

- **A.** Some students arrived late because they forgot to check the time.
- **B.** Some teachers had to finish their lessons earlier than they planned.
- **C.** Many students complained that the corridors had become too crowded.
- **D.** Some students could not find the new digital clocks around the school.

3. **R-B1-002-Q3 — inference (difficulty 4/5)**

What can be inferred about the head teacher's view of personal responsibility?

- **A.** It is too much to expect from the youngest students.
- **B.** It matters less than making sure students arrive at lessons on time.
- **C.** It depends on having enough clocks around the school.
- **D.** It is an advantage of the system, even though it is demanding.

4. **R-B1-002-Q4 — text_organisation (difficulty 4/5)**

Why does the final paragraph mention students who prefer the bell?

- **A.** to suggest that the school may bring the bells back
- **B.** to give a balanced picture of opinions about the change
- **C.** to explain why the number of late arrivals did not fall
- **D.** to show that younger students find it hard to organise their day

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-002-Q1` | **D** | main_idea | 3/5 |
| `R-B1-002-Q2` | **A** | detail | 3/5 |
| `R-B1-002-Q3` | **D** | inference | 4/5 |
| `R-B1-002-Q4` | **B** | text_organisation | 4/5 |

---
## B2 — Independent User — Vantage

### R-B2-001 — When Convenience Becomes a Default
**Topic:** technology  
**Genre:** opinion_article  
**Audience:** general  
**Input length:** 320 words

#### Input

A decade ago, ordering a meal through an app felt like a useful alternative to cooking or visiting a restaurant. Today, in many cities, it can feel like the default. That shift is not unique to food. Navigation apps choose routes for us, streaming services decide what we might watch next, and online shops repeatedly display products they predict we will want.

There is an obvious advantage to all this assistance: it reduces friction. Few people miss unfolding a paper map in the rain, and recommendations can help us discover music, books or restaurants we would otherwise never encounter. The problem begins when convenience quietly changes from a tool into an expectation. Once a service removes a small inconvenience, having to face that inconvenience again can feel disproportionately irritating.

This matters because some apparently inefficient activities have benefits that only become visible when they disappear. Walking through an unfamiliar neighbourhood because we have not chosen the fastest route can improve our sense of a city. Browsing shelves without a recommendation engine can expose us to subjects outside our established interests. Even waiting can create moments in which attention is not already assigned to a task or screen.

None of this means we should reject technologies that make daily life easier. Romanticising inconvenience would be as unhelpful as treating efficiency as an unquestionable good. The more useful question is whether we are still making deliberate choices. If an app saves us twenty minutes so that we can spend those minutes on something we value, that is genuine convenience. If we simply fill the recovered time with more automated choices, the benefit is less obvious.

Designers sometimes describe the best technology as technology that becomes invisible. For users, however, a little visibility may be healthy. Not because every decision must become difficult, but because occasionally noticing the system that is making a choice for us reminds us that another choice remains possible.

#### Items

1. **R-B2-001-Q1 — writer_stance (difficulty 4/5)**

Which statement best represents the writer's position?

- **A.** Efficiency is good as long as the technology stays invisible to the people using it.
- **B.** Inconvenient activities are valuable and should be kept wherever possible.
- **C.** Recommendation systems mainly stop people from discovering new interests.
- **D.** Assistance is useful, provided people stay aware of the choices made for them.

2. **R-B2-001-Q2 — paragraph_function (difficulty 4/5)**

Why does the writer mention walking through an unfamiliar neighbourhood?

- **A.** to show that navigation apps sometimes choose a slower route
- **B.** to give an example of a hidden benefit of not taking the quickest option
- **C.** to argue that people understand a city better when they travel through it on foot
- **D.** to suggest that walking should replace other ways of getting around

3. **R-B2-001-Q3 — inference (difficulty 4/5)**

What does the writer imply about time saved by technology?

- **A.** People tend to spend the time they save on things they value more.
- **B.** Saving twenty minutes is rarely worth losing the habit of deliberate choice.
- **C.** Its benefit depends on whether the time is used for something people value.
- **D.** Time recovered from automation is mostly spent waiting for the next task.

4. **R-B2-001-Q4 — implication (difficulty 5/5)**

What is meant by 'a little visibility may be healthy' in the final paragraph?

- **A.** Being aware now and then of automated influence keeps other options in mind.
- **B.** Technology should deliberately make decisions a little harder for its users.
- **C.** Designers should stop trying to make their products disappear from view.
- **D.** Users should check regularly how much time each application saves them.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B2-001-Q1` | **D** | writer_stance | 4/5 |
| `R-B2-001-Q2` | **B** | paragraph_function | 4/5 |
| `R-B2-001-Q3` | **C** | inference | 4/5 |
| `R-B2-001-Q4` | **A** | implication | 5/5 |

### R-B2-002 — The Case for Slow Expertise
**Topic:** work  
**Genre:** argumentative_article  
**Audience:** adult  
**Input length:** 302 words

#### Input

Modern workplaces often reward people who can respond quickly. Messages arrive continuously, meetings are shortened, and information is summarised into dashboards designed to be understood at a glance. In that environment, expertise can easily be confused with speed: the person who answers first appears to know the most.

Yet many forms of expertise develop in almost the opposite way. An experienced doctor may pause because several explanations fit the same symptoms. A skilled editor may reread a paragraph that a less experienced reader considers perfectly clear. An engineer may delay recommending a solution until the assumptions behind the available data have been checked. In each case, hesitation does not reveal ignorance; it may reveal awareness of complexity.

This creates a communication problem. Experts frequently know that an accurate answer requires conditions and qualifications, while organisations often want certainty. A cautious response such as “the evidence suggests this is likely, provided these assumptions hold” can sound less impressive than a confident yes or no. As a result, the language of expertise may be undervalued precisely because it is careful.

There are, of course, situations in which speed is itself part of expertise. Emergency teams train so that essential decisions can be made rapidly, and an experienced technician can often recognise a familiar fault almost immediately. The distinction is not between fast experts and slow experts. It is between speed that comes from well-founded recognition and speed that comes from pressure to appear decisive.

Organisations that genuinely value expertise therefore need to make room for both. They should streamline decisions that are routine while protecting time for questions in which uncertainty matters. This may feel inefficient, especially when a meeting ends without a simple conclusion. But the cost of a thoughtful delay is often easier to see than the cost of a confident mistake.

#### Items

1. **R-B2-002-Q1 — argument (difficulty 4/5)**

What is the writer's central argument?

- **A.** Organisations should slow down decision-making so that experts can think.
- **B.** Fast decisions usually reflect pressure to appear decisive, not expertise.
- **C.** Careful hesitation by experts can reflect knowledge rather than a lack of it.
- **D.** Experts should learn to speak with the kind of confidence that organisations expect.

2. **R-B2-002-Q2 — writer_attitude (difficulty 4/5)**

How does the writer view qualified language such as 'the evidence suggests this is likely'?

- **A.** as impressive language that organisations tend to reward
- **B.** as a sign that the speaker has not checked the assumptions
- **C.** as suitable for routine questions but not for complex ones
- **D.** as more accurate, even if it sounds less convincing

3. **R-B2-002-Q3 — paragraph_function (difficulty 4/5)**

What is the purpose of the fourth paragraph?

- **A.** to argue that emergency teams need more time for their decisions
- **B.** to acknowledge that rapid judgement can also be a form of expertise
- **C.** to show that technicians are more reliable than doctors and editors
- **D.** to explain why organisations prefer confident answers to careful ones

4. **R-B2-002-Q4 — implication (difficulty 5/5)**

What does the final sentence suggest?

- **A.** The damage done by a confident mistake can be harder to notice than a delay.
- **B.** Meetings that end without a clear conclusion are a sign of poor management.
- **C.** Confident mistakes cost less than delays because they are noticed sooner.
- **D.** Delays are worth accepting when their financial cost can be measured.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B2-002-Q1` | **C** | argument | 4/5 |
| `R-B2-002-Q2` | **D** | writer_attitude | 4/5 |
| `R-B2-002-Q3` | **B** | paragraph_function | 4/5 |
| `R-B2-002-Q4` | **A** | implication | 5/5 |

---
## C1 — Proficient User — Effective Operational Proficiency

### R-C1-001 — The Productivity of Not Knowing
**Topic:** society  
**Genre:** analytical_essay  
**Audience:** adult  
**Input length:** 501 words

#### Input

Institutions tend to treat uncertainty as a temporary defect. A research proposal promises to resolve a question, a consultancy is hired to deliver an answer, and a meeting is expected to conclude with a decision. Even education often rewards the rapid production of certainty: students are asked what they know, not how well they can identify the limits of what they know. Yet in complex work, the ability to remain intelligently uncertain is not a failure to progress. It is frequently a condition of progress.

This is easiest to see in research. A good scientific question is not simply an empty space waiting to be filled by a fact. It has boundaries. Researchers decide what would count as evidence, which alternative explanations need to be excluded and where the available methods may be inadequate. In other words, expertise does not merely reduce uncertainty; it gives uncertainty a more precise shape. A novice may say, “We do not know.” An expert may say, “We know these three things, we have weak evidence for a fourth, and this particular assumption prevents us from distinguishing between two explanations.” The second statement contains more uncertainty in one sense, but also far more knowledge.

Outside research, however, such precision can be difficult to communicate. Organisations are built around action, and carefully bounded uncertainty can sound like hesitation. This encourages a peculiar form of performance in which confidence becomes a proxy for competence. Forecasts acquire unjustified decimal places, strategic plans disguise assumptions as facts, and complex disagreements are compressed into traffic-light indicators. The resulting clarity is comforting, but comfort is not the same as understanding.

The alternative is not to celebrate ambiguity for its own sake. Endless qualification can become a method of avoiding responsibility, just as demands for certainty can become a method of avoiding thought. Productive uncertainty has to be disciplined. It should identify what is unknown, explain why it matters, and indicate what information or decision would reduce it. A doctor who tells a patient only that “anything is possible” has not demonstrated sophistication. A doctor who explains which diagnoses remain plausible, what evidence favours each one and why a particular test is the next sensible step has.

There is therefore a practical case for teaching people to communicate uncertainty, not merely tolerate it. This includes the language of probability, but it also includes the ability to distinguish missing information from genuine unpredictability, disagreement about values from disagreement about facts, and ignorance that can be reduced from uncertainty that must simply be managed. These distinctions rarely produce dramatic answers. They do something more useful: they make the limits of an answer visible.

Paradoxically, institutions that become better at saying “we do not yet know” may make decisions more confidently, not less. Once uncertainty has been located rather than vaguely feared, decision-makers can ask whether it is important enough to delay action. Sometimes it is. Sometimes it is not. The point is that the decision then responds to uncertainty rather than pretending uncertainty has disappeared.

#### Items

1. **R-C1-001-Q1 — nuanced_stance (difficulty 4/5)**

Which claim most accurately captures the writer's view of uncertainty?

- **A.** Uncertainty is valuable in itself and institutions should learn to preserve it.
- **B.** Institutions should resolve uncertainty before acting on important questions.
- **C.** Uncertainty should be communicated mainly through the language of probability.
- **D.** Precisely located uncertainty can be a sign of knowledge, not its absence.

2. **R-C1-001-Q2 — rhetorical_purpose (difficulty 4/5)**

Why does the writer contrast a novice's 'We do not know' with an expert's more detailed statement?

- **A.** to show that experts are less sure than novices about the basic facts
- **B.** to argue that experts should simplify their answers for organisations
- **C.** to suggest that novices are more honest about the limits of what they really know
- **D.** to illustrate that knowing more can mean describing the unknown more exactly

3. **R-C1-001-Q3 — implicit_meaning (difficulty 5/5)**

What criticism is implied by the reference to 'unjustified decimal places'?

- **A.** Forecasts would be clearer if they were shown as traffic-light indicators.
- **B.** Numerical forecasts are inherently less reliable than qualitative judgements.
- **C.** Figures can suggest a level of certainty that the evidence does not support.
- **D.** Extra decimal places make forecasts harder for decision-makers to follow.

4. **R-C1-001-Q4 — argument_structure (difficulty 5/5)**

What role does the fourth paragraph play in the overall argument?

- **A.** It prevents the case for uncertainty from becoming an excuse for vagueness.
- **B.** It argues that doctors should discuss probabilities more openly with patients.
- **C.** It identifies demands for certainty as the main cause of poor decisions.
- **D.** It introduces the teaching of probability as the solution to the problem.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C1-001-Q1` | **D** | nuanced_stance | 4/5 |
| `R-C1-001-Q2` | **D** | rhetorical_purpose | 4/5 |
| `R-C1-001-Q3` | **C** | implicit_meaning | 5/5 |
| `R-C1-001-Q4` | **A** | argument_structure | 5/5 |

### R-C1-002 — The Problem with Perfect Preservation
**Topic:** culture  
**Genre:** analytical_essay  
**Audience:** general  
**Input length:** 529 words

#### Input

Museums, archives and conservation projects are often described as if their task were straightforward: preserve the past so that it remains available to the future. The language is reassuring. Preservation appears to oppose loss, and loss appears self-evidently undesirable. Yet every act of preservation is also an act of selection. Space, money, expertise and attention are limited, so institutions must decide what will be stabilised, restored, digitised, catalogued and displayed—and what will not.

Digital technology initially seemed to weaken this constraint. If storing a copy of a document costs almost nothing, why not keep everything? But digital abundance creates different forms of scarcity. Files require formats that remain readable, metadata that allow them to be found, servers that must be maintained and people capable of deciding which version is authoritative. A million unlabelled images may technically survive while becoming practically inaccessible. Preservation without organisation can resemble loss at a different scale.

There is also a conceptual problem with the ambition to preserve objects unchanged. Many things acquire meaning through use. A musical instrument sealed permanently in a climate-controlled case may retain its materials while losing part of its social life. A building protected so strictly that its neighbourhood can no longer adapt around it may preserve an architectural moment by freezing the conditions that once made the place dynamic. Conservationists are therefore often forced to choose between different kinds of continuity: material, functional, cultural or communal.

These choices become especially visible when restoration is involved. Restoring a damaged object sounds like returning it to an earlier, authentic state, but which earlier state? A centuries-old building may contain additions from several periods, each of which records a different use. Removing later changes can produce a visually coherent result while erasing evidence of the object's history. Conversely, retaining every alteration may leave the original design almost unreadable. “Authenticity” does not solve the problem; it names the value over which the disagreement is taking place.

None of this is an argument against conservation. It is an argument against imagining conservation as neutral. Decisions about what deserves attention inevitably reflect present values, even when institutions try carefully to resist fashionable judgements. Recognising this does not make preservation arbitrary. On the contrary, it makes explicit reasoning more important. Institutions can state why an object matters, which forms of change they are willing to accept and whose interests are represented by a particular decision.

Perhaps the most responsible form of preservation is therefore not the fantasy of stopping time but the creation of an accountable relationship with change. The past cannot be handed to the future untouched. It can only be handed over through choices. The quality of preservation depends partly on whether those choices remain visible enough to be questioned.

A further complication is that preservation decisions can alter what later generations perceive as historically significant. Materials that receive cataloguing, conservation and exhibition become easier to research and therefore more likely to appear in future accounts. What survives is not simply a sample of the past; it is partly a record of earlier preservation priorities. This feedback effect gives institutions another reason to document not only objects but the reasoning that determined their care.

#### Items

1. **R-C1-002-Q1 — main_argument (difficulty 4/5)**

What is the writer's main argument?

- **A.** Preserving the past means choosing, and the reasons should be open to question.
- **B.** Digital storage has largely solved the old problem of limited space in archives.
- **C.** Objects are better preserved through continued use than by being sealed away.
- **D.** Restoration should aim to return objects to their original, authentic state.

2. **R-C1-002-Q2 — implicit_meaning (difficulty 5/5)**

What does the writer mean by saying digital preservation can 'resemble loss at a different scale'?

- **A.** Digital copies lose quality each time storage formats are updated.
- **B.** Keeping everything digitally ends up costing more than physical conservation.
- **C.** Files may still exist and yet be impossible to use without organisation.
- **D.** Unlabelled images are deleted once servers are no longer maintained.

3. **R-C1-002-Q3 — rhetorical_purpose (difficulty 5/5)**

Why does the writer ask 'which earlier state?' when discussing restoration?

- **A.** to argue that later additions should normally be removed from old buildings and objects
- **B.** to challenge the idea that an object has one obvious authentic past to restore
- **C.** to point out that restorers rarely agree on how old an object actually is
- **D.** to suggest that authenticity can settle disagreements about restoration

4. **R-C1-002-Q4 — nuanced_stance (difficulty 4/5)**

Which statement would the writer most likely support?

- **A.** Conservation should keep objects as close as possible to their condition when acquired.
- **B.** Institutions should explain which values and compromises guide their conservation choices.
- **C.** Since preservation reflects present values, decisions about it are essentially arbitrary.
- **D.** Institutions should give priority to whatever later generations are most likely to research.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C1-002-Q1` | **A** | main_argument | 4/5 |
| `R-C1-002-Q2` | **C** | implicit_meaning | 5/5 |
| `R-C1-002-Q3` | **B** | rhetorical_purpose | 5/5 |
| `R-C1-002-Q4` | **B** | nuanced_stance | 4/5 |

---
## C2 — Proficient User — Mastery

### R-C2-001 — Against the Tyranny of the Representative Example
**Topic:** society  
**Genre:** critical_essay  
**Audience:** adult  
**Input length:** 745 words

#### Input

Public arguments depend heavily on examples. A policy is introduced through the story of one family; a scientific finding is explained through a single patient; an economic trend acquires a human face in the biography of a worker. This is not merely a journalistic convenience. Abstraction is cognitively expensive, and examples allow us to grasp consequences that percentages alone may leave inert. The problem begins when an example ceases to illustrate a claim and quietly starts to carry the evidential burden of proving it.

The representative example is particularly seductive because it appears to solve two difficulties at once. It supplies emotional intelligibility and seems to convert a population-level claim into something observable. Yet the more memorable the case, the less representative it may be. Exceptional stories are selected precisely because they possess narrative shape: an identifiable protagonist, a reversal, an injustice, an improbable success. Statistical reality, by contrast, is often narratively disappointing. Most outcomes cluster somewhere in the middle; many causes interact; and the person whose experience most closely reflects an average may have the least compelling story to tell.

None of this makes individual cases epistemically worthless. A single case can expose a mechanism that aggregate data conceal, reveal a category that researchers failed to measure, or demonstrate that an allegedly universal claim has an exception. What a case cannot do, without additional argument, is establish frequency. The distinction is elementary, yet public reasoning repeatedly blurs it. “This happened” migrates almost imperceptibly into “this is what happens.”

The reverse error is equally damaging. Because anecdotes can mislead, institutions sometimes treat lived experience as if it were merely decorative: useful for communication after the real analysis has been completed. This confuses the limits of anecdotal evidence with the limits of qualitative knowledge. People may notice administrative barriers, unintended incentives or forms of harm that a dataset cannot register because its categories were designed before those effects became visible. The proper response to a troubling case is neither immediate generalisation nor immediate dismissal. It is curiosity disciplined by method.

This matters especially in environments where examples are selected competitively. Political campaigns, social media platforms and advocacy organisations all have incentives to circulate stories that compress complexity into moral clarity. A vivid case travels better than a confidence interval. Once circulated, it can become a template through which subsequent evidence is interpreted: similar cases are noticed, dissimilar ones become exceptions, and the original example gains the appearance of typicality through repetition.

The solution is not a bloodless public language purged of stories. Numbers themselves require framing, and a table can conceal assumptions as effectively as an anecdote can exaggerate them. A healthier practice would force examples and aggregates into conversation. When a story is offered as typical, ask typical of whom and under what conditions. When statistics imply that a problem is rare, ask whether rarity makes a severe consequence irrelevant. When an exceptional case reveals an unmeasured mechanism, investigate the mechanism rather than voting immediately on the general conclusion.

Examples are indispensable because they make claims inhabitable. They become tyrannical only when their vividness exempts them from the questions we would ask of less memorable evidence.

The temptation to promote an example into a general rule is intensified by a familiar asymmetry in correction. A dramatic story can establish an impression in seconds; qualifying that impression may require describing sampling, base rates, selection effects and uncertainty. By the time the qualification arrives, it can sound evasive, as if method were being used to avoid the moral clarity the story supposedly provided. This is one reason corrections often lose rhetorically even when they win analytically.

There is also a temporal problem. Examples are frequently selected before the broader pattern is known. Early in a crisis, for instance, the first visible cases may shape expectations about who is affected, how severe an outcome is or which mechanism is responsible. Later data may show that the initial cases were unusual, but public categories have already formed around them. Evidence then enters a conceptual landscape created by the very anecdotes it is supposed to evaluate.

A disciplined use of examples therefore requires a kind of double vision. We should ask what the case reveals in its own specificity and, separately, what would be required to claim that it is common. These are not competing questions. The first protects us from reducing people to data points; the second protects us from turning the most narratively convenient person into a population.

#### Items

1. **R-C2-001-Q1 — nuanced_stance (difficulty 5/5)**

Which formulation best captures the writer's position on individual examples?

- **A.** They are most useful for communicating findings once the analysis is complete.
- **B.** They should be balanced by statistics so that public debate stays calm and unemotional.
- **C.** They become reliable evidence of frequency when they are carefully selected.
- **D.** They can reveal what data miss, but cannot alone show how common something is.

2. **R-C2-001-Q2 — subtle_implication (difficulty 5/5)**

Why does the writer describe statistical reality as 'narratively disappointing'?

- **A.** Statistics tend to show that exceptional stories are rarer than people assume.
- **B.** Ordinary outcomes seldom have the shape that makes a story compelling.
- **C.** Readers struggle to follow averages unless they are given a human example.
- **D.** Researchers prefer results that cluster in the middle because they are easier to explain.

3. **R-C2-001-Q3 — rhetorical_structure (difficulty 5/5)**

What function does the fourth paragraph serve?

- **A.** It shows that institutions rely too heavily on personal testimony.
- **B.** It argues that qualitative knowledge is more trustworthy than statistical data.
- **C.** It explains why anecdotes belong at the communication stage of an analysis.
- **D.** It complicates the critique: dismissing lived experience is another error.

4. **R-C2-001-Q4 — figurative_meaning (difficulty 5/5)**

What is conveyed by the final claim that vividness can 'exempt' an example from questions?

- **A.** Vivid examples are usually exceptions to the general pattern.
- **B.** Memorable stories have no place in serious public debate.
- **C.** Memorable stories may escape the scrutiny normally applied to evidence.
- **D.** Vivid stories spread faster than the corrections that follow them.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C2-001-Q1` | **D** | nuanced_stance | 5/5 |
| `R-C2-001-Q2` | **B** | subtle_implication | 5/5 |
| `R-C2-001-Q3` | **D** | rhetorical_structure | 5/5 |
| `R-C2-001-Q4` | **C** | figurative_meaning | 5/5 |

### R-C2-002 — The Useful Friction of Translation
**Topic:** culture  
**Genre:** critical_essay  
**Audience:** adult  
**Input length:** 783 words

#### Input

Translation is often judged against an ideal of disappearance. The successful translator is imagined as someone who removes every trace of mediation so that readers encounter the work as effortlessly as if it had been written in their own language. Fluency, in this view, is transparency. The translation succeeds when the translator becomes invisible.

There are obvious reasons to value such ease. A version so awkward that readers continuously trip over its syntax may communicate little beyond the translator's struggle. Yet the ideal of perfect transparency contains a less obvious risk: it can mistake familiarity for fidelity. Languages divide experience differently, distribute emphasis differently and carry histories that do not always survive when unfamiliar forms are replaced by the nearest comfortable equivalent. If every resistance is polished away, the reader may receive an elegant text at the price of encountering only what their own language already knows how to say.

This does not justify deliberate obscurity. The choice is not between domestic smoothness and a museum display of foreignness in which every unusual feature is preserved regardless of effect. Translation is an act of reconstruction under constraint. A pun may demand sacrifice because its sound and meaning cannot both travel intact; a form of address may encode social distance for which the receiving language has no routine equivalent; a sentence whose ambiguity is purposeful may become falsely precise if the translator resolves it merely to sound natural.

The translator therefore works not by eliminating loss but by allocating it. That allocation is interpretive. Which feature is central here: rhythm, conceptual precision, social tone, comic timing, historical strangeness? Different answers can generate translations that are all competent and yet substantially different. The fact that no version is neutral is sometimes treated as an embarrassment, as though translation were a laboratory measurement contaminated by the observer. A better analogy may be performance. Two musicians can play the same score recognisably while making different judgements about tempo, emphasis and phrasing. We do not infer that the score is meaningless because interpretation is involved.

The analogy has limits, of course. Translators can alter propositions in ways performers generally cannot, and readers who do not know the source language are unusually dependent on those choices. That dependence creates an ethical obligation to avoid disguising interpretation as inevitability. Notes, prefaces and even small moments of linguistic friction can sometimes serve this obligation by reminding readers that a choice has been made. Such reminders need not dominate the text. Their value lies precisely in interrupting the fantasy that nothing has crossed a boundary.

The phrase “lost in translation” encourages us to imagine loss as an accidental spill that better technique might eventually prevent. But some loss is structural: meanings are embedded in systems that do not map neatly onto one another. The more interesting question is what the translation makes newly possible in return. A translated work enters relationships, debates and literary traditions unavailable to the original in quite the same way. It acquires echoes the author could not have planned and may reveal patterns that readers of the source language take for granted.

Translation, then, is not successful because it abolishes distance. At its best, it manages distance intelligently. A completely frictionless translation may occasionally be exactly what a text requires. In other cases, a slight resistance is not evidence of failure but evidence that the reader has been permitted to notice the crossing.

This becomes especially visible when a translation enters a culture with expectations very different from those surrounding the source. A joke that was casually irreverent may acquire political weight; an ordinary term may echo a famous phrase in the receiving language; a rhythm that sounded neutral in one tradition may sound archaic in another. The translator cannot simply transport meaning into an empty container because the receiving language is already crowded with associations.

For that reason, even the decision to write fluently is historically situated. What counts as natural prose changes. A translation praised in one generation for elegance may later appear to have domesticated its source too aggressively, while a version once criticised as strange may come to seem prescient. Retranslation is not always evidence that earlier translators failed. It can reflect the fact that the receiving language, its readers and its assumptions have changed.

The ethical question, then, is not how to avoid interpretation but how to make interpretive responsibility answerable. Sometimes that means transparency outside the text; sometimes it means choosing a phrase whose slight unfamiliarity preserves a distinction that a smoother equivalent would erase. Such decisions are contestable. Their contestability is not a flaw to be engineered away but part of what it means to carry a work between linguistic worlds.

#### Items

1. **R-C2-002-Q1 — main_argument (difficulty 5/5)**

What is the essay's central claim?

- **A.** Translation succeeds when readers no longer notice that a translator was involved.
- **B.** Translators should keep unfamiliar features even when they obscure the meaning.
- **C.** Good translation decides on principle which differences to keep, adapt or reveal.
- **D.** Most of what is lost in translation could be avoided with better technique.

2. **R-C2-002-Q2 — nuanced_inference (difficulty 5/5)**

What does the writer imply by saying that the translator 'allocates' loss?

- **A.** Unavoidable compromises force the translator to decide which features matter most to keep.
- **B.** Translators should spread unavoidable losses evenly across rhythm, tone and overall meaning.
- **C.** Most of what disappears in translation can be prevented by careful choices.
- **D.** Features such as puns cannot be translated and are best explained in notes.

3. **R-C2-002-Q3 — analogy_function (difficulty 5/5)**

Why does the writer compare translation to musical performance?

- **A.** to show that interpretive variation can coexist with recognisable fidelity to a source
- **B.** to show that, like a musical performance, translation involves no real loss of meaning
- **C.** to argue that readers should judge translations as they judge performances
- **D.** to show that translators have as little freedom as musicians reading a score

4. **R-C2-002-Q4 — subtle_implication (difficulty 5/5)**

What is the 'fantasy that nothing has crossed a boundary'?

- **A.** the belief that fidelity matters more than fluency in a translation
- **B.** the impression that the reader is meeting the original work directly
- **C.** the hope that most readers will pay attention to notes and prefaces
- **D.** the assumption that the receiving language brings no associations of its own

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C2-002-Q1` | **C** | main_argument | 5/5 |
| `R-C2-002-Q2` | **A** | nuanced_inference | 5/5 |
| `R-C2-002-Q3` | **A** | analogy_function | 5/5 |
| `R-C2-002-Q4` | **B** | subtle_implication | 5/5 |

---
# 5. Listening Bank

## Orientação de aplicação

Os scripts abaixo são material interno. Durante a avaliação, o candidato recebe apenas o áudio e os itens. Para a pilotagem, recomenda-se gravação natural com voz humana ou síntese de voz de alta qualidade, mantendo ritmo e condições coerentes com o nível. A mesma versão do áudio deve ser usada para todos os candidatos de uma mesma form.


## A1 — Basic User — Breakthrough

### L-A1-001 — At the Bakery
**Topic:** daily_life  
**Genre:** dialogue  
**Audience:** general  
**Script length:** 35 words  
**Estimated duration:** 0:16 at ~130 wpm

#### Internal audio script

Woman: Good morning. Can I have two cheese rolls and one chocolate cake, please?
Clerk: Of course. Anything to drink?
Woman: Yes, a small orange juice.
Clerk: That's twelve reais altogether.
Woman: Here you are.

#### Items

1. **L-A1-001-Q1 — specific_information (difficulty 2/5)**

How many cheese rolls does the woman buy?

- **A.** twelve
- **B.** one
- **C.** two
- **D.** three

2. **L-A1-001-Q2 — specific_information (difficulty 2/5)**

What drink does she order?

- **A.** coffee
- **B.** milk
- **C.** water
- **D.** orange juice

3. **L-A1-001-Q3 — basic_gist (difficulty 2/5)**

Where are the speakers?

- **A.** at a bus station
- **B.** in a bakery
- **C.** in a classroom
- **D.** at a pharmacy

4. **L-A1-001-Q4 — specific_information (difficulty 2/5)**

How much does the order cost?

- **A.** two reais
- **B.** twelve reais
- **C.** ten reais
- **D.** twenty reais

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A1-001-Q1` | **C** | specific_information | 2/5 |
| `L-A1-001-Q2` | **D** | specific_information | 2/5 |
| `L-A1-001-Q3` | **B** | basic_gist | 2/5 |
| `L-A1-001-Q4` | **B** | specific_information | 2/5 |

### L-A1-002 — Voice Message
**Topic:** relationships  
**Genre:** voice_message  
**Audience:** teen  
**Script length:** 34 words  
**Estimated duration:** 0:16 at ~130 wpm

#### Internal audio script

Hi, Sofia. It's Lucas. The football game starts at four, not at three. Meet me outside the school at quarter to four. Bring your blue water bottle because it's very hot today. See you!

#### Items

1. **L-A1-002-Q1 — specific_information (difficulty 2/5)**

What time does the football game start?

- **A.** 4:00
- **B.** 4:15
- **C.** 3:45
- **D.** 3:00

2. **L-A1-002-Q2 — specific_information (difficulty 2/5)**

Where should Sofia meet Lucas?

- **A.** outside the school
- **B.** at the bus stop
- **C.** at Lucas's house
- **D.** inside the sports hall

3. **L-A1-002-Q3 — specific_information (difficulty 2/5)**

What should Sofia bring?

- **A.** a football shirt
- **B.** a school bag
- **C.** a blue water bottle
- **D.** a hat

4. **L-A1-002-Q4 — basic_gist (difficulty 3/5)**

What is the weather like today?

- **A.** rainy
- **B.** cold
- **C.** windy
- **D.** very hot

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A1-002-Q1` | **A** | specific_information | 2/5 |
| `L-A1-002-Q2` | **A** | specific_information | 2/5 |
| `L-A1-002-Q3` | **C** | specific_information | 2/5 |
| `L-A1-002-Q4` | **D** | basic_gist | 3/5 |

---
## A2 — Basic User — Waystage

### L-A2-001 — Museum Announcement
**Topic:** culture  
**Genre:** announcement  
**Audience:** general  
**Script length:** 82 words  
**Estimated duration:** 0:38 at ~130 wpm

#### Internal audio script

Welcome to the City History Museum. The museum closes at five thirty today. The café on the ground floor will close thirty minutes earlier, at five. Our special photography exhibition is on the second floor, next to Gallery Six. Please remember that large bags must be left in the lockers near the main entrance. At two o'clock, there is a free guided tour. If you would like to join, meet your guide beside the information desk five minutes before the tour begins.

#### Items

1. **L-A2-001-Q1 — specific_information (difficulty 2/5)**

What time does the café close?

- **A.** 1:55
- **B.** 2:00
- **C.** 5:00
- **D.** 5:30

2. **L-A2-001-Q2 — specific_information (difficulty 2/5)**

Where is the photography exhibition?

- **A.** on the ground floor
- **B.** near the main entrance
- **C.** inside the café
- **D.** on the second floor

3. **L-A2-001-Q3 — sequence (difficulty 3/5)**

When should visitors meet for the guided tour?

- **A.** at 5:00
- **B.** at 2:05
- **C.** at 1:55
- **D.** at 2:00

4. **L-A2-001-Q4 — simple_purpose (difficulty 3/5)**

Why are the lockers mentioned?

- **A.** Visitors must put large bags there.
- **B.** Visitors can buy tickets there.
- **C.** The guided tour begins there.
- **D.** The photography exhibition is there.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A2-001-Q1` | **C** | specific_information | 2/5 |
| `L-A2-001-Q2` | **D** | specific_information | 2/5 |
| `L-A2-001-Q3` | **C** | sequence | 3/5 |
| `L-A2-001-Q4` | **A** | simple_purpose | 3/5 |

### L-A2-002 — Changing a Restaurant Booking
**Topic:** daily_life  
**Genre:** phone_dialogue  
**Audience:** adult  
**Script length:** 98 words  
**Estimated duration:** 0:45 at ~130 wpm

#### Internal audio script

Man: Hi, I'm calling about a table I booked for Saturday evening. The booking is for four people at seven.
Host: Can I have the name, please?
Man: Rafael Lima.
Host: Yes, I have it here. What would you like to change?
Man: Two more friends are coming, so we need a table for six. Could we keep the same time?
Host: At seven we only have tables for four, but I can offer you a table for six at seven thirty.
Man: That's fine. Do we need to arrive early?
Host: Just five minutes before is enough.

#### Items

1. **L-A2-002-Q1 — basic_gist (difficulty 2/5)**

Why does Rafael call the restaurant?

- **A.** to cancel a booking completely
- **B.** to change an existing booking
- **C.** to complain about a meal
- **D.** to ask when the restaurant opens

2. **L-A2-002-Q2 — specific_information (difficulty 2/5)**

How many people will now have dinner?

- **A.** four
- **B.** two
- **C.** seven
- **D.** six

3. **L-A2-002-Q3 — specific_information (difficulty 2/5)**

What time is the new booking?

- **A.** 7:25
- **B.** 7:30
- **C.** 6:30
- **D.** 7:00

4. **L-A2-002-Q4 — inference (difficulty 3/5)**

What will Rafael probably do on Saturday?

- **A.** arrive at the restaurant at about 7:25
- **B.** ask two friends not to come
- **C.** arrive at seven and wait thirty minutes
- **D.** look for a different restaurant

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A2-002-Q1` | **B** | basic_gist | 2/5 |
| `L-A2-002-Q2` | **D** | specific_information | 2/5 |
| `L-A2-002-Q3` | **B** | specific_information | 2/5 |
| `L-A2-002-Q4` | **A** | inference | 3/5 |

---
## B1 — Independent User — Threshold

### L-B1-001 — A Different Commute
**Topic:** work  
**Genre:** interview  
**Audience:** adult  
**Script length:** 174 words  
**Estimated duration:** 1:20 at ~130 wpm

#### Internal audio script

Presenter: Today we're talking to people who changed the way they travel to work. Nina, you used to drive every day, right?

Nina: Yes. It took about forty minutes in good traffic, but parking was expensive and I often arrived already stressed. Last year I started taking the train. The journey itself is slightly longer—about fifty minutes—but I can read or answer messages instead of concentrating on traffic.

Presenter: Was the change easy?

Nina: Not completely. The first train I tried was too crowded, so now I leave home twenty minutes earlier. That sounds inconvenient, but I actually prefer it because the earlier train is quieter. The biggest surprise is that I now walk about fifteen minutes from the station to the office. I thought I would dislike that, but it's become one of my favourite parts of the morning.

Presenter: Would you ever drive again?

Nina: Of course, if I needed the car after work. But for a normal day, no. The train isn't perfect, but overall I arrive in a better mood.

#### Items

1. **L-B1-001-Q1 — main_points (difficulty 3/5)**

What is Nina mainly explaining?

- **A.** why her employer should pay for staff parking
- **B.** why she now prefers travelling to work by train
- **C.** why she wants to move closer to her office
- **D.** how she reduced the length of her journey to work

2. **L-B1-001-Q2 — detail (difficulty 3/5)**

Why does Nina leave home earlier now?

- **A.** to walk all the way to work
- **B.** to answer work messages before the journey
- **C.** to avoid paying a higher train fare
- **D.** to take a less crowded train

3. **L-B1-001-Q3 — inference (difficulty 3/5)**

How did Nina's opinion of the walk from the station change?

- **A.** She enjoyed it initially but now finds it tiring.
- **B.** She thought it would save time but discovered it was slower.
- **C.** She only likes it when she has driven to the station.
- **D.** She expected to dislike it but now enjoys it.

4. **L-B1-001-Q4 — speaker_intention (difficulty 4/5)**

Why does Nina say 'The train isn't perfect'?

- **A.** to admit a problem but say she is still happy overall
- **B.** to suggest that the presenter has misunderstood her answer
- **C.** to complain that train services have become less reliable
- **D.** to explain that she plans to return to driving soon

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B1-001-Q1` | **B** | main_points | 3/5 |
| `L-B1-001-Q2` | **D** | detail | 3/5 |
| `L-B1-001-Q3` | **D** | inference | 3/5 |
| `L-B1-001-Q4` | **A** | speaker_intention | 4/5 |

### L-B1-002 — A Small Festival Goes Cashless
**Topic:** culture  
**Genre:** radio_interview  
**Audience:** general  
**Script length:** 179 words  
**Estimated duration:** 1:23 at ~130 wpm

#### Internal audio script

Host: The Riverside Music Festival tried something new this year: visitors couldn't pay cash at food stalls. Instead, they added money to a wristband. Festival organiser Tom Ellis explains why.

Tom: We had two main reasons. First, queues were getting longer every year, especially when staff had to handle change. Second, several stall owners said they felt uncomfortable keeping large amounts of cash. With the wristbands, people could add money online before arriving or at machines inside the festival.

Host: Did everyone like the system?

Tom: No. Younger visitors adapted quickly, but some people were worried they would lose money if they didn't spend everything. We had explained on our website that unused money could be refunded, but clearly that information wasn't easy enough to find. We also had a technical problem on Saturday afternoon when two top-up machines stopped working.

Host: Will you use wristbands next year?

Tom: Probably, but with changes. We need more machines, clearer signs about refunds and at least one place where staff can help visitors who don't want to use the technology alone.

#### Items

1. **L-B1-002-Q1 — main_points (difficulty 3/5)**

Why did the festival introduce payment wristbands?

- **A.** to collect information about which bands people watched
- **B.** to stop food stalls from changing their prices
- **C.** to reduce queues and the cash that sellers handle
- **D.** to encourage visitors to buy tickets online

2. **L-B1-002-Q2 — detail (difficulty 3/5)**

What worried some visitors?

- **A.** They had to buy the wristband before arriving.
- **B.** The wristband could not be used at food stalls.
- **C.** They might not use all their wristband money.
- **D.** The machines accepted cash only on Saturday.

3. **L-B1-002-Q3 — inference (difficulty 4/5)**

What does Tom think about the information on refunds?

- **A.** It was available, but it was not communicated clearly enough.
- **B.** It should have been removed from the festival website.
- **C.** It was understood by older visitors better than younger ones.
- **D.** It was incorrect because refunds were not actually possible.

4. **L-B1-002-Q4 — speaker_intention (difficulty 4/5)**

What is Tom's attitude to using the system again?

- **A.** He thinks only younger visitors should be allowed to use it.
- **B.** He is generally in favour but wants practical improvements.
- **C.** He will use it again without changing anything.
- **D.** He has decided the experiment was a complete failure.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B1-002-Q1` | **C** | main_points | 3/5 |
| `L-B1-002-Q2` | **C** | detail | 3/5 |
| `L-B1-002-Q3` | **A** | inference | 4/5 |
| `L-B1-002-Q4` | **B** | speaker_intention | 4/5 |

---
## B2 — Independent User — Vantage

### L-B2-001 — The Meeting-Free Afternoon
**Topic:** work  
**Genre:** interview  
**Audience:** adult  
**Script length:** 218 words  
**Estimated duration:** 1:41 at ~130 wpm

#### Internal audio script

Interviewer: Your company introduced meeting-free Wednesday afternoons six months ago. What problem were you trying to solve?

Manager: Not meetings themselves. Some are essential. The problem was fragmentation. People had calendars full of thirty-minute meetings separated by tiny gaps. On paper, they still had several hours for focused work, but those hours were broken into pieces too small for difficult tasks.

Interviewer: Has banning meetings for half a day fixed that?

Manager: 'Banning' is slightly too strong. Client emergencies still happen, and teams in different time zones sometimes need exceptions. But the default is now that Wednesday afternoons are protected. The interesting result is that people have become more selective about meetings on other days too. They ask whether a decision could be made in a shared document instead.

Interviewer: So productivity has increased?

Manager: That's difficult to prove. We can measure fewer meetings, but measuring the quality of thinking is much harder. What we do know is that staff surveys show less frustration about interruptions. I wouldn't claim that one policy transformed the company.

Interviewer: Any unexpected downside?

Manager: Some people began treating Wednesday morning as a race to fit in every meeting they couldn't hold later. We had to remind teams that the goal wasn't to move congestion from one part of the calendar to another.

#### Items

1. **L-B2-001-Q1 — main_argument (difficulty 4/5)**

What problem was the policy mainly designed to address?

- **A.** work time being broken into many short periods
- **B.** different time zones making meetings impossible to schedule
- **C.** staff spending too much time working alone
- **D.** employees refusing to attend necessary client meetings

2. **L-B2-001-Q2 — speaker_attitude (difficulty 4/5)**

How does the manager respond to the claim that productivity increased?

- **A.** negatively, because staff surveys show no improvement
- **B.** enthusiastically, because company data clearly prove it
- **C.** cautiously, because the evidence does not fully measure it
- **D.** confidently, because fewer meetings automatically mean better work

3. **L-B2-001-Q3 — inference (difficulty 4/5)**

What broader behavioural change does the manager value?

- **A.** Employees now question if some meetings are necessary.
- **B.** Teams in different time zones communicate less often.
- **C.** Employees are now willing to work on Wednesday evenings.
- **D.** Clients have stopped requesting urgent meetings.

4. **L-B2-001-Q4 — figurative_meaning (difficulty 5/5)**

What does the manager mean by 'move congestion from one part of the calendar to another'?

- **A.** Client meetings should be moved to another week rather than to another day of the same week.
- **B.** Teams should spread meetings across different office locations.
- **C.** Meetings should not simply be crowded into Wednesday morning instead.
- **D.** Employees should change the digital calendar system they use.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B2-001-Q1` | **A** | main_argument | 4/5 |
| `L-B2-001-Q2` | **C** | speaker_attitude | 4/5 |
| `L-B2-001-Q3` | **A** | inference | 4/5 |
| `L-B2-001-Q4` | **C** | figurative_meaning | 5/5 |

### L-B2-002 — Why Some Parks Leave Fallen Trees
**Topic:** environment  
**Genre:** radio_interview  
**Audience:** general  
**Script length:** 202 words  
**Estimated duration:** 1:33 at ~130 wpm

#### Internal audio script

Presenter: In many city parks, a fallen tree used to be removed almost immediately. But some park managers now leave certain trunks where they fall. Ecologist Priya Shah says this can look like neglect.

Priya: Exactly. People often associate a tidy park with a healthy park. A dead trunk looks messy, especially if visitors are used to lawns and carefully cut flower beds. Ecologically, though, dead wood is incredibly active. Fungi break it down, insects use it for shelter, and those insects become food for birds.

Presenter: So should every fallen tree stay?

Priya: No, and that's where the public conversation sometimes becomes too simple. A trunk beside a path can be dangerous. In a small urban park there may also be no space to leave everything. Managers have to balance habitat value, safety, access and what residents actually want from the park.

Presenter: Does public opinion change once people understand the reason?

Priya: Often. One park added small signs explaining why several logs had been left. Complaints dropped quite sharply. But signs aren't magic. If managers use ecological language to dismiss every concern about access or appearance, people stop listening. Explanation works best when it is part of a genuine compromise.

#### Items

1. **L-B2-002-Q1 — speaker_attitude (difficulty 4/5)**

What misconception does Priya identify?

- **A.** Urban residents generally dislike seeing birds and insects in parks.
- **B.** A neat-looking park is necessarily an ecologically healthier park.
- **C.** Fungi prevent dead wood from supporting other forms of wildlife.
- **D.** Fallen trees are more dangerous than standing trees in every situation.

2. **L-B2-002-Q2 — inference (difficulty 4/5)**

Why does Priya reject the idea of leaving every fallen tree?

- **A.** Residents should decide individually which trees are removed.
- **B.** Only trees in large forests can provide useful habitats.
- **C.** Dead trees stop supporting wildlife when they are close to paths.
- **D.** Ecological benefits must be weighed against safety and access.

3. **L-B2-002-Q3 — detail (difficulty 3/5)**

What happened after one park installed explanatory signs?

- **A.** All fallen trees were moved away from paths.
- **B.** Visitors asked for more lawns to be removed.
- **C.** Managers stopped receiving questions about access.
- **D.** The number of complaints decreased significantly.

4. **L-B2-002-Q4 — speaker_intention (difficulty 5/5)**

Why does Priya say 'signs aren't magic'?

- **A.** to argue that signs are too expensive for most city parks
- **B.** to stress that information cannot replace listening to concerns
- **C.** to suggest that visitors rarely read information in public spaces
- **D.** to explain why ecological terminology should never appear on signs

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B2-002-Q1` | **B** | speaker_attitude | 4/5 |
| `L-B2-002-Q2` | **D** | inference | 4/5 |
| `L-B2-002-Q3` | **D** | detail | 3/5 |
| `L-B2-002-Q4` | **B** | speaker_intention | 5/5 |

---
## C1 — Proficient User — Effective Operational Proficiency

### L-C1-001 — The Trouble with Measuring Collaboration
**Topic:** work  
**Genre:** expert_interview  
**Audience:** adult  
**Script length:** 298 words  
**Estimated duration:** 2:18 at ~130 wpm

#### Internal audio script

Host: Organisations increasingly say they value collaboration, but measuring it is less straightforward than measuring individual output. Professor Elena Wu studies team performance.

Wu: One common mistake is to count visible activity—messages sent, meetings attended, documents edited—and treat that as collaboration. Those behaviours are easy to record, but they can measure noise as easily as contribution. Someone who asks the right question once may improve a project more than someone who writes fifty messages.

Host: So should managers avoid metrics entirely?

Wu: Not necessarily. Metrics can reveal patterns, especially when combined with qualitative evidence. Suppose one team has a member who is never invited into early discussions but is repeatedly asked to fix problems at the end. Communication data might reveal that pattern. The danger is when the measure becomes a target. If employees know that a high message count is interpreted as collaboration, unsurprisingly, message counts rise.

Host: That sounds like the classic problem of people gaming a metric.

Wu: Sometimes it is deliberate, but not always. People adapt to signals about what the organisation values. A poorly chosen metric can reshape behaviour even when nobody is trying to manipulate anything.

Host: What would a better evaluation look like?

Wu: I'd ask what collaboration is supposed to achieve in that context. Faster decisions? Better error detection? More diverse ideas? Once the purpose is clearer, you can combine several imperfect indicators rather than pretending one number is the thing itself. And you need room for judgement, which is uncomfortable because judgement is less tidy than a dashboard.

Host: So the dashboard should start a conversation rather than end one?

Wu: Exactly. A metric is most useful when it prompts a better question. It becomes dangerous when its apparent precision discourages people from asking what the number actually represents.

#### Items

1. **L-C1-001-Q1 — nuanced_stance (difficulty 5/5)**

What is Professor Wu's position on using metrics to assess collaboration?

- **A.** They are useful alongside context and other evidence, but are not direct measures of it.
- **B.** They are more reliable than managerial judgement because they reduce subjective interpretation.
- **C.** They are useful mainly for identifying employees who deliberately manipulate performance systems.
- **D.** They should be abandoned because numerical measures inevitably distort how employees collaborate.

2. **L-C1-001-Q2 — implicit_meaning (difficulty 5/5)**

What does Wu mean when she says a measure can become 'a target'?

- **A.** People may change their behaviour to improve the measured number, not the real outcome.
- **B.** Employees may refuse to collaborate if they know their activity is being recorded.
- **C.** Managers may set an official minimum number of meetings for every employee.
- **D.** A metric becomes useful only after the organisation publishes a numerical goal.

3. **L-C1-001-Q3 — argument_structure (difficulty 5/5)**

Why does Wu give the example of a team member brought in only at the end to fix problems?

- **A.** to demonstrate that late-stage problem solving is the most valuable type of team contribution
- **B.** to prove that qualitative evidence is unnecessary when communication logs are available
- **C.** to argue that employees should be included in every meeting from the beginning of a project
- **D.** to show that activity data can reveal an important collaboration pattern if read carefully

4. **L-C1-001-Q4 — speaker_attitude (difficulty 4/5)**

How does Wu characterize managerial judgement at the end?

- **A.** as useful only when a team has no measurable objectives
- **B.** as unreliable because managers rarely agree with one another
- **C.** as an outdated practice that should eventually be automated
- **D.** as necessary but less easily measured than a dashboard

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C1-001-Q1` | **A** | nuanced_stance | 5/5 |
| `L-C1-001-Q2` | **A** | implicit_meaning | 5/5 |
| `L-C1-001-Q3` | **D** | argument_structure | 5/5 |
| `L-C1-001-Q4` | **D** | speaker_attitude | 4/5 |

### L-C1-002 — Designing for the Average
**Topic:** technology  
**Genre:** expert_interview  
**Audience:** general  
**Script length:** 278 words  
**Estimated duration:** 2:08 at ~130 wpm

#### Internal audio script

Presenter: Product designers often talk about the 'average user'. Design researcher Malik Osei thinks that phrase can be useful, but also misleading.

Osei: An average is a summary, not a person. Imagine measuring ten physical characteristics across a large population and calculating the average for each one. You might discover that almost nobody is average on all ten simultaneously. So if you design a chair, interface or public service for an imaginary person who sits at the centre of every distribution, you can produce something that fits surprisingly few real people.

Presenter: Does that mean averages are useless?

Osei: No. They help us see distributions and compare groups. The problem is treating the centre of a distribution as the specification for a human being. Good design usually needs ranges. How small a screen can someone comfortably read? How much variation in hand size can a control accommodate? Who is excluded at the edges?

Presenter: But accommodating every possible user could make a product expensive or impossible to design.

Osei: Absolutely. Inclusive design isn't a promise that one object will work perfectly for everyone. It is a discipline of making exclusions visible. Sometimes the answer is adjustability. Sometimes it is offering more than one version. Sometimes a constraint is unavoidable. What changes is that exclusion becomes a decision you can examine, rather than an accidental consequence hidden inside the word 'average'.

Presenter: So the aim is not to eliminate averages but to use them differently?

Osei: Exactly. An average can be a useful map of a population. It becomes a design mistake when the map is treated as though it were the individual user standing in front of you.

#### Items

1. **L-C1-002-Q1 — main_argument (difficulty 5/5)**

What is Osei's main criticism of designing for an 'average user'?

- **A.** Designers often use the word 'average' to avoid conducting more detailed research with users.
- **B.** An average may describe a population without corresponding to any real person's characteristics.
- **C.** Products designed from averages tend to cost more because they require unnecessary adjustments.
- **D.** Average measurements are usually unreliable because designers collect data from samples that are too small.

2. **L-C1-002-Q2 — inference (difficulty 5/5)**

What does Osei mean by saying good design often needs 'ranges'?

- **A.** The most successful products are those that can serve several unrelated purposes equally well.
- **B.** Every product should be produced in enough versions to fit every potential user exactly.
- **C.** Design should accommodate meaningful variation rather than optimise only for a central value.
- **D.** Designers should replace numerical measurements with direct observation of individual users.

3. **L-C1-002-Q3 — nuanced_stance (difficulty 5/5)**

How does Osei view the goal of inclusive design?

- **A.** It requires every product to work equally well for every conceivable user.
- **B.** It is mainly a marketing strategy for offering several versions of one product.
- **C.** It should reduce unnecessary exclusion without claiming all limits can disappear.
- **D.** It should prioritise users at the statistical extremes over everyone else.

4. **L-C1-002-Q4 — implicit_meaning (difficulty 5/5)**

What changes when exclusion becomes 'a decision you can examine'?

- **A.** Users become legally responsible for choosing products that suit their needs.
- **B.** Designers can justify or revise a limitation instead of treating it as a default.
- **C.** A product can be described as inclusive even when no changes are made.
- **D.** Statistical averages become unnecessary because all design decisions are subjective.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C1-002-Q1` | **B** | main_argument | 5/5 |
| `L-C1-002-Q2` | **C** | inference | 5/5 |
| `L-C1-002-Q3` | **C** | nuanced_stance | 5/5 |
| `L-C1-002-Q4` | **B** | implicit_meaning | 5/5 |

---
## C2 — Proficient User — Mastery

### L-C2-001 — The Seduction of the Clean Explanation
**Topic:** society  
**Genre:** expert_interview  
**Audience:** adult  
**Script length:** 534 words  
**Estimated duration:** 4:06 at ~130 wpm

#### Internal audio script

Host: In public debate, complex events often acquire a single dominant explanation remarkably quickly. Historian Leah Moretti calls this the 'clean explanation' problem.

Moretti: We are drawn to explanations that compress. A policy failed because of one leader, a company collapsed because of one decision, a social change happened because of one invention. Sometimes a factor really is disproportionately important, but the narrative reward for choosing one cause is so strong that we can mistake elegance for adequacy.

Host: Yet historians have to explain things. Listing every factor isn't explanation either.

Moretti: Exactly. Complexity is not a virtue by itself. If I give you forty causes and refuse to say which mattered more, I've transferred the analytical problem to you. The task is weighting, not merely accumulating. But weighting is different from purification. A good explanation can say, 'This factor changed the incentives, but only because these institutions were already vulnerable and this external shock arrived at the same time.'

Host: Why do clean explanations persist even after scholars complicate them?

Moretti: Because they are portable. They fit headlines, speeches, even memory. And once an explanation becomes morally useful—because it identifies a villain, a hero or a lesson—it gains another kind of resilience. Contrary evidence can then feel like an attempt to weaken the lesson rather than improve the account.

Host: So is the historian's job to make public stories messier?

Moretti: Sometimes. But 'messier' can become its own performance of sophistication. I would say the task is to preserve the distinctions that change what we should conclude. If two extra causes don't alter our interpretation, they may be detail. If they change who had agency, what alternatives existed or whether the outcome was avoidable, they aren't decorative complexity; they're part of the explanation.

Host: Does the format of evidence affect which explanation wins?

Moretti: Very much. Imagine two explanations for the same event. One can be expressed as a single causal sentence; the other requires a sequence: this institution limited one option, that incentive made another attractive, and a later shock changed the cost of waiting. The second may be better supported and still be harder to circulate. Compression has distributional advantages.

Host: Is there a way to communicate that complexity without losing everyone?

Moretti: I think so, but it requires accepting layers. A short explanation can identify the dominant mechanism while signalling that it operated under particular conditions. Then a longer version can unpack those conditions. What worries me is not simplification itself; any explanation simplifies. It is simplification that deletes the very condition on which the conclusion depends.

Host: Can you give an example of that distinction?

Moretti: Suppose we say, 'The reform failed because people resisted change.' That sounds psychological and perhaps inevitable. But if resistance emerged only after promised protections were removed, the institutional sequence matters. Add that detail and responsibility shifts. The extra complexity isn't ornamental; it changes what lesson the case supports.

Host: So the criterion is whether a detail changes inference.

Moretti: Precisely. We should ask: if I remove this factor, do I merely lose texture, or do I change the causal, moral or practical conclusion? That question does not eliminate disagreement, but it disciplines it.

#### Items

1. **L-C2-001-Q1 — nuanced_stance (difficulty 5/5)**

What distinction does Moretti draw between useful complexity and unhelpful complexity?

- **A.** Extra factors matter when they change how causes are weighted, not when they merely add detail.
- **B.** Any factor supported by evidence should be included regardless of its effect on the conclusion.
- **C.** Complex explanations are useful only when they contain fewer than a certain number of causes.
- **D.** A single cause is acceptable in public communication but never in historical scholarship.

2. **L-C2-001-Q2 — subtle_implication (difficulty 5/5)**

What does Moretti mean by saying clean explanations are 'portable'?

- **A.** They can be separated from moral judgement more easily than complex explanations can.
- **B.** They are easy to repeat, remember and reuse in simplified public accounts.
- **C.** They can be applied accurately to many different historical cases.
- **D.** They remain valid when translated into several languages and cultural contexts.

3. **L-C2-001-Q3 — rhetorical_function (difficulty 5/5)**

Why does Moretti reject simply listing forty causes?

- **A.** Because long lists encourage people to search for heroes and villains.
- **B.** Because explaining means judging importance, not passing that task to the audience.
- **C.** Because most events have only a small number of causes that can be empirically verified.
- **D.** Because audiences are incapable of remembering more than a few historical facts.

4. **L-C2-001-Q4 — implicit_meaning (difficulty 5/5)**

Why can contrary evidence feel like an attempt to 'weaken the lesson'?

- **A.** A moralised explanation can make nuance feel like a threat to the lesson people value.
- **B.** Moral lessons become unreliable whenever an explanation involves more than one significant cause.
- **C.** Scholars often introduce new evidence specifically to weaken the political force of public stories.
- **D.** Historical evidence becomes less credible when it conflicts with a widely shared ethical judgement.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C2-001-Q1` | **A** | nuanced_stance | 5/5 |
| `L-C2-001-Q2` | **B** | subtle_implication | 5/5 |
| `L-C2-001-Q3` | **B** | rhetorical_function | 5/5 |
| `L-C2-001-Q4` | **A** | implicit_meaning | 5/5 |

### L-C2-002 — What Counts as Silence?
**Topic:** society  
**Genre:** expert_interview  
**Audience:** adult  
**Script length:** 543 words  
**Estimated duration:** 4:11 at ~130 wpm

#### Internal audio script

Presenter: We tend to think of silence as the absence of speech, but linguist Amara Bell argues that silence can be an active part of interaction.

Bell: Consider a meeting where a manager asks, 'Does anyone disagree?' and nobody answers. Grammatically, nothing has been said, but socially a great deal may have happened. The silence could signal agreement, fear, uncertainty, politeness, boredom or simply that people need time. Its meaning depends on what the participants believe silence is allowed to mean in that setting.

Presenter: But if silence can mean almost anything, is it analytically useful?

Bell: Only if we avoid treating it as a code with fixed translations. Researchers sometimes ask, 'What does a three-second pause mean?' as if duration alone were enough. Instead, we look at position and expectation. A pause after an invitation is not the same as a pause after a factual question. In some conversational contexts, a delayed acceptance can suggest reluctance precisely because an enthusiastic acceptance is normally immediate.

Presenter: So interpretation depends on norms.

Bell: Yes, and norms are unevenly distributed. In a workplace, senior staff may experience silence as freedom to think, while junior staff experience the same silence as pressure not to speak. That's why advice like 'give everyone space' can be insufficient. Space is not neutral if some people have learned that entering it carries a cost.

Presenter: Can technology change this?

Bell: Certainly. Video calls alter cues; text chat lets people compose before responding; anonymous tools can redistribute participation. But every tool creates new silences too. If someone doesn't type in a chat, is that absence more visible or less? Technology doesn't remove the interpretive problem. It rearranges it.

Presenter: Are there cases where silence is deliberately used as a resource?

Bell: Constantly. A negotiator may pause to avoid accepting the frame of a question. A teacher may wait after asking something difficult because answering too quickly would take the thinking away from students. Friends may leave a silence because filling it would turn comfort into interrogation. These are not identical actions, but they show why counting words alone gives a poor picture of participation.

Presenter: That sounds difficult to study empirically.

Bell: It is, because interpretation has to remain accountable. We do not simply decide what a silence 'feels like'. We examine what happens before and after it, whether participants orient to it as unusual, whether someone repairs, changes topic, softens a statement or explicitly comments on the pause. The evidence is sequential.

Presenter: Does culture make the problem even more complicated?

Bell: It can, although culture is sometimes invoked too quickly. Saying 'people from culture X are comfortable with silence' can erase differences of age, status, profession and situation. Cultural expectations matter, but they are resources participants use, not scripts that determine behaviour.

Presenter: What practical lesson follows from this for meetings?

Bell: I'd avoid treating participation as a simple speaking-time target. Someone can dominate with short interventions and someone else can contribute decisively after listening for ten minutes. Leaders should notice who can enter the conversation, what kinds of pause are tolerated and whether disagreement is followed by curiosity or punishment. The question isn't 'How do we eliminate silence?' It is 'What possibilities does this silence create or close?'

#### Items

1. **L-C2-002-Q1 — conceptual_understanding (difficulty 5/5)**

What is Bell's main point about silence?

- **A.** It is usually a sign that participants are afraid to disagree with authority.
- **B.** It has become more difficult to interpret because most communication now occurs online.
- **C.** Its meaning depends on interaction and context, not just an absence of words.
- **D.** Its duration provides the most reliable evidence of what a speaker intends.

2. **L-C2-002-Q2 — subtle_inference (difficulty 5/5)**

Why does Bell compare a pause after an invitation with a pause after a factual question?

- **A.** to suggest that reluctance can only be expressed indirectly through silence
- **B.** to argue that factual questions should be answered immediately in professional settings
- **C.** to demonstrate that invitations produce longer pauses than questions in every language
- **D.** to show that the same delay can mean different things depending on expectations

3. **L-C2-002-Q3 — nuanced_stance (difficulty 5/5)**

What reservation does Bell express about telling leaders to 'give everyone space'?

- **A.** Anonymous tools should replace open discussion whenever people are likely to disagree.
- **B.** Silence becomes useful only when all participants have approximately the same professional status.
- **C.** Leaders often give junior employees too much unstructured discussion time in meetings.
- **D.** The same 'space' may feel less safe to enter for people with less power.

4. **L-C2-002-Q4 — implication (difficulty 5/5)**

What does Bell mean when she says technology 'rearranges' the interpretive problem?

- **A.** Online communication makes silence less socially meaningful because participants are physically separated.
- **B.** Digital tools can solve unequal participation even though they create new technical problems.
- **C.** Different tools change the cues through which silence is interpreted without removing the ambiguity.
- **D.** Technology turns ambiguous spoken silences into clearer written records that are easier to interpret.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C2-002-Q1` | **C** | conceptual_understanding | 5/5 |
| `L-C2-002-Q2` | **D** | subtle_inference | 5/5 |
| `L-C2-002-Q3` | **D** | nuanced_stance | 5/5 |
| `L-C2-002-Q4` | **C** | implication | 5/5 |

---
# 6. Language Use Bank

## Orientação

Language Use fornece evidência complementar de controle gramatical, lexical, pragmático e de registro. Ele **não deve, isoladamente, determinar o CEFR global**.


## A1 — Basic User — Breakthrough

1. **LU-A1-001 — grammar (difficulty 1/5)**

My brother ___ 14 years old.

- **A.** am
- **B.** is
- **C.** are
- **D.** be

2. **LU-A1-002 — grammar (difficulty 2/5)**

We ___ English on Tuesdays and Thursdays.

- **A.** studying
- **B.** study
- **C.** to study
- **D.** studies

3. **LU-A1-003 — grammar (difficulty 2/5)**

There ___ two chairs next to the table.

- **A.** are
- **B.** be
- **C.** is
- **D.** has

4. **LU-A1-004 — grammar (difficulty 1/5)**

Maria can't come now. ___ is at work.

- **A.** Her
- **B.** She
- **C.** Hers
- **D.** He

5. **LU-A1-005 — grammar (difficulty 2/5)**

I usually have breakfast ___ seven o'clock.

- **A.** on
- **B.** from
- **C.** at
- **D.** in

6. **LU-A1-006 — vocabulary (difficulty 1/5)**

You use a ___ to open a door.

- **A.** key
- **B.** spoon
- **C.** pillow
- **D.** plate

7. **LU-A1-007 — functional_language (difficulty 1/5)**

A: Thank you very much. B: ___

- **A.** You're welcome.
- **B.** Excuse me.
- **C.** I'm sorry.
- **D.** Good night.

8. **LU-A1-008 — grammar (difficulty 2/5)**

My parents ___ a small car.

- **A.** has
- **B.** having
- **C.** are having
- **D.** have

9. **LU-A1-009 — vocabulary (difficulty 1/5)**

It is very cold today. Please take your ___.

- **A.** sandals
- **B.** swimsuit
- **C.** jacket
- **D.** shorts

10. **LU-A1-010 — grammar (difficulty 2/5)**

A: ___ you swim? B: Yes, I can.

- **A.** Are
- **B.** Have
- **C.** Do
- **D.** Can

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-A1-001` | **B** | grammar | 1/5 |
| `LU-A1-002` | **B** | grammar | 2/5 |
| `LU-A1-003` | **A** | grammar | 2/5 |
| `LU-A1-004` | **B** | grammar | 1/5 |
| `LU-A1-005` | **C** | grammar | 2/5 |
| `LU-A1-006` | **A** | vocabulary | 1/5 |
| `LU-A1-007` | **A** | functional_language | 1/5 |
| `LU-A1-008` | **D** | grammar | 2/5 |
| `LU-A1-009` | **C** | vocabulary | 1/5 |
| `LU-A1-010` | **D** | grammar | 2/5 |

---
## A2 — Basic User — Waystage

1. **LU-A2-001 — grammar (difficulty 2/5)**

We ___ that restaurant last Saturday.

- **A.** went to
- **B.** are going to
- **C.** have gone to
- **D.** go to

2. **LU-A2-002 — grammar (difficulty 2/5)**

This bag is ___ than mine.

- **A.** heaviest
- **B.** heavy
- **C.** the heaviest
- **D.** heavier

3. **LU-A2-003 — grammar (difficulty 2/5)**

There isn't ___ milk left in the fridge.

- **A.** several
- **B.** a few
- **C.** much
- **D.** many

4. **LU-A2-004 — grammar (difficulty 3/5)**

I think it ___ rain later, so take an umbrella.

- **A.** must
- **B.** can
- **C.** might
- **D.** has to

5. **LU-A2-005 — functional_language (difficulty 2/5)**

A: Could I try this shirt on? B: ___

- **A.** No thanks. I don't need a new shirt.
- **B.** Of course. The changing rooms are over there.
- **C.** Yes, I tried that shirt on yesterday.
- **D.** It was forty pounds when I bought it.

6. **LU-A2-006 — vocabulary (difficulty 2/5)**

The bus was very ___, so we had to stand.

- **A.** available
- **B.** comfortable
- **C.** crowded
- **D.** empty

7. **LU-A2-007 — grammar (difficulty 2/5)**

She's going to visit her aunt ___ weekend.

- **A.** on next
- **B.** in next
- **C.** at next
- **D.** next

8. **LU-A2-008 — grammar (difficulty 3/5)**

I was cooking when the phone ___.

- **A.** was ringing
- **B.** rings
- **C.** has rung
- **D.** rang

9. **LU-A2-009 — collocation (difficulty 2/5)**

Can you ___ a photo of us, please?

- **A.** take
- **B.** do
- **C.** make
- **D.** bring

10. **LU-A2-010 — functional_language (difficulty 2/5)**

A: I'm sorry I'm late. B: ___

- **A.** Yes, I am.
- **B.** That's all right.
- **C.** It starts at eight o’clock.
- **D.** I'm sorry too.

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-A2-001` | **A** | grammar | 2/5 |
| `LU-A2-002` | **D** | grammar | 2/5 |
| `LU-A2-003` | **C** | grammar | 2/5 |
| `LU-A2-004` | **C** | grammar | 3/5 |
| `LU-A2-005` | **B** | functional_language | 2/5 |
| `LU-A2-006` | **C** | vocabulary | 2/5 |
| `LU-A2-007` | **D** | grammar | 2/5 |
| `LU-A2-008` | **D** | grammar | 3/5 |
| `LU-A2-009` | **A** | collocation | 2/5 |
| `LU-A2-010` | **B** | functional_language | 2/5 |

---
## B1 — Independent User — Threshold

1. **LU-B1-001 — grammar (difficulty 3/5)**

I ___ this book yet, so please don't tell me the ending.

- **A.** haven't finished
- **B.** hadn't finished
- **C.** wasn’t finishing
- **D.** don't finish

2. **LU-B1-002 — grammar (difficulty 3/5)**

If the weather ___ good tomorrow, we'll have lunch outside.

- **A.** would be
- **B.** will be
- **C.** was
- **D.** is

3. **LU-B1-003 — grammar (difficulty 3/5)**

The new sports centre ___ by the mayor last year.

- **A.** was opened
- **B.** has been opened
- **C.** opened
- **D.** was opening

4. **LU-B1-004 — word_formation (difficulty 3/5)**

The instructions were clear and easy to ___.

- **A.** understanding
- **B.** understand
- **C.** understandable
- **D.** understood

5. **LU-B1-005 — collocation (difficulty 3/5)**

We need to ___ a decision before Friday.

- **A.** do
- **B.** make
- **C.** put
- **D.** set

6. **LU-B1-006 — phrasal_verbs (difficulty 3/5)**

I didn't know the answer, so I ___ it up online.

- **A.** made
- **B.** turned
- **C.** looked
- **D.** put

7. **LU-B1-007 — grammar (difficulty 3/5)**

That's the teacher ___ helped me prepare for the exam.

- **A.** which
- **B.** whose
- **C.** who
- **D.** whom

8. **LU-B1-008 — functional_language (difficulty 3/5)**

A: Do you mind if I open the window? B: ___

- **A.** Not at all. Go ahead.
- **B.** Yes, please do.
- **C.** Yes, I do. Go ahead.
- **D.** I'm sorry, I can't open it.

9. **LU-B1-009 — lexical_choice (difficulty 4/5)**

The train was delayed, but we ___ to arrive before the meeting started.

- **A.** succeeded
- **B.** achieved
- **C.** reached
- **D.** managed

10. **LU-B1-010 — discourse_markers (difficulty 3/5)**

The hotel was quite basic. ___, it was clean and the staff were friendly.

- **A.** Because
- **B.** Unless
- **C.** For example
- **D.** However

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-B1-001` | **A** | grammar | 3/5 |
| `LU-B1-002` | **D** | grammar | 3/5 |
| `LU-B1-003` | **A** | grammar | 3/5 |
| `LU-B1-004` | **B** | word_formation | 3/5 |
| `LU-B1-005` | **B** | collocation | 3/5 |
| `LU-B1-006` | **C** | phrasal_verbs | 3/5 |
| `LU-B1-007` | **C** | grammar | 3/5 |
| `LU-B1-008` | **A** | functional_language | 3/5 |
| `LU-B1-009` | **D** | lexical_choice | 4/5 |
| `LU-B1-010` | **D** | discourse_markers | 3/5 |

---
## B2 — Independent User — Vantage

1. **LU-B2-001 — grammar (difficulty 4/5)**

Had I known the road was closed, I ___ a different route.

- **A.** would have taken
- **B.** will have taken
- **C.** would take
- **D.** had taken

2. **LU-B2-002 — collocation (difficulty 4/5)**

The report ___ serious concerns about the safety of the building.

- **A.** raises
- **B.** rises
- **C.** lifts
- **D.** grows

3. **LU-B2-003 — lexical_choice (difficulty 4/5)**

Her explanation was so ___ that even people unfamiliar with the topic could follow it.

- **A.** available
- **B.** ordinary
- **C.** accessible
- **D.** casual

4. **LU-B2-004 — grammar (difficulty 4/5)**

The company is believed ___ more than 200 people next year.

- **A.** that it hires
- **B.** to have hired
- **C.** to be hiring
- **D.** hiring

5. **LU-B2-005 — phrasal_verbs (difficulty 3/5)**

We had to ___ the meeting until Monday because two key people were absent.

- **A.** take over
- **B.** put off
- **C.** bring up
- **D.** set out

6. **LU-B2-006 — register (difficulty 4/5)**

Which sentence is most appropriate in a formal request?

- **A.** Confirm the revised deadline for this project at your earliest convenience.
- **B.** I want to know the revised deadline as soon as possible.
- **C.** Would you mind telling me the new deadline? Thanks!
- **D.** I would be grateful if you could confirm the revised deadline.

7. **LU-B2-007 — discourse_markers (difficulty 4/5)**

The proposal is expensive. ___, it could reduce maintenance costs in the long term.

- **A.** Whereas
- **B.** Nevertheless
- **C.** Despite
- **D.** Consequently

8. **LU-B2-008 — grammar (difficulty 4/5)**

It's about time we ___ a clearer policy on remote work.

- **A.** will introduce
- **B.** introduced
- **C.** introduce
- **D.** have introduced

9. **LU-B2-009 — collocation (difficulty 4/5)**

The researchers were unable to ___ a firm conclusion from the limited data.

- **A.** extract
- **B.** make
- **C.** draw
- **D.** take

10. **LU-B2-010 — lexical_choice (difficulty 4/5)**

His comments were not directly critical, but the ___ was clear.

- **A.** definition
- **B.** translation
- **C.** instruction
- **D.** implication

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-B2-001` | **A** | grammar | 4/5 |
| `LU-B2-002` | **A** | collocation | 4/5 |
| `LU-B2-003` | **C** | lexical_choice | 4/5 |
| `LU-B2-004` | **C** | grammar | 4/5 |
| `LU-B2-005` | **B** | phrasal_verbs | 3/5 |
| `LU-B2-006` | **D** | register | 4/5 |
| `LU-B2-007` | **B** | discourse_markers | 4/5 |
| `LU-B2-008` | **B** | grammar | 4/5 |
| `LU-B2-009` | **C** | collocation | 4/5 |
| `LU-B2-010` | **D** | lexical_choice | 4/5 |

---
## C1 — Proficient User — Effective Operational Proficiency

1. **LU-C1-001 — lexical_precision (difficulty 5/5)**

The committee's conclusions were necessarily ___, given the limited evidence available.

- **A.** tentative
- **B.** temporary
- **C.** fragile
- **D.** casual

2. **LU-C1-002 — grammar (difficulty 5/5)**

Rarely ___ such a rapid change in public attitudes.

- **A.** we have seen
- **B.** have we seen
- **C.** we saw
- **D.** we had seen

3. **LU-C1-003 — collocation (difficulty 5/5)**

The minister's remarks ___ a wave of criticism from opposition parties.

- **A.** lit
- **B.** made
- **C.** gave rise
- **D.** sparked

4. **LU-C1-004 — register (difficulty 5/5)**

Which wording is most appropriately cautious for an academic report?

- **A.** The findings show that this interpretation is correct, although other explanations exist.
- **B.** It seems quite obvious from these findings that this interpretation is preferable to the other available alternatives.
- **C.** The findings appear to support this interpretation, although alternative explanations cannot be excluded.
- **D.** The findings prove this interpretation, but alternative explanations may also be possible.

5. **LU-C1-005 — lexical_precision (difficulty 5/5)**

The policy was intended as a temporary measure, but it gradually became ___ in everyday practice.

- **A.** entrenched
- **B.** enclosed
- **C.** engraved
- **D.** enlisted

6. **LU-C1-006 — grammar (difficulty 5/5)**

Were the funding to be withdrawn, the project ___ difficult to sustain.

- **A.** has become
- **B.** will become
- **C.** would become
- **D.** became

7. **LU-C1-007 — discourse_markers (difficulty 5/5)**

The evidence is incomplete. ___, it is sufficient to justify further investigation.

- **A.** Even so
- **B.** Whereupon
- **C.** Insofar
- **D.** Thereby

8. **LU-C1-008 — word_formation (difficulty 5/5)**

The apparent simplicity of the solution is somewhat ___.

- **A.** deception
- **B.** deceived
- **C.** deceivingly
- **D.** deceptive

9. **LU-C1-009 — collocation (difficulty 5/5)**

The author ___ a distinction between legal responsibility and moral responsibility.

- **A.** cuts
- **B.** draws
- **C.** sets
- **D.** opens

10. **LU-C1-010 — lexical_precision (difficulty 5/5)**

The speaker deliberately ___ the difference between correlation and causation, which weakened the argument.

- **A.** melted
- **B.** blended
- **C.** blurred
- **D.** faded

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-C1-001` | **A** | lexical_precision | 5/5 |
| `LU-C1-002` | **B** | grammar | 5/5 |
| `LU-C1-003` | **D** | collocation | 5/5 |
| `LU-C1-004` | **C** | register | 5/5 |
| `LU-C1-005` | **A** | lexical_precision | 5/5 |
| `LU-C1-006` | **C** | grammar | 5/5 |
| `LU-C1-007` | **A** | discourse_markers | 5/5 |
| `LU-C1-008` | **D** | word_formation | 5/5 |
| `LU-C1-009` | **B** | collocation | 5/5 |
| `LU-C1-010` | **C** | lexical_precision | 5/5 |

---
## C2 — Proficient User — Mastery

1. **LU-C2-001 — lexical_precision (difficulty 5/5)**

The article does not reject the theory outright; rather, it ___ its explanatory reach.

- **A.** cancels
- **B.** circumscribes
- **C.** circulates
- **D.** interrupts

2. **LU-C2-002 — idiomatic_control (difficulty 5/5)**

Her criticism was ___ by praise for the team's earlier work, making the overall judgement deliberately measured.

- **A.** heightened
- **B.** sharpened
- **C.** tempered
- **D.** hardened

3. **LU-C2-003 — register (difficulty 5/5)**

A colleague writes: "The evidence proves the actors intended this outcome." You think intention is possible but not established. Which revision best preserves that distinction?

- **A.** The actors did not actually intend this outcome, whatever the evidence may appear to suggest about it.
- **B.** The evidence shows that the actors intended this outcome, at least in part.
- **C.** The evidence is consistent with that interpretation, but it does not establish the actors' intention.
- **D.** The evidence proves the actors probably intended this outcome.

4. **LU-C2-004 — lexical_precision (difficulty 5/5)**

The distinction may seem ___, but it has significant consequences for how the law is applied.

- **A.** heavy-handed
- **B.** long-winded
- **C.** open-ended
- **D.** hair-splitting

5. **LU-C2-005 — collocation (difficulty 5/5)**

The later chapters ___ the earlier claim by introducing evidence that the author initially set aside.

- **A.** implicate
- **B.** complicate
- **C.** duplicate
- **D.** replicate

6. **LU-C2-006 — grammar (difficulty 5/5)**

So compelling ___ that several critics overlooked weaknesses in the underlying data.

- **A.** has been the narrative
- **B.** the narrative was
- **C.** did the narrative
- **D.** was the narrative

7. **LU-C2-007 — lexical_precision (difficulty 5/5)**

The minister's answer was technically accurate but strategically ___, avoiding the question's central issue.

- **A.** evasive
- **B.** escaped
- **C.** missing
- **D.** wandering

8. **LU-C2-008 — pragmatic_appropriacy (difficulty 5/5)**

Which reply most tactfully challenges an unsupported assumption in a formal discussion?

- **A.** Could we examine what evidence leads us to treat that assumption as settled?
- **B.** Before we continue, you will need to demonstrate that this assumption is actually correct.
- **C.** That assumption is plainly unsupported by anything that has been presented so far.
- **D.** Could we pause there? I have to say that assumption makes very little sense to me.

9. **LU-C2-009 — idiomatic_control (difficulty 5/5)**

The proposal was initially dismissed as unrealistic, but recent events have given it a new ___ of life.

- **A.** period
- **B.** contract
- **C.** rent
- **D.** lease

10. **LU-C2-010 — lexical_precision (difficulty 5/5)**

The author's irony is sufficiently ___ that a literal reading remains possible.

- **A.** underused
- **B.** understated
- **C.** undersized
- **D.** underwritten

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-C2-001` | **B** | lexical_precision | 5/5 |
| `LU-C2-002` | **C** | idiomatic_control | 5/5 |
| `LU-C2-003` | **C** | register | 5/5 |
| `LU-C2-004` | **D** | lexical_precision | 5/5 |
| `LU-C2-005` | **B** | collocation | 5/5 |
| `LU-C2-006` | **D** | grammar | 5/5 |
| `LU-C2-007` | **A** | lexical_precision | 5/5 |
| `LU-C2-008` | **A** | pragmatic_appropriacy | 5/5 |
| `LU-C2-009` | **D** | idiomatic_control | 5/5 |
| `LU-C2-010` | **B** | lexical_precision | 5/5 |

---
# 7. Writing Task Bank

Todos os prompts de Writing são avaliados pela rubrica analítica definida na `LangSpot CEFR Assessment Specification`: **Task Achievement, Range, Accuracy, Organisation & Cohesion, Register & Pragmatic Appropriacy**.


## A1 — Basic User — Breakthrough

### W-A1-001 — personal_message
**Topic:** daily_life  
**Audience:** general  
**Target:** 20–35 words  
**Primary evidence:** basic information; intelligibility; simple linking

You are at a friend’s house. Write a message to your mother or father. Say:
- where you are;
- who you are with;
- what time you will come home.

### W-A1-002 — basic_description
**Topic:** daily_life  
**Audience:** general  
**Target:** 20–35 words  
**Primary evidence:** basic description; frequent structures; simple cohesion

A new classmate wants to know about your daily routine. Write a short text about:
- what time you get up;
- one thing you do in the morning;
- what you do after school or work;
- one activity you like.

---
## A2 — Basic User — Waystage

### W-A2-001 — informal_email
**Topic:** relationships  
**Audience:** general  
**Target:** 40–70 words  
**Primary evidence:** functional completion; simple connected text; appropriacy

Your friend wants to visit you this weekend. Write an email:
- suggest one activity;
- say where you can meet;
- explain what your friend should bring;
- ask one question about the visit.

### W-A2-002 — simple_narrative
**Topic:** daily_life  
**Audience:** general  
**Target:** 40–70 words  
**Primary evidence:** past narration; sequence; basic evaluation

Your English teacher wants stories for the class blog. Write about a day when your plans changed. Say:
- what you planned to do;
- what happened;
- what you did instead;
- how you felt about the change.

---
## B1 — Independent User — Threshold

### W-B1-001 — informal_email
**Topic:** relationships  
**Audience:** general  
**Target:** 100–120 words
**Primary evidence:** connected advice; justification; functional organisation

Your English-speaking friend Alex wants to start a new hobby but says they have very little free time. Write an email to Alex in which you:
- recommend a hobby;
- explain why it could suit them;
- describe one possible difficulty;
- suggest how they could get started.

### W-B1-002 — opinion_article
**Topic:** education  
**Audience:** teen_adult  
**Target:** 100–120 words
**Primary evidence:** opinion; reasons; examples; connected discourse

You see this notice on your school’s or workplace’s English-language website:

**Articles wanted! Is it better to learn something new alone or with other people?**

Write an article giving your opinion. Include reasons and at least one example.

---
## B2 — Independent User — Vantage

### W-B2-001 — argumentative_essay
**Topic:** education  
**Audience:** teen_adult  
**Target:** 140–190 words  
**Primary evidence:** balanced argument; development; conclusion; register

In your English class you have been talking about homework. Your teacher has asked you to write an essay.

**Should schools give students less homework and more time for independent projects?**

Write about:
1. the effect on what students learn;
2. the effect on students’ free time;
3. your own idea.

Give reasons for your point of view.

### W-B2-002 — formal_email
**Topic:** education  
**Audience:** adult  
**Target:** 140–190 words  
**Primary evidence:** formal register; evaluation; recommendation; cohesion

You recently attended a professional or educational event. The organisers have asked for feedback. Write a formal email in which you:
- explain what was useful;
- identify one aspect that could be improved;
- explain why that improvement matters;
- make a practical suggestion.

---
## C1 — Proficient User — Effective Operational Proficiency

### W-C1-001 — proposal
**Topic:** culture  
**Audience:** adult  
**Target:** 220–260 words
**Primary evidence:** structured proposal; qualification; feasibility; register

A community organisation wants to increase participation in local cultural activities but has a limited budget. Its committee has asked members for proposals.

Write a proposal for the committee that:
- identifies two barriers to participation;
- recommends practical measures;
- considers possible limitations of your recommendations;
- explains how success could be evaluated.

### W-C1-002 — argumentative_essay
**Topic:** education  
**Audience:** adult  
**Target:** 220–260 words
**Primary evidence:** complex argument; counterargument; lexical precision; cohesion

Your college magazine is publishing essays on the following claim:

“When information is easy to access, knowing facts becomes less important than knowing how to evaluate them.”

Write an essay examining this claim. Develop a clear position while acknowledging relevant counterarguments.

---
## C2 — Proficient User — Mastery

### W-C2-001 — critical_synthesis
**Topic:** technology  
**Audience:** adult  
**Target:** 280–320 words
**Primary evidence:** synthesis; nuance; policy register; trade-off management

A public institution is considering replacing some face-to-face services with automated digital systems. Write a critical briefing for its senior decision-makers.

Your briefing should:
- distinguish efficiency gains from changes in service quality;
- consider users for whom automation may create new barriers;
- examine at least one trade-off rather than presenting a simple pro/anti position;
- recommend principles that should guide implementation.

### W-C2-002 — analytical_essay
**Topic:** society  
**Audience:** adult  
**Target:** 280–320 words
**Primary evidence:** conceptual precision; nuanced argument; stylistic control

A journal for teachers and science communicators invites essays on the proposition:

“A perfectly clear explanation is not always the most accurate explanation.”

Write an analytical essay exploring this proposition. You may draw on examples from science, education, public communication, professional life or another relevant field. Distinguish productive complexity from unnecessary obscurity.

---
# 8. Spoken Production Task Bank

Estas tarefas avaliam produção oral individual. A dimensão **Interaction** não deve ser pontuada a partir destas tarefas isoladamente.


## A1 — Basic User — Breakthrough

### SP-A1-001 — short_turn
**Topic:** daily_life  
**Audience:** general  
**Target duration:** 30–45 seconds  
**Primary evidence:** basic connected personal information

Talk about your home. Say:
- where you live;
- who lives with you;
- one room you like;
- one thing in that room.

### SP-A1-002 — short_turn
**Topic:** daily_life  
**Audience:** general  
**Target duration:** 30–45 seconds  
**Primary evidence:** simple sequence; frequent vocabulary

Talk about a normal school or work day. Say what you do in the morning, afternoon and evening.

---
## A2 — Basic User — Waystage

### SP-A2-001 — short_long_turn
**Topic:** daily_life  
**Audience:** general  
**Target duration:** 45–60 seconds  
**Primary evidence:** simple description; reasons; basic cohesion

Describe a place in your town that you like visiting. Explain:
- where it is;
- what people can do there;
- when you usually go;
- why you like it.

### SP-A2-002 — simple_narrative
**Topic:** daily_life  
**Audience:** general  
**Target duration:** 45–60 seconds  
**Primary evidence:** past narration; sequence; evaluation

Talk about a recent weekend or free day. Say what you did, who you were with and which part you enjoyed most.

---
## B1 — Independent User — Threshold

### SP-B1-001 — long_turn
**Topic:** education  
**Audience:** general  
**Target duration:** 1–2 minutes  
**Primary evidence:** connected narrative; explanation; reflection

Describe something useful you learned outside a formal class. Explain how you learned it, what was difficult and how you use that skill now.

### SP-B1-002 — opinion_long_turn
**Topic:** daily_life  
**Audience:** general  
**Target duration:** 1–2 minutes  
**Primary evidence:** comparison; preference; reasons

Some people prefer planning their free time carefully; others prefer deciding at the last minute. Compare the two approaches and explain which you prefer.

---
## B2 — Independent User — Vantage

### SP-B2-001 — argument_long_turn
**Topic:** society  
**Audience:** adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** sustained evaluation; comparison; consequences

A city wants to reduce car use in the centre. It is considering better public transport, higher parking fees and more cycle lanes. Explain which measures are likely to be most effective and what problems they might create.

### SP-B2-002 — abstract_long_turn
**Topic:** technology  
**Audience:** teen_adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** argument; qualification; examples

Some people say that close friendships are harder to keep today than in the past. Do you agree? Develop your view with reasons and examples.

---
## C1 — Proficient User — Effective Operational Proficiency

### SP-C1-001 — advanced_long_turn
**Topic:** work  
**Audience:** adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** complex explanation; qualification; structure

Organisations often say they want employees to be creative but also require predictable results. Explain why these goals can conflict and how an organisation might manage the tension.

### SP-C1-002 — advanced_long_turn
**Topic:** society  
**Audience:** adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** abstract argument; nuanced distinction; examples

Many people now learn new skills from short online videos. Discuss what this kind of learning does well and what it may fail to develop.

---
## C2 — Proficient User — Mastery

### SP-C2-001 — advanced_analytical_turn
**Topic:** work  
**Audience:** adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** fine distinctions; sustained analytical discourse; precision

Discuss the claim that institutions sometimes confuse measurable performance with valuable performance. Explain why the distinction matters and how decision-makers might respond without rejecting measurement altogether.

### SP-C2-002 — advanced_analytical_turn
**Topic:** society  
**Audience:** adult  
**Target duration:** 2–3 minutes  
**Primary evidence:** nuanced argument; conceptual control; qualification

Consider the idea that preserving disagreement can sometimes be more productive than reaching consensus. Identify contexts in which this may be true, contexts in which it may be harmful, and the principles that distinguish the two.

---
# 9. Spoken Interaction Task Bank

Estas tarefas exigem reação ao interlocutor, negociação de significado e gerenciamento de turnos. Devem ser avaliadas com a rubrica oral completa.


## A1 — Basic User — Breakthrough

### SI-A1-001 — guided_interview
**Topic:** daily_life  
**Audience:** general  
**Suggested duration:** 2–3 minutes  
**Primary evidence:** responding to basic questions; simple follow-up; asking for repetition

The examiner will ask you some questions about yourself: your name, your home, your family, what you like and your day. Answer each question with one or two sentences.

### SI-A1-002 — simple_role_play
**Topic:** daily_life  
**Audience:** general  
**Suggested duration:** 2–3 minutes  
**Primary evidence:** basic transactional exchange; repair with support

You are in a café. The examiner is the server. Ask for a drink and a snack. One of them is not available, so choose something else. Then ask how much it costs.

---
## A2 — Basic User — Waystage

### SI-A2-001 — role_play
**Topic:** education  
**Audience:** general  
**Suggested duration:** 3–4 minutes  
**Primary evidence:** routine information exchange; choosing; clarification

You want to join a class at a local centre. The examiner works at the centre. Ask about the days, the time, the price and what to bring. Then choose one of the two class times the examiner offers and say why.

### SI-A2-002 — planning_task
**Topic:** daily_life  
**Audience:** general  
**Suggested duration:** 3–4 minutes  
**Primary evidence:** suggestions; simple agreement/disagreement; decision

You and the examiner are planning a Saturday outing. There are three options: a picnic in the park, the cinema or the city museum. Talk about the time, the cost and the weather, and agree on one plan.

---
## B1 — Independent User — Threshold

### SI-B1-001 — collaborative_decision
**Topic:** travel  
**Audience:** general  
**Suggested duration:** 4–5 minutes  
**Primary evidence:** independent interaction; reasons; negotiation

You and the examiner have one afternoon to show a visiting student around your town. The options are a walking tour of the old town, a local market, a football match and an art exhibition. Think about the visitor’s interests and budget, and agree on two activities.

### SI-B1-002 — problem_solving
**Topic:** education  
**Audience:** teen_adult  
**Suggested duration:** 4–5 minutes  
**Primary evidence:** hypothesising; responding; joint decision

Fewer and fewer people are coming to your class’s monthly social event. Talk with the examiner about possible reasons and agree on two realistic changes to bring more people back.

---
## B2 — Independent User — Vantage

### SI-B2-001 — collaborative_decision
**Topic:** education  
**Audience:** teen_adult  
**Suggested duration:** 5–6 minutes  
**Primary evidence:** spontaneous negotiation; sustained justification; turn management

Your school has money for only one improvement: a quiet study area, better sports facilities, a media lab or more student clubs. Discuss the options with the examiner, question each other’s priorities and reach a decision.

### SI-B2-002 — problem_solving
**Topic:** work  
**Audience:** adult  
**Suggested duration:** 5–6 minutes  
**Primary evidence:** argument response; trade-offs; collaborative solution

Your town wants to make its main shopping street more attractive. Discuss four proposals with the examiner — weekend markets, more green space, free parking or regular cultural events — and agree on a plan.

---
## C1 — Proficient User — Effective Operational Proficiency

### SI-C1-001 — advanced_discussion
**Topic:** society  
**Audience:** adult  
**Suggested duration:** 6–8 minutes  
**Primary evidence:** strategic turn-taking; register; compromise; complex argument

Your city is considering restricting short-term tourist rentals in residential areas. You represent local residents; the examiner represents property owners and tourism businesses. Negotiate a recommendation that recognises both sets of interests.

### SI-C1-002 — advanced_discussion
**Topic:** technology  
**Audience:** adult  
**Suggested duration:** 6–8 minutes  
**Primary evidence:** abstract interaction; reformulation; qualification; synthesis

Your organisation wants to use AI-generated summaries for internal reports. With the examiner, discuss the benefits, the risks to accuracy, who is accountable for errors and what safeguards are needed, then agree on a joint recommendation.

---
## C2 — Proficient User — Mastery

### SI-C2-001 — high_level_negotiation
**Topic:** society  
**Audience:** adult  
**Suggested duration:** 7–9 minutes  
**Primary evidence:** nuanced disagreement; assumption testing; precise compromise

Your city must decide whether to close its historic centre to private cars permanently. You argue for closure; the examiner argues against. Question each other’s assumptions and negotiate the principles a final decision should follow.

### SI-C2-002 — high_level_discussion
**Topic:** education  
**Audience:** adult  
**Suggested duration:** 7–9 minutes  
**Primary evidence:** conceptual interaction; subtle stance; collaborative synthesis

You and the examiner are advising a research funder that must divide its budget between a few large, ambitious projects and many small ones. Discuss what each approach risks and rewards, challenge each other’s reasoning and reach a qualified joint position.

---
# 10. Mediation Task Bank

Mediation deve avaliar a capacidade de selecionar, processar, sintetizar, explicar ou reformular informação para outra pessoa ou público. A resposta não deve ser julgada como tradução palavra por palavra.


## A1 — Basic User — Breakthrough

### M-A1-001 — relay_specific_information
**Topic:** daily_life  
**Audience:** general  
**Target:** 20–35 words
**Primary evidence:** selection and accurate relay of basic information

Source card:
**Community Pool**
Monday–Friday: 7:00–20:00
Saturday: 8:00–14:00
Sunday: closed
Adult ticket: R$12
Child ticket: R$6

**Task:** Your English-speaking friend asks when the pool is open on Saturday and how much one adult and one child will pay. Write a short message to your friend in English with this information.

---
## A2 — Basic User — Waystage

### M-A2-001 — relay_and_explain
**Topic:** education  
**Audience:** general  
**Target:** 30–50 words
**Primary evidence:** selection; simple cross-linguistic relay; clarity

Read this Portuguese note:

**A aula de fotografia de sábado foi transferida das 9h para as 10h30 porque o professor chegará mais tarde. Os alunos devem levar o celular ou uma câmera e encontrar o grupo na entrada principal.**

**Task:** Write a message in English to a classmate who does not read Portuguese. Explain the change and what they need to do.

---
## B1 — Independent User — Threshold

### M-B1-001 — summary_for_audience
**Topic:** culture  
**Audience:** general  
**Target:** 60–90 words
**Primary evidence:** processing text; prioritisation; accessible summary

You have read two short comments about a local book club:

**Comment 1:** Meetings are friendly and discussions are interesting, but the group chooses books that are too long for people with busy schedules.

**Comment 2:** The monthly meeting works well, but new members sometimes feel uncomfortable because the same few people speak most of the time.

**Task:** Write an email to the club organiser explaining the two main problems in the comments and saying which one is most important to act on first.

---
## B2 — Independent User — Vantage

### M-B2-001 — synthesis
**Topic:** work  
**Audience:** adult  
**Target:** 90–130 words
**Primary evidence:** synthesis; comparison; audience adaptation; trade-offs

Two teams tested different ways to reduce email overload.

**Team A:** introduced a rule that internal emails should be answered only twice a day. Staff reported better concentration, but urgent requests were sometimes missed.

**Team B:** kept email open but required subject labels such as URGENT, ACTION and INFORMATION. Urgent communication improved, but employees complained that too many messages were labelled URGENT.

**Task:** Write a short briefing for your manager on what the two trials suggest. Do not simply repeat each source: bring out the trade-offs and identify one question the manager should consider before choosing a policy.

---
## C1 — Proficient User — Effective Operational Proficiency

### M-C1-001 — complex_reformulation
**Topic:** work  
**Audience:** adult  
**Target:** 130–180 words
**Primary evidence:** precise reformulation; preserving qualification; audience adaptation

A technical report states:

'The observed association between flexible scheduling and lower staff turnover remains statistically significant after adjustment for department and tenure. However, the observational design does not establish causality, and unmeasured differences between employees who use flexible schedules and those who do not may partly account for the result.'

**Task:** Write a note explaining this finding to a non-specialist manager. Preserve the uncertainty and explain what the report does **not** justify concluding.

---
## C2 — Proficient User — Mastery

### M-C2-001 — multi_source_critical_synthesis
**Topic:** society  
**Audience:** adult  
**Target:** 160–220 words
**Primary evidence:** multi-source integration; nuance preservation; conceptual reframing

Source A argues that public institutions should release preliminary data quickly because delayed information can allow rumours to dominate.

Source B argues that preliminary figures are often revised and can acquire unjustified authority once widely reported.

Source C proposes releasing provisional data only when uncertainty, revision history and decision relevance can be communicated alongside the figures.

**Task:** Write a concise briefing for senior officials that reconstructs the underlying disagreement, distinguishes the values at stake, and proposes a decision principle rather than merely choosing one source.

---
# 11. Revisão vertical A1 → C2

## Reading

- **A1:** reconhecimento e informação explícita.
- **A2:** gist, detalhe, sequência, referência e propósito simples.
- **B1:** ideia principal, inferência básica, propósito e organização.
- **B2:** posição, argumento, implicação e função de parágrafo.
- **C1:** significado implícito, estrutura retórica, stance nuançado.
- **C2:** distinções finas, implicação sutil, analogia, efeito figurativo e estrutura epistemológica do argumento.

## Listening

- **A1:** informação concreta em falas curtas.
- **A2:** mensagens e diálogos rotineiros.
- **B1:** intenção, inferência básica e atitude.
- **B2:** stance, trade-offs, linguagem figurativa contextual.
- **C1:** qualificação, argumento, significado implícito.
- **C2:** conceptualização, pressupostos, nuance, significado interactional e retórico.

## Language Use

A progressão evita tratar C1/C2 como “gramática secreta”. Quanto mais alto o nível, maior o peso de:

- lexical precision;
- collocation;
- register;
- pragmatic appropriacy;
- qualification;
- idiomatic control;
- advanced syntactic choice.

## Productive skills

A progressão ocorre pela capacidade de:

```text
state
→ describe
→ connect
→ explain
→ justify
→ argue
→ qualify
→ synthesise
→ manipulate nuance
```

---

# 12. Itens que exigem revisão humana durante a aplicação

| Área | Correção |
|---|---|
| Reading | automática |
| Listening | automática |
| Language Use | automática |
| Writing | professor/rater |
| Spoken Production | professor/rater |
| Spoken Interaction | professor/rater |
| Mediation | professor/rater, exceto futuras tarefas altamente controladas |

Itens objetivos podem gerar `needs_review` em casos técnicos ou respostas abertas controladas futuras.

---

# 13. Status de cada item nesta versão

Todos os itens deste documento recebem inicialmente:

```yaml
status: approved_for_pilot
psychometric_status: uncalibrated
version: pilot-0.1
```

Após uso real:

```text
approved_for_pilot
↓
pilot_data_collected
↓
item_analysis
↓
approved
   or
needs_revision
   or
retired
```

---

# 14. Métricas a coletar na pilotagem

Para cada item objetivo:

```text
facility
discrimination
option_frequency
omission_rate
average_response_time
```

Para Writing/Speaking/Mediation:

```text
rater_score_by_dimension
overall_level
rater_id
rating_time
second_rating_when_selected
disagreement
```

Também registrar:

```text
candidate_level_estimate
skill_profile
technical_flags
form_version
rule_version
```

---

# 15. Critérios para expansão ao MVP Bank

O Pilot Bank v0.1 deve ser expandido somente após:

1. aplicação em amostra real;
2. análise de distractors;
3. revisão de itens muito fáceis/difíceis;
4. revisão vertical dos resultados;
5. revisão de itens com discriminação ruim;
6. análise de concordância dos raters;
7. correção de eventuais efeitos de tema ou público;
8. atualização das regras provisórias de decisão.

Meta do banco MVP:

| Área | Meta por nível |
|---|---:|
| Reading | 4+ tasklets |
| Listening | 4+ tasklets |
| Language Use | 25+ itens |
| Writing | 6+ prompts |
| Spoken Production | 6+ prompts |
| Spoken Interaction | 6+ tasks |
| Mediation | 4+ tasks |

---

# 16. Limites da validação atual

A expressão **“validado”** neste documento significa:

- revisado estruturalmente;
- revisado linguisticamente;
- revisado pedagogicamente;
- comparado verticalmente;
- auditado quanto a padrões de chave e pistas superficiais.

Ela **não** significa ainda:

- cut scores empiricamente validados;
- dificuldade calibrada por IRT/Rasch;
- equivalência entre forms;
- reliability estimada em população real;
- alinhamento externo certificado ao CEFR.

Essas evidências só podem ser produzidas com dados reais de aplicação.

---

# 17. Referências de framework

- Council of Europe — *Common European Framework of Reference for Languages: Learning, Teaching, Assessment — Companion Volume (2020)*.
- Council of Europe — CEFR Descriptors.
- Council of Europe — *Relating Language Examinations to the CEFR: A Manual*.
- Council of Europe — Tests and Examinations / illustrative tasks.
- Council of Europe — Mediation descriptors and resources.

O CEFR fornece o framework e os descritores; a qualidade da relação entre uma avaliação local e os níveis CEFR é responsabilidade do desenvolvedor do exame e deve ser sustentada por especificação, standardisation e validation.

---

# 18. Próxima etapa recomendada

1. importar estes itens para uma estrutura de banco (`JSON/SQL`);
2. criar as formas de pilotagem;
3. preparar os áudios de Listening;
4. criar folhas/rubricas de rating;
5. aplicar a uma pequena amostra;
6. coletar estatísticas;
7. executar a primeira análise de itens;
8. revisar antes da expansão do banco.



# PART II — Expansion for Real Placement Pilot v0.2

## 19. Purpose of the expansion

This expansion increases the bank from **198** to **300 evaluative units** so that LangSpot can run a realistic end-to-end placement pilot while retaining unused alternate items. It is intentionally larger than a single test form.

### Bank size after this expansion

| Area | Per level | Total |
|---|---:|---:|
| Reading | 3 tasklets × 4 = **12 items** | **72** |
| Listening | 3 tasklets × 4 = **12 items** | **72** |
| Language Use | **15 items** | **90** |
| Writing | **3 prompts** | **18** |
| Spoken Production | **3 prompts** | **18** |
| Spoken Interaction | **3 tasks** | **18** |
| Mediation | **2 tasks** | **12** |
| **Total** | **50 units per CEFR level** | **300** |

This is the **minimum expanded pilot bank**, not the final production target. For an operational release with meaningful rotation, the recommended next milestone remains at least 4 Reading tasklets, 4 Listening tasklets, 25 Language Use items, 6 Writing prompts, 6 Spoken Production prompts, 6 Spoken Interaction tasks and 4 Mediation tasks per level.

---

## 20. Minimum evidence for a real placement pilot

### When the probable band is already located

For a candidate whose probable level is **B1**, the recommended minimum objective evidence is:

| Skill | A2 floor | B1 target | B2 ceiling | Total |
|---|---:|---:|---:|---:|
| Reading | 4 | 8 | 4 | **16** |
| Listening | 4 | 8 | 4 | **16** |
| Language Use | 5 | 10 | 5 | **20** |
| **Objective total** |  |  |  | **52** |

Then add productive evidence centred on B1/B2:

- **Writing:** 2 tasks;
- **Spoken Production:** 1 assessed long turn plus interview evidence;
- **Spoken Interaction:** 1 task;
- **Mediation:** 1 task.

The same `floor → target → ceiling` rule applies at other levels. At A1 there is no lower CEFR floor in this bank; at C2 there is no higher CEFR ceiling.

### Minimum objective evidence by target level

| Target | Reading evidence | Listening evidence | Language Use evidence | Objective total |
|---|---|---|---|---:|
| **A1** | 8 A1 + 4 A2 | 8 A1 + 4 A2 | 10 A1 + 5 A2 | **39** |
| **A2** | 4 A1 + 8 A2 + 4 B1 | 4 A1 + 8 A2 + 4 B1 | 5 A1 + 10 A2 + 5 B1 | **52** |
| **B1** | 4 A2 + 8 B1 + 4 B2 | 4 A2 + 8 B1 + 4 B2 | 5 A2 + 10 B1 + 5 B2 | **52** |
| **B2** | 4 B1 + 8 B2 + 4 C1 | 4 B1 + 8 B2 + 4 C1 | 5 B1 + 10 B2 + 5 C1 | **52** |
| **C1** | 4 B2 + 8 C1 + 4 C2 | 4 B2 + 8 C1 + 4 C2 | 5 B2 + 10 C1 + 5 C2 | **52** |
| **C2** | 4 C1 + 8 C2 | 4 C1 + 8 C2 | 5 C1 + 10 C2 | **39** |

For A1 and C2, the absence of a lower or upper adjacent band reduces the objective minimum. If future LangSpot versions include **Pre-A1** or an above-C2 research band, boundary testing can be extended, but neither is required for the present placement product.

### When the candidate's level is completely unknown and adaptive routing is not yet implemented

Use a fixed locator form with:

- Reading: 4 items per level = **24**;
- Listening: 4 items per level = **24**;
- Language Use: 5 items per level = **30**;
- **Total objective locator: 78 items**.

After the locator, select productive tasks around the estimated band. This fixed form is appropriate for platform pilot testing, but a later multistage/adaptive form should reduce unnecessary items.

### Form-level alternative-key QA

The bank-level answer distribution is not itself a test form. Every generated placement form must be checked separately. LangSpot should preferably **shuffle option positions per attempt** while preserving option IDs. For any non-shuffled/exported form, apply these minimum checks:

- no run of three identical correct-option letters;
- no deliberate cyclic pattern such as `ABCDABCD` or `DCBADCBA`;
- overall A/B/C/D frequencies differ by no more than two items when the form length permits;
- no correct option is systematically longer or more specific than its distractors;
- each distractor remains grammatically and semantically plausible for a candidate at that level.

### Important interpretation rule

The CEFR does **not** prescribe a universal number of questions or a universal percentage for each level. The quantities above are LangSpot operational specifications intended to provide multiple samples of performance at the floor, target and ceiling. They remain provisional until pilot data, standard setting and psychometric analysis are available.

---

## 21. Additional Reading tasklets


## A1 — Expansion

### R-A1-003 — After-School Art Club
**Topic:** education  
**Genre:** notice  
**Audience:** teen  
**Input length:** ~43 words

#### Input

AFTER-SCHOOL ART CLUB

Tuesday, Room 12
3:30–4:30 p.m.

This week: make a poster for the school festival.
Bring a pencil and an eraser. Paper and paint are provided.
New students are welcome. Please tell Ms Green before Tuesday if you want to join.

#### Items

1. **R-A1-003-Q1 — specific_information (difficulty 2/5)**

What day does the art club meet?

- **A.** Monday
- **B.** Tuesday
- **C.** Wednesday
- **D.** Friday

2. **R-A1-003-Q2 — specific_information (difficulty 2/5)**

What should students bring?

- **A.** paint and paper
- **B.** a poster from home
- **C.** a school bag and ruler
- **D.** a pencil and an eraser

3. **R-A1-003-Q3 — basic_gist (difficulty 2/5)**

What will students make this week?

- **A.** a poster
- **B.** a painting of Room 12
- **C.** a pencil case
- **D.** a festival ticket

4. **R-A1-003-Q4 — specific_information (difficulty 3/5)**

What should a new student do before joining?

- **A.** bring paper and paint
- **B.** come to Room 12 at 3:30
- **C.** speak to Ms Green before Tuesday
- **D.** bring a friend from another school

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A1-003-Q1` | **B** | specific_information | 2/5 |
| `R-A1-003-Q2` | **D** | specific_information | 2/5 |
| `R-A1-003-Q3` | **A** | basic_gist | 2/5 |
| `R-A1-003-Q4` | **C** | specific_information | 3/5 |

---


### R-A1-004 — Grand Canyon Visitor Centers
**Topic:** travel  
**Genre:** notice  
**Audience:** general  
**Input length:** ~42 words  
**Source:** NATIONAL PARK SERVICE (Estados Unidos). Visitor centers, information desks, and museums. Grand Canyon National Park, 12 out. 2026. Disponível em: https://www.nps.gov/grca/planyourvisit/visitorcenters.htm. Acesso em: 6 nov. 2026.  
**License:** Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403).  
**Credit:** Texto: National Park Service (EUA), domínio público.  
**Adaptation:** Trecho com informações de dois centros de visitantes; texto original, diagramado como aviso.

#### Input

GRAND CANYON VISITOR CENTER (SOUTH RIM)
Open daily, 9 am–4 pm.
Junior Ranger books/badges

VERKAMP'S VISITOR CENTER
Located in the Village Historic District: Open daily, 8 am–6 pm
Verkamp's features exhibits about the history of Grand Canyon Village and a museum store.

#### Items

1. **R-A1-004-Q1 — specific_information (difficulty 2/5)**

What time does the Grand Canyon Visitor Center open?

- **A.** 8 am
- **B.** 4 pm
- **C.** 9 am
- **D.** 6 pm

2. **R-A1-004-Q2 — specific_information (difficulty 2/5)**

What time does Verkamp's Visitor Center close?

- **A.** 9 am
- **B.** 4 pm
- **C.** 8 am
- **D.** 6 pm

3. **R-A1-004-Q3 — basic_gist (difficulty 2/5)**

When are the two visitor centers open?

- **A.** every day
- **B.** on Saturday and Sunday
- **C.** from Monday to Friday
- **D.** in the summer

4. **R-A1-004-Q4 — specific_information (difficulty 3/5)**

Where can you learn about the history of Grand Canyon Village?

- **A.** at the Grand Canyon Visitor Center
- **B.** at Verkamp's Visitor Center
- **C.** at the Junior Ranger office
- **D.** at the South Rim train station

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A1-004-Q1` | **C** | specific_information | 2/5 |
| `R-A1-004-Q2` | **D** | specific_information | 2/5 |
| `R-A1-004-Q3` | **A** | basic_gist | 2/5 |
| `R-A1-004-Q4` | **B** | specific_information | 3/5 |

---

## A2 — Expansion

### R-A2-003 — A First Morning at the Market
**Topic:** daily_life  
**Genre:** personal_email  
**Audience:** general  
**Input length:** ~148 words

#### Input

Hi Leo,

I finally went to the Saturday market you told me about. I arrived just after eight because you said it gets busy later. At first I thought I was too early, but several fruit and bread stalls were already open.

I planned to buy vegetables, but I also found a small stall selling notebooks made from recycled paper. I bought one for my sister because her birthday is next week. The owner told me that the market has live music after ten, but I left before then because I had to meet Dad at the station.

The only difficult part was getting there. I took bus 16 as you suggested, but I got off one stop too soon and had to walk for ten minutes. Next time I'll use the stop beside the bank.

Thanks for recommending it. Maybe we can go together next month.

Maya

#### Items

1. **R-A2-003-Q1 — main_idea (difficulty 3/5)**

Why is Maya writing to Leo?

- **A.** to explain why the market has changed location
- **B.** to ask him to buy a birthday present
- **C.** to tell him about her visit to a market he recommended
- **D.** to complain that the market opened late

2. **R-A2-003-Q2 — detail (difficulty 2/5)**

Why did Maya buy the notebook?

- **A.** It was a present for her sister.
- **B.** She needed it for the station.
- **C.** The fruit seller recommended it.
- **D.** She wanted to write down bus times.

3. **R-A2-003-Q3 — sequence (difficulty 3/5)**

Why did Maya leave before the live music started?

- **A.** The market became too crowded.
- **B.** She could not find the music area.
- **C.** The stalls were beginning to close.
- **D.** She had arranged to meet her father.

4. **R-A2-003-Q4 — basic_inference (difficulty 3/5)**

What will Maya probably do differently next time?

- **A.** arrive at the market after ten
- **B.** stay on the bus for one more stop
- **C.** take bus 16 instead of walking
- **D.** go to the market with her sister

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A2-003-Q1` | **C** | main_idea | 3/5 |
| `R-A2-003-Q2` | **A** | detail | 2/5 |
| `R-A2-003-Q3` | **D** | sequence | 3/5 |
| `R-A2-003-Q4` | **B** | basic_inference | 3/5 |

---


### R-A2-004 — Making Healthy Choices
**Topic:** health  
**Genre:** dialogue  
**Audience:** general  
**Input length:** ~171 words  
**Source:** VOICE OF AMERICA. Lesson 44: making healthy choices. In: LET'S LEARN English: level 1. Washington, DC: VOA Learning English, 13 jul. 2019. Disponível em: https://learningenglish.voanews.com/a/lets-learn-english-lesson-44-making-healthy-choices/3688552.html. Acesso em: 6 nov. 2026.  
**License:** Domínio público — conteúdo produzido pela Voice of America (VOA Terms of Use; Request Our Content).  
**Credit:** Texto: VOA Learning English, domínio público.  
**Adaptation:** Trecho inicial do diálogo, sem alterações; inclui a nota original sobre “Healthy” e “Junky”.

#### Input

Anna: Hi there, Ashley!
Ashley: Anna! Hi! Where are you going?
(Anna’s stomach growls loudly)
Ashley: What was that?
Anna: I’m hungry. When I’m hungry, I only want to eat junk food! But I know I should eat healthy food. So, I fight with myself. One side says, ‘You should eat healthy food.’ The other side says, ‘But I want to eat junk food!’
Ashley: Well, Anna, go to the Giant supermarket. You should be able to find all kinds of food there - for all of you.
Anna: Good idea, Ashley. See you later!
Ashley: 'Bye, Anna.
Anna: Wow! This supermarket is huge! Look at all of these fruits and vegetables! I should eat more vegetables.
Healthy: Good idea, Anna. You must eat more vegetables … like celery!
Junky: Celery?! Do you know what the web says about celery?
Anna: No, what?
Junky: “Celery is 95 percent water - 100 percent NOT ice cream. I love the web!”

Note: "Healthy" and "Junky" are Anna's thoughts about what she should eat.

#### Items

1. **R-A2-004-Q1 — basic_gist (difficulty 2/5)**

What is Anna's problem at the start of the conversation?

- **A.** She cannot find the Giant supermarket today.
- **B.** She does not like fruit or vegetables.
- **C.** She has no money to buy food today.
- **D.** She wants junk food but knows it is bad.

2. **R-A2-004-Q2 — specific_information (difficulty 2/5)**

Where does Ashley tell Anna to go?

- **A.** to a very large supermarket
- **B.** to a fruit and vegetable shop
- **C.** to an ice cream shop nearby
- **D.** to a café that sells junk food

3. **R-A2-004-Q3 — reference (difficulty 3/5)**

Who are 'Healthy' and 'Junky'?

- **A.** two people who work at the supermarket
- **B.** two voices in Anna's mind about food
- **C.** Ashley and one of her friends
- **D.** two people talking on the web

4. **R-A2-004-Q4 — detail (difficulty 3/5)**

What does Junky say about celery?

- **A.** It is very expensive.
- **B.** It is good for her heart.
- **C.** It is mostly water.
- **D.** It is Anna's favourite food.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A2-004-Q1` | **D** | basic_gist | 2/5 |
| `R-A2-004-Q2` | **A** | specific_information | 2/5 |
| `R-A2-004-Q3` | **B** | reference | 3/5 |
| `R-A2-004-Q4` | **C** | detail | 3/5 |

---

## B1 — Expansion

### R-B1-003 — The One-Week Phone Drawer
**Topic:** technology  
**Genre:** personal_article  
**Audience:** teen  
**Input length:** ~249 words

#### Input

At the start of term, one class at Northfield School tried an experiment: during lessons, every student placed their phone in a numbered drawer near the door. The phones were not confiscated, and students could collect them at break. The idea came from the class itself after a discussion about concentration.

I expected the experiment to be unpopular. In fact, the first morning was strangely quiet because several of us kept reaching towards pockets that were empty. A few students complained that they used their phones as calculators or to photograph notes, so the teacher provided calculators and uploaded copies of important diagrams after class.

By Wednesday, something unexpected had happened. Group activities were finishing more quickly. This was not because everyone suddenly became more hardworking. We simply spent less time waiting while someone answered a message or checked a notification. I also noticed that I asked classmates questions more often instead of immediately searching online.

The experiment did not solve every problem. One student needed to keep a phone because of a family medical situation, and the class agreed that exceptions should be possible. Some of us also disliked having to remember a separate calculator.

At the end of the week, we voted to continue the system for another month. I still use my phone constantly outside lessons, so I would not claim the experiment transformed my habits. But it showed me that a small change in where a device is kept can change how a room works.

#### Items

1. **R-B1-003-Q1 — main_idea (difficulty 3/5)**

What is the writer mainly describing?

- **A.** why the class voted to keep their phones away for a month
- **B.** how students became more hardworking during group activities
- **C.** why some students needed to be allowed exceptions to a rule
- **D.** how keeping phones out of reach changed the way a class worked

2. **R-B1-003-Q2 — detail (difficulty 3/5)**

How did the teacher respond to students who used phones for class tasks?

- **A.** by letting those students keep their phones for class tasks
- **B.** by giving them other ways to calculate and to keep notes
- **C.** by asking them to photograph their notes during the break
- **D.** by moving the phone drawer closer to the students' desks

3. **R-B1-003-Q3 — inference (difficulty 4/5)**

What does the writer suggest about the faster group activities?

- **A.** Students understood the tasks more easily than before.
- **B.** Students had become more hardworking than they were before.
- **C.** Fewer short interruptions meant that less time was lost.
- **D.** Students talked to each other less while they were working.

4. **R-B1-003-Q4 — writer_attitude (difficulty 4/5)**

Which statement best describes the writer’s final view?

- **A.** It made a real difference in lessons, although it had limits.
- **B.** It should be extended to the students' time outside school.
- **C.** It was less successful because some students needed exceptions.
- **D.** It has changed the way the writer uses a phone outside lessons.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-003-Q1` | **D** | main_idea | 3/5 |
| `R-B1-003-Q2` | **B** | detail | 3/5 |
| `R-B1-003-Q3` | **C** | inference | 4/5 |
| `R-B1-003-Q4` | **A** | writer_attitude | 4/5 |

---


### R-B1-004 — Leave What You Find
**Topic:** environment  
**Genre:** informative_article  
**Audience:** general  
**Input length:** ~243 words  
**Source:** NATIONAL PARK SERVICE (Estados Unidos). I didn't know that!: Leave No Trace principle #4 – leave what you find. [S. l.]: NPS, 23 dez. 2024. Disponível em: https://www.nps.gov/articles/000/idkt_lnt4.htm. Acesso em: 6 nov. 2026.  
**License:** Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403).  
**Credit:** Texto: National Park Service (EUA), domínio público.  
**Adaptation:** Trecho; frases originais, omissões indicadas por […].

#### Input

Leave what you find is one of the 7 Leave No Trace Principles. These Principles empower you to leave nature as unchanged by your presence as possible. […]

The items we find in nature have a role to play, either in the ecosystem or the story of the landscape. Leaving what we find in place helps to preserve both.

All natural items play a role in their ecosystems. For example, flowers are more than just beautiful. They are also important sources of pollen for pollinators. And, if fertilized, they become seeds or fruit, which could be food for other animals or become new flowers!

Even dead things have a role to play! For example, dead leaves and sticks might seem to have no purpose, but they actually play a big role. They can provide cover for amphibians, reptiles, insects, and even pollinators. Birds can use them to build their nests. […]

Just as with natural items, it is important to leave cultural items and artifacts where you find them. These items, and their original locations, tell us a story of our shared heritage. When they are taken, that story is harder to piece together. […]

Leaving what you find isn’t just good etiquette, it’s also the law—especially on federal lands. […]

Leaving what you find doesn’t have to put a damper on your outdoor experience. There are many ways to appreciate and enjoy found items without disturbing them or taking them with you.

#### Items

1. **R-B1-004-Q1 — main_idea (difficulty 3/5)**

What is the main message of the text?

- **A.** Dead plants and sticks are more useful than they first appear.
- **B.** Things found outdoors should be left in place, for several reasons.
- **C.** Taking objects from federal lands can be against the law for visitors.
- **D.** Flowers matter because they provide food for pollinators.

2. **R-B1-004-Q2 — detail (difficulty 3/5)**

According to the text, why are dead leaves and sticks useful?

- **A.** They turn into seeds that can grow into new plants.
- **B.** They provide pollen for insects that pollinate flowers.
- **C.** They offer shelter to small animals and nest material to birds.
- **D.** They help visitors to understand the story of the whole landscape.

3. **R-B1-004-Q3 — inference (difficulty 4/5)**

Why is the 'story' of an artifact harder to understand after someone takes it?

- **A.** The place where it was found is also part of the evidence.
- **B.** Removing it from federal lands is against the law.
- **C.** Cultural objects tell us less than natural objects do.
- **D.** Visitors cannot enjoy an object without disturbing it.

4. **R-B1-004-Q4 — writer_purpose (difficulty 4/5)**

Why does the text mention the law?

- **A.** to explain how rangers protect cultural heritage sites
- **B.** to show that the rule matters more for objects than for plants
- **C.** to warn that visitors may enjoy their trips less than before
- **D.** to show that leaving items is a duty, not just good manners

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-004-Q1` | **B** | main_idea | 3/5 |
| `R-B1-004-Q2` | **C** | detail | 3/5 |
| `R-B1-004-Q3` | **A** | inference | 4/5 |
| `R-B1-004-Q4` | **D** | writer_purpose | 4/5 |

---

## B2 — Expansion

### R-B2-003 — What Salary Ranges Change
**Topic:** work  
**Genre:** opinion_article  
**Audience:** adult  
**Input length:** ~305 words

#### Input

Job advertisements have traditionally treated salary as information to be revealed late in the recruitment process. Applicants may spend hours preparing applications and attending interviews before discovering whether an employer’s budget is even close to their expectations. In response, a growing number of organisations now publish salary ranges at the beginning.

Supporters present transparency as a simple fairness measure. If applicants know the range, they can decide whether applying is worth their time. Published ranges may also reduce the advantage enjoyed by candidates who are unusually confident negotiators or who already know what colleagues earn. Yet transparency does not eliminate negotiation; it changes what is being negotiated. A range of 40,000 to 60,000 still leaves the question of why one candidate should enter near one end rather than the other.

There are less obvious effects inside organisations. When existing employees see a vacancy advertised at a salary above their own, managers may have to explain differences that previously remained invisible. This can be uncomfortable, but discomfort is not necessarily evidence that transparency has failed. It may expose inconsistencies that were easier to ignore when salaries were private.

On the other hand, published ranges can create a false sense of precision. Two jobs with the same title may involve different responsibilities, and compensation may include benefits that are difficult to compare. Employers can also publish ranges so wide that they provide almost no useful information. Transparency works only when the numbers are meaningful enough to constrain expectations.

The strongest case for salary ranges, then, is not that they remove every unfairness. It is that they move part of the negotiation from a private guessing game into a space where assumptions can be questioned. That makes pay decisions more visible, not automatically more just. Visibility is a condition for scrutiny; it is not a substitute for it.

#### Items

1. **R-B2-003-Q1 — writer_stance (difficulty 4/5)**

Which statement best represents the writer's view?

- **A.** Making pay visible is useful, but it does not guarantee fair decisions.
- **B.** Salary ranges remove the advantage that confident negotiators used to have.
- **C.** Transparency fails when it makes existing employees uncomfortable.
- **D.** Salary ranges mislead because jobs with the same title can differ.

2. **R-B2-003-Q2 — paragraph_function (difficulty 4/5)**

Why does the writer discuss existing employees in the third paragraph?

- **A.** to argue that current staff should be paid the advertised salary
- **B.** to show that transparency has failed when managers feel uncomfortable
- **C.** to show that publishing ranges can reveal unequal pay among current staff
- **D.** to explain why employers prefer to keep their vacancies private

3. **R-B2-003-Q3 — inference (difficulty 4/5)**

What would the writer most likely say about a range of 30,000–100,000 for an ordinary role?

- **A.** It is useful because it gives employers room to negotiate.
- **B.** It is fair because applicants see the same numbers before they apply.
- **C.** It stops applicants from asking for more than the top of the range.
- **D.** It may look transparent while giving applicants little real guidance.

4. **R-B2-003-Q4 — argument_structure (difficulty 5/5)**

What distinction is central to the final paragraph?

- **A.** between confident negotiators and less confident ones
- **B.** between salaries and benefits that are difficult to compare
- **C.** between making pay decisions visible and making them fair
- **D.** between existing employees and applicants from outside

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B2-003-Q1` | **A** | writer_stance | 4/5 |
| `R-B2-003-Q2` | **C** | paragraph_function | 4/5 |
| `R-B2-003-Q3` | **D** | inference | 4/5 |
| `R-B2-003-Q4` | **C** | argument_structure | 5/5 |

---


### R-B2-004 — Soda Leaves High Schools
**Topic:** health  
**Genre:** news_report  
**Audience:** teen_adult  
**Input length:** ~284 words  
**Source:** SOFT drink companies to stop high school soda sales. Wikinews, [s. l.], 4 maio 2006. Disponível em: https://en.wikinews.org/wiki/Soft_drink_companies_to_stop_high_school_soda_sales. Acesso em: 6 nov. 2026.  
**License:** Creative Commons Atribuição 2.5 Genérica (CC BY 2.5) — https://creativecommons.org/licenses/by/2.5/ — crédito: Wikinews.  
**Credit:** Texto: Wikinews, “Soft drink companies to stop high school soda sales”, CC BY 2.5.  
**Adaptation:** Cinco primeiros parágrafos; texto sem alterações.

#### Input

Most U.S. soft drink companies will stop selling their soda products at high schools across the nation as part of a soft drink industry deal that aims to reduce childhood obesity.

The agreement, announced Wednesday morning by the William J. Clinton Foundation, means that the nation's biggest beverage distributors, Coca Cola Co., Pepsico, Cadbury Schweppes PLC, and the American Beverage Association, will pull their soda products from vending machines and cafeterias in schools serving about 35 million students, according to the Alliance for a Healthier Generation, a joint initiative between the Clinton Foundation and the American Heart Association.

"This is an important announcement and a bold step forward in the struggle to help America's kids live healthier lives," said Bill Clinton, according to a press release from the foundation. "These industry leaders recognize that childhood obesity is a problem and have stepped up to help solve it. I commend them for being here today and for taking this important step. There is a lot of work to be done to turn this problem around but this is a big step in the right direction and it will help improve the diet of millions of students across the country."

Under the agreement, high schools will still be able to purchase drinks such as diet and unsweetened teas, diet sodas, sports drinks, flavored water, seltzer, and low-calorie sports drinks for resale to students.

The companies plan to stop soda sales at 75 percent of the nation's public schools by the 2008-2009 school year, and at all schools in the following school year. The speed of the changes will depend in part on school districts' willingness to change their contracts with the beverage distributors, the release said.

#### Items

1. **R-B2-004-Q1 — main_idea (difficulty 3/5)**

What is the main news in the article?

- **A.** A health alliance agreed to pay for healthier drinks in schools.
- **B.** High schools must replace soda with sports drinks by 2008.
- **C.** Bill Clinton asked lawmakers to ban soda in public schools.
- **D.** Major drink companies agreed to remove soda from high schools.

2. **R-B2-004-Q2 — detail (difficulty 3/5)**

Which drinks will high schools still be able to sell?

- **A.** regular sodas, as long as they are sold in smaller sizes
- **B.** diet sodas, unsweetened teas and flavored water
- **C.** low-calorie sports drinks but not regular sports drinks
- **D.** drinks that schools ordered before the agreement

3. **R-B2-004-Q3 — inference (difficulty 4/5)**

What will partly decide how quickly the changes happen?

- **A.** how many students choose diet drinks instead of soda
- **B.** how quickly distributors can take out vending machines
- **C.** how willing school districts are to revise their agreements
- **D.** whether the 75 percent target is met in public schools

4. **R-B2-004-Q4 — speaker_attitude (difficulty 4/5)**

How does Bill Clinton present the agreement?

- **A.** as a step forward, although much work is still needed
- **B.** as a complete solution to the problem of childhood obesity
- **C.** as a decision the law forced the companies to accept
- **D.** as a deal that mainly improves the drink industry's image

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B2-004-Q1` | **D** | main_idea | 3/5 |
| `R-B2-004-Q2` | **B** | detail | 3/5 |
| `R-B2-004-Q3` | **C** | inference | 4/5 |
| `R-B2-004-Q4` | **A** | speaker_attitude | 4/5 |

---

## C1 — Expansion

### R-C1-003 — The Case for Reversible Decisions
**Topic:** society  
**Genre:** analytical_essay  
**Audience:** adult  
**Input length:** ~535 words

#### Input

Institutions often praise decisiveness. A leader who chooses quickly appears confident; a committee that delays appears weak. This preference is understandable when hesitation carries obvious costs. Yet it encourages a habit that is less defensible: treating every decision as though commitment itself were evidence of quality.

Some choices are genuinely difficult to reverse. Building a bridge, closing a hospital or replacing a city’s transport network creates costs that cannot simply be undone next week. Such decisions deserve extensive analysis before action. Others, however, are comparatively reversible. A school can trial a timetable for one term. A company can test a meeting policy in two departments. A city can temporarily change the use of a street before redesigning it permanently. The distinction matters because reversible decisions allow evidence to be produced by action rather than demanded entirely in advance.

This does not mean that experiments are neutral. A temporary policy can still inconvenience people, distribute risks unevenly or create expectations that survive after the trial ends. Calling something a pilot is not a licence to ignore consequences. But requiring the same certainty before a reversible trial as before an irreversible commitment can have a different cost: organisations may remain with familiar arrangements simply because the evidence required to change them cannot exist until change is attempted.

The difficulty is partly cultural. Reversing a decision is often narrated as failure. Leaders therefore become reluctant to announce in advance what evidence would make them change course, because doing so can sound like doubt. Yet a decision designed with exit conditions is not necessarily weaker. In scientific work, specifying what result would count against a hypothesis is usually considered a strength. Policy and management cannot copy laboratory methods directly, but they can borrow the underlying discipline: decide what would justify continuation, revision or abandonment before personal reputation becomes tied to one outcome.

There is also a communication advantage. When a temporary measure is presented honestly as a test with explicit criteria, disagreement can become more concrete. Instead of arguing only about predictions, participants can argue about what should be measured and what outcomes would matter. This does not remove politics or values; decisions about evidence are themselves value-laden. It can, however, expose where disagreement actually lies.

Reversibility also has limits that become visible only after a trial begins. A formally temporary decision can create path dependence: staff may be retrained, users may reorganise routines, or suppliers may invest in new systems. Reversing the policy is then technically possible but socially or financially costly. This is another reason to define the trial carefully. A reversible decision should not be confused with a consequence-free decision. The more a pilot changes the environment in which the final choice will later be made, the more cautiously its evidence must be interpreted.

The principle of reversibility is therefore not an argument for endless experimentation. Some organisations hide indecision behind permanent “pilots” that never produce a conclusion. The point is almost the opposite: where reversal is feasible, institutions should use that flexibility deliberately. They should test, specify conditions for learning and then actually decide. Commitment has value, but it is most useful after uncertainty has been reduced—not as a performance intended to make uncertainty disappear.

#### Items

1. **R-C1-003-Q1 — main_argument (difficulty 4/5)**

What is the author’s central argument?

- **A.** Institutions should avoid decisions that would be difficult to reverse later.
- **B.** Reversible choices can be used to gather evidence before full commitment.
- **C.** Temporary policies avoid most of the risks that permanent policies create.
- **D.** Leaders should state publicly when they intend to reverse a previous decision.

2. **R-C1-003-Q2 — nuanced_inference (difficulty 5/5)**

Why does the author compare exit conditions with scientific hypotheses?

- **A.** to show that being willing to revise a decision can be disciplined, not weak
- **B.** to argue that organisational policies should be tested with laboratory methods
- **C.** to suggest that trials can produce evidence that is free from political values
- **D.** to show that scientists admit failure more readily than organisational leaders

3. **R-C1-003-Q3 — rhetorical_function (difficulty 5/5)**

What function does the paragraph beginning ‘There is also a communication advantage’ serve?

- **A.** to argue that trials remove disagreements about values from policy debates
- **B.** to show that predictions are an unreliable basis for most policy decisions
- **C.** to explain why temporary measures are easier to present than permanent ones
- **D.** to add a practical benefit of trials while noting that evidence choices involve values

4. **R-C1-003-Q4 — author_stance (difficulty 5/5)**

Which view would the author most likely reject?

- **A.** Some decisions require more careful analysis because they are especially hard to undo.
- **B.** A pilot can create harms even when it is temporary.
- **C.** After a public commitment, consistency should outweigh new evidence.
- **D.** Changing course can be compatible with competent leadership.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C1-003-Q1` | **B** | main_argument | 4/5 |
| `R-C1-003-Q2` | **A** | nuanced_inference | 5/5 |
| `R-C1-003-Q3` | **D** | rhetorical_function | 5/5 |
| `R-C1-003-Q4` | **C** | author_stance | 5/5 |

---


### R-C1-004 — Reading Lost Classics with Infrared Light
**Topic:** science  
**Genre:** news_report  
**Audience:** adult  
**Input length:** ~523 words  
**Source:** INFRARED technology enables recovery of lost classical writings. Wikinews, [s. l.], 20 abr. 2005. Disponível em: https://en.wikinews.org/wiki/Infrared_technology_enables_recovery_of_lost_classical_writings. Acesso em: 6 nov. 2026.  
**License:** Domínio público — artigo da Wikinews publicado antes de 25 set. 2005 (Wikinews:Copyright).  
**Credit:** Texto: Wikinews, domínio público.  
**Adaptation:** Trecho do início até a seção “Classical and Christian Writings”; intertítulos removidos, texto sem alterações.

#### Input

Papyrologists at Oxford University in England last week reported major literary finds in examining old fragments of papyrus with a new technique: multi-spectral imaging (MSI). The fragments were unearthed near the buried town of Oxyrhynchus, Egypt in a major archaeological find a century ago. Many of the fragments were unable to be read until now.

Multi-Spectral Imaging (MSI) is based on technology originally developed by NASA to photograph features of other worlds in bands beyond the visible spectrum, both infrared and ultraviolet. The technology was adapted by researchers at Brigham Young University to filter a narrow bandwidth of infrared light, which reacts with ink but not the surrounding material, making the writing stand out more easily and plainly than before and enabling non-destructive photographs of formerly invisible text to be taken.

MSI was successfully used in 1999 to read many of the Herculaneum Scrolls, which were considered to be blank or charred beyond recognition until then. Herculaneum was a town in ancient Italy that was buried next to Pompeii in its volcanic eruption of 79 AD, leaving many scrolls damaged but naturally preserved.

Oxyrhynchus, whose name means "sharp-nose", was a town located along a tributary of the Nile in ancient Egypt and populated largely by Greek immigrants. The name refers to a river-dwelling fish with a long snout that was worshiped as the town's patron deity by a local cult.

In between the town's surrounding wall and the local farmlands, there developed a number of dumping sites for papyrus and other materials, many of which have survived to the present day buried under mounds of sand because of dry, rainless local conditions. Papyrus, a paper-like writing surface made from reeds along the Nile river, normally does not last and no actual books written on ancient papyri have been uncovered.

The site was explored in the late 19th century by Bernard Grenfell and Arthur Hunt of Oxford University, during which about 100,000 fragments of papyrus were unearthed, which today are stored at Sackler Library, Oxford, in the largest collection of its kind in the world.

Oxyrhynchus was not noted as a center of learning, and 90% of the fragments found there are expected to be mundane yet useful in reconstructing ancient daily life, including such things as "codes, edicts, registers, official correspondence, census-returns, tax-assessments, petitions, court-records; sales, leases, wills, bills, accounts, inventories, horoscopes, [and] private letters". According to researchers on the project, "the mass of unedited material represents the random waste-paper of seven centuries of Greco-Egyptian life."

The remaining 10% could possibly contain unknown portions of literary classics of Greek and Roman antiquity, or even lost Christian gospel copies or apocryphal writings. Among the items currently being worked on are parts of a play by Sophocles, a lost novel by Lucian, mythological poetry by Parthenius of Nicaea, an elegiac poem by Archilochus, and other writings by Euripides and Hesiod.

Given that Oxyrhynchus was also the site of a discovery of portions of the Gospel of Thomas (although that discovery was later overshadowed by the discovery of a more complete copy among the Dead Sea Scrolls), many classical scholars are excited by the new discoveries.

#### Items

1. **R-C1-004-Q1 — main_idea (difficulty 4/5)**

What is the article mainly about?

- **A.** the rediscovery of a buried Egyptian town by Oxford researchers
- **B.** a new imaging method that makes unreadable ancient texts legible
- **C.** the discovery of parts of the Gospel of Thomas at Oxyrhynchus
- **D.** how the Herculaneum Scrolls were finally read in 1999

2. **R-C1-004-Q2 — detail (difficulty 4/5)**

How does multi-spectral imaging make the writing visible?

- **A.** It photographs the papyrus in ultraviolet as well as visible light.
- **B.** It removes the charred surface layer to reveal the text beneath.
- **C.** It compares each damaged fragment with other copies of the same work.
- **D.** It filters light so that the ink reacts but the background does not.

3. **R-C1-004-Q3 — inference (difficulty 4/5)**

Why have so many papyri survived at Oxyrhynchus?

- **A.** Rainless conditions kept the discarded material safe under sand.
- **B.** They were stored in the town library, which was a centre of learning.
- **C.** Papyrus made from Nile reeds lasts longer than most writing materials.
- **D.** Volcanic ash sealed them, just as it did at Herculaneum.

4. **R-C1-004-Q4 — implicit_meaning (difficulty 5/5)**

What does the phrase 'the random waste-paper of seven centuries' suggest about the collection?

- **A.** It consists mainly of literary works that were thrown away by mistake.
- **B.** It is too badly damaged to tell historians much about daily life.
- **C.** Most of it is everyday documents rather than literature.
- **D.** Scholars gathered the documents over a period of seven centuries.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C1-004-Q1` | **B** | main_idea | 4/5 |
| `R-C1-004-Q2` | **D** | detail | 4/5 |
| `R-C1-004-Q3` | **A** | inference | 4/5 |
| `R-C1-004-Q4` | **C** | implicit_meaning | 5/5 |

---

## C2 — Expansion

### R-C2-003 — The Authority of the First Draft
**Topic:** culture  
**Genre:** critical_essay  
**Audience:** adult  
**Input length:** ~750 words

#### Input

We tend to grant beginnings a peculiar authority. The first version of a constitution, the earliest recording of a song, the author’s initial manuscript or the prototype from which later designs descend can acquire an aura that subsequent versions lack. The attraction is partly historical: beginnings appear to place us closer to origin, intention and cause. But the preference also reveals a theory of authenticity that is rarely examined. We often assume that what came first is somehow less contaminated by compromise.

The assumption is difficult to sustain. First drafts are not produced outside history; they are produced before some kinds of feedback and after others. An author’s earliest surviving manuscript may already reflect conversations, discarded notes and conventions so familiar that nobody thought to record them. A prototype may look spontaneous only because the failed prototypes that preceded it were not preserved. Even the word “first” can therefore conceal an archive’s accidents. What survives earliest is not always what existed earliest.

Nor is revision simply erosion. Later versions can clarify purposes that the maker only partly understood at the beginning. A composer may discover through performance that a passage whose complexity looked impressive on paper obscures the musical relation that mattered. A legal text may be revised because experience exposes ambiguities invisible to its drafters. To call the revision less authentic because it comes later is to treat intention as a possession fully formed before practice begins.

Yet the opposite conclusion—that later automatically means better—is equally crude. Revision can domesticate difficulty, remove productive ambiguity or accommodate pressures that have little to do with the work’s internal aims. Institutions sometimes rewrite uncomfortable language not because it has become inaccurate but because its precision has become inconvenient. Artists may smooth away an eccentricity that initially carried energy. The historical record matters precisely because it lets us see that change is neither purification nor corruption by definition.

This is why disputes about “the authentic version” are often really disputes about which history should count. A theatre director who restores an early ending may claim fidelity to the playwright; another who stages the revised ending may claim fidelity to the work as the playwright chose to leave it. Both appeals sound like appeals to a stable object, yet each selects a different moment as authoritative. The argument cannot be settled by chronology alone because chronology is the thing being interpreted.

The fetish of the first draft is especially tempting in digital culture, where software preserves traces of composition that earlier media often erased. Version histories can show a sentence before and after revision, a design before and after user testing, a public statement before and after lawyers intervened. Such records are valuable, but abundance can create its own illusion: because we can inspect every intermediate state, we may imagine that one of them must contain the uncontaminated truth. Often the history shows something less comforting—that intention itself moved.

There are, of course, contexts in which first versions deserve special weight. Historians may need them to reconstruct what was known at a particular moment; courts may distinguish original wording from later interpretation; conservators may have reasons to preserve an initial material state. The mistake is not attending to beginnings. It is allowing chronological priority to perform argumentative work that belongs to a more specific claim. First according to which record? Authentic for what purpose? Evidence of whose intention, at what time?

Collaborative works make the difficulty sharper. In a film, a software project or a scientific report, there may be no single intention to recover. The earliest version can reflect one participant’s priorities before later contributors have materially changed the object. Calling that state “original” is descriptively harmless; treating it as uniquely authoritative can quietly privilege whoever happened to act first. Here the romance of origins becomes a politics of authorship. Version history does not merely preserve change; it records changing distributions of influence.

Perhaps the most useful approach is to treat versions relationally. A first draft tells us something that a final draft cannot; a final draft tells us something unavailable at the beginning. The movement between them may be more informative than either endpoint. Authenticity then becomes less a prize awarded to one privileged state and more a question about the history of decisions. That history is messier than the romance of origins, but it is also richer. It replaces the comforting question “Which version is the real one?” with the more demanding question “What does each version allow us to understand?”

#### Items

1. **R-C2-003-Q1 — nuanced_stance (difficulty 5/5)**

Which statement best captures the writer’s position?

- **A.** Later versions are usually more authentic because they reflect experience.
- **B.** First versions deserve special weight because they are the closest to the maker's intention.
- **C.** Versions offer different evidence, so being earliest does not settle authenticity.
- **D.** Authenticity is best judged by the version the creator finally chose.

2. **R-C2-003-Q2 — subtle_implication (difficulty 5/5)**

What is implied by the phrase 'an archive’s accidents'?

- **A.** Digital archives keep so many versions that the first is hard to identify.
- **B.** Archivists sometimes damage early drafts while trying to preserve them.
- **C.** Creators conceal failed attempts so that later work looks spontaneous.
- **D.** What happens to survive can make a later stage look like the beginning.

3. **R-C2-003-Q3 — rhetorical_structure (difficulty 5/5)**

Why does the writer discuss both beneficial and harmful revision?

- **A.** to show that revision must be judged on its effects, not on chronology
- **B.** to argue that artists revise for better reasons than institutions do
- **C.** to show that revision tends to remove the energy of an early version
- **D.** to suggest preferring later versions when experience exposes ambiguities

4. **R-C2-003-Q4 — conceptual_inference (difficulty 5/5)**

What does the writer mean by saying that “intention itself moved”?

- **A.** Creators often lose sight of what they originally aimed for during long revisions.
- **B.** A work's purpose can develop through making and revision, not exist from the start.
- **C.** Version histories reveal the single intention behind each change.
- **D.** Intentions can no longer be studied once several versions exist.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C2-003-Q1` | **C** | nuanced_stance | 5/5 |
| `R-C2-003-Q2` | **D** | subtle_implication | 5/5 |
| `R-C2-003-Q3` | **A** | rhetorical_structure | 5/5 |
| `R-C2-003-Q4` | **B** | conceptual_inference | 5/5 |

---


### R-C2-004 — On Silencing an Opinion
**Topic:** society  
**Genre:** philosophical_essay  
**Audience:** adult  
**Input length:** ~723 words  
**Source:** MILL, John Stuart. On liberty. London: The Walter Scott Publishing, [1901]. Obra publicada originalmente em 1859. Disponível em: https://www.gutenberg.org/ebooks/34901. Acesso em: 6 nov. 2026.  
**License:** Domínio público — autor falecido em 1873 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos.  
**Credit:** Texto: John Stuart Mill, On Liberty (1859), cap. II, domínio público.  
**Adaptation:** Trecho do capítulo II; texto sem alterações (itálicos do original não reproduzidos).

#### Input

If all mankind minus one, were of one opinion, and only one person were of the contrary opinion, mankind would be no more justified in silencing that one person, than he, if he had the power, would be justified in silencing mankind. Were an opinion a personal possession of no value except to the owner; if to be obstructed in the enjoyment of it were simply a private injury, it would make some difference whether the injury was inflicted only on a few persons or on many. But the peculiar evil of silencing the expression of an opinion is, that it is robbing the human race; posterity as well as the existing generation; those who dissent from the opinion, still more than those who hold it. If the opinion is right, they are deprived of the opportunity of exchanging error for truth: if wrong, they lose, what is almost as great a benefit, the clearer perception and livelier impression of truth, produced by its collision with error.

It is necessary to consider separately these two hypotheses, each of which has a distinct branch of the argument corresponding to it. We can never be sure that the opinion we are endeavouring to stifle is a false opinion; and if we were sure, stifling it would be an evil still.

First: the opinion which it is attempted to suppress by authority may possibly be true. Those who desire to suppress it, of course deny its truth; but they are not infallible. They have no authority to decide the question for all mankind, and exclude every other person from the means of judging. To refuse a hearing to an opinion, because they are sure that it is false, is to assume that their certainty is the same thing as absolute certainty. All silencing of discussion is an assumption of infallibility. Its condemnation may be allowed to rest on this common argument, not the worse for being common.

Unfortunately for the good sense of mankind, the fact of their fallibility is far from carrying the weight in their practical judgment, which is always allowed to it in theory; for while every one well knows himself to be fallible, few think it necessary to take any precautions against their own fallibility, or admit the supposition that any opinion, of which they feel very certain, may be one of the examples of the error to which they acknowledge themselves to be liable. Absolute princes, or others who are accustomed to unlimited deference, usually feel this complete confidence in their own opinions on nearly all subjects. People more happily situated, who sometimes hear their opinions disputed, and are not wholly unused to be set right when they are wrong, place the same unbounded reliance only on such of their opinions as are shared by all who surround them, or to whom they habitually defer: for in proportion to a man's want of confidence in his own solitary judgment, does he usually repose, with implicit trust, on the infallibility of "the world" in general. And the world, to each individual, means the part of it with which he comes in contact; his party, his sect, his church, his class of society: the man may be called, by comparison, almost liberal and large-minded to whom it means anything so comprehensive as his own country or his own age. Nor is his faith in this collective authority at all shaken by his being aware that other ages, countries, sects, churches, classes, and parties have thought, and even now think, the exact reverse. He devolves upon his own world the responsibility of being in the right against the dissentient worlds of other people; and it never troubles him that mere accident has decided which of these numerous worlds is the object of his reliance, and that the same causes which make him a Churchman in London, would have made him a Buddhist or a Confucian in Pekin. Yet it is as evident in itself as any amount of argument can make it, that ages are no more infallible than individuals; every age having held many opinions which subsequent ages have deemed not only false but absurd; and it is as certain that many opinions, now general, will be rejected by future ages, as it is that many, once general, are rejected by the present.

#### Items

1. **R-C2-004-Q1 — main_argument (difficulty 5/5)**

Which statement best captures Mill's central claim in this passage?

- **A.** A majority may silence an opinion once almost everyone agrees it is false.
- **B.** Governments may suppress opinions that the public largely rejects.
- **C.** Silencing any opinion wrongs everyone, since it assumes a certainty no one has.
- **D.** Since opinions belong to individuals, silencing one is merely a private injury.

2. **R-C2-004-Q2 — rhetorical_purpose (difficulty 5/5)**

Why does Mill mention a man who would be 'a Churchman in London' but 'a Buddhist or a Confucian in Pekin'?

- **A.** to show that people's certainties often reflect where they happen to live
- **B.** to show that religious belief is stronger in some countries than in others
- **C.** to argue that people should travel in order to understand other beliefs
- **D.** to show that individuals trust their own judgment more than their society's

3. **R-C2-004-Q3 — implicit_meaning (difficulty 5/5)**

According to Mill, what is lost when a false opinion is silenced?

- **A.** the opportunity of exchanging an error for the truth itself
- **B.** the chance for the minority to persuade the generations that come after them
- **C.** little of value, since the error is simply removed from debate
- **D.** a clearer, livelier grasp of the truth that collision with error gives

4. **R-C2-004-Q4 — nuanced_inference (difficulty 5/5)**

What does Mill imply about people who 'sometimes hear their opinions disputed'?

- **A.** They no longer assume that their own views are infallible.
- **B.** They still treat the views shared by their own circle as beyond doubt.
- **C.** They trust their solitary judgment more than absolute princes do.
- **D.** They rely more on their own judgment than on the views of the people around them.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C2-004-Q1` | **C** | main_argument | 5/5 |
| `R-C2-004-Q2` | **A** | rhetorical_purpose | 5/5 |
| `R-C2-004-Q3` | **D** | implicit_meaning | 5/5 |
| `R-C2-004-Q4` | **B** | nuanced_inference | 5/5 |

---

# 22. Additional Listening tasklets


## A1 — Expansion

### L-A1-003 — Platform Change
**Topic:** travel  
**Audience:** general  
**Estimated duration:** 25–30 seconds

#### Script

Attention, please. The 9:20 train to Lakeside is now on platform four. It is about ten minutes late. Please use the stairs beside the ticket office. The café on platform four is closed today.

#### Items

1. **L-A1-003-Q1 — specific_information (difficulty 2/5)**

Where will the train to Lakeside leave from?

- **A.** platform four
- **B.** platform two
- **C.** the ticket office
- **D.** the café

2. **L-A1-003-Q2 — specific_information (difficulty 2/5)**

How late is the train?

- **A.** about two minutes
- **B.** about twenty minutes
- **C.** about ten minutes
- **D.** about forty minutes

3. **L-A1-003-Q3 — specific_information (difficulty 3/5)**

What should passengers use to reach the platform?

- **A.** the lift beside the café
- **B.** the bridge outside the station
- **C.** the door near platform two
- **D.** the stairs beside the ticket office

4. **L-A1-003-Q4 — basic_gist (difficulty 2/5)**

Which place is closed?

- **A.** the ticket office
- **B.** the café on platform four
- **C.** the stairs
- **D.** the station entrance

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A1-003-Q1` | **A** | specific_information | 2/5 |
| `L-A1-003-Q2` | **C** | specific_information | 2/5 |
| `L-A1-003-Q3` | **D** | specific_information | 3/5 |
| `L-A1-003-Q4` | **B** | basic_gist | 2/5 |

---


## A2 — Expansion

### L-A2-003 — A Change to the Evening Class
**Topic:** education  
**Audience:** general  
**Estimated duration:** 50–60 seconds

#### Script

Hi, this is Rosa from Green Street Language Centre. I’m calling about your conversation class this Thursday. The teacher, Mr Patel, has to attend a meeting, so the class won’t start at six as usual. It will begin at seven and finish at eight thirty. If that is too late for you, you can join Friday’s class at five instead. You don’t need to pay again. Please send us a message before Thursday afternoon if you want the Friday class. Also, remember that both classes are in Room 5 this week because Room 3 is being painted.

#### Items

1. **L-A2-003-Q1 — main_idea (difficulty 2/5)**

Why is Rosa calling?

- **A.** to ask the student to pay for another class
- **B.** to introduce a new teacher
- **C.** to cancel all classes this week
- **D.** to explain a change to a class

2. **L-A2-003-Q2 — detail (difficulty 2/5)**

What time will Thursday’s class start?

- **A.** 6:00
- **B.** 7:00
- **C.** 5:00
- **D.** 8:30

3. **L-A2-003-Q3 — detail (difficulty 3/5)**

What can the student do if Thursday is too late?

- **A.** attend a Friday class
- **B.** ask for a private lesson
- **C.** come to Room 3 earlier
- **D.** take the class online

4. **L-A2-003-Q4 — specific_information (difficulty 3/5)**

Why are the classes in Room 5?

- **A.** Room 5 has new computers.
- **B.** Mr Patel requested a larger room.
- **C.** Room 3 is being painted.
- **D.** The Friday class is usually there.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-A2-003-Q1` | **D** | main_idea | 2/5 |
| `L-A2-003-Q2` | **B** | detail | 2/5 |
| `L-A2-003-Q3` | **A** | detail | 3/5 |
| `L-A2-003-Q4` | **C** | specific_information | 3/5 |

---


## B1 — Expansion

### L-B1-003 — The Community Cinema Volunteers
**Topic:** culture  
**Audience:** general  
**Estimated duration:** 1 min 35 sec

#### Script

HOST: Our town cinema reopened last year as a community project. Mia, you volunteer there twice a month. What do volunteers actually do?

MIA: It depends on the evening. Sometimes I check tickets or help people find seats, but I also help choose films for our Sunday programme. I thought that would be the easiest part, but it’s surprisingly difficult. We need films people are interested in, of course, but we also try not to show only the big titles everyone can already stream at home.

HOST: Has anything surprised you since you started?

MIA: Yes. I assumed our older films would mostly attract older people. Actually, some of the most enthusiastic audiences are students. Last month we showed a black-and-white comedy from the 1940s, and nearly half the audience was under twenty-five.

HOST: Do volunteers get free tickets?

MIA: We do, but that wasn’t why I joined. The cinema was closed for three years, and the town centre felt quieter without it. I wanted to help bring something back. The free tickets are just a nice extra.

#### Items

1. **L-B1-003-Q1 — gist (difficulty 3/5)**

What is Mia mainly talking about?

- **A.** why the cinema stopped showing older films
- **B.** what volunteering at a community cinema is like
- **C.** how she became a professional film critic
- **D.** why streaming services are more popular than cinemas

2. **L-B1-003-Q2 — detail (difficulty 3/5)**

What does Mia find difficult?

- **A.** deciding which films to include
- **B.** checking tickets quickly
- **C.** helping people find their seats
- **D.** working with younger volunteers

3. **L-B1-003-Q3 — inference (difficulty 4/5)**

What surprised Mia about the audiences for older films?

- **A.** They were much smaller than expected.
- **B.** Most people left before the film ended.
- **C.** Many people in those audiences were young.
- **D.** They mainly came because the tickets were free.

4. **L-B1-003-Q4 — speaker_intention (difficulty 4/5)**

Why did Mia originally decide to volunteer?

- **A.** to get some experience for a future job in film
- **B.** to receive free cinema tickets
- **C.** to meet students from the town
- **D.** to help bring back something the town had lost

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B1-003-Q1` | **B** | gist | 3/5 |
| `L-B1-003-Q2` | **A** | detail | 3/5 |
| `L-B1-003-Q3` | **C** | inference | 4/5 |
| `L-B1-003-Q4` | **D** | speaker_intention | 4/5 |

---


## B2 — Expansion

### L-B2-003 — The Library Without Late Fines
**Topic:** society  
**Audience:** general  
**Estimated duration:** 2 min 20 sec

#### Script

PRESENTER: Several public libraries have stopped charging daily fines when books are returned late. Critics say that without a penalty, people will simply keep books for longer. Librarian Daniel Cho says that hasn’t been the main result in his city.

DANIEL: Before we changed the policy, we looked at who actually had blocked accounts. The pattern was uncomfortable. People in lower-income neighbourhoods were much more likely to stop using the library after receiving even a fairly small fine. A five-pound charge may sound minor, but if you have several children borrowing books, it can accumulate quickly.

PRESENTER: So books now have no due dates?

DANIEL: No, and that misunderstanding matters. We still send reminders, and if an item is very late, the borrower can’t take out more material until it’s returned or replaced. What we removed was the amount increasing every day.

PRESENTER: Did returns become slower?

DANIEL: Slightly, in the first few months. But we also saw more long-overdue books come back, probably because people no longer felt embarrassed about a debt that had grown. Overall availability hasn’t changed much.

PRESENTER: Some listeners might say you’ve replaced a simple rule with a more complicated one.

DANIEL: Perhaps. But simplicity isn’t the only value. A rule can be easy to explain and still discourage the very people a public service is trying to reach. We’re continuing to collect data, so I wouldn’t claim the policy is perfect. The question is whether fines were actually producing the behaviour we assumed they produced.

#### Items

1. **L-B2-003-Q1 — speaker_stance (difficulty 4/5)**

What is Daniel’s main position?

- **A.** Daily fines are effective but should be reduced for families with children.
- **B.** Libraries should remove all due dates because reminders are sufficient.
- **C.** Removing fines seems beneficial, but the policy should keep being evaluated.
- **D.** The new system has clearly made books return faster in every neighbourhood.

2. **L-B2-003-Q2 — detail (difficulty 3/5)**

What happens when an item becomes very late under the new system?

- **A.** The borrower receives a larger daily fine.
- **B.** The library automatically charges the cost of a new copy.
- **C.** The borrower loses access to reminder messages.
- **D.** The borrower cannot borrow more until it is resolved.

3. **L-B2-003-Q3 — inference (difficulty 4/5)**

Why might some long-overdue books have been returned after fines were removed?

- **A.** Borrowers were offered cash for returning old books.
- **B.** People felt freer to return items once debts disappeared.
- **C.** The library shortened all loan periods at the same time.
- **D.** Books from poorer areas were collected directly from homes.

4. **L-B2-003-Q4 — argument (difficulty 5/5)**

What assumption does Daniel question at the end?

- **A.** that a daily fine necessarily makes people return books
- **B.** that libraries should collect data about policy changes
- **C.** that public services need rules that are easy to understand
- **D.** that reminders can help borrowers remember due dates

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-B2-003-Q1` | **C** | speaker_stance | 4/5 |
| `L-B2-003-Q2` | **D** | detail | 3/5 |
| `L-B2-003-Q3` | **B** | inference | 4/5 |
| `L-B2-003-Q4` | **A** | argument | 5/5 |

---


## C1 — Expansion

### L-C1-003 — Predictive Text and the Shape of a Sentence
**Topic:** technology  
**Audience:** adult  
**Estimated duration:** 3 min 10 sec

#### Script

INTERVIEWER: We tend to discuss predictive text as a question of speed: does it help us write faster? But your research asks a different question.

RESEARCHER: Right. I’m interested in whether prediction changes the sentence before the writer has fully decided what to say. The software doesn’t merely correct spelling after the fact. It offers continuations while a thought is still being formulated. That makes it part of the environment in which the choice is made.

INTERVIEWER: Are you saying people simply accept whatever the system suggests?

RESEARCHER: No, that would be far too strong. Most suggestions are ignored. The interesting effect is subtler. Imagine you begin an email with “I’m afraid that…” and the system offers a conventional continuation. Even if you reject it, you’ve now seen one path made unusually available. Other formulations require slightly more effort to retrieve. A tiny difference in effort can matter when it happens hundreds of times.

INTERVIEWER: But writing has always involved tools—dictionaries, templates, style guides. Why single out prediction?

RESEARCHER: We shouldn’t romanticise a tool-free past. The distinction is timing and scale. A dictionary usually waits for you to ask a question. Predictive systems intervene continuously and often invisibly. That doesn’t make them harmful by definition, but it means the comparison with passive reference tools is incomplete.

INTERVIEWER: Can we measure whether everyone’s writing is becoming more similar?

RESEARCHER: Not easily. Similarity can increase for many reasons, including workplace conventions and global communication. And prediction systems are trained on language that was already common, so cause and effect loop together. If a phrase is frequent, the system suggests it; if the system suggests it, the phrase may become slightly more frequent.

INTERVIEWER: So what should users do? Turn prediction off?

RESEARCHER: Sometimes, perhaps, especially during tasks where discovering your own wording matters. But I’m wary of turning awareness into a purity test. The useful habit is noticing when ease is doing part of the deciding. A suggestion can save time and still deserve scrutiny. Efficiency and authorship aren’t opposites; the question is how consciously we trade between them.

#### Items

1. **L-C1-003-Q1 — main_argument (difficulty 4/5)**

What is the researcher primarily interested in?

- **A.** whether predictive text shapes wording while ideas are still being expressed
- **B.** whether predictive systems contain more spelling errors than dictionaries
- **C.** whether people can learn to type without any automated assistance
- **D.** whether email templates are replacing other forms of workplace communication

2. **L-C1-003-Q2 — nuanced_inference (difficulty 5/5)**

Why does the researcher mention suggestions that users reject?

- **A.** to show that rejected suggestions are stored and used to retrain the system
- **B.** to suggest that just seeing an option may affect which alternatives feel available
- **C.** to argue that prediction fails because most users ignore its recommendations
- **D.** to show that writers remember rejected phrases better than accepted ones

3. **L-C1-003-Q3 — speaker_attitude (difficulty 5/5)**

How does the researcher view comparisons with dictionaries?

- **A.** They prove predictive text is simply another harmless writing tool.
- **B.** They are irrelevant because dictionaries no longer influence writing.
- **C.** They show that all writing technologies should be evaluated in the same way.
- **D.** They are useful but miss how continuous and proactive prediction is.

4. **L-C1-003-Q4 — implication (difficulty 5/5)**

What does the researcher mean by saying “ease is doing part of the deciding”?

- **A.** Writers become unable to make decisions once prediction is enabled.
- **B.** Predictive systems deliberately choose ideas on behalf of users.
- **C.** Convenient suggestions can shape choices without determining them.
- **D.** Efficient writing always reduces the originality of the final text.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C1-003-Q1` | **A** | main_argument | 4/5 |
| `L-C1-003-Q2` | **B** | nuanced_inference | 5/5 |
| `L-C1-003-Q3` | **D** | speaker_attitude | 5/5 |
| `L-C1-003-Q4` | **C** | implication | 5/5 |

---


## C2 — Expansion

### L-C2-003 — When Expert Disagreement Is Productive
**Topic:** science  
**Audience:** adult  
**Estimated duration:** 4 min 40 sec

#### Script

HOST: Public discussions often treat expert disagreement as evidence that expertise has failed. If specialists cannot agree, people ask, why should anyone trust them? Philosopher of science Dr Lena Morris thinks that reaction confuses two very different kinds of disagreement.

MORRIS: Some disagreement is obviously a warning sign. If two laboratories using the same well-established method obtain incompatible results and nobody can explain why, confidence should fall. But disagreement can also be a mechanism by which a field discovers what it has been assuming. Two researchers may accept the same data and still disagree because they assign different importance to competing risks, use different models or define the problem at different scales. Making those differences explicit can improve the inquiry.

HOST: That sounds reasonable inside a research community, but from outside it can look like uncertainty.

MORRIS: It is uncertainty. The mistake is treating uncertainty as the opposite of knowledge. Mature expertise often includes a more precise map of what is uncertain. A novice may give you one confident number because they don’t yet see the assumptions around it; an expert may give you a range and three conditions. The expert can sound less certain while actually understanding more.

HOST: Does that mean the public should simply accept disagreement and wait?

MORRIS: No. “Experts disagree” can become an excuse for paralysis, especially when action must be taken before uncertainty disappears. We need to ask what the disagreement is about. Is it about the underlying evidence? The model? Values? The acceptable level of risk? Those require different responses. If ninety specialists agree that a chemical increases a particular risk but disagree about what regulation is proportionate, presenting this as scientific confusion hides a normative dispute inside technical language.

HOST: There’s also a media problem, isn’t there? Two opposing guests create a neat debate.

MORRIS: Exactly. Balance can distort the distribution of informed opinion. If a field contains a large majority and a small dissenting minority, putting one representative of each side on screen produces visual equality where intellectual weight is unequal. But the opposite danger is to suppress minority positions merely because they are minority positions. Some important corrections begin at the margins.

HOST: So how do we distinguish valuable dissent from noise?

MORRIS: There is no shortcut, which is frustrating. We look at the quality of evidence, whether claims survive criticism, whether alternative explanations are being tested, and whether disagreement changes as new evidence arrives. Productive dissent is responsive. It doesn’t just repeat itself unchanged while treating every failed prediction as someone else’s fault.

HOST: Then disagreement itself tells us very little?

MORRIS: On its own, yes. The existence of disagreement is weak information. Its structure is much more informative. Who disagrees, about what, on what evidence, and what would change their minds? Those questions turn “experts disagree” from a slogan into something we can actually evaluate.

#### Items

1. **L-C2-003-Q1 — nuanced_stance (difficulty 5/5)**

What distinction is central to Morris’s argument?

- **A.** between disagreement caused by ignorance and disagreement caused by dishonesty
- **B.** between scientific disagreement and all forms of political disagreement
- **C.** between experts who communicate confidently and experts who avoid public debate
- **D.** between disagreement that exposes assumptions and disagreement signalling failure

2. **L-C2-003-Q2 — subtle_implication (difficulty 5/5)**

Why does Morris contrast the novice’s single number with the expert’s range?

- **A.** to imply that precise numerical claims are never scientifically useful
- **B.** to argue that novices communicate more effectively with the public
- **C.** to show that recognising conditions and uncertainty can reflect deeper knowledge
- **D.** to suggest that experts deliberately make answers complicated to protect their authority

3. **L-C2-003-Q3 — rhetorical_inference (difficulty 5/5)**

What is Morris’s criticism of presenting two opposing experts as “balanced”?

- **A.** It can visually exaggerate the weight of a minority position.
- **B.** It prevents minority arguments from being tested publicly.
- **C.** It makes scientific disagreements appear too technical for audiences.
- **D.** It assumes that all experts are equally skilled at television interviews.

4. **L-C2-003-Q4 — conceptual_inference (difficulty 5/5)**

What does Morris mean by saying productive dissent is “responsive”?

- **A.** It is expressed politely when other researchers criticise it.
- **B.** It changes in response to new evidence and failed predictions.
- **C.** It appears mainly in fields where experts already agree on values.
- **D.** It should be given equal media attention regardless of support.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `L-C2-003-Q1` | **D** | nuanced_stance | 5/5 |
| `L-C2-003-Q2` | **C** | subtle_implication | 5/5 |
| `L-C2-003-Q3` | **A** | rhetorical_inference | 5/5 |
| `L-C2-003-Q4` | **B** | conceptual_inference | 5/5 |

---


# 23. Additional Language Use items

## A1 — Additional Language Use Items

11. **LU-A1-011 — grammar (difficulty 2/5)**

My sister ___ to school by bus every day.

- **A.** goes
- **B.** go
- **C.** going
- **D.** has gone

12. **LU-A1-012 — vocabulary (difficulty 1/5)**

You can buy medicine at a ___.

- **A.** bakery
- **B.** pharmacy
- **C.** library
- **D.** garage

13. **LU-A1-013 — grammar (difficulty 2/5)**

A: Where are my shoes? B: They are ___ the bed.

- **A.** during
- **B.** from
- **C.** under
- **D.** until

14. **LU-A1-014 — functional_language (difficulty 2/5)**

A: Excuse me, where is the bathroom? B: ___

- **A.** It's very big.
- **B.** Yes, there is.
- **C.** No, it isn't.
- **D.** It’s next to the kitchen.

15. **LU-A1-015 — grammar (difficulty 2/5)**

We don’t have ___ classes on Sunday.

- **A.** any
- **B.** some
- **C.** a
- **D.** no

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-A1-011` | **A** | grammar | 2/5 |
| `LU-A1-012` | **B** | vocabulary | 1/5 |
| `LU-A1-013` | **C** | grammar | 2/5 |
| `LU-A1-014` | **D** | functional_language | 2/5 |
| `LU-A1-015` | **A** | grammar | 2/5 |

---

## A2 — Additional Language Use Items

11. **LU-A2-011 — grammar (difficulty 3/5)**

I ___ my keys while I was walking home.

- **A.** lose
- **B.** lost
- **C.** have lost
- **D.** was losing

12. **LU-A2-012 — functional_language (difficulty 2/5)**

A: Would you like some more coffee? B: ___

- **A.** Yes, I drink it every day.
- **B.** No, I don't.
- **C.** No, thanks. I’ve had enough.
- **D.** Yes, I like coffee.

13. **LU-A2-013 — grammar (difficulty 3/5)**

This is the ___ restaurant in our neighbourhood.

- **A.** more popular
- **B.** mostly popular
- **C.** popular than
- **D.** most popular

14. **LU-A2-014 — collocation (difficulty 3/5)**

We had to ___ the bus because the next one was an hour later.

- **A.** catch
- **B.** lose
- **C.** win
- **D.** reach

15. **LU-A2-015 — grammar (difficulty 3/5)**

You ___ bring a towel; the hotel provides one.

- **A.** mustn’t
- **B.** don’t have to
- **C.** can’t
- **D.** aren’t able to

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-A2-011` | **B** | grammar | 3/5 |
| `LU-A2-012` | **C** | functional_language | 2/5 |
| `LU-A2-013` | **D** | grammar | 3/5 |
| `LU-A2-014` | **A** | collocation | 3/5 |
| `LU-A2-015` | **B** | grammar | 3/5 |

---

## B1 — Additional Language Use Items

11. **LU-B1-011 — grammar (difficulty 3/5)**

By the time we arrived, the film ___.

- **A.** starts
- **B.** has started
- **C.** had started
- **D.** started

12. **LU-B1-012 — lexical_choice (difficulty 3/5)**

I didn’t recognise Sam at first because he had ___ his appearance so much.

- **A.** replaced
- **B.** exchanged
- **C.** turned
- **D.** changed

13. **LU-B1-013 — functional_language (difficulty 3/5)**

A: I’m not sure this plan will work. B: ___ Let’s look at the possible problems first.

- **A.** You may have a point.
- **B.** I'm sure it will work.
- **C.** I'm afraid I disagree.
- **D.** Don't worry about it.

14. **LU-B1-014 — grammar (difficulty 4/5)**

If I ___ about the road closure, I would have left earlier.

- **A.** knew
- **B.** had known
- **C.** would know
- **D.** have known

15. **LU-B1-015 — collocation (difficulty 3/5)**

The course gave me a chance to ___ experience in customer service.

- **A.** win
- **B.** make
- **C.** gain
- **D.** do

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-B1-011` | **C** | grammar | 3/5 |
| `LU-B1-012` | **D** | lexical_choice | 3/5 |
| `LU-B1-013` | **A** | functional_language | 3/5 |
| `LU-B1-014` | **B** | grammar | 4/5 |
| `LU-B1-015` | **C** | collocation | 3/5 |

---

## B2 — Additional Language Use Items

11. **LU-B2-011 — lexical_choice (difficulty 4/5)**

The report does not reject the proposal; it simply ___ several risks that need further attention.

- **A.** addresses
- **B.** dismisses
- **C.** quantifies
- **D.** highlights

12. **LU-B2-012 — grammar (difficulty 4/5)**

I wish I ___ more attention during yesterday's safety briefing.

- **A.** had paid
- **B.** would pay
- **C.** have paid
- **D.** was paying

13. **LU-B2-013 — collocation (difficulty 4/5)**

The new evidence ___ doubt on the assumption that the two events were unrelated.

- **A.** poses
- **B.** casts
- **C.** places
- **D.** delivers

14. **LU-B2-014 — register (difficulty 4/5)**

Which sentence is most appropriate in a formal report?

- **A.** A large number of the respondents said that they did not like the revised timetable at all.
- **B.** Quite a lot of respondents were unhappy about the changes to the timetable.
- **C.** A substantial number of respondents expressed dissatisfaction with the revised timetable.
- **D.** Many respondents felt that the new timetable was not really working for them.

15. **LU-B2-015 — discourse_markers (difficulty 4/5)**

The initial results appear promising. ___, the sample is too small for firm conclusions.

- **A.** Likewise
- **B.** Consequently
- **C.** For instance
- **D.** That said

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-B2-011` | **D** | lexical_choice | 4/5 |
| `LU-B2-012` | **A** | grammar | 4/5 |
| `LU-B2-013` | **B** | collocation | 4/5 |
| `LU-B2-014` | **C** | register | 4/5 |
| `LU-B2-015` | **D** | discourse_markers | 4/5 |

---

## C1 — Additional Language Use Items

11. **LU-C1-011 — lexical_precision (difficulty 5/5)**

The chair’s comments were deliberately ___, allowing both sides to interpret them as support.

- **A.** ambiguous
- **B.** provisional
- **C.** redundant
- **D.** restrained

12. **LU-C1-012 — grammar (difficulty 5/5)**

Not until the final report was published ___ the full extent of the problem.

- **A.** the public understood
- **B.** did the public understand
- **C.** the public did understand
- **D.** the public had understood

13. **LU-C1-013 — collocation (difficulty 5/5)**

Critics were quick to ___ holes in the argument.

- **A.** make
- **B.** dig
- **C.** pick
- **D.** cut

14. **LU-C1-014 — register (difficulty 5/5)**

Which reply best softens a disagreement in a professional meeting?

- **A.** I'm afraid that's simply not right; the figures don't support it at all.
- **B.** I disagree, because the figures don't support that view.
- **C.** With respect, you haven't looked at the figures closely.
- **D.** I see your point, although I'm not convinced the figures support it.

15. **LU-C1-015 — lexical_precision (difficulty 5/5)**

The committee’s recommendation was not binding, but it carried considerable ___.

- **A.** weight
- **B.** pressure
- **C.** volume
- **D.** mass

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-C1-011` | **A** | lexical_precision | 5/5 |
| `LU-C1-012` | **B** | grammar | 5/5 |
| `LU-C1-013` | **C** | collocation | 5/5 |
| `LU-C1-014` | **D** | register | 5/5 |
| `LU-C1-015` | **A** | lexical_precision | 5/5 |

---

## C2 — Additional Language Use Items

11. **LU-C2-011 — lexical_precision (difficulty 5/5)**

The apology was carefully worded to ___ responsibility without explicitly accepting legal liability.

- **A.** assign
- **B.** acknowledge
- **C.** transfer
- **D.** discharge

12. **LU-C2-012 — idiomatic_control (difficulty 5/5)**

The new evidence does not refute the account, but it does ___ its claim to explanatory completeness.

- **A.** reinforce
- **B.** preserve
- **C.** qualify
- **D.** formalise

13. **LU-C2-013 — register (difficulty 5/5)**

Which sentence best conveys a restrained but pointed criticism?

- **A.** The analysis is illuminating in parts, though its central distinction is asserted rather than demonstrated.
- **B.** The analysis is interesting in places, but its central distinction is simply wrong.
- **C.** Parts of the analysis are genuinely useful, and its central distinction is, on the whole, broadly convincing.
- **D.** The analysis fails to demonstrate anything, least of all the distinction at its centre.

14. **LU-C2-014 — lexical_precision (difficulty 5/5)**

The exception was initially justified as temporary, but gradually became the ___ against which later cases were judged.

- **A.** convention
- **B.** routine
- **C.** tendency
- **D.** precedent

15. **LU-C2-015 — discourse_control (difficulty 5/5)**

The evidence is consistent with the proposed mechanism. ___, consistency alone is weaker than a prediction that distinguishes between rival accounts.

- **A.** Accordingly
- **B.** For all that
- **C.** By the same token
- **D.** In other words

### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `LU-C2-011` | **B** | lexical_precision | 5/5 |
| `LU-C2-012` | **C** | idiomatic_control | 5/5 |
| `LU-C2-013` | **A** | register | 5/5 |
| `LU-C2-014` | **D** | lexical_precision | 5/5 |
| `LU-C2-015` | **B** | discourse_control | 5/5 |

---


# 24. Additional Writing prompts


## A1

### W-A1-003 — short_invitation
**Target length:** 20–35 words

**Prompt:** Write a short message to a classmate. Invite them to study English with you after school. Say where you want to meet, what day and time, and what they should bring.


## A2

### W-A2-003 — informal_email
**Target length:** 40–70 words

**Prompt:** You borrowed a book from a friend and cannot return it on the day you promised. Write an email. Explain why, apologise, and suggest a new day to return it.


## B1

### W-B1-003 — review
**Target length:** 100–120 words

**Prompt:** An English-language website for visitors to your town is asking for reviews. Write a review of a place you would recommend: describe the place, explain what is good about it, mention one possible disadvantage, and say who would enjoy it most.


## B2

### W-B2-003 — article
**Target length:** 140–190 words

**Prompt:** Your town has an empty building that could become either a youth centre or a market hall. Write an article for a local English-language magazine discussing which would benefit the community more, and give your recommendation.


## C1

### W-C1-003 — analytical_report
**Target length:** 220–260 words

**Prompt:** A community centre has tested three ways to increase participation: cheaper membership, longer opening hours and more specialised events. Write a report for the centre’s management committee explaining what evidence should be collected before deciding which measure to keep, and recommending how the centre should evaluate success.


## C2

### W-C2-003 — critical_commentary
**Target length:** 280–320 words

**Prompt:** A professional magazine invites critical commentaries on the claim: “Expertise should be judged by its results rather than by credentials.” Write a commentary that distinguishes different kinds of expertise, considers when credentials matter even if results are good, and develops a nuanced conclusion.


# 25. Additional Spoken Production prompts


## A1

### SP-A1-003 — short_turn
**Target speaking time:** 30–45 seconds

**Prompt:** Talk about your favourite food. Say what it is, when you eat it, who makes it and why you like it.


## A2

### SP-A2-003 — simple_description
**Target speaking time:** 45–60 seconds

**Prompt:** Describe a person you admire. Say who they are, how you know them, what they are like and why you admire them.


## B1

### SP-B1-003 — opinion_long_turn
**Target speaking time:** 1–2 minutes

**Prompt:** Some people prefer holidays in a big city; others prefer the countryside. Compare the two and explain which you prefer.


## B2

### SP-B2-003 — argument_long_turn
**Target speaking time:** 2–3 minutes

**Prompt:** Should young people do a period of community service before university or their first job? Discuss possible benefits and disadvantages and give a reasoned position.


## C1

### SP-C1-003 — advanced_long_turn
**Target speaking time:** 2–3 minutes

**Prompt:** To what extent should people accept less privacy in public spaces in exchange for greater safety? Develop and qualify your position.


## C2

### SP-C2-003 — advanced_analytical_turn
**Target speaking time:** 2–3 minutes

**Prompt:** Discuss whether societies benefit more from protecting individual choice or from encouraging shared habits, using examples such as health, the environment or education. Explain where you would draw the line and why.


# 26. Additional Spoken Interaction tasks


## A1

### SI-A1-003 — guided_role_play
**Suggested duration:** 2–3 minutes

**Task:** You are lost in town. Ask the examiner how to get to the bus station, ask how long it takes to walk there, and say thank you.


## A2

### SI-A2-003 — planning_task
**Suggested duration:** 3–4 minutes

**Task:** You and the examiner want to meet a friend this weekend. Talk about two possible times and two possible places, explain one problem, and agree on a plan.


## B1

### SI-B1-003 — collaborative_decision
**Suggested duration:** 4–5 minutes

**Task:** Your class has money for one end-of-term activity: a picnic, a cinema visit, a sports afternoon or a workshop. Discuss the options with the examiner, think about practical problems, and reach a decision.


## B2

### SI-B2-003 — collaborative_problem_solving
**Suggested duration:** 5–6 minutes

**Task:** Your sports club wants to attract more young members. Discuss four ideas with the examiner — lower fees, evening sessions, social events or a beginners’ team — consider the likely effects and agree on a recommendation.


## C1

### SI-C1-003 — advanced_discussion
**Suggested duration:** 6–8 minutes

**Task:** Your town must decide how to use a large empty building: affordable housing, a community arts centre or a space for new small businesses. Discuss the options with the examiner, weigh short- and long-term effects, and negotiate a recommendation.


## C2

### SI-C2-003 — high_level_negotiation
**Suggested duration:** 7–9 minutes

**Task:** You and the examiner are advising a national museum that must decide whether to return a historically contested object to its country of origin. Negotiate a position that weighs legal ownership, cultural significance, public access and precedent, challenging and refining each other’s proposals.


# 27. Additional Mediation tasks


## A1

### M-A1-002 — relay_specific_information
**Suggested duration:** 20–35 words

**Source card**

COMMUNITY SPORTS DAY  
Saturday — 10:00–14:00  
Sports Hall  
Basketball: 10:30  
Family games: 12:00  
Entry: free  
Please bring water.

**Task:** Your English-speaking friend wants to go. Write a short message telling them when and where the event is, one activity they can do and what they should bring.


## A2

### M-A2-002 — relay_and_explain
**Suggested duration:** 30–50 words

**Source notice**

TOWN MUSEUM — FRIDAY VISITS  
Entry is free from 4:00 p.m. on Fridays.  
Last entry: 5:30 p.m.  
Large bags must be left in the lockers near reception.  
Guided tour: 4:30 p.m. — R$15 per person.  
The museum closes at 6:00 p.m.

**Task:** Your friend finishes work at 4:15 and wants to visit as cheaply as possible. Write a message explaining the information they need, including the latest time they can enter and what they must do with a large bag.


## B1

### M-B1-002 — summary_for_audience
**Suggested duration:** 60–90 words

**Source: Homework Club notice**

The Homework Club is open Monday to Thursday from 3:30 to 5:30 p.m. Students may stay for as little as 30 minutes or for the full two hours. An English teacher is available on Mondays and Wednesdays. Mathematics support is offered on Mondays and Thursdays, while a science teacher attends on Tuesdays and Thursdays. Students do not need to book a normal study place. However, there are only twelve computers, so anyone who needs a computer must reserve one online before 2:00 p.m. on the same day. Printing is available, but students should bring their own paper. The club is held in the Learning Centre on the first floor. Students who need help with a particular assignment should bring the task instructions with them.

**Task:** Your classmate needs help with a science assignment and must use a computer. Write a message with only the information that matters to them, and explain what they need to do before going.


## B2

### M-B2-002 — synthesis
**Suggested duration:** 90–130 words

**Source A — Review of the city bike-sharing scheme**

The scheme has made short trips across the centre much cheaper than taxis, and I can usually find a bike near the main shopping streets. The app is straightforward, and the first thirty minutes cost very little. My main complaint is maintenance. I have reported loose brakes twice this month, and on one occasion three bikes at the same station were unavailable because of faults. Expanding the fleet will not help if existing bikes are not checked more consistently.

**Source B — Community transport blog**

Bike maintenance has improved noticeably since the operator introduced weekly inspections. The bigger problem is where the stations are located. Central and high-income neighbourhoods have dense coverage, while several outer districts have only one or two stations, sometimes far from major bus stops. A system promoted as city-wide should not require residents in some areas to travel twenty minutes just to reach a bike.

**Task:** Write a briefing for a community group explaining where the two sources agree or complement each other, where their emphasis differs, and one issue the city should investigate before deciding whether the scheme is working fairly and effectively.


## C1

### M-C1-002 — complex_reformulation
**Suggested duration:** 130–180 words

**Source: Technical summary of a flexible-work pilot**

A six-month flexible-work pilot was introduced in four departments. Employees were allowed to shift their start and finish times by up to two hours, provided that each team maintained core availability between 10:00 and 15:00. Self-reported job satisfaction increased in all four departments, with the largest increase among employees who had caring responsibilities or long commutes. Staff turnover during the pilot was lower than during the same six-month period in the previous year.

Productivity results were less consistent. Two departments recorded a modest increase in completed tasks, one showed no meaningful change, and one recorded a small decline. The measures used were not identical across departments, so direct comparison is limited. Managers also reported that scheduling meetings became more complicated in teams where employees selected very different working hours.

The pilot was observational rather than randomly assigned. Employees who made the greatest use of flexible hours may therefore differ from other employees in ways not measured by the evaluation. Seasonal workload also varied between the comparison periods. The findings support further testing, but they do not establish that flexible scheduling caused the changes in satisfaction, turnover or productivity.

**Task:** Write a message to employees explaining the findings in clear, non-technical English. Preserve the uncertainty, distinguish the stronger findings from the weaker ones, and avoid reducing the report to a simple “success” or “failure”.


## C2

### M-C2-002 — multi_source_synthesis
**Suggested duration:** 160–220 words

**Source A — Regulator**

People affected by automated decisions should be able to see how public institutions use algorithmic systems. Disclosure can deter careless design and make it possible for journalists, researchers and citizens to question decisions that would otherwise appear neutral. Transparency should therefore be the default, with secrecy justified only where disclosure would create a specific and substantial risk.

**Source B — Systems engineer**

Publishing source code can create the appearance of transparency without producing understanding. Modern systems may depend on training data, configuration choices, thresholds and operational procedures that cannot be inferred from code alone. A technically accurate disclosure can therefore mislead non-specialists into believing the system is more interpretable than it is. Explanations should focus on decision pathways, limitations and tested behaviour rather than assuming that more raw technical material always means more accountability.

**Source C — Civil-rights organisation**

The central question is not whether an institution can describe its system but whether a person can challenge a harmful decision. Individuals need meaningful reasons, accessible appeal procedures and review by bodies independent of the organisation deploying the technology. Transparency can support these safeguards, but disclosure without contestability may simply reveal a process that affected people remain powerless to change.

**Task:** Write a briefing for a decision-making panel. Reconstruct the underlying disagreement without flattening the three positions, distinguish transparency, interpretability and accountability, identify the main assumption behind each source, and propose principles the panel could use when deciding what information and safeguards to require.


# 28. QA validation of expansion v0.2

The expansion was structurally and pedagogically reviewed before release.

### Objective-item counts

- New Reading items: **24**
- New Listening items: **24**
- New Language Use items: **30**
- New objective items: **78**
- Objective items in consolidated v0.2: **234**

### Answer-key distribution

New items:

| A | B | C | D |
|---:|---:|---:|---:|
| 20 | 19 | 20 | 19 |

Consolidated objective bank (v0.1 + expansion):

| A | B | C | D |
|---:|---:|---:|---:|
| 59 | 58 | 59 | 58 |

Because 234 is not divisible by four, an exactly equal four-way distribution is impossible. The maximum difference is **one item**.

### Automated structural checks passed

- 78/78 new objective IDs unique;
- four distinct alternatives in every new MCQ;
- valid A–D key in every new MCQ;
- no duplicate new stems;
- no sequence of three identical answer keys in the expansion ordering;
- no severe correct-answer length heuristic flags;
- expected counts by skill and level confirmed.

### Pedagogical review completed

The new items were reviewed for:

- CEFR progression A1→C2;
- floor/target/ceiling usefulness;
- plausible distractors;
- absence of external-knowledge dependence;
- age/audience appropriacy;
- increasing inferential and discourse demands at B1+;
- C1/C2 difficulty based on nuance, argument and discourse control rather than merely rare vocabulary;
- separation of Language Use from communicative proficiency;
- productive tasks that require performance rather than a single predetermined answer.

### Status

**VALIDATED INTERNALLY FOR REAL PLATFORM PILOTING — NOT YET PSYCHOMETRICALLY CALIBRATED.**

Listening tasklets include scripts but still require production of **18 audio files in the consolidated bank (3 per CEFR level)** before operational use. No task in v0.2 requires a generated image; Mediation source cards/texts can be rendered natively by the LangSpot interface.


# 29. Recommended first real LangSpot placement run

## Option A — Current fixed-mode platform pilot

Use this when the platform does not yet support routing.

### Stage 1 — Locator

Administer:

- 1 Reading tasklet from each level = **24 Reading items**;
- 1 Listening tasklet from each level = **24 Listening items**;
- 5 Language Use items from each level = **30 Language Use items**.

**Stage 1 total: 78 objective items.**

### Stage 2 — Target confirmation

After the system identifies the most likely level, retain the Stage 1 evidence and add:

- 1 additional Reading tasklet at the estimated target = **4 items**;
- 1 additional Listening tasklet at the estimated target = **4 items**;
- 5 additional Language Use items at the estimated target = **5 items**.

**Additional confirmation: 13 objective items.**  
**Maximum objective total in this fixed pilot path: 91 items.**

This raises target-level evidence from 4→8 Reading items, 4→8 Listening items and 5→10 Language Use items while Stage 1 already supplies the adjacent floor/ceiling probes.

### Stage 3 — Productive profile

Administer:

- **2 Writing tasks** selected around the estimated band;
- **1 assessed Spoken Production long turn** plus interview evidence;
- **1 Spoken Interaction task**;
- **1 Mediation task**.

For a probable **B1** candidate, the confirmation stage should use additional B1 items, while productive tasks should primarily target B1 and may include a carefully chosen B2 ceiling probe when the objective evidence is strong.

### Delivery recommendation

Split the full pilot into two sessions to reduce fatigue:

**Session 1:** objective locator + confirmation.  
**Session 2:** Writing + Speaking + Mediation.

## Option B — Preferred multistage pilot

As soon as LangSpot can route between sections, do not force every candidate through all six CEFR bands. Begin around B1 and move down or up according to evidence. The candidate then receives approximately the **39–52 objective items** defined in the target-level table rather than the 78-item all-level locator, followed by productive tasks.

This is the preferred learner-facing design because item exposure and fatigue are lower while the bank still contains all A1–C2 material needed for routing.
