# LangSpot CEFR Placement Pilot Bank v0.2 — Expanded

**Documento:** Banco Piloto de Itens para o Sistema de Avaliação do LangSpot  
**Versão:** 0.2 — Expanded Real Placement Pilot  
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
- **D.** Sunday

2. **R-A1-001-Q2 — specific_information (difficulty 2/5)**

How long can a person use a computer for free?

- **A.** 10 minutes
- **B.** all morning
- **C.** 30 minutes
- **D.** one hour

3. **R-A1-001-Q3 — basic_gist (difficulty 2/5)**

Who is the story time for?

- **A.** computer users
- **B.** library staff
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

- **A.** to arrange a meeting
- **B.** to invite her to swim
- **C.** to cancel a swimming class
- **D.** to ask for a blue jacket

2. **R-A1-002-Q2 — specific_information (difficulty 2/5)**

Where should Ana meet Diego?

- **A.** at the swimming pool inside the sports centre
- **B.** at the café opposite the sports centre
- **C.** at the bus stop opposite the school
- **D.** at Ana's house near the sports centre

3. **R-A1-002-Q3 — specific_information (difficulty 2/5)**

What time does Diego's class finish?

- **A.** 6:30
- **B.** 6:15
- **C.** 5:15
- **D.** 7:00

4. **R-A1-002-Q4 — reference (difficulty 3/5)**

Which detail can help Ana recognise Diego?

- **A.** his café order
- **B.** his swimming teacher
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

- **A.** to advertise a professional gardening course
- **B.** to sell vegetables from a garden
- **C.** to invite people to volunteer in a garden
- **D.** to explain how to grow vegetables at home

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

- **A.** to reward experienced volunteers
- **B.** to support a local food centre
- **C.** to sell them at the Saturday meeting
- **D.** to teach volunteers how to cook

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

- **A.** She has to meet her cousin at the bus station.
- **B.** She is going to Recife with her parents that afternoon.
- **C.** She has to work at the cinema until late on Friday.
- **D.** She has football practice with her cousin that evening.

3. **R-A2-002-Q3 — simple_purpose (difficulty 3/5)**

Why does Marina prefer the 7:20 film on Saturday?

- **A.** Her cousin wants to see the earlier film.
- **B.** The restaurant closes before the late film.
- **C.** The later film is more expensive.
- **D.** She needs to get up early on Sunday.

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

- **A.** why old electrical appliances are safer than new ones
- **B.** how to start a professional repair business
- **C.** how a repair event changed the writer's attitude to broken objects
- **D.** why modern appliances are usually impossible to repair

2. **R-B1-001-Q2 — detail (difficulty 3/5)**

What were owners expected to do at the repair café?

- **A.** leave their objects and collect them later
- **B.** stay and take part in the repair when possible
- **C.** pay volunteers according to the time spent
- **D.** bring only electrical objects that were easy to fix

3. **R-B1-001-Q3 — inference (difficulty 4/5)**

Why does the writer call the name 'repair café' slightly misleading?

- **A.** The event never takes place in a community building.
- **B.** The volunteers refuse to speak to the owners of broken items.
- **C.** It might make people expect a more conventional café or repair service.
- **D.** Only drinks, rather than repairs, are provided there.

4. **R-B1-001-Q4 — writer_purpose (difficulty 4/5)**

Why does the writer mention repairs that failed?

- **A.** to show that success was not measured only by whether an object worked again
- **B.** to explain why the organisers planned to close the event
- **C.** to warn readers not to bring valuable objects to the event
- **D.** to suggest that most volunteers lacked the necessary skills

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

- **A.** a plan to reduce the length of school lessons
- **B.** students' complaints about new digital clocks
- **C.** a school rule that prevents students using the playground
- **D.** the effects of removing lesson bells at a school

2. **R-B1-002-Q2 — detail (difficulty 3/5)**

What problem occurred during the first two weeks?

- **A.** Some students were late because they did not watch the time.
- **B.** Some teachers finished early because the new clocks were inaccurate.
- **C.** Some teachers arrived late because they forgot the new timetable.
- **D.** Some students stayed in class because they could not hear instructions.

3. **R-B1-002-Q3 — inference (difficulty 4/5)**

What can be inferred about the head teacher's view of personal responsibility?

- **A.** It is too difficult for younger students to learn at school.
- **B.** It matters less than keeping every student exactly on time.
- **C.** It should be the responsibility of teachers rather than students.
- **D.** It is a useful skill that students can develop through the new system.

4. **R-B1-002-Q4 — text_organisation (difficulty 4/5)**

Why does the final paragraph mention students who prefer the bell?

- **A.** to prove that the experiment has failed
- **B.** to acknowledge a disadvantage or opposing view
- **C.** to introduce a completely different school policy
- **D.** to show that older students were never surveyed

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

- **A.** Efficiency is the most important measure of whether a technology improves daily life.
- **B.** Digital services generally make people less intelligent and should be avoided whenever possible.
- **C.** People would benefit from returning to older technologies such as paper maps and physical shops.
- **D.** Convenience is valuable, but people should remain aware of the choices automated systems make for them.

2. **R-B2-001-Q2 — paragraph_function (difficulty 4/5)**

Why does the writer mention walking through an unfamiliar neighbourhood?

- **A.** to argue that navigation applications often provide inaccurate directions
- **B.** to illustrate that an inefficient experience can produce an unexpected benefit
- **C.** to show that most people prefer exploring cities without any technology
- **D.** to suggest that walking is always a better use of time than travelling quickly

3. **R-B2-001-Q3 — inference (difficulty 4/5)**

What does the writer imply about time saved by technology?

- **A.** People normally underestimate how much time technology saves them.
- **B.** Automated services should decide how users spend the time they save.
- **C.** Its value depends partly on what people do with the time they recover.
- **D.** Saving small amounts of time is more important than making deliberate choices.

4. **R-B2-001-Q4 — implication (difficulty 5/5)**

What is meant by 'a little visibility may be healthy' in the final paragraph?

- **A.** Users may benefit from occasionally recognising that a system is influencing their decisions.
- **B.** Technology should display more visual information on every screen.
- **C.** Designers should make applications more difficult to use so people notice them.
- **D.** Automated systems should publicly reveal the personal data of their users.

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

- **A.** Workplaces should remove deadlines whenever specialist knowledge is required.
- **B.** Experts are generally less efficient than employees with less experience.
- **C.** Good expertise sometimes requires deliberate caution, and organisations should distinguish this from indecision.
- **D.** Rapid decisions are reliable only in medical and engineering professions.

2. **R-B2-002-Q2 — writer_attitude (difficulty 4/5)**

How does the writer view qualified language such as 'the evidence suggests this is likely'?

- **A.** as useful only when speaking to other specialists
- **B.** as evidence that an expert has not studied the subject sufficiently
- **C.** as unnecessarily formal language that organisations should discourage
- **D.** as potentially more responsible than an unjustifiably certain answer

3. **R-B2-002-Q3 — paragraph_function (difficulty 4/5)**

What is the purpose of the fourth paragraph?

- **A.** to introduce a new argument that experience is unnecessary
- **B.** to limit the argument by recognising cases where expert speed is appropriate
- **C.** to show that emergency workers make fewer mistakes than other professionals
- **D.** to contradict the examples used earlier in the article

4. **R-B2-002-Q4 — implication (difficulty 5/5)**

What does the final sentence suggest?

- **A.** The consequences of a confident mistake may be less visible than the inconvenience of waiting.
- **B.** Employees tend to notice confident decisions because managers explain them more clearly.
- **C.** A thoughtful delay becomes acceptable only when managers can measure its financial benefit.
- **D.** Organisations can usually calculate the cost of a delay more accurately than the cost of expertise.

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

- **A.** Experts generally know less than novices because they recognise more possible explanations.
- **B.** Institutions should postpone decisions until uncertainty has been completely eliminated.
- **C.** Organisations value uncertainty in research but reject it only in educational settings.
- **D.** When precisely defined and managed, uncertainty can be evidence of sophisticated understanding rather than ignorance.

2. **R-C1-001-Q2 — rhetorical_purpose (difficulty 4/5)**

Why does the writer contrast a novice's 'We do not know' with an expert's more detailed statement?

- **A.** to show that novices are normally more confident because they consider fewer explanations
- **B.** to argue that experts should give longer answers whenever they speak to non-specialists
- **C.** to suggest that scientific questions become less answerable as researchers gain experience
- **D.** to show that expertise can produce a more precise account of what remains uncertain

3. **R-C1-001-Q3 — implicit_meaning (difficulty 5/5)**

What criticism is implied by the reference to 'unjustified decimal places'?

- **A.** Consultants tend to use decimal places mainly to make reports look more technically sophisticated.
- **B.** Strategic plans should avoid quantitative evidence because numbers create unrealistic expectations.
- **C.** Numerical precision can conceal uncertainty that the underlying evidence does not justify.
- **D.** Numerical forecasts become unreliable whenever organisations present them to non-specialist audiences.

4. **R-C1-001-Q4 — argument_structure (difficulty 5/5)**

What role does the fourth paragraph play in the overall argument?

- **A.** It prevents the defence of uncertainty from becoming a defence of vagueness or avoidance.
- **B.** It changes the topic from institutions to medical ethics.
- **C.** It argues that uncertainty matters only when human health is involved.
- **D.** It provides evidence that doctors make better decisions than managers.

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

- **A.** Preservation inevitably involves value-based choices, so those choices should be made and explained transparently.
- **B.** Digital archives have made traditional museum conservation largely unnecessary.
- **C.** Museums should prioritise socially useful objects over aesthetically valuable ones.
- **D.** Objects are best preserved by allowing them to continue changing without restriction.

2. **R-C1-002-Q2 — implicit_meaning (difficulty 5/5)**

What does the writer mean by saying digital preservation can 'resemble loss at a different scale'?

- **A.** Digital copies gradually become less accurate than physical originals as storage systems are updated.
- **B.** Large digital collections eventually force institutions to remove the physical objects they document.
- **C.** Material can survive but become practically unusable if it cannot be organised or found.
- **D.** People tend to value archived material less when many identical digital copies are available.

3. **R-C1-002-Q3 — rhetorical_purpose (difficulty 5/5)**

Why does the writer ask 'which earlier state?' when discussing restoration?

- **A.** to argue that later additions should normally be removed from historically important objects
- **B.** to challenge the idea that an object has one obvious authentic past to restore
- **C.** to show that modern buildings present fewer questions of authenticity than older ones
- **D.** to suggest that restorers rarely have enough evidence to identify an object's age accurately

4. **R-C1-002-Q4 — nuanced_stance (difficulty 4/5)**

Which statement would the writer most likely support?

- **A.** The best conservation policy is always to maintain an object's original physical materials.
- **B.** Conservation decisions become more defensible when institutions acknowledge the values and trade-offs behind them.
- **C.** Present-day values should determine preservation priorities without reference to historical evidence.
- **D.** Because preservation is selective, attempts to conserve the past are ultimately pointless.

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

- **A.** They are more reliable than aggregate evidence when a policy has significant human consequences.
- **B.** They should be excluded from serious public reasoning because emotional force inevitably distorts judgement.
- **C.** They are useful primarily as communication devices after quantitative analysis has established the truth.
- **D.** They are cognitively and analytically valuable, but their evidential role must be distinguished from claims about prevalence.

2. **R-C2-001-Q2 — subtle_implication (difficulty 5/5)**

Why does the writer describe statistical reality as 'narratively disappointing'?

- **A.** Statistical findings usually contradict the stories researchers expected to discover.
- **B.** Typical patterns often lack the dramatic structure that makes exceptional cases memorable and shareable.
- **C.** Members of the public dislike statistics because they cannot understand numerical information.
- **D.** Researchers deliberately remove unusual observations so that their results appear less dramatic.

3. **R-C2-001-Q3 — rhetorical_structure (difficulty 5/5)**

What function does the fourth paragraph serve?

- **A.** It abandons the discussion of evidence and moves to a separate argument about public administration.
- **B.** It demonstrates that qualitative research should replace statistical research in policy decisions.
- **C.** It explains why institutions are more easily persuaded by personal testimony than the public is.
- **D.** It complicates the critique by showing that dismissing lived experience can produce a different epistemic error.

4. **R-C2-001-Q4 — figurative_meaning (difficulty 5/5)**

What is conveyed by the final claim that vividness can 'exempt' an example from questions?

- **A.** Exceptional cases are sometimes removed from datasets before they can be analysed.
- **B.** Audiences are more likely to forget examples that contain too many methodological details.
- **C.** Memorable stories may escape the scrutiny that should normally be applied to evidence.
- **D.** Legal rules often prevent researchers from checking the accuracy of personal stories.

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

- **A.** Translations are most faithful when they reproduce the grammar and syntax of the source language as closely as possible.
- **B.** Translator commentary is necessary whenever a language lacks an exact equivalent for a source expression.
- **C.** Good translation does not always erase linguistic distance; it makes principled choices about what to preserve, transform or make perceptible.
- **D.** The main purpose of literary translation is to introduce foreign works into new cultural debates.

2. **R-C2-002-Q2 — nuanced_inference (difficulty 5/5)**

What does the writer imply by saying that the translator 'allocates' loss?

- **A.** Unavoidable compromises require the translator to decide which features matter most to preserve.
- **B.** Most translation losses result from practical limits imposed by publishers and editors.
- **C.** All translations lose roughly the same amount of meaning, though different details disappear.
- **D.** Translators can calculate how much meaning may be omitted before a reader notices the loss.

3. **R-C2-002-Q3 — analogy_function (difficulty 5/5)**

Why does the writer compare translation to musical performance?

- **A.** to show that interpretive variation can coexist with recognisable fidelity to a shared source
- **B.** to suggest that translating literature requires the same training as performing music
- **C.** to demonstrate that readers should compare several translations simultaneously
- **D.** to argue that translators should reproduce the sound of the original more than its meaning

4. **R-C2-002-Q4 — subtle_implication (difficulty 5/5)**

What is the 'fantasy that nothing has crossed a boundary'?

- **A.** the belief that literature can influence readers outside the culture in which it was written
- **B.** the illusion that a translated text can reach the reader without visible interpretive mediation
- **C.** the idea that translators should avoid explaining cultural references in notes
- **D.** the assumption that authors expect their work to be translated into other languages

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

Why does Lucas mention that it is hot?

- **A.** to explain why he is at school
- **B.** to ask Sofia to arrive after four
- **C.** to say the game may be cancelled
- **D.** to explain why Sofia should bring water

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

- **A.** to acknowledge a disadvantage before giving her overall positive view
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
- **C.** to reduce queues and the amount of cash handled by sellers
- **D.** to encourage visitors to buy tickets online

2. **L-B1-002-Q2 — detail (difficulty 3/5)**

What worried some visitors?

- **A.** They had to buy the wristband before arriving.
- **B.** The wristband could not be used at food stalls.
- **C.** They might have money left on the wristband after the festival.
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

- **A.** work time being divided into many short, interrupted periods
- **B.** different time zones making meetings impossible to schedule
- **C.** staff spending too much time working alone
- **D.** employees refusing to attend necessary client meetings

2. **L-B2-001-Q2 — speaker_attitude (difficulty 4/5)**

How does the manager respond to the claim that productivity increased?

- **A.** negatively, because staff surveys show no improvement
- **B.** enthusiastically, because company data clearly prove it
- **C.** cautiously, because the available evidence does not fully measure it
- **D.** confidently, because fewer meetings automatically mean better work

3. **L-B2-001-Q3 — inference (difficulty 4/5)**

What broader behavioural change does the manager value?

- **A.** Employees have started questioning whether some meetings are necessary.
- **B.** Teams in different time zones communicate less often.
- **C.** Employees are now willing to work on Wednesday evenings.
- **D.** Clients have stopped requesting urgent meetings.

4. **L-B2-001-Q4 — figurative_meaning (difficulty 5/5)**

What does the manager mean by 'move congestion from one part of the calendar to another'?

- **A.** Client meetings should be moved to another week rather than another day.
- **B.** Teams should spread meetings across different office locations.
- **C.** The policy should not simply cause meetings to be crowded into Wednesday morning.
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
- **D.** Ecological benefits must be balanced against practical needs such as safety and access.

3. **L-B2-002-Q3 — detail (difficulty 3/5)**

What happened after one park installed explanatory signs?

- **A.** All fallen trees were moved away from paths.
- **B.** Visitors asked for more lawns to be removed.
- **C.** Managers stopped receiving questions about access.
- **D.** The number of complaints decreased significantly.

4. **L-B2-002-Q4 — speaker_intention (difficulty 5/5)**

Why does Priya say 'signs aren't magic'?

- **A.** to argue that signs are too expensive for most city parks
- **B.** to stress that information alone cannot replace listening to legitimate concerns
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

- **A.** They are useful when combined with context and other evidence, but not as direct measures of collaboration.
- **B.** They are more reliable than managerial judgement because they reduce subjective interpretation.
- **C.** They are useful mainly for identifying employees who deliberately manipulate performance systems.
- **D.** They should be abandoned because numerical measures inevitably distort how employees collaborate.

2. **L-C1-001-Q2 — implicit_meaning (difficulty 5/5)**

What does Wu mean when she says a measure can become 'a target'?

- **A.** People may alter their behaviour to improve the measured indicator rather than the underlying outcome.
- **B.** Employees may refuse to collaborate if they know their activity is being recorded.
- **C.** Managers may set an official minimum number of meetings for every employee.
- **D.** A metric becomes useful only after the organisation publishes a numerical goal.

3. **L-C1-001-Q3 — argument_structure (difficulty 5/5)**

Why does Wu give the example of a team member brought in only at the end to fix problems?

- **A.** to demonstrate that late-stage problem solving is the most valuable type of team contribution
- **B.** to prove that qualitative evidence is unnecessary when communication logs are available
- **C.** to argue that employees should be included in every meeting from the beginning of a project
- **D.** to show that activity data can sometimes reveal an important collaboration pattern when interpreted carefully

4. **L-C1-001-Q4 — speaker_attitude (difficulty 4/5)**

How does Wu characterize managerial judgement at the end?

- **A.** as useful only when a team has no measurable objectives
- **B.** as unreliable because managers rarely agree with one another
- **C.** as an outdated practice that should eventually be automated
- **D.** as necessary but less comfortably measurable than a dashboard

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
- **B.** An average may describe a population without corresponding to any real person's full set of characteristics.
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
- **C.** It should identify and reduce unnecessary exclusion without pretending all constraints can disappear.
- **D.** It should prioritise users at the statistical extremes over everyone else.

4. **L-C1-002-Q4 — implicit_meaning (difficulty 5/5)**

What changes when exclusion becomes 'a decision you can examine'?

- **A.** Users become legally responsible for choosing products that suit their needs.
- **B.** Designers can justify, question or revise a limitation instead of treating it as an invisible default.
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

- **A.** Additional factors matter when they change the interpretation or weighting of causes, not simply because they make an account more detailed.
- **B.** Any factor supported by evidence should be included regardless of its effect on the conclusion.
- **C.** Complex explanations are useful only when they contain fewer than a certain number of causes.
- **D.** A single cause is acceptable in public communication but never in historical scholarship.

2. **L-C2-001-Q2 — subtle_implication (difficulty 5/5)**

What does Moretti mean by saying clean explanations are 'portable'?

- **A.** They can be separated from moral judgement more easily than complex explanations can.
- **B.** They are easy to repeat, remember and reuse across simplified forms of public communication.
- **C.** They can be applied accurately to many different historical cases.
- **D.** They remain valid when translated into several languages and cultural contexts.

3. **L-C2-001-Q3 — rhetorical_function (difficulty 5/5)**

Why does Moretti reject simply listing forty causes?

- **A.** Because long lists encourage people to search for heroes and villains.
- **B.** Because explanation requires judging relative importance rather than transferring that judgement to the audience.
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
- **C.** Its meaning is interactional and context-dependent rather than merely the absence of words.
- **D.** Its duration provides the most reliable evidence of what a speaker intends.

2. **L-C2-002-Q2 — subtle_inference (difficulty 5/5)**

Why does Bell compare a pause after an invitation with a pause after a factual question?

- **A.** to suggest that reluctance can only be expressed indirectly through silence
- **B.** to argue that factual questions should be answered immediately in professional settings
- **C.** to demonstrate that invitations produce longer pauses than questions in every language
- **D.** to show that the same observable delay can carry different meanings depending on conversational expectations

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
- **C.** studied
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
- **C.** are have
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
- **B.** more heavy
- **C.** the heavier
- **D.** heavier

3. **LU-A2-003 — grammar (difficulty 2/5)**

There isn't ___ milk left in the fridge.

- **A.** several
- **B.** a few
- **C.** much
- **D.** many

4. **LU-A2-004 — grammar (difficulty 3/5)**

I think it ___ rain later, so take an umbrella.

- **A.** must to
- **B.** is able
- **C.** might
- **D.** has

5. **LU-A2-005 — functional_language (difficulty 2/5)**

A: Could I try this shirt on? B: ___

- **A.** No thanks. I don't need a new shirt.
- **B.** Of course. The changing rooms are over there.
- **C.** Yes, I tried that shirt on yesterday.
- **D.** It was forty pounds when I bought it.

6. **LU-A2-006 — vocabulary (difficulty 2/5)**

The bus was very ___, so we had to stand.

- **A.** available
- **B.** quietly
- **C.** crowded
- **D.** empty

7. **LU-A2-007 — grammar (difficulty 2/5)**

She's going to visit her aunt ___ weekend.

- **A.** on next
- **B.** at next
- **C.** the next to
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

- **A.** I don't apologise.
- **B.** That's all right.
- **C.** It's at eight o'clock.
- **D.** You are late yesterday.

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
- **B.** didn't finish
- **C.** wasn't finishing
- **D.** don't finish

2. **LU-B1-002 — grammar (difficulty 3/5)**

If the weather ___ good tomorrow, we'll have lunch outside.

- **A.** would be
- **B.** will be
- **C.** was
- **D.** is

3. **LU-B1-003 — grammar (difficulty 3/5)**

The new sports centre ___ last year.

- **A.** was opened
- **B.** has opening
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
- **C.** take up
- **D.** create up

6. **LU-B1-006 — phrasal_verbs (difficulty 3/5)**

I didn't know the answer, so I ___ it up online.

- **A.** made
- **B.** turned
- **C.** looked
- **D.** put

7. **LU-B1-007 — grammar (difficulty 3/5)**

That's the teacher ___ helped me prepare for the exam.

- **A.** which
- **B.** whose it
- **C.** who
- **D.** where

8. **LU-B1-008 — functional_language (difficulty 3/5)**

A: Do you mind if I open the window? B: ___

- **A.** Not at all. Go ahead.
- **B.** No, I don't know if it opens.
- **C.** Yes, I open it every day.
- **D.** I'm afraid the window is glass.

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
- **C.** For example of
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
- **B.** lifts
- **C.** increases up
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
- **B.** to hired
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

- **A.** Tell me the new deadline as soon as you can.
- **B.** You'd better let me know the deadline.
- **C.** I want you to confirm when this is due.
- **D.** I would be grateful if you could confirm the revised deadline.

7. **LU-B2-007 — discourse_markers (difficulty 4/5)**

The proposal is expensive. ___, it could reduce maintenance costs in the long term.

- **A.** Whereas of
- **B.** Nevertheless
- **C.** In spite
- **D.** Consequently of

8. **LU-B2-008 — grammar (difficulty 4/5)**

It's about time we ___ a clearer policy on remote work.

- **A.** will introduce
- **B.** introduced
- **C.** introduce
- **D.** have introduce

9. **LU-B2-009 — collocation (difficulty 4/5)**

The researchers were unable to ___ a firm conclusion from the limited data.

- **A.** extract out
- **B.** make up
- **C.** draw
- **D.** pull

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
- **D.** did we have seen

3. **LU-C1-003 — collocation (difficulty 5/5)**

The new evidence ___ doubt on the assumption that the two events were connected.

- **A.** gives out
- **B.** places over
- **C.** throws up
- **D.** casts

4. **LU-C1-004 — register (difficulty 5/5)**

Which wording is most appropriately cautious for an academic report?

- **A.** We know for a fact that no other explanation works.
- **B.** Obviously, this interpretation is the only sensible one.
- **C.** The findings appear to support this interpretation, although alternative explanations cannot be excluded.
- **D.** The findings definitely prove that this interpretation is correct.

5. **LU-C1-005 — lexical_precision (difficulty 5/5)**

The policy was intended as a temporary measure, but it gradually became ___ in everyday practice.

- **A.** entrenched
- **B.** buried
- **C.** settled down
- **D.** installed

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
- **C.** makes up
- **D.** opens

10. **LU-C1-010 — lexical_precision (difficulty 5/5)**

The speaker deliberately ___ the difference between correlation and causation, which weakened the argument.

- **A.** softened up
- **B.** melted
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
- **C.** narrows down completely
- **D.** interrupts

2. **LU-C2-002 — idiomatic_control (difficulty 5/5)**

Her criticism was ___ by praise for the team's earlier work, making the overall judgement deliberately measured.

- **A.** boiled
- **B.** frozen
- **C.** tempered
- **D.** diluted out

3. **LU-C2-003 — register (difficulty 5/5)**

A colleague writes: "The evidence proves the actors intended this outcome." You think intention is possible but not established. Which revision best preserves that distinction?

- **A.** The actors did not intend this outcome, despite what the evidence suggests.
- **B.** There is no evidence at all that could support an interpretation of intention.
- **C.** The evidence is consistent with that interpretation, but it does not establish the actors' intention.
- **D.** The evidence proves the actors probably intended this outcome.

4. **LU-C2-004 — lexical_precision (difficulty 5/5)**

The distinction may seem ___, but it has significant consequences for how the law is applied.

- **A.** thin-haired
- **B.** split-haired
- **C.** hair-cutting
- **D.** hair-splitting

5. **LU-C2-005 — collocation (difficulty 5/5)**

The later chapters ___ the earlier claim by introducing evidence that the author initially set aside.

- **A.** disturb up
- **B.** complicate
- **C.** confuse against
- **D.** make difficult

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
- **B.** Before continuing, you need to demonstrate that the assumption is correct.
- **C.** That assumption appears unsupported by the evidence presented so far.
- **D.** Could we pause there? I am not persuaded by that assumption.

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
**Target:** 40–60 words  
**Primary evidence:** basic information; intelligibility; simple linking

You are staying with a host family. Write a short message to your host parent. Say:
- where you are;
- who you are with;
- what time you will return home.

### W-A1-002 — basic_description
**Topic:** daily_life  
**Audience:** general  
**Target:** 40–60 words  
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
**Target:** 60–100 words  
**Primary evidence:** functional completion; simple connected text; appropriacy

Your friend wants to visit you this weekend. Write an email:
- suggest one activity;
- say where you can meet;
- explain what your friend should bring;
- ask one question about the visit.

### W-A2-002 — simple_narrative
**Topic:** daily_life  
**Audience:** general  
**Target:** 60–100 words  
**Primary evidence:** past narration; sequence; basic evaluation

Write about a day when your plans changed. Explain:
- what you planned to do;
- what happened;
- what you did instead;
- how you felt about the change.

---
## B1 — Independent User — Threshold

### W-B1-001 — informal_email
**Topic:** relationships  
**Audience:** general  
**Target:** 120–160 words  
**Primary evidence:** connected advice; justification; functional organisation

A friend is thinking about starting a new hobby but says they have very little free time. Write an email in which you:
- recommend a hobby;
- explain why it could suit them;
- describe one possible difficulty;
- suggest how they could get started.

### W-B1-002 — opinion_article
**Topic:** education  
**Audience:** teen_adult  
**Target:** 120–160 words  
**Primary evidence:** opinion; reasons; examples; connected discourse

Your school or workplace website is collecting short articles on the question:

**Is it better to learn something new alone or with other people?**

Write an article giving your opinion. Include reasons and at least one example.

---
## B2 — Independent User — Vantage

### W-B2-001 — argumentative_essay
**Topic:** education  
**Audience:** teen_adult  
**Target:** 180–250 words  
**Primary evidence:** balanced argument; development; conclusion; register

Some people think schools should reduce the amount of homework and give students more time for independent projects.

Write an essay discussing the advantages and disadvantages of this change and give your own conclusion.

### W-B2-002 — formal_email
**Topic:** education  
**Audience:** adult  
**Target:** 180–250 words  
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
**Target:** 250–350 words  
**Primary evidence:** structured proposal; qualification; feasibility; register

A community organisation wants to increase participation in local cultural activities but has a limited budget.

Write a proposal that:
- identifies two barriers to participation;
- recommends practical measures;
- considers possible limitations of your recommendations;
- explains how success could be evaluated.

### W-C1-002 — argumentative_essay
**Topic:** education  
**Audience:** adult  
**Target:** 250–350 words  
**Primary evidence:** complex argument; counterargument; lexical precision; cohesion

“When information is easy to access, knowing facts becomes less important than knowing how to evaluate them.”

Write an essay examining this claim. Develop a clear position while acknowledging relevant counterarguments.

---
## C2 — Proficient User — Mastery

### W-C2-001 — critical_synthesis
**Topic:** technology  
**Audience:** adult  
**Target:** 300–450 words  
**Primary evidence:** synthesis; nuance; policy register; trade-off management

A public institution is considering replacing some face-to-face services with automated digital systems. Write a critical briefing for senior decision-makers.

Your briefing should:
- distinguish efficiency gains from changes in service quality;
- consider users for whom automation may create new barriers;
- examine at least one trade-off rather than presenting a simple pro/anti position;
- recommend principles that should guide implementation.

### W-C2-002 — analytical_essay
**Topic:** society  
**Audience:** adult  
**Target:** 300–450 words  
**Primary evidence:** conceptual precision; nuanced argument; stylistic control

“A perfectly clear explanation is not always the most accurate explanation.”

Write an analytical essay exploring this proposition. You may draw on examples from science, education, public communication, professional life or another relevant field. Your response should distinguish productive complexity from unnecessary obscurity.

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
**Target duration:** 2 minutes  
**Primary evidence:** sustained evaluation; comparison; consequences

A city wants to reduce car use in the centre. It is considering better public transport, higher parking fees and more cycle lanes. Explain which measures are likely to be most effective and what problems they might create.

### SP-B2-002 — abstract_long_turn
**Topic:** technology  
**Audience:** teen_adult  
**Target duration:** 2 minutes  
**Primary evidence:** argument; qualification; examples

Do online recommendations—such as suggested videos, music or products—help people discover more, or do they narrow people's choices? Develop your view.

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

Public communication often simplifies complex information. Discuss when simplification is useful and when it becomes misleading.

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

The assessor asks the learner about name, home, family, likes and daily routine, then asks one simple follow-up based on each answer.

### SI-A1-002 — simple_role_play
**Topic:** daily_life  
**Audience:** general  
**Suggested duration:** 2–3 minutes  
**Primary evidence:** basic transactional exchange; repair with support

The learner is buying a drink and a snack at a café. The assessor is the server. The learner must ask for two items, respond to one availability problem and ask the price.

---
## A2 — Basic User — Waystage

### SI-A2-001 — role_play
**Topic:** education  
**Audience:** general  
**Suggested duration:** 3–4 minutes  
**Primary evidence:** routine information exchange; choosing; clarification

The learner wants to join a local class. The assessor works at the centre. The learner must ask about days, time, price and what to bring, then choose between two available class times.

### SI-A2-002 — planning_task
**Topic:** daily_life  
**Audience:** general  
**Suggested duration:** 3–4 minutes  
**Primary evidence:** suggestions; simple agreement/disagreement; decision

The learner and assessor are planning a simple Saturday outing. They have three options: park picnic, cinema, or city museum. They should discuss time, cost and weather and agree on one plan.

---
## B1 — Independent User — Threshold

### SI-B1-001 — collaborative_decision
**Topic:** travel  
**Audience:** general  
**Suggested duration:** 4–5 minutes  
**Primary evidence:** independent interaction; reasons; negotiation

The learner and assessor have one afternoon to show a visiting student around town. They must compare four activities, consider the visitor's interests and budget, and agree on two activities.

### SI-B1-002 — problem_solving
**Topic:** education  
**Audience:** teen_adult  
**Suggested duration:** 4–5 minutes  
**Primary evidence:** hypothesising; responding; joint decision

A class or team event has low attendance. The learner and assessor discuss possible reasons and choose two realistic changes to improve participation.

---
## B2 — Independent User — Vantage

### SI-B2-001 — collaborative_decision
**Topic:** education  
**Audience:** teen_adult  
**Suggested duration:** 5–6 minutes  
**Primary evidence:** spontaneous negotiation; sustained justification; turn management

A school has funding for only one improvement: a quiet study area, upgraded sports facilities, a media lab, or more student clubs. Compare the options, challenge each other's priorities and reach a decision.

### SI-B2-002 — problem_solving
**Topic:** work  
**Audience:** adult  
**Suggested duration:** 5–6 minutes  
**Primary evidence:** argument response; trade-offs; collaborative solution

A small company wants to reduce unnecessary meetings without harming communication. The learner and assessor evaluate four proposals and agree on a policy.

---
## C1 — Proficient User — Effective Operational Proficiency

### SI-C1-001 — advanced_discussion
**Topic:** society  
**Audience:** adult  
**Suggested duration:** 6–8 minutes  
**Primary evidence:** strategic turn-taking; register; compromise; complex argument

A city is considering restricting short-term tourist rentals in residential areas. The learner and assessor represent different stakeholder perspectives and must negotiate a recommendation that recognises competing interests.

### SI-C1-002 — advanced_discussion
**Topic:** technology  
**Audience:** adult  
**Suggested duration:** 6–8 minutes  
**Primary evidence:** abstract interaction; reformulation; qualification; synthesis

An organisation wants to use AI-generated summaries for internal reports. Discuss benefits, epistemic risks, accountability and practical safeguards, then formulate a joint recommendation.

---
## C2 — Proficient User — Mastery

### SI-C2-001 — high_level_negotiation
**Topic:** society  
**Audience:** adult  
**Suggested duration:** 7–9 minutes  
**Primary evidence:** nuanced disagreement; assumption testing; precise compromise

A public institution must decide whether to publish an uncertain forecast that could influence public behaviour. The learner and assessor defend different initial positions, interrogate each other's assumptions and negotiate principles for publication.

### SI-C2-002 — high_level_discussion
**Topic:** education  
**Audience:** adult  
**Suggested duration:** 7–9 minutes  
**Primary evidence:** conceptual interaction; subtle stance; collaborative synthesis

A university is debating whether intellectual disagreement should be actively preserved in committee decisions rather than resolved into a single consensus statement. Explore the implications for clarity, accountability and minority positions, and reach a qualified joint position.

---
# 10. Mediation Task Bank

Mediation deve avaliar a capacidade de selecionar, processar, sintetizar, explicar ou reformular informação para outra pessoa ou público. A resposta não deve ser julgada como tradução palavra por palavra.


## A1 — Basic User — Breakthrough

### M-A1-001 — relay_specific_information
**Topic:** daily_life  
**Audience:** general  
**Target:** 30–45 seconds  
**Primary evidence:** selection and accurate relay of basic information

Source card:
**Community Pool**
Monday–Friday: 7:00–20:00
Saturday: 8:00–14:00
Sunday: closed
Adult ticket: R$12
Child ticket: R$6

Your English-speaking friend asks when the pool is open on Saturday and how much one adult and one child will pay. Give them the information in English.

---
## A2 — Basic User — Waystage

### M-A2-001 — relay_and_explain
**Topic:** education  
**Audience:** general  
**Target:** 45–75 seconds  
**Primary evidence:** selection; simple cross-linguistic relay; clarity

Read this Portuguese note:

**A aula de fotografia de sábado foi transferida das 9h para as 10h30 porque o professor chegará mais tarde. Os alunos devem levar o celular ou uma câmera e encontrar o grupo na entrada principal.**

Explain the change and the practical instructions to an English-speaking classmate who does not read Portuguese.

---
## B1 — Independent User — Threshold

### M-B1-001 — summary_for_audience
**Topic:** culture  
**Audience:** general  
**Target:** 1–2 minutes  
**Primary evidence:** processing text; prioritisation; accessible summary

You have read two short comments about a local book club:

**Comment 1:** Meetings are friendly and discussions are interesting, but the group chooses books that are too long for people with busy schedules.

**Comment 2:** The monthly meeting works well, but new members sometimes feel uncomfortable because the same few people speak most of the time.

Explain to the club organiser the two main problems and suggest what information from the comments is most important to act on.

---
## B2 — Independent User — Vantage

### M-B2-001 — synthesis
**Topic:** work  
**Audience:** adult  
**Target:** 2–3 minutes  
**Primary evidence:** synthesis; comparison; audience adaptation; trade-offs

Two teams tested different ways to reduce email overload.

**Team A:** introduced a rule that internal emails should be answered only twice a day. Staff reported better concentration, but urgent requests were sometimes missed.

**Team B:** kept email open but required subject labels such as URGENT, ACTION and INFORMATION. Urgent communication improved, but employees complained that too many messages were labelled URGENT.

Brief a manager on what the two trials suggest. Do not simply repeat each source; synthesise the trade-offs and identify one question the manager should consider before choosing a policy.

---
## C1 — Proficient User — Effective Operational Proficiency

### M-C1-001 — complex_reformulation
**Topic:** work  
**Audience:** adult  
**Target:** 2–3 minutes  
**Primary evidence:** precise reformulation; preserving qualification; audience adaptation

A technical report states:

'The observed association between flexible scheduling and lower staff turnover remains statistically significant after adjustment for department and tenure. However, the observational design does not establish causality, and unmeasured differences between employees who use flexible schedules and those who do not may partly account for the result.'

Explain this finding to a non-specialist manager. Preserve the uncertainty and explain what the report does **not** justify concluding.

---
## C2 — Proficient User — Mastery

### M-C2-001 — multi_source_critical_synthesis
**Topic:** society  
**Audience:** adult  
**Target:** 3–4 minutes  
**Primary evidence:** multi-source integration; nuance preservation; conceptual reframing

Source A argues that public institutions should release preliminary data quickly because delayed information can allow rumours to dominate.

Source B argues that preliminary figures are often revised and can acquire unjustified authority once widely reported.

Source C proposes releasing provisional data only when uncertainty, revision history and decision relevance can be communicated alongside the figures.

Prepare a concise briefing for senior officials that reconstructs the underlying disagreement, distinguishes the values at stake, and proposes a decision principle rather than merely choosing one source.

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

- **A.** buy paper from Ms Green
- **B.** come one hour early
- **C.** tell Ms Green before Tuesday
- **D.** bring a friend from another school

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A1-003-Q1` | **B** | specific_information | 2/5 |
| `R-A1-003-Q2` | **D** | specific_information | 2/5 |
| `R-A1-003-Q3` | **A** | basic_gist | 2/5 |
| `R-A1-003-Q4` | **C** | specific_information | 3/5 |

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

- **A.** arrive after ten o’clock
- **B.** get off the bus at a later stop
- **C.** avoid buying anything except vegetables
- **D.** take a different bus from Leo

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-A2-003-Q1` | **C** | main_idea | 3/5 |
| `R-A2-003-Q2` | **A** | detail | 2/5 |
| `R-A2-003-Q3` | **D** | sequence | 3/5 |
| `R-A2-003-Q4` | **B** | basic_inference | 3/5 |

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

- **A.** why schools should ban phones outside lessons
- **B.** how students learned to use fewer online resources
- **C.** why calculators are more useful than phones
- **D.** how a short classroom experiment affected behaviour

2. **R-B1-003-Q2 — detail (difficulty 3/5)**

How did the teacher respond to students who used phones for class tasks?

- **A.** by allowing everyone to keep phones on desks
- **B.** by giving them alternative tools and materials
- **C.** by cancelling activities that needed calculators
- **D.** by asking parents to buy new equipment

3. **R-B1-003-Q3 — inference (difficulty 4/5)**

What does the writer suggest about the faster group activities?

- **A.** Students understood the work more easily than before.
- **B.** The teacher made the activities much shorter.
- **C.** Fewer small interruptions meant less time was lost.
- **D.** Students stopped talking to one another during tasks.

4. **R-B1-003-Q4 — writer_attitude (difficulty 4/5)**

Which statement best describes the writer’s final view?

- **A.** The experiment was useful without being a complete solution.
- **B.** The experiment should become compulsory in every school.
- **C.** The experiment failed because exceptions were necessary.
- **D.** The experiment permanently changed the writer’s phone use.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-003-Q1` | **D** | main_idea | 3/5 |
| `R-B1-003-Q2` | **B** | detail | 3/5 |
| `R-B1-003-Q3` | **C** | inference | 4/5 |
| `R-B1-003-Q4` | **A** | writer_attitude | 4/5 |

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

- **A.** Publishing salary ranges can improve scrutiny, but it does not by itself guarantee fairness.
- **B.** Salary ranges should replace individual negotiation in all recruitment.
- **C.** Salary transparency mainly benefits employers by reducing interview time.
- **D.** Publishing pay information creates more problems than it solves.

2. **R-B2-003-Q2 — paragraph_function (difficulty 4/5)**

Why does the writer discuss existing employees in the third paragraph?

- **A.** to argue that current staff should always receive the salary offered to new employees
- **B.** to explain why managers prefer recruiting candidates from outside the organisation
- **C.** to show that transparency can reveal internal inconsistencies as well as help applicants
- **D.** to suggest that employees usually misunderstand how salaries are calculated

3. **R-B2-003-Q3 — inference (difficulty 4/5)**

What would the writer most likely say about a range of 30,000–100,000 for an ordinary role?

- **A.** It is useful because it gives employers maximum flexibility.
- **B.** It is fair as long as every applicant sees the same numbers.
- **C.** It prevents applicants from negotiating beyond the published limit.
- **D.** It may technically be transparent while providing little practical guidance.

4. **R-B2-003-Q4 — argument_structure (difficulty 5/5)**

What distinction is central to the final paragraph?

- **A.** between public-sector and private-sector salaries
- **B.** between negotiating salary and negotiating benefits
- **C.** between making decisions visible and making them fair
- **D.** between experienced and inexperienced applicants

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B2-003-Q1` | **A** | writer_stance | 4/5 |
| `R-B2-003-Q2` | **C** | paragraph_function | 4/5 |
| `R-B2-003-Q3` | **D** | inference | 4/5 |
| `R-B2-003-Q4` | **C** | argument_structure | 5/5 |

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

- **A.** Institutions should avoid major decisions until complete evidence is available.
- **B.** Reversible choices can be used deliberately to generate evidence before permanent commitment.
- **C.** Temporary policies are usually fairer than permanent policies.
- **D.** Leaders should make decisions more slowly regardless of their reversibility.

2. **R-C1-003-Q2 — nuanced_inference (difficulty 5/5)**

Why does the author compare exit conditions with scientific hypotheses?

- **A.** to show that willingness to revise a decision can represent disciplined reasoning rather than weakness
- **B.** to argue that public policy should be decided by scientists instead of elected leaders
- **C.** to suggest that experiments in organisations produce objective evidence free from values
- **D.** to prove that reversible decisions have no meaningful social consequences

3. **R-C1-003-Q3 — rhetorical_function (difficulty 5/5)**

What function does the paragraph beginning ‘There is also a communication advantage’ serve?

- **A.** to claim that communication matters more than the eventual policy outcome
- **B.** to reject the idea that evidence can be used in political disagreement
- **C.** to argue that temporary measures should be introduced without consulting affected groups
- **D.** to introduce a practical benefit of trials while acknowledging that evidence choices remain value-laden

4. **R-C1-003-Q4 — author_stance (difficulty 5/5)**

Which view would the author most likely reject?

- **A.** Some decisions require more analysis because they are hard to undo.
- **B.** A pilot can create harms even when it is temporary.
- **C.** Once a leader has publicly committed to a policy, consistency should normally matter more than new evidence.
- **D.** Changing course can be compatible with competent leadership.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C1-003-Q1` | **B** | main_argument | 4/5 |
| `R-C1-003-Q2` | **A** | nuanced_inference | 5/5 |
| `R-C1-003-Q3` | **D** | rhetorical_function | 5/5 |
| `R-C1-003-Q4` | **C** | author_stance | 5/5 |

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

- **A.** Later versions are generally more authentic because they incorporate experience.
- **B.** First versions should be privileged only when no later version survives.
- **C.** Different versions provide different evidence, so chronological priority alone cannot determine authenticity.
- **D.** The concept of authenticity is too subjective to have any useful role in interpretation.

2. **R-C2-003-Q2 — subtle_implication (difficulty 5/5)**

What is implied by the phrase 'an archive’s accidents'?

- **A.** Digital archives are less reliable than physical collections because they contain too much information.
- **B.** Archivists frequently damage early drafts while attempting to preserve them.
- **C.** Creators deliberately hide preliminary versions to increase the value of later ones.
- **D.** Surviving records may make a version appear earliest even when earlier stages have disappeared.

3. **R-C2-003-Q3 — rhetorical_structure (difficulty 5/5)**

Why does the writer discuss both beneficial and harmful revision?

- **A.** to show that the effects of revision must be judged rather than assumed from chronology
- **B.** to argue that artists revise for better reasons than institutions do
- **C.** to demonstrate that early drafts are usually more innovative than finished works
- **D.** to suggest that revision should stop once outside pressure becomes involved

4. **R-C2-003-Q4 — conceptual_inference (difficulty 5/5)**

What does the writer mean by saying that “intention itself moved”?

- **A.** Creators often forget what they originally intended after many revisions.
- **B.** A work’s purpose can develop through making, feedback and revision rather than existing fully formed at the start.
- **C.** Digital version histories allow later editors to replace the creator’s intentions.
- **D.** Intentions become impossible to study once multiple versions of a work exist.

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-C2-003-Q1` | **C** | nuanced_stance | 5/5 |
| `R-C2-003-Q2` | **D** | subtle_implication | 5/5 |
| `R-C2-003-Q3` | **A** | rhetorical_structure | 5/5 |
| `R-C2-003-Q4` | **B** | conceptual_inference | 5/5 |

---


# 22. Additional Listening tasklets


## A1 — Expansion

### L-A1-003 — Platform Change
**Topic:** travel  
**Audience:** general  
**Estimated duration:** 25–30 seconds

#### Script

Attention, please. The 9:20 train to Lakeside will now leave from platform four, not platform two. The train is about ten minutes late. Passengers for Lakeside should use the stairs beside the ticket office. The café on platform four is closed this morning.

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
- **C.** Many younger people were interested in them.
- **D.** They mainly came because tickets were free.

4. **L-B1-003-Q4 — speaker_intention (difficulty 4/5)**

Why did Mia originally decide to volunteer?

- **A.** to get experience for a job in film
- **B.** to receive free cinema tickets
- **C.** to meet students from the town
- **D.** to help restore something she felt the town had lost

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
- **C.** Removing daily fines appears to have benefits, though the policy should continue to be evaluated.
- **D.** The new system has clearly made books return faster in every neighbourhood.

2. **L-B2-003-Q2 — detail (difficulty 3/5)**

What happens when an item becomes very late under the new system?

- **A.** The borrower receives a larger daily fine.
- **B.** The library automatically charges the cost of a new copy.
- **C.** The borrower loses access to reminder messages.
- **D.** The borrower cannot borrow more until the issue is resolved.

3. **L-B2-003-Q3 — inference (difficulty 4/5)**

Why might some long-overdue books have been returned after fines were removed?

- **A.** Borrowers were offered cash for returning old books.
- **B.** People may have felt more comfortable returning items once growing debts disappeared.
- **C.** The library shortened all loan periods at the same time.
- **D.** Books from poorer areas were collected directly from homes.

4. **L-B2-003-Q4 — argument (difficulty 5/5)**

What assumption does Daniel question at the end?

- **A.** that a daily financial penalty necessarily encourages the desired return behaviour
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

- **A.** whether predictive text influences formulation while ideas are still being expressed
- **B.** whether predictive systems contain more spelling errors than dictionaries
- **C.** whether people can learn to type without any automated assistance
- **D.** whether email templates are replacing other forms of workplace communication

2. **L-C1-003-Q2 — nuanced_inference (difficulty 5/5)**

Why does the researcher mention suggestions that users reject?

- **A.** to show that rejected suggestions are stored and used to retrain the system
- **B.** to suggest that merely seeing an option may influence which alternatives feel readily available
- **C.** to argue that prediction fails because most users ignore its recommendations
- **D.** to show that writers remember rejected phrases better than accepted ones

3. **L-C1-003-Q3 — speaker_attitude (difficulty 5/5)**

How does the researcher view comparisons with dictionaries?

- **A.** They prove predictive text is simply another harmless writing tool.
- **B.** They are irrelevant because dictionaries no longer influence writing.
- **C.** They show that all writing technologies should be evaluated in the same way.
- **D.** They are useful but overlook the continuous and proactive nature of prediction.

4. **L-C1-003-Q4 — implication (difficulty 5/5)**

What does the researcher mean by saying “ease is doing part of the deciding”?

- **A.** Writers become unable to make decisions once prediction is enabled.
- **B.** Predictive systems deliberately choose ideas on behalf of users.
- **C.** Convenient suggestions can subtly shape choices without fully determining them.
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
- **D.** between disagreement that exposes assumptions and disagreement that simply signals unresolved failure

2. **L-C2-003-Q2 — subtle_implication (difficulty 5/5)**

Why does Morris contrast the novice’s single number with the expert’s range?

- **A.** to imply that precise numerical claims are never scientifically useful
- **B.** to argue that novices communicate more effectively with the public
- **C.** to show that recognising conditions and uncertainty can reflect deeper knowledge rather than weaker knowledge
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
- **B.** It changes or develops in response to evidence and failed predictions.
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
- **D.** is go

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

- **A.** I like the bathroom.
- **B.** It was very clean.
- **C.** Yes, I am.
- **D.** It’s next to the kitchen.

15. **LU-A1-015 — grammar (difficulty 2/5)**

We don’t have ___ classes on Sunday.

- **A.** any
- **B.** some of
- **C.** a
- **D.** much of

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
- **C.** have lose
- **D.** was lose

12. **LU-A2-012 — functional_language (difficulty 2/5)**

A: Would you like some more coffee? B: ___

- **A.** I drink it yesterday.
- **B.** It is a coffee cup.
- **C.** No, thanks. I’ve had enough.
- **D.** I would like coffee yesterday.

13. **LU-A2-013 — grammar (difficulty 3/5)**

This is the ___ restaurant in our neighbourhood.

- **A.** more popular
- **B.** popular than
- **C.** most popular than
- **D.** most popular

14. **LU-A2-014 — collocation (difficulty 3/5)**

We had to ___ the bus because the next one was an hour later.

- **A.** catch
- **B.** take up
- **C.** make
- **D.** reach to

15. **LU-A2-015 — grammar (difficulty 3/5)**

You ___ bring a towel; the hotel provides one.

- **A.** mustn’t
- **B.** don’t have to
- **C.** shouldn’t to
- **D.** can’t to

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
- **D.** was start

12. **LU-B1-012 — lexical_choice (difficulty 3/5)**

I didn’t recognise Sam at first because he had ___ his appearance so much.

- **A.** replaced
- **B.** exchanged
- **C.** turned
- **D.** changed

13. **LU-B1-013 — functional_language (difficulty 3/5)**

A: I’m not sure this plan will work. B: ___ Let’s look at the possible problems first.

- **A.** You may have a point.
- **B.** I don’t have a plan.
- **C.** That’s because plans work.
- **D.** You must be sure.

14. **LU-B1-014 — grammar (difficulty 4/5)**

If I ___ about the road closure, I would have left earlier.

- **A.** knew
- **B.** had known
- **C.** would know
- **D.** have known

15. **LU-B1-015 — collocation (difficulty 3/5)**

The course gave me a chance to ___ experience in customer service.

- **A.** win
- **B.** earn out
- **C.** gain
- **D.** collect up

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

Had the organisers known how many people would attend, they ___ a larger venue.

- **A.** would have booked
- **B.** would book
- **C.** had booked
- **D.** booked

13. **LU-B2-013 — collocation (difficulty 4/5)**

The new evidence ___ doubt on the assumption that the two events were unrelated.

- **A.** poses
- **B.** casts
- **C.** places
- **D.** delivers

14. **LU-B2-014 — register (difficulty 4/5)**

Which sentence is most appropriate in a formal report?

- **A.** A very large number of respondents said that they really disliked the revised timetable.
- **B.** Respondents were, like, quite unhappy about the timetable changes introduced this term.
- **C.** A substantial number of respondents expressed dissatisfaction with the revised timetable.
- **D.** Many respondents expressed that the new timetable was basically not working well for them.

15. **LU-B2-015 — discourse_markers (difficulty 4/5)**

The initial results appear promising. ___, the sample is too small for firm conclusions.

- **A.** Likewise
- **B.** Consequently
- **C.** For instance
- **D.** Nevertheless

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
- **C.** indirect
- **D.** restrained

12. **LU-C1-012 — grammar (difficulty 5/5)**

Rarely ___ such a rapid shift in public attitudes within a single year.

- **A.** researchers observe
- **B.** have researchers observed
- **C.** researchers had observed
- **D.** researchers are observing

13. **LU-C1-013 — collocation (difficulty 5/5)**

The author ___ a distinction between legal responsibility and moral responsibility.

- **A.** sets
- **B.** builds
- **C.** draws
- **D.** places

14. **LU-C1-014 — register (difficulty 5/5)**

Which wording most appropriately hedges a claim in an academic discussion?

- **A.** The findings clearly demonstrate that the policy has failed in every relevant respect.
- **B.** The available evidence leaves no reasonable doubt that the policy produces these effects.
- **C.** The results conclusively establish the policy as the only explanation for the observed change.
- **D.** The findings may indicate that the policy has effects not captured by the current model.

15. **LU-C1-015 — lexical_precision (difficulty 5/5)**

The committee’s recommendation was not binding, but it carried considerable ___.

- **A.** weight
- **B.** pressure
- **C.** volume
- **D.** force

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
- **B.** The analysis is terrible and the main distinction makes no sense at all.
- **C.** Obviously, the writer has not understood the subject properly.
- **D.** The analysis totally fails because its distinction is just wrong.

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
**Target length:** 40–60 words

**Prompt:** Write a short message to a classmate. Invite them to study English with you after school. Say where you want to meet, what day and time, and what they should bring.


## A2

### W-A2-003 — informal_email
**Target length:** 60–100 words

**Prompt:** You borrowed a book from a friend and cannot return it on the day you promised. Write an email. Explain why, apologise, and suggest a new day to return it.


## B1

### W-B1-003 — review
**Target length:** 120–160 words

**Prompt:** Write a review of a place in your town that you would recommend to a visitor. Describe the place, explain what is good about it, mention one possible disadvantage, and say who would enjoy it most.


## B2

### W-B2-003 — article
**Target length:** 180–250 words

**Prompt:** Your school or workplace is considering one day each week with no internal email. Write an article discussing possible advantages and disadvantages and give your own recommendation.


## C1

### W-C1-003 — analytical_report
**Target length:** 250–350 words

**Prompt:** A community centre has tested three ways to increase participation: cheaper membership, longer opening hours, and more specialised events. Write a report explaining what evidence should be collected before deciding which measure to keep, and recommend how the centre should evaluate success.


## C2

### W-C2-003 — critical_commentary
**Target length:** 300–450 words

**Prompt:** Write a critical commentary on the claim: “When public communication is simplified, accuracy is inevitably sacrificed.” Distinguish different kinds of simplification, consider circumstances in which simplification may improve understanding, and develop a nuanced conclusion.


# 25. Additional Spoken Production prompts


## A1

### SP-A1-003 — short_turn
**Target speaking time:** 30–45 seconds

**Prompt:** Talk about your room or another room you use often. Say what is in it, where two or three things are, and what you usually do there.


## A2

### SP-A2-003 — simple_description
**Target speaking time:** 45–60 seconds

**Prompt:** Describe a weekend you enjoyed. Say where you went, who you were with, what you did, and why you enjoyed it.


## B1

### SP-B1-003 — opinion_long_turn
**Target speaking time:** 1–2 minutes

**Prompt:** Some people prefer learning a new skill alone; others prefer learning with a teacher or group. Compare the two approaches and explain which works better for you.


## B2

### SP-B2-003 — argument_long_turn
**Target speaking time:** 2 minutes

**Prompt:** Should schools and workplaces create periods when notifications are automatically silenced? Discuss possible benefits and disadvantages and give a reasoned position.


## C1

### SP-C1-003 — advanced_long_turn
**Target speaking time:** 2–3 minutes

**Prompt:** To what extent should organisations favour policies that can be reversed and tested over policies designed as permanent solutions from the start? Develop and qualify your position.


## C2

### SP-C2-003 — advanced_analytical_turn
**Target speaking time:** 2–3 minutes

**Prompt:** Discuss whether transparency always increases trust. Consider how too much, too little or poorly contextualised information can affect credibility, and distinguish transparency from accountability.


# 26. Additional Spoken Interaction tasks


## A1

### SI-A1-003 — guided_role_play

**Task:** You are at a café. Ask the teacher/examiner for a drink and a snack, ask the price, and respond when one item is not available.


## A2

### SI-A2-003 — planning_task

**Task:** You and the examiner want to meet a friend this weekend. Discuss two possible times and two possible places, explain one problem, and agree on a plan.


## B1

### SI-B1-003 — collaborative_decision

**Task:** Your class has money for one end-of-term activity: a picnic, a cinema visit, a sports afternoon or a workshop. Discuss the options, consider practical problems, and reach a decision.


## B2

### SI-B2-003 — collaborative_problem_solving

**Task:** A small company wants to reduce interruptions during the workday. Consider four options: quiet hours, fewer meetings, message-response windows, or optional remote-work blocks. Discuss likely consequences and agree on a recommendation.


## C1

### SI-C1-003 — advanced_discussion

**Task:** A city wants to test a controversial transport change for six months before deciding whether to make it permanent. Discuss what evidence should count, what safeguards are needed, and what conditions should trigger continuation, revision or cancellation.


## C2

### SI-C2-003 — high_level_negotiation

**Task:** A public institution must publish information about an uncertain risk. Negotiate a communication strategy that is transparent about uncertainty without either alarming the public unnecessarily or creating false reassurance. Challenge and refine each other’s proposals.


# 27. Additional Mediation tasks


## A1

### M-A1-002 — relay_specific_information

**Source card**

COMMUNITY SPORTS DAY  
Saturday — 10:00–14:00  
Sports Hall  
Basketball: 10:30  
Family games: 12:00  
Entry: free  
Please bring water.

**Task:** Your English-speaking friend wants to go. Tell them when and where the event is, name one activity, and say what they should bring.


## A2

### M-A2-002 — relay_and_explain

**Source notice**

TOWN MUSEUM — FRIDAY VISITS  
Entry is free from 4:00 p.m. on Fridays.  
Last entry: 5:30 p.m.  
Large bags must be left in the lockers near reception.  
Guided tour: 4:30 p.m. — £3 per person.  
The museum closes at 6:00 p.m.

**Task:** Your friend finishes work at 4:15 and wants to visit as cheaply as possible. Explain the practical information they need, including the latest time they can enter and what they must do with a large bag.


## B1

### M-B1-002 — summary_for_audience

**Source: Homework Club notice**

The Homework Club is open Monday to Thursday from 3:30 to 5:30 p.m. Students may stay for as little as 30 minutes or for the full two hours. An English teacher is available on Mondays and Wednesdays. Mathematics support is offered on Mondays and Thursdays, while a science teacher attends on Tuesdays and Thursdays. Students do not need to book a normal study place. However, there are only twelve computers, so anyone who needs a computer must reserve one online before 2:00 p.m. on the same day. Printing is available, but students should bring their own paper. The club is held in the Learning Centre on the first floor. Students who need help with a particular assignment should bring the task instructions with them.

**Task:** Your classmate needs help with a science assignment and must use a computer. Summarise only the information that is most relevant to them and explain what they need to do before attending.


## B2

### M-B2-002 — synthesis

**Source A — Review of the city bike-sharing scheme**

The scheme has made short trips across the centre much cheaper than taxis, and I can usually find a bike near the main shopping streets. The app is straightforward, and the first thirty minutes cost very little. My main complaint is maintenance. I have reported loose brakes twice this month, and on one occasion three bikes at the same station were unavailable because of faults. Expanding the fleet will not help if existing bikes are not checked more consistently.

**Source B — Community transport blog**

Bike maintenance has improved noticeably since the operator introduced weekly inspections. The bigger problem is where the stations are located. Central and high-income neighbourhoods have dense coverage, while several outer districts have only one or two stations, sometimes far from major bus stops. A system promoted as city-wide should not require residents in some areas to travel twenty minutes just to reach a bike.

**Task:** Brief a community group. Explain where the two sources agree or complement each other, where their emphasis differs, and identify one issue that the city should investigate before deciding whether the scheme is working fairly and effectively.


## C1

### M-C1-002 — complex_reformulation

**Source: Technical summary of a flexible-work pilot**

A six-month flexible-work pilot was introduced in four departments. Employees were allowed to shift their start and finish times by up to two hours, provided that each team maintained core availability between 10:00 and 15:00. Self-reported job satisfaction increased in all four departments, with the largest increase among employees who had caring responsibilities or long commutes. Staff turnover during the pilot was lower than during the same six-month period in the previous year.

Productivity results were less consistent. Two departments recorded a modest increase in completed tasks, one showed no meaningful change, and one recorded a small decline. The measures used were not identical across departments, so direct comparison is limited. Managers also reported that scheduling meetings became more complicated in teams where employees selected very different working hours.

The pilot was observational rather than randomly assigned. Employees who made the greatest use of flexible hours may therefore differ from other employees in ways not measured by the evaluation. Seasonal workload also varied between the comparison periods. The findings support further testing, but they do not establish that flexible scheduling caused the changes in satisfaction, turnover or productivity.

**Task:** Explain the findings to employees in clear, non-technical English. Preserve the uncertainty, distinguish the stronger findings from the weaker ones, and avoid reducing the report to a simple “success” or “failure” conclusion.


## C2

### M-C2-002 — multi_source_synthesis

**Source A — Regulator**

People affected by automated decisions should be able to see how public institutions use algorithmic systems. Disclosure can deter careless design and make it possible for journalists, researchers and citizens to question decisions that would otherwise appear neutral. Transparency should therefore be the default, with secrecy justified only where disclosure would create a specific and substantial risk.

**Source B — Systems engineer**

Publishing source code can create the appearance of transparency without producing understanding. Modern systems may depend on training data, configuration choices, thresholds and operational procedures that cannot be inferred from code alone. A technically accurate disclosure can therefore mislead non-specialists into believing the system is more interpretable than it is. Explanations should focus on decision pathways, limitations and tested behaviour rather than assuming that more raw technical material always means more accountability.

**Source C — Civil-rights organisation**

The central question is not whether an institution can describe its system but whether a person can challenge a harmful decision. Individuals need meaningful reasons, accessible appeal procedures and review by bodies independent of the organisation deploying the technology. Transparency can support these safeguards, but disclosure without contestability may simply reveal a process that affected people remain powerless to change.

**Task:** Brief a decision-making panel. Reconstruct the underlying disagreement without flattening the three positions. Distinguish transparency, interpretability and accountability, identify the main assumption behind each source, and propose principles the panel could use when deciding what information and safeguards to require.


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
