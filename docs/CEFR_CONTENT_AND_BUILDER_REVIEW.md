# Revisão de conteúdo CEFR e do construtor de avaliações

Data: 2026-11-06
Escopo: Pilot Bank v0.2 (300 unidades), os seis Level Checks (A1–C2), o General CEFR Placement e a página de criação de avaliações.
Fora do escopo: questões que professores criaram direto no banco de produção. Esta revisão leu o repositório (`docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.2.md`, migrations e código do editor).

> Como ler: as seções 1–3 tratam do conteúdo, a seção 4 da página de criação e a seção 5 traz as prioridades. O **Apêndice** traz o veredito de cada uma das 300 unidades.

## Resumo

| | |
|---|---|
| Unidades revisadas | 300 (234 objetivas, 66 produtivas, 36 tasklets) |
| Adequadas | 184 |
| Ajustar | 101 (a maior parte pelo viés de alternativa mais longa) |
| Corrigir | 9 (resposta dupla, duplicatas, sobreposição de tema com o Listening) |
| Rever nível | 6 |

**O que está bem:**
- A progressão de extensão e de complexidade dos textos é coerente com o CEFR.
- Os construtos de A1–A2 seguem os descritores (informação específica, ideia geral, propósito simples).
- O Language Use de A1–B1 está bem calibrado.
- As tarefas de Mediation seguem o Companion Volume, inclusive com fonte em português no A2.
- As salvaguardas dos Level Checks (piso, alvo e teto; sem certificação pelo teto; produtivas sempre revisadas) estão bem desenhadas.

**O que impede usar os resultados com confiança hoje:**

1. **A resposta certa é a alternativa mais longa** em 75–79% dos itens de Reading/Listening do B2 ao C2 (o acaso daria cerca de 25%). Um aluno que nunca lê e só marca a alternativa mais longa acerta 79% no B2 e no C1. Pela regra de decisão (6 de 8), isso já é **“nível demonstrado”**.
2. **Item com duas respostas corretas** (LU-B1-003) e **duplicatas** no Language Use: há três pares no C1, e um mesmo item aparece no B2 e no C1.
3. **Temas repetidos** no B2–C2: produtividade no trabalho, incerteza e especialistas, transparência. Em um caso, o tema do Listening é o mesmo da fala (L-B2-001 × SI-B2-002).
4. **Ritmo de fala único** (~130 palavras/min) do A1 ao C2. É rápido demais para o A1 e lento e “de estúdio” demais para o C2.
5. **Os Level Checks duram de 100 a 145 min** (A1: 75–95 min), mais que uma aula.

## 1. Os textos (input) estão no nível?

Métricas por tasklet: palavras, palavras por frase e índice Flesch–Kincaid (FK). O FK é só um indicador; o julgamento final foi feito pela leitura.

| Nível | Reading (palavras) | Listening (palavras) | FK Reading | Leitura |
|---|---|---|---|---|
| A1 | 28–43 | 34–42 | 2–6 | Avisos e mensagens curtas: adequado. |
| A2 | 104–147 | 82–99 | 5–7 | E-mails e anúncios do dia a dia: adequado. |
| B1 | 238–249 | 176–183 | 9–10 | Artigos pessoais com opinião: adequado (vocabulário pontual de B2). |
| B2 | 303–320 | 202–262 | 12 | Artigos de opinião com posição do autor: adequado. |
| C1 | 503–539 | 278–358 | 12–13 | Ensaios analíticos: adequado. |
| C2 | 746–783 | 483–549 | 12–14 | Ensaios críticos: adequado, mas só um gênero. |

**Pontos de atenção:**
- **L-A1-003 (Platform Change)** é um anúncio público com quatro informações. O descritor de A1 cobre informação concreta, falada devagar; anúncios curtos são descritor de A2. Sugestão: reclassificar como A2 ou simplificar.
- **B1:** os textos estão no nível, mas palavras como *misleading*, *appliances*, *confiscated* e *punctuality* puxam para B1+.
- **C1–C2:** todos os textos são ensaios abstratos sobre epistemologia (incerteza, evidência, expertise, autenticidade). O CEFR em C1/C2 também cobre textos literários, fala coloquial e domínios pessoal e profissional. Isso estreita o construto e favorece alunos com formação acadêmica.
- **Listening:** as durações foram calculadas a ~130 palavras/min em todos os níveis. Ao gravar os áudios, sugiro:

  | Nível | Ritmo sugerido | Observação |
  |---|---|---|
  | A1 | 90–110 wpm | pausas claras |
  | A2 | 110–125 wpm | |
  | B1 | 130–150 wpm | |
  | B2 | 150–170 wpm | |
  | C1–C2 | 170–190 wpm | fala natural, com sobreposição e variação de sotaque |

## 2. As questões estão no nível?

### Construtos por nível

A distribuição de subskills segue a progressão esperada:
- **A1:** 17 de 24 itens são de informação específica.
- **A2:** acrescenta sequência, propósito simples e inferência básica.
- **B1:** detalhe, inferência e intenção do falante.
- **B2 em diante:** posição do autor, função de parágrafo, implicação e estrutura argumentativa.

### O enunciado é mais difícil que o texto (A1–B1)

No A2 e no B1, o FK mediano de enunciado + alternativas (7,5 e 10,7) **fica acima** do FK dos textos (5–7 e 9–10). Na prática, o aluno pode errar por não entender a pergunta, não o texto. Exemplos:
- R-A1-002-Q4: “Which detail can help Ana **recognise** Diego?”. Sugestão: “What is Diego wearing?”.
- R-B1-002-Q4: “to **acknowledge a disadvantage or opposing view**”. Sugestão: “to show that some students do not agree”.
- L-B1-001-Q4: mesma metalinguagem.

Regra prática: o enunciado e as alternativas devem ficar **um nível abaixo** do texto.

### Viés da alternativa mais longa (crítico)

| Nível | Itens R/L | Correta = mais longa | “Marcar a mais longa” acerta |
|---|---|---|---|
| A1 | 24 | 21% | 29% |
| A2 | 24 | 17% | 17% |
| B1 | 24 | 46% | 54% |
| B2 | 24 | **75%** | **79%** |
| C1 | 24 | **79%** | **79%** |
| C2 | 24 | **75%** | **75%** |

Tasklets em que a estratégia acerta 4 de 4: L-B2-001, L-B2-003, R-B2-003, L-C1-001, L-C1-003, R-C1-003 e R-C2-002.

**Por que acontece:** a alternativa certa costuma ser a única “qualificada”, com concessivas e ressalvas (“X is valuable, **but** …”). Os distratores são afirmações absolutas e mais curtas.

**Correção:**
- Igualar a extensão das quatro alternativas (±15%).
- Escrever distratores igualmente qualificados, porém errados.
- Variar a posição da alternativa mais longa.

Isto vem **antes** de qualquer calibração com dados reais: um item com esse viés mede a esperteza do aluno com a prova, não a compreensão.

### Itens com defeito

| Item | Problema |
|---|---|
| **LU-B1-003** | *The new sports centre ___ last year.* A chave é *was opened*, mas *opened* também é correto e natural. **Duas respostas corretas.** |
| **LU-B2-013 = LU-C1-003** | O mesmo item (“The new evidence ___ doubt on the assumption…”, chave *casts*) aparece em dois níveis. |
| **LU-C1-009 = LU-C1-013** | Idênticos (o PR #2 já havia apontado). |
| **LU-C1-002 ≈ LU-C1-012** | A mesma inversão (“Rarely have…”) com o mesmo contexto. |
| **LU-B2-001 ≈ LU-B2-012** | A mesma inversão do 3º condicional. |
| **LU-B2-007 / LU-B2-015** | O mesmo conector como resposta (*Nevertheless*). |
| **LU-C2-008** | As alternativas 3 e 4 também são aceitáveis numa discussão formal; a chave é discutível. |
| **LU-C2-004** | Distratores inexistentes (*thin-haired*, *split-haired*) são eliminados sem nenhum conhecimento. |

Com três pares duplicados, o Language Use do C1 tem na prática 12 construtos, não 15. Como os presets escolhem 10 itens de C1, um mesmo form pode incluir os dois itens de um par.

## 3. As tarefas produtivas estão no nível?

**Os enunciados estão alinhados:**
- A1: informação pessoal.
- A2: descrição e narrativa simples.
- B1: opinião com razões.
- B2: argumentação equilibrada.
- C1: proposta e ressalvas.
- C2: síntese crítica.

As rubricas analíticas (5 dimensões em Writing, 6–7 em Speaking e 6 em Mediation) também estão adequadas. Os problemas estão na extensão pedida, em duplicatas e em dados faltando:

| Problema | Itens | Sugestão |
|---|---|---|
| Extensão de Writing um nível acima | A1: 40–60 palavras; A2: 60–100; B2: 180–250 | A1: 20–35; A2: 40–70; B2: 140–190 (faixas próximas às usadas por exames de referência) |
| Instrução em inglês acima do nível do aluno | W-A1-001 (“host parent”) e demais A1–A2 | Dar a instrução de A1–A2 em português; a rubrica avalia a resposta, não a leitura da instrução |
| Duplicatas | SI-A1-003 = SI-A1-002; SP-A2-003 = SP-A2-002; SP-A1-003 ≈ SP-A1-001; SI-C2-003 ≈ SI-C2-001 | Substituir |
| Sem duração | SI-A1-003, SI-A2-003, SI-B1-003, SI-B2-003, SI-C1-003, SI-C2-003, SP-B2-001/002/003 | Definir |
| Tema do Listening repetido na fala | L-B2-001 (reuniões) × SI-B2-002 (reuniões) | Trocar um dos dois |
| Família de temas repetida | B2: 7 tarefas sobre produtividade no trabalho; C1: decisões reversíveis (R-C1-003, SP-C1-003, SI-C1-003); C1/C2: simplificação × precisão (SP-C1-002, W-C2-002, W-C2-003); C2: transparência e informação incerta | Diversificar os domínios (pessoal, público, educacional, lazer, literário) |
| Público adulto e corporativo a partir do B2 | Quase tudo trata de empresas e políticas públicas | Para alunos adolescentes, incluir escola, tecnologia, cultura e esportes |

Interaction e Mediation dependem de interlocutor. Com o PR #6, essas tarefas podem ser aplicadas **ao vivo**, como o próprio Pilot Bank descreve (“learner and assessor…”).

## 4. Os modelos prontos (Level Checks e Placement)

**A estrutura está correta:**
- Piso, alvo e teto, com 4/8/4 itens em Reading e Listening e 5/10/5 em Language Use.
- Duas tarefas de Writing, Spoken Production, Spoken Interaction e Mediation em todos os níveis.
- Regras que impedem certificar o teto e que exigem revisão humana quando as habilidades produtivas ficam abaixo do alvo.

O desenho segue a lógica de *targeted testing* do CEFR.

**O que precisa mudar:**

1. **O viés da alternativa mais longa contamina o alvo e o teto do B2 ao C2.** No B2 Level Check, 8 de 8 itens-alvo podem ser acertados pela estratégia, o que basta para “demonstrado”.
2. **O banco é raso para formas paralelas.** São 3 tasklets por nível e por skill, e o alvo usa 2. Outro *seed* repete boa parte dos textos. O aluno que faz o A2 Check e depois o B1 Check reencontra textos de B1, porque o teto de um é o alvo do outro. Sugestão: 6 tasklets por nível e por skill antes de usar formas diferentes com o mesmo aluno.
3. **Duração.** A1: 75–95 min; A2–C1: 100–145 min. Sugestão: apresentar explicitamente em **duas sessões**, com a parte objetiva em casa e a parte produtiva ao vivo em aula. A tentativa já salva e retoma, e o PR #6 permite a parte ao vivo antes ou depois.
4. **Áudios.** Nenhum Listening tem áudio no banco; o B1 Pilot Form 1 exige o envio de 4 arquivos. Seguir a tabela de ritmo da seção 1 ao gravar.
5. **General CEFR Placement** (“Placement CEFR” no menu): cria 18 seções vazias, e o professor precisa escolher cerca de 78 itens, um por um, num `<select>`. Com 300 itens, isso é inviável. Sugestão: gerar automaticamente a partir do banco, como os Level Checks.

## 5. A página de criação é didática, coerente e fácil?

Avaliação feita pelo código do editor e por capturas renderizadas.

**O que funciona:**
- Salvamento automático com indicador “Salvo/Salvando”.
- Validação antes de publicar.
- Separação entre “Avaliação escolar” e “Proficiência CEFR”.
- Level Checks gerados com um clique.
- Envio de áudio por tasklet com estado visível.
- Pré-visualização.

**O que dificulta para o professor:**

| # | Problema | Impacto | Sugestão |
|---|---|---|---|
| 1 | **Jargão psicométrico em inglês sem explicação:** *Assessments, Draft, Blank Assessment, Level Check, Floor/Target/Ceiling, Tasklet, Construct, Função (Screening/Primary/Confirmation), Questões do pool, Form version, Decision rule, Ability inicial, Status de qualidade (approved_for_pilot…), Descriptor ID, PROVISIONAL INTERNAL STANDARD* | Alto: o professor independente não sabe o que preencher | Rótulos em português simples e um “?” com uma frase de ajuda; esconder campos técnicos em “Avançado” |
| 2 | **Formulário plano**, sem etapas: tipo, modo, navegação, resultado e randomização aparecem juntos, sem dizer o que cada um muda | Alto | Assistente em 3 passos: *Objetivo* (prova de unidade / nivelamento / acompanhamento) → *Conteúdo* → *Aplicação*. Os padrões vêm do objetivo |
| 3 | **“Tipo” (Placement/Diagnostic/Progress/Unit/Custom)** não explica a diferença; na prática quase só muda o rótulo (só “placement” permite confirmar nível na Evolução) | Médio | Explicar o efeito ou derivar do objetivo |
| 4 | **Trocar para CEFR torna obrigatórios** nível do tasklet, construct, skill, subskill e task type em toda seção e questão | Alto: montar uma prova CEFR própria fica pesado | Preencher automaticamente a partir do banco; pedir só nível e skill em questões manuais |
| 5 | **“Adicionar do banco” é um `<select>`** com o texto de cada questão, sem prévia, sem agrupar por texto-base e sem seleção múltipla | Alto, com 300 itens | Painel de busca com filtros, prévia da questão e “adicionar tasklet inteiro” |
| 6 | **Não dá para editar nem reordenar** uma questão depois de adicionada (só remover); peso e “obrigatória” não são editáveis | Médio | Editar no lugar, arrastar para reordenar, campos de peso |
| 7 | **Excluir seção não pede confirmação**, e o autosave grava em seguida | Médio: perda de trabalho | Confirmação inline ou “desfazer” |
| 8 | **Erros de publicação** aparecem todos juntos numa faixa de texto, sem apontar o campo; avisos usam `window.confirm` | Médio | Lista clicável que leva à seção ou questão; marcar o campo |
| 9 | **“Criar questão”** pede “Dificuldade (1–10)” e “Nível CEFR” até em prova escolar; gabarito de associação usa a sintaxe `esquerda => direita`; ordenação usa linhas | Médio | Campos visuais (pares lado a lado, arrastar a ordem); dificuldade opcional |
| 10 | **Pré-visualização** mostra só enunciado e tipo, sem alternativas, texto-base ou áudio; não é a visão do aluno | Médio | Renderizar com o mesmo componente do runner do aluno |
| 11 | **“Tempo (min)”** vem com 30 por padrão até em Level Checks; vazio significa “sem limite”, e isso não é dito | Baixo | Placeholder “Sem limite” e padrão por objetivo |
| 12 | **“Questões do pool”** (sortear N de M) não é explicado | Baixo | “Sortear quantas questões desta seção?” |
| 13 | **Menu “Nova avaliação”** mistura inglês (“Blank Assessment”, “General CEFR Placement”) e português | Baixo | “Prova em branco”, “Nivelamento CEFR”, “Verificação de nível” |

**Conclusão:** para quem já entende avaliação CEFR, o construtor é coerente e completo. Para o professor independente médio, ainda não é didático: o caminho mais fácil hoje é o Level Check pronto, e montar a própria prova exige conhecer o vocabulário interno. As mudanças de maior retorno são os itens 1, 2, 4 e 5.

## 6. Prioridades

1. **Reescrever as alternativas** de Reading/Listening do B1 ao C2 marcadas “Alternativa correta é a mais longa” no Apêndice. Até lá, não usar os Level Checks B2–C2 para decisões de nível sem revisão do professor.
2. **Corrigir os 9 itens “Corrigir”** (LU-B1-003, as duplicatas, SI-B2-002) e incluir no validador do banco uma verificação de duplicata entre níveis.
3. **Rever os 6 itens “Rever nível”** (L-A1-003, L-A1-002-Q4 e LU-C2-008).
4. **Ajustar as extensões de Writing** do A1, do A2 e do B2, e definir as durações que faltam.
5. **Aplicar os Level Checks em duas sessões**, com a parte produtiva ao vivo (PR #6).
6. **Construtor:** rótulos em português com ajuda, banco com busca e “adicionar tasklet”, e geração automática do Placement.
7. **Ampliar o banco** para 6 tasklets por nível e por skill, diversificando temas e gêneros (incluir texto literário e fala coloquial em C1–C2).

Validação estatística (facilidade, discriminação, Rasch) continua dependendo de dados reais de aplicação, como a auditoria anterior já registrou. Os pontos acima podem e devem ser corrigidos antes.

## Apêndice — veredito por item

Vereditos: **Adequado** (nenhum problema encontrado na leitura), **Ajustar** (melhoria de redação, extensão ou tema), **Corrigir** (defeito que afeta a pontuação ou a validade), **Rever nível** (construto ou input de outro nível). A marca “Alternativa correta é a mais longa” vem da verificação automática de B1–C2.

| Nível | Skill | Item | Veredito | Problema | Recomendação |
|---|---|---|---|---|---|
| A1 | reading | R-A1-001-Q1 | Ajustar | Distrator “Sunday” não é horário; é eliminável sem ler. | Trocar por um horário plausível (ex.: 10:00). |
| A1 | reading | R-A1-001-Q2 | Adequado |  |  |
| A1 | reading | R-A1-001-Q3 | Adequado |  |  |
| A1 | reading | R-A1-001-Q4 | Adequado |  |  |
| A1 | reading | R-A1-002-Q1 | Ajustar | “arrange a meeting” na alternativa correta está acima de A1. | “to say where and when to meet”. |
| A1 | reading | R-A1-002-Q2 | Ajustar | Alternativas de 8–9 palavras: carga de leitura acima do texto. | Encurtar: “at the café”, “at the pool”… |
| A1 | reading | R-A1-002-Q3 | Adequado |  |  |
| A1 | reading | R-A1-002-Q4 | Ajustar | “recognise” no enunciado é vocabulário B1. | “What is Diego wearing?” |
| A2 | reading | R-A2-001-Q1 | Adequado |  |  |
| A2 | reading | R-A2-001-Q2 | Adequado |  |  |
| A2 | reading | R-A2-001-Q3 | Adequado |  |  |
| A2 | reading | R-A2-001-Q4 | Adequado |  |  |
| A2 | reading | R-A2-002-Q1 | Adequado |  |  |
| A2 | reading | R-A2-002-Q2 | Adequado |  |  |
| A2 | reading | R-A2-002-Q3 | Adequado |  |  |
| A2 | reading | R-A2-002-Q4 | Adequado |  |  |
| B1 | reading | R-B1-001-Q1 | Ajustar | Alternativa correta é a mais longa (66 car. vs média 54). | Equalizar a extensão das alternativas. |
| B1 | reading | R-B1-001-Q2 | Adequado |  |  |
| B1 | reading | R-B1-001-Q3 | Ajustar | Alternativa correta usa “conventional” (B2). Alternativa correta é a mais longa (71 car. vs média 59). | “a normal café or repair shop”. Equalizar a extensão das alternativas. |
| B1 | reading | R-B1-001-Q4 | Ajustar | Alternativa correta é a mais longa (76 car. vs média 62). | Equalizar a extensão das alternativas. |
| B1 | reading | R-B1-002-Q1 | Adequado |  |  |
| B1 | reading | R-B1-002-Q2 | Adequado |  |  |
| B1 | reading | R-B1-002-Q3 | Ajustar | Alternativa correta é a mais longa (70 car. vs média 64). | Equalizar a extensão das alternativas. |
| B1 | reading | R-B1-002-Q4 | Ajustar | Metalinguagem “acknowledge a disadvantage or opposing view” (B2). | “to show that some students do not agree”. |
| B2 | reading | R-B2-001-Q1 | Ajustar | Alternativa correta é a mais longa (103 car. vs média 95). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-001-Q2 | Adequado |  |  |
| B2 | reading | R-B2-001-Q3 | Adequado |  |  |
| B2 | reading | R-B2-001-Q4 | Ajustar | Alternativa correta é a mais longa (93 car. vs média 78). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-002-Q1 | Ajustar | Alternativa correta é a mais longa (112 car. vs média 84). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-002-Q2 | Adequado |  |  |
| B2 | reading | R-B2-002-Q3 | Ajustar | Alternativa correta é a mais longa (76 car. vs média 66). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-002-Q4 | Adequado |  |  |
| C1 | reading | R-C1-001-Q1 | Ajustar | Alternativa correta é a mais longa (117 car. vs média 96). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-001-Q2 | Adequado |  |  |
| C1 | reading | R-C1-001-Q3 | Adequado |  |  |
| C1 | reading | R-C1-001-Q4 | Ajustar | Alternativa correta é a mais longa (89 car. vs média 72). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-002-Q1 | Ajustar | Alternativa correta é a mais longa (114 car. vs média 90). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-002-Q2 | Adequado |  |  |
| C1 | reading | R-C1-002-Q3 | Adequado |  |  |
| C1 | reading | R-C1-002-Q4 | Ajustar | Alternativa correta é a mais longa (114 car. vs média 99). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-001-Q1 | Ajustar | Alternativa correta é a mais longa (125 car. vs média 108). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-001-Q2 | Ajustar | Alternativa correta é a mais longa (104 car. vs média 95). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-001-Q3 | Ajustar | Alternativa correta é a mais longa (112 car. vs média 102). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-001-Q4 | Adequado |  |  |
| C2 | reading | R-C2-002-Q1 | Ajustar | Alternativa correta é a mais longa (142 car. vs média 116). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-002-Q2 | Ajustar | Alternativa correta é a mais longa (96 car. vs média 92). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-002-Q3 | Ajustar | Alternativa correta é a mais longa (93 car. vs média 86). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-002-Q4 | Ajustar | Alternativa correta é a mais longa (95 car. vs média 87). | Equalizar a extensão das alternativas. |
| A1 | reading | R-A1-003-Q1 | Adequado |  |  |
| A1 | reading | R-A1-003-Q2 | Adequado |  |  |
| A1 | reading | R-A1-003-Q3 | Adequado |  |  |
| A1 | reading | R-A1-003-Q4 | Adequado |  |  |
| A2 | reading | R-A2-003-Q1 | Adequado |  |  |
| A2 | reading | R-A2-003-Q2 | Adequado |  |  |
| A2 | reading | R-A2-003-Q3 | Adequado |  |  |
| A2 | reading | R-A2-003-Q4 | Adequado |  |  |
| B1 | reading | R-B1-003-Q1 | Ajustar | Alternativa correta é a mais longa (51 car. vs média 47). | Equalizar a extensão das alternativas. |
| B1 | reading | R-B1-003-Q2 | Adequado |  |  |
| B1 | reading | R-B1-003-Q3 | Adequado |  |  |
| B1 | reading | R-B1-003-Q4 | Ajustar | Alternativa correta é a mais longa (60 car. vs média 58). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-003-Q1 | Ajustar | Alternativa correta é a mais longa (92 car. vs média 75). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-003-Q2 | Ajustar | Alternativa correta é a mais longa (88 car. vs média 82). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-003-Q3 | Ajustar | Alternativa correta é a mais longa (76 car. vs média 66). | Equalizar a extensão das alternativas. |
| B2 | reading | R-B2-003-Q4 | Ajustar | Alternativa correta é a mais longa (53 car. vs média 50). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-003-Q1 | Ajustar | Alternativa correta é a mais longa (93 car. vs média 78). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-003-Q2 | Ajustar | Alternativa correta é a mais longa (102 car. vs média 87). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-003-Q3 | Ajustar | Alternativa correta é a mais longa (103 car. vs média 84). | Equalizar a extensão das alternativas. |
| C1 | reading | R-C1-003-Q4 | Ajustar | Alternativa correta é a mais longa (108 car. vs média 72). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-003-Q1 | Ajustar | Alternativa correta é a mais longa (109 car. vs média 87). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-003-Q2 | Adequado |  |  |
| C2 | reading | R-C2-003-Q3 | Ajustar | Alternativa correta é a mais longa (87 car. vs média 78). | Equalizar a extensão das alternativas. |
| C2 | reading | R-C2-003-Q4 | Ajustar | Alternativa correta é a mais longa (114 car. vs média 86). | Equalizar a extensão das alternativas. |
| A1 | listening | L-A1-001-Q1 | Adequado |  |  |
| A1 | listening | L-A1-001-Q2 | Adequado |  |  |
| A1 | listening | L-A1-001-Q3 | Adequado |  |  |
| A1 | listening | L-A1-001-Q4 | Ajustar | Moeda “reais” convive com “£” em outros itens. | Padronizar a moeda do banco. |
| A1 | listening | L-A1-002-Q1 | Adequado |  |  |
| A1 | listening | L-A1-002-Q2 | Adequado |  |  |
| A1 | listening | L-A1-002-Q3 | Adequado |  |  |
| A1 | listening | L-A1-002-Q4 | Rever nível | Pergunta de propósito/inferência (“Why does Lucas mention…”) é construto A2. | Mover para A2 ou trocar por informação explícita. |
| A2 | listening | L-A2-001-Q1 | Adequado |  |  |
| A2 | listening | L-A2-001-Q2 | Adequado |  |  |
| A2 | listening | L-A2-001-Q3 | Adequado |  |  |
| A2 | listening | L-A2-001-Q4 | Adequado |  |  |
| A2 | listening | L-A2-002-Q1 | Adequado |  |  |
| A2 | listening | L-A2-002-Q2 | Adequado |  |  |
| A2 | listening | L-A2-002-Q3 | Adequado |  |  |
| A2 | listening | L-A2-002-Q4 | Adequado |  |  |
| B1 | listening | L-B1-001-Q1 | Adequado |  |  |
| B1 | listening | L-B1-001-Q2 | Adequado |  |  |
| B1 | listening | L-B1-001-Q3 | Adequado |  |  |
| B1 | listening | L-B1-001-Q4 | Ajustar | Metalinguagem “acknowledge a disadvantage before giving her overall positive view” (B2). Alternativa correta é a mais longa (69 car. vs média 59). | “to say there are problems, but she is happy with the train”. Equalizar a extensão das alternativas. |
| B1 | listening | L-B1-002-Q1 | Ajustar | Alternativa correta é a mais longa (58 car. vs média 50). | Equalizar a extensão das alternativas. |
| B1 | listening | L-B1-002-Q2 | Ajustar | Alternativa correta é a mais longa (63 car. vs média 50). | Equalizar a extensão das alternativas. |
| B1 | listening | L-B1-002-Q3 | Adequado |  |  |
| B1 | listening | L-B1-002-Q4 | Adequado |  |  |
| B2 | listening | L-B2-001-Q1 | Ajustar | Alternativa correta é a mais longa (60 car. vs média 54). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-001-Q2 | Ajustar | Alternativa correta é a mais longa (68 car. vs média 60). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-001-Q3 | Ajustar | Alternativa correta é a mais longa (71 car. vs média 57). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-001-Q4 | Ajustar | Alternativa correta é a mais longa (81 car. vs média 69). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-002-Q1 | Adequado |  |  |
| B2 | listening | L-B2-002-Q2 | Ajustar | Alternativa correta é a mais longa (87 car. vs média 67). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-002-Q3 | Adequado |  |  |
| B2 | listening | L-B2-002-Q4 | Ajustar | Alternativa correta é a mais longa (80 car. vs média 67). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-001-Q1 | Ajustar | Alternativa correta é a mais longa (107 car. vs média 99). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-001-Q2 | Ajustar | Alternativa correta é a mais longa (102 car. vs média 84). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-001-Q3 | Ajustar | Alternativa correta é a mais longa (109 car. vs média 95). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-001-Q4 | Ajustar | Alternativa correta é a mais longa (61 car. vs média 59). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-002-Q1 | Ajustar | Alternativa correta é a mais longa (108 car. vs média 101). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-002-Q2 | Adequado |  |  |
| C1 | listening | L-C1-002-Q3 | Ajustar | Alternativa correta é a mais longa (101 car. vs média 82). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-002-Q4 | Ajustar | Alternativa correta é a mais longa (102 car. vs média 83). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-001-Q1 | Ajustar | Alternativa correta é a mais longa (140 car. vs média 104). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-001-Q2 | Ajustar | Alternativa correta é a mais longa (92 car. vs média 80). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-001-Q3 | Ajustar | Alternativa correta é a mais longa (113 car. vs média 88). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-001-Q4 | Adequado |  |  |
| C2 | listening | L-C2-002-Q1 | Ajustar | Alternativa correta é a mais longa (91 car. vs média 82). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-002-Q2 | Ajustar | Alternativa correta é a mais longa (108 car. vs média 89). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-002-Q3 | Adequado |  |  |
| C2 | listening | L-C2-002-Q4 | Adequado |  |  |
| A1 | listening | L-A1-003-Q1 | Rever nível | Anúncio público com 4 informações corresponde ao descritor A2 (“short, clear announcements”). | Rotular o tasklet como A2 ou simplificar o anúncio. |
| A1 | listening | L-A1-003-Q2 | Rever nível | Idem tasklet L-A1-003. |  |
| A1 | listening | L-A1-003-Q3 | Rever nível | Idem tasklet L-A1-003. |  |
| A1 | listening | L-A1-003-Q4 | Rever nível | Idem tasklet L-A1-003. |  |
| A2 | listening | L-A2-003-Q1 | Adequado |  |  |
| A2 | listening | L-A2-003-Q2 | Adequado |  |  |
| A2 | listening | L-A2-003-Q3 | Adequado |  |  |
| A2 | listening | L-A2-003-Q4 | Adequado |  |  |
| B1 | listening | L-B1-003-Q1 | Adequado |  |  |
| B1 | listening | L-B1-003-Q2 | Adequado |  |  |
| B1 | listening | L-B1-003-Q3 | Ajustar | Alternativa correta é a mais longa (44 car. vs média 41). | Equalizar a extensão das alternativas. |
| B1 | listening | L-B1-003-Q4 | Ajustar | Alternativa correta é a mais longa (52 car. vs média 37). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-003-Q1 | Ajustar | Alternativa correta é a mais longa (97 car. vs média 80). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-003-Q2 | Ajustar | Alternativa correta é a mais longa (60 car. vs média 52). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-003-Q3 | Ajustar | Alternativa correta é a mais longa (85 car. vs média 63). | Equalizar a extensão das alternativas. |
| B2 | listening | L-B2-003-Q4 | Ajustar | Alternativa correta é a mais longa (82 car. vs média 62). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-003-Q1 | Ajustar | Alternativa correta é a mais longa (84 car. vs média 74). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-003-Q2 | Ajustar | Alternativa correta é a mais longa (95 car. vs média 80). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-003-Q3 | Ajustar | Alternativa correta é a mais longa (79 car. vs média 73). | Equalizar a extensão das alternativas. |
| C1 | listening | L-C1-003-Q4 | Ajustar | Alternativa correta é a mais longa (79 car. vs média 69). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-003-Q1 | Ajustar | Alternativa correta é a mais longa (101 car. vs média 82). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-003-Q2 | Ajustar | Alternativa correta é a mais longa (109 car. vs média 83). | Equalizar a extensão das alternativas. |
| C2 | listening | L-C2-003-Q3 | Adequado |  |  |
| C2 | listening | L-C2-003-Q4 | Ajustar | Alternativa correta é a mais longa (70 car. vs média 65). | Equalizar a extensão das alternativas. |
| A1 | language_use | LU-A1-001 | Adequado |  |  |
| A1 | language_use | LU-A1-002 | Adequado |  |  |
| A1 | language_use | LU-A1-003 | Adequado |  |  |
| A1 | language_use | LU-A1-004 | Adequado |  |  |
| A1 | language_use | LU-A1-005 | Adequado |  |  |
| A1 | language_use | LU-A1-006 | Adequado |  |  |
| A1 | language_use | LU-A1-007 | Adequado |  |  |
| A1 | language_use | LU-A1-008 | Adequado |  |  |
| A1 | language_use | LU-A1-009 | Adequado |  |  |
| A1 | language_use | LU-A1-010 | Adequado |  |  |
| A2 | language_use | LU-A2-001 | Adequado |  |  |
| A2 | language_use | LU-A2-002 | Adequado |  |  |
| A2 | language_use | LU-A2-003 | Adequado |  |  |
| A2 | language_use | LU-A2-004 | Adequado |  |  |
| A2 | language_use | LU-A2-005 | Adequado |  |  |
| A2 | language_use | LU-A2-006 | Adequado |  |  |
| A2 | language_use | LU-A2-007 | Adequado |  |  |
| A2 | language_use | LU-A2-008 | Adequado |  |  |
| A2 | language_use | LU-A2-009 | Adequado |  |  |
| A2 | language_use | LU-A2-010 | Adequado |  |  |
| B1 | language_use | LU-B1-001 | Adequado |  |  |
| B1 | language_use | LU-B1-002 | Adequado |  |  |
| B1 | language_use | LU-B1-003 | Corrigir | Duas respostas corretas: “The new sports centre opened last year” também é correto e natural. | Trocar o distrator “opened” por “has been open” ou usar agente: “___ by the mayor last year”. |
| B1 | language_use | LU-B1-004 | Adequado |  |  |
| B1 | language_use | LU-B1-005 | Adequado |  |  |
| B1 | language_use | LU-B1-006 | Adequado |  |  |
| B1 | language_use | LU-B1-007 | Adequado |  |  |
| B1 | language_use | LU-B1-008 | Adequado |  |  |
| B1 | language_use | LU-B1-009 | Adequado |  |  |
| B1 | language_use | LU-B1-010 | Adequado |  |  |
| B2 | language_use | LU-B2-001 | Adequado |  |  |
| B2 | language_use | LU-B2-002 | Adequado |  |  |
| B2 | language_use | LU-B2-003 | Adequado |  |  |
| B2 | language_use | LU-B2-004 | Adequado |  |  |
| B2 | language_use | LU-B2-005 | Adequado |  |  |
| B2 | language_use | LU-B2-006 | Adequado |  |  |
| B2 | language_use | LU-B2-007 | Adequado |  |  |
| B2 | language_use | LU-B2-008 | Adequado |  |  |
| B2 | language_use | LU-B2-009 | Adequado |  |  |
| B2 | language_use | LU-B2-010 | Adequado |  |  |
| C1 | language_use | LU-C1-001 | Adequado |  |  |
| C1 | language_use | LU-C1-002 | Adequado |  |  |
| C1 | language_use | LU-C1-003 | Corrigir | Mesmo item que LU-B2-013, em outro nível. | Manter em um nível só. |
| C1 | language_use | LU-C1-004 | Adequado |  |  |
| C1 | language_use | LU-C1-005 | Adequado |  |  |
| C1 | language_use | LU-C1-006 | Adequado |  |  |
| C1 | language_use | LU-C1-007 | Adequado |  |  |
| C1 | language_use | LU-C1-008 | Adequado |  |  |
| C1 | language_use | LU-C1-009 | Adequado |  |  |
| C1 | language_use | LU-C1-010 | Adequado |  |  |
| C2 | language_use | LU-C2-001 | Adequado |  |  |
| C2 | language_use | LU-C2-002 | Adequado |  |  |
| C2 | language_use | LU-C2-003 | Adequado |  |  |
| C2 | language_use | LU-C2-004 | Ajustar | Distratores inexistentes (“thin-haired”, “split-haired”) são eliminados sem conhecimento. | Usar distratores reais (ex.: “nit-picking” em contexto errado, “far-fetched”). |
| C2 | language_use | LU-C2-005 | Adequado |  |  |
| C2 | language_use | LU-C2-006 | Adequado |  |  |
| C2 | language_use | LU-C2-007 | Adequado |  |  |
| C2 | language_use | LU-C2-008 | Rever nível | Alternativas 3 e 4 também são tácitas e aceitáveis numa discussão formal; chave discutível. | Revisar com dois avaliadores ou reescrever os distratores. |
| C2 | language_use | LU-C2-009 | Adequado |  |  |
| C2 | language_use | LU-C2-010 | Adequado |  |  |
| A1 | language_use | LU-A1-011 | Adequado |  |  |
| A1 | language_use | LU-A1-012 | Adequado |  |  |
| A1 | language_use | LU-A1-013 | Adequado |  |  |
| A1 | language_use | LU-A1-014 | Adequado |  |  |
| A1 | language_use | LU-A1-015 | Adequado |  |  |
| A2 | language_use | LU-A2-011 | Adequado |  |  |
| A2 | language_use | LU-A2-012 | Adequado |  |  |
| A2 | language_use | LU-A2-013 | Adequado |  |  |
| A2 | language_use | LU-A2-014 | Adequado |  |  |
| A2 | language_use | LU-A2-015 | Adequado |  |  |
| B1 | language_use | LU-B1-011 | Adequado |  |  |
| B1 | language_use | LU-B1-012 | Adequado |  |  |
| B1 | language_use | LU-B1-013 | Adequado |  |  |
| B1 | language_use | LU-B1-014 | Adequado |  |  |
| B1 | language_use | LU-B1-015 | Adequado |  |  |
| B2 | language_use | LU-B2-011 | Adequado |  |  |
| B2 | language_use | LU-B2-012 | Corrigir | Repete LU-B2-001 (inversão do 3º condicional “Had … known”). | Substituir por outro construto B2 (ex.: “wish + past perfect”). |
| B2 | language_use | LU-B2-013 | Corrigir | Mesmo item que LU-C1-003 (“The new evidence ___ doubt on the assumption…”) classificado em outro nível. | Manter em um nível só. |
| B2 | language_use | LU-B2-014 | Adequado |  |  |
| B2 | language_use | LU-B2-015 | Ajustar | Mesmo construto e mesma resposta de LU-B2-007 (“Nevertheless”). | Variar o conector (ex.: “Even so”, “On the other hand”). |
| C1 | language_use | LU-C1-011 | Ajustar | “indirect” também é defensável (“deliberately indirect, allowing both sides…”). | Trocar “indirect” por um distrator claramente errado. |
| C1 | language_use | LU-C1-012 | Corrigir | Quase idêntico a LU-C1-002 (inversão “Rarely have…” + “rapid change in public attitudes”). | Substituir. |
| C1 | language_use | LU-C1-013 | Corrigir | Idêntico a LU-C1-009 (“The author ___ a distinction…”). | Substituir. |
| C1 | language_use | LU-C1-014 | Ajustar | Mesmo construto de LU-C1-004 (hedging acadêmico). | Variar o construto. |
| C1 | language_use | LU-C1-015 | Adequado |  |  |
| C2 | language_use | LU-C2-011 | Adequado |  |  |
| C2 | language_use | LU-C2-012 | Adequado |  |  |
| C2 | language_use | LU-C2-013 | Adequado |  |  |
| C2 | language_use | LU-C2-014 | Adequado |  |  |
| C2 | language_use | LU-C2-015 | Adequado |  |  |
| A1 | writing | W-A1-001 | Ajustar | 40–60 palavras é extensão de A2; “host parent” acima de A1. | A1: 20–35 palavras; instrução em português ou mais simples. |
| A1 | writing | W-A1-002 | Ajustar | 40–60 palavras é extensão de A2. | 20–35 palavras. |
| A2 | writing | W-A2-001 | Ajustar | 60–100 palavras se aproxima da extensão de B1. | A2: 40–70 palavras. |
| A2 | writing | W-A2-002 | Ajustar | 60–100 palavras se aproxima da extensão de B1. | 40–70 palavras. |
| B1 | writing | W-B1-001 | Adequado |  |  |
| B1 | writing | W-B1-002 | Adequado |  |  |
| B2 | writing | W-B2-001 | Ajustar | 180–250 palavras: acima da faixa usual de B2 (≈140–190). | 140–190 palavras. |
| B2 | writing | W-B2-002 | Ajustar | 180–250 palavras: acima da faixa usual de B2. | 140–190 palavras. |
| C1 | writing | W-C1-001 | Adequado |  |  |
| C1 | writing | W-C1-002 | Adequado |  |  |
| C2 | writing | W-C2-001 | Adequado |  |  |
| C2 | writing | W-C2-002 | Adequado |  |  |
| A1 | spoken_production | SP-A1-001 | Adequado |  |  |
| A1 | spoken_production | SP-A1-002 | Adequado |  |  |
| A2 | spoken_production | SP-A2-001 | Adequado |  |  |
| A2 | spoken_production | SP-A2-002 | Adequado |  |  |
| B1 | spoken_production | SP-B1-001 | Adequado |  |  |
| B1 | spoken_production | SP-B1-002 | Adequado |  |  |
| B2 | spoken_production | SP-B2-001 | Ajustar | Sem duração definida. | 2 min. |
| B2 | spoken_production | SP-B2-002 | Ajustar | Sem duração definida. | 2 min. |
| C1 | spoken_production | SP-C1-001 | Adequado |  |  |
| C1 | spoken_production | SP-C1-002 | Adequado |  |  |
| C2 | spoken_production | SP-C2-001 | Adequado |  |  |
| C2 | spoken_production | SP-C2-002 | Adequado |  |  |
| A1 | spoken_interaction | SI-A1-001 | Adequado |  |  |
| A1 | spoken_interaction | SI-A1-002 | Adequado |  |  |
| A2 | spoken_interaction | SI-A2-001 | Adequado |  |  |
| A2 | spoken_interaction | SI-A2-002 | Adequado |  |  |
| B1 | spoken_interaction | SI-B1-001 | Adequado |  |  |
| B1 | spoken_interaction | SI-B1-002 | Adequado |  |  |
| B2 | spoken_interaction | SI-B2-001 | Adequado |  |  |
| B2 | spoken_interaction | SI-B2-002 | Corrigir | Tema idêntico ao Listening L-B2-001 (reduzir reuniões): o áudio fornece argumentos para a fala. | Trocar o tema ou impedir os dois no mesmo form. |
| C1 | spoken_interaction | SI-C1-001 | Adequado |  |  |
| C1 | spoken_interaction | SI-C1-002 | Adequado |  |  |
| C2 | spoken_interaction | SI-C2-001 | Adequado |  |  |
| C2 | spoken_interaction | SI-C2-002 | Adequado |  |  |
| A1 | mediation | M-A1-001 | Adequado |  |  |
| A2 | mediation | M-A2-001 | Adequado |  |  |
| B1 | mediation | M-B1-001 | Adequado |  |  |
| B2 | mediation | M-B2-001 | Ajustar | Tema (e-mail no trabalho) repete a família “produtividade”. | Diversificar. |
| C1 | mediation | M-C1-001 | Adequado |  |  |
| C2 | mediation | M-C2-001 | Adequado |  |  |
| A1 | writing | W-A1-003 | Ajustar | 40–60 palavras é extensão de A2. | 20–35 palavras. |
| A2 | writing | W-A2-003 | Ajustar | 60–100 palavras se aproxima da extensão de B1. | 40–70 palavras. |
| B1 | writing | W-B1-003 | Adequado |  |  |
| B2 | writing | W-B2-003 | Ajustar | 180–250 palavras; tema (dia sem e-mail) repete a família “produtividade no trabalho”. | 140–190 palavras; diversificar o tema. |
| C1 | writing | W-C1-003 | Adequado |  |  |
| C2 | writing | W-C2-003 | Ajustar | Tema (simplificar x precisão) repete W-C2-002 e SP-C1-002. | Diversificar. |
| A1 | spoken_production | SP-A1-003 | Ajustar | Quase igual a SP-A1-001 (falar da casa/quarto). | Trocar o tema (ex.: família, comida favorita). |
| A2 | spoken_production | SP-A2-003 | Corrigir | Duplica SP-A2-002 (descrever um fim de semana). | Trocar o tema. |
| B1 | spoken_production | SP-B1-003 | Ajustar | Mesmo tema de W-B1-002 (aprender sozinho x em grupo). | Garantir que não caiam no mesmo form, ou trocar o tema. |
| B2 | spoken_production | SP-B2-003 | Ajustar | Sem duração; tema (notificações) repete a família “produtividade”. | 2 min; diversificar. |
| C1 | spoken_production | SP-C1-003 | Ajustar | Mesmo tema de R-C1-003 e SI-C1-003 (decisões reversíveis/testes). | Diversificar. |
| C2 | spoken_production | SP-C2-003 | Ajustar | Tema (transparência) repete M-C2-002. | Diversificar. |
| A1 | spoken_interaction | SI-A1-003 | Corrigir | Duplica SI-A1-002 (mesmo role-play no café) e não tem duração. | Substituir por outra situação (ex.: pedir informação na rua) e definir 2–3 min. |
| A2 | spoken_interaction | SI-A2-003 | Ajustar | Sem duração definida. | 3–4 min, como SI-A2-001/002. |
| B1 | spoken_interaction | SI-B1-003 | Ajustar | Sem duração definida. | 4–5 min. |
| B2 | spoken_interaction | SI-B2-003 | Ajustar | Sem duração; tema (interrupções no trabalho) repete SI-B2-002. | 5–6 min; diversificar. |
| C1 | spoken_interaction | SI-C1-003 | Ajustar | Sem duração; mesmo tema de R-C1-003. | 6–8 min; diversificar. |
| C2 | spoken_interaction | SI-C2-003 | Ajustar | Quase igual a SI-C2-001 (publicar informação incerta) e sem duração. | Diversificar; 7–9 min. |
| A1 | mediation | M-A1-002 | Adequado |  |  |
| A2 | mediation | M-A2-002 | Ajustar | Moeda “£” convive com “R$”/“reais”. | Padronizar a moeda. |
| B1 | mediation | M-B1-002 | Adequado |  |  |
| B2 | mediation | M-B2-002 | Adequado |  |  |
| C1 | mediation | M-C1-002 | Ajustar | Mesmo tema e tipo de fonte de M-C1-001 (horário flexível). | Diversificar. |
| C2 | mediation | M-C2-002 | Adequado |  |  |
