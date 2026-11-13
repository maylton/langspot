# LangSpot CEFR Pilot Bank v0.1

**Documento:** Banco Piloto de Itens para o Sistema de Avaliação do LangSpot  
**Versão:** 0.1  
**Framework:** CEFR/QECR — A1 a C2  
**Finalidade:** pilotagem, revisão vertical, coleta inicial de dados e preparação do banco MVP  
**Status de QA:** **VALIDADO INTERNAMENTE PARA PILOTAGEM**  
**Importante:** esta versão passou por revisão estrutural, linguística e pedagógica interna, mas **ainda não é psicometricamente calibrada**. Classificações CEFR operacionais só devem ganhar maior força após pilotagem com estudantes, análise dos itens, revisão de cut scores e standard setting.

---

## 1. Escopo do Pilot Bank

O banco segue a proposta aprovada para o `Pilot Bank v0.1`:

| Área | Quantidade por nível | Total |
|---|---:|---:|
| Reading | 2 tasklets × 4 itens = 8 | **48 itens** |
| Listening | 2 tasklets × 4 itens = 8 | **48 itens** |
| Language Use | 10 itens | **60 itens** |
| Writing | 2 prompts | **12 prompts** |
| Spoken Production | 2 prompts | **12 prompts** |
| Spoken Interaction | 2 tasks | **12 tasks** |
| Mediation | 1 task | **6 tasks** |
| **Total de unidades avaliativas** |  | **198** |

O banco foi criado verticalmente, de A1 a C2, para permitir comparação direta entre níveis.

---

# 2. Política de alternativas e prevenção de padrões

As questões objetivas usam quatro alternativas (`A–D`). A chave desta versão foi deliberadamente auditada para evitar pistas não relacionadas à proficiência.

### Regras aplicadas

- distribuição global equilibrada de chaves;
- distribuição equilibrada dentro de Reading e Listening;
- distribuição quase uniforme dentro de cada bloco de 10 itens de Language Use;
- nenhuma sequência de três respostas corretas com a mesma letra;
- nenhuma repetição idêntica de sequência de quatro letras na chave global;
- nenhuma repetição idêntica de sequência de cinco letras na chave global;
- nenhuma sequência deliberada do tipo `ABCD / DCBA`;
- distractors semanticamente plausíveis;
- ausência de alternativas do tipo “all of the above”;
- revisão de comprimento das alternativas para evitar que a correta seja sistematicamente a mais longa;
- quatro opções distintas em todos os itens;
- apenas uma resposta defensável em cada MCQ.

### Distribuição final da chave

| Resposta | Reading | Listening | Language Use | Total |
|:---:|---:|---:|---:|---:|
| A | 12 | 12 | 15 | **39** |
| B | 12 | 12 | 15 | **39** |
| C | 12 | 12 | 15 | **39** |
| D | 12 | 12 | 15 | **39** |

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

**198/198 unidades passaram pela revisão interna para uso em pilotagem.**

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

