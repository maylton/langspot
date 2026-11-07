# Diretrizes e prompt para criar itens novos no Pilot Bank

Este documento junta o que foi corrigido no banco entre as versões 0.4 e 0.7 (6–7 nov. 2026) num roteiro
para quem for **criar itens novos ou mudar o banco**: professores, revisores ou um assistente de IA.

- **Parte 1:** o que aprendemos (por que as regras existem).
- **Parte 2:** como implementar uma mudança no banco de dados, passo a passo.
- **Parte 3:** um prompt pronto para copiar e colar ao pedir itens novos.
- **Parte 4:** a revisão humana obrigatória antes de publicar.

As regras detalhadas, com exemplos e referências, estão em
[`ITEM_WRITING_GUIDELINES.md`](ITEM_WRITING_GUIDELINES.md). As regras de direitos autorais dos textos estão
em [`AUTHENTIC_TEXT_SOURCES.md`](AUTHENTIC_TEXT_SOURCES.md).

---

## Parte 1 — O que aprendemos

| Versão | Problema encontrado | Correção |
|---|---|---|
| 0.4 | Os textos de Reading eram todos escritos para a prova | Um texto autêntico por nível, só de domínio público ou CC BY, com referência ABNT, licença e crédito |
| 0.5 | No Reading, era possível acertar sem entender o texto: distratores com *all / every / only / never*, distratores sobre coisas que não estão no texto, gabarito copiado do texto | Distratores apoiados no texto, com a relação errada; gabarito parafraseado; regra automática contra absolutos |
| 0.5 | Ao parafrasear, o gabarito virou a alternativa mais longa | Tamanhos rebalanceados; limite de 35% por nível |
| 0.6 | No Language Use havia formas inexistentes (*create up*, *increases up*), dois gabaritos possíveis (*take a decision*), respostas funcionais absurdas e registros caricatos | Só formas reais; distratores tirados de erros típicos de brasileiros; respostas coerentes para a função errada |
| 0.7 | Mediation pedia resposta em segundos, mas o app recolhe texto | Mediation escrita, com meta em palavras |
| 0.7 | Spoken Interaction ora falava com o aluno, ora com o avaliador | Todas as tarefas falam com o aluno ("you", "the examiner") |
| 0.7 | O mesmo tema aparecia no texto de Reading e nas tarefas de fala e escrita da mesma prova | Nenhum tema repetido dentro de uma forma |
| 0.7 | Extensões de Writing acima das da Cambridge (B1 120–160, C2 300–450) | B1 100–120, C1 220–260, C2 280–320 |
| Regra v2 | O nível de Reading e Language Use era a mediana das partes: o piso puxava para baixo e uma prova perfeita dava B1, nunca B1+ | Escada piso/alvo/teto (`docs/CEFR_LEVEL_CHECK_PRESETS.md`) |

Duas lições valem para tudo:

1. **Um item mede o que o aluno sabe, não a esperteza para fazer prova.** Se dá para descartar uma opção
   sem saber o conteúdo (pela forma, por absurdo, pelo tamanho), o item está com defeito.
2. **Sempre revise com outra pessoa.** Os erros mais graves de hoje (gabarito duplo, pista de tamanho)
   apareceram só quando alguém respondeu sem ver o gabarito ou mediu o banco inteiro.

---

## Parte 2 — Como implementar uma mudança no banco

O conteúdo do banco **não se edita direto no Supabase**. A fonte de verdade é o markdown versionado em
`docs/cefr/`.

1. **Crie a versão nova do markdown com um script**, como nas anteriores
   (`scripts/cefr-pilot-bank-v0_7-productive.py` + `scripts/cefr_pilot_bank_v0_7_productive.py`). O script
   lê a versão anterior, aplica as mudanças guardadas num arquivo de dados e confere que cada alteração
   acontece exatamente uma vez. Nunca edite o markdown à mão: o script documenta o que mudou.
2. **Atualize a versão em `scripts/cefr-pilot-bank.mjs`**: a constante `PILOT_VERSION`, o arquivo de
   origem e o cabeçalho do seed.
3. **Ao acrescentar itens** (e não só reescrever), atualize as contagens fixas:
   - `EXPECTED` em `scripts/cefr-pilot-bank.mjs`: total, por habilidade e distribuição das letras A/B/C/D;
   - as contagens da função SQL `private.validate_cefr_pilot_bank`, numa migration nova;
   - os presets em `cefr_level_check_presets`, se a prova tiver de sortear mais itens.

   Use IDs novos e sequenciais (por exemplo `R-B1-005`, `LU-B1-016`). Nunca reaproveite um ID: o
   `external_id` é a chave da atualização no lugar.
4. **Rode o validador e gere o seed:**
   `node scripts/cefr-pilot-bank.mjs --check` e depois
   `node scripts/cefr-pilot-bank.mjs --output=supabase/seed.sql`.
5. **Crie a migration** que muda o padrão `pilot-X.Y` em `private.validate_cefr_pilot_bank` e
   `public.generate_assessment_from_preset` (copie a da versão anterior). Registre-a em
   `scripts/test-assessment-migrations.sh`.
6. **Atualize o app e os testes**:
   - `CURRENT_PILOT_BANK_VERSION` em `src/domains/assessments/assessmentService.ts`;
   - `pilot-X.Y` nos smoke tests de `supabase/tests/`;
   - o arquivo usado em `scripts/cefr-pilot-bank.node.mjs`;
   - um teste para cada regra nova.
7. **Verifique**: `node --test scripts/cefr-pilot-bank.node.mjs`, `npx tsc -b`, `npx vitest run`,
   `npm run build`. O CI do PR roda os testes de banco num Postgres.
8. **Publique** depois que o CI passar:
   - `npx -y supabase@latest db push --remote --dry-run`;
   - `npx -y supabase@latest db push --remote --yes`;
   - `npx -y supabase@latest db query --remote --yes -f supabase/seed.sql`;
   - mescle o PR (a Vercel publica o site) e reinstale o app de computador.

   Confira em produção com `db query --remote --read-only`.

**Provas já geradas não mudam.** Cada prova guarda uma cópia das questões. Para usar a versão nova, gere
a prova de novo.

---

## Parte 3 — Prompt para pedir itens novos

Copie o bloco abaixo, preencha os campos entre colchetes e entregue a um assistente de IA ou a um
professor. O resultado deve voltar no formato do markdown do banco, pronto para o script da Parte 2.

````text
Você vai escrever itens novos para o LangSpot CEFR Pilot Bank, um banco de itens de inglês (níveis A1–C2)
usado em provas de nível para alunos brasileiros adultos e adolescentes.

PEDIDO
- Nível CEFR: [A1 | A2 | B1 | B2 | C1 | C2]
- Tipo: [Reading tasklet (texto + 4 questões) | Language Use (frases com lacuna) | Writing | Spoken
  Production | Spoken Interaction | Mediation]
- Quantidade: [n]
- Próximo ID livre: [ex.: R-B1-005, LU-B1-016, W-B1-004]
- Temas JÁ USADOS neste nível, no piso e no teto (não repita): [lista]
- Texto-fonte, se for Reading autêntico: [texto + referência ABNT + licença; só domínio público ou CC BY]

REGRAS GERAIS
1. Um item mede a habilidade, não a esperteza para fazer prova. Se uma opção puder ser descartada sem o
   conhecimento testado (pela forma, por absurdo, pelo tamanho, por palavras absolutas), reescreva.
2. Nível: confira estruturas e vocabulário no English Grammar Profile e no English Vocabulary Profile. As
   instruções ficam ABAIXO do nível testado (em A1/A2, só vocabulário de A1/A2).
3. Inglês padrão britânico ou americano; o gabarito deve ser o único correto nos DOIS.
4. Distribua as letras dos gabaritos de forma equilibrada (A, B, C e D aparecem quase o mesmo número de
   vezes) e não deixe o gabarito como a opção mais longa em mais de 1 de cada 4 itens.
5. Nenhum tema pode repetir os da lista "Temas já usados".

READING (texto + 4 questões de múltipla escolha)
- Perguntas na ordem do texto; a última pode tratar do texto como um todo. Varie as subhabilidades
  (main_idea, detail, inference, writer_purpose, writer_attitude, reference, text_organisation).
- Cada DISTRATOR usa algo que ESTÁ no texto, mas com a relação errada: causa trocada, pessoa/lugar/momento
  trocados, verdadeiro mas não responde à pergunta, a posição que o autor critica, generalização de um
  detalhe, ou repetição de uma palavra marcante do texto (isca).
- O GABARITO parafraseia o texto (a partir do A2); não copie a frase do texto.
- Proibido em distrator: all, every, always, never, only, none, nothing, nobody, completely, entirely,
  totally, a menos que o texto use a palavra.
- As quatro opções têm a mesma forma gramatical e extensão parecida.
- A1: localizar informação; o gabarito pode repetir o dado, e os distratores são OUTROS dados do mesmo
  texto (outros horários, lugares, cores).
- Extensão do texto: A1 30–80 palavras, A2 100–180, B1 220–300, B2 280–380, C1 450–650, C2 600–900.

LANGUAGE USE (frase com lacuna, 4 opções)
- Toda opção é uma palavra/forma/frase REAL do inglês, errada só naquele contexto. Proibido inventar
  combinações ("create up", "increases up", "did we have seen").
- Use como distratores os erros típicos de brasileiros quando forem formas reais: lose the bus, make a
  photo, take a conclusion, is believed that, it can rain later, rise/raise, succeed to, actually =
  atualmente, assist = assistir.
- As quatro opções são da mesma classe (4 verbos, 4 adjetivos…) e preenchem a mesma posição sintática.
- Em vocabulário, prefira testar colocação e regência (make a decision, cast doubt on, believed to be),
  não definição.
- Itens funcionais (diálogo): os distratores são respostas coerentes e gramaticais para a FUNÇÃO errada
  (ex.: "Do you mind if I open the window?" → "Yes, please do."), nunca absurdas.
- Itens de registro: as quatro frases são gramaticais e de tom parecido; diferem em um ou dois traços
  (imperativo sem atenuação, quantificador informal, certeza excessiva). Nada de caricaturas.

WRITING
- Diga para quem, por quê e em que gênero se escreve. Dê 3 ou 4 pontos de conteúdo em lista.
- B2 ensaio: duas ideias dadas + "your own idea".
- Extensões: A1 20–35 palavras, A2 40–70, B1 100–120, B2 140–190, C1 220–260, C2 280–320.

SPOKEN PRODUCTION
- Uma pergunta clara, com 2–4 pontos para cobrir. Tempo: A1 30–45 s, A2 45–60 s, B1 1–2 min,
  B2–C2 2–3 min.

SPOKEN INTERACTION
- Escreva PARA o aluno: "You and the examiner…", "The examiner is the server. Ask…". Nunca "the learner"
  ou "the assessor".
- Dê as opções concretas da discussão (ex.: quatro atividades) e o objetivo final (chegar a um acordo,
  escolher duas, negociar uma recomendação).

MEDIATION (escrita)
- Texto-fonte curto + tarefa que manda ESCREVER para outra pessoa, com propósito ("Write a message to
  your classmate…"). Fontes em português são bem-vindas (mediação entre línguas).
- Extensões: A1 20–35 palavras, A2 30–50, B1 60–90, B2 90–130, C1 130–180, C2 160–220.
- Separe a fonte e a tarefa com a linha "**Task:** …".

FORMATO DE SAÍDA (markdown exatamente assim)

Reading tasklet:
### R-B1-005 — Título do texto
**Topic:** tema  
**Genre:** gênero  
**Audience:** general  
**Input length:** ~240 words  
**Source:** referência ABNT completa, com "Disponível em: … Acesso em: …"   ← só se o texto for externo
**License:** licença                                                       ← só se o texto for externo
**Credit:** Texto: autor/instituição, licença.                             ← só se o texto for externo
**Adaptation:** o que foi recortado ou omitido                             ← só se o texto for externo

#### Input

(texto)

#### Items

1. **R-B1-005-Q1 — main_idea (difficulty 3/5)**

(pergunta)

- **A.** …
- **B.** …
- **C.** …
- **D.** …

(… Q2 a Q4 …)

#### Answer key & metadata

| Item | Key | Subskill | Difficulty |
|---|:---:|---|:---:|
| `R-B1-005-Q1` | **C** | main_idea | 3/5 |

Language Use:
16. **LU-B1-016 — collocation (difficulty 3/5)**

(frase com ___)

- **A.** …
- **B.** …
- **C.** …
- **D.** …

(e uma linha na tabela "Answer key & metadata" do nível: | `LU-B1-016` | **B** | collocation | 3/5 |)

Writing / Spoken Production / Spoken Interaction / Mediation:
### W-B1-004 — informal_email
**Target length:** 100–120 words

**Prompt:** (uma linha só)

### SP-B1-004 — opinion_long_turn
**Target speaking time:** 1–2 minutes

**Prompt:** (uma linha só)

### SI-B1-004 — collaborative_decision
**Suggested duration:** 4–5 minutes

**Task:** (uma linha só, falando com o aluno)

### M-B1-003 — relay_specific_information
**Suggested duration:** 60–90 words

(texto-fonte)

**Task:** (uma linha só)

AUTOVERIFICAÇÃO (responda no fim, item por item)
- Cada distrator de Reading usa algo do texto? Qual relação errada ele explora?
- Algum distrator tem palavra absoluta que o texto não usa?
- Alguma opção de Language Use não existe em inglês ou seria aceita no inglês britânico ou americano?
- O gabarito é a opção mais longa? Em quantos itens?
- As letras dos gabaritos estão equilibradas?
- Alguma instrução usa vocabulário acima do nível?
- Algum tema repete a lista de temas já usados?
- Writing e Mediation têm meta em palavras? Interaction fala com o aluno?
````

---

## Parte 4 — Revisão humana antes de publicar

1. **Resposta às cegas:** um professor que não escreveu os itens responde sem ver o gabarito. Toda
   divergência é discutida. Se o distrator puder ser defendido, ele é reescrito.
2. **Teste de esperteza:** alguém tenta acertar sem ler o texto, só pelas opções. Se acertar mais do que o
   acaso permite, os distratores estão fracos.
3. **Nível:** confira as estruturas e palavras novas no English Grammar Profile e no English Vocabulary
   Profile.
4. **Fonte:** confira a licença e a referência ABNT de todo texto externo (`AUTHENTIC_TEXT_SOURCES.md`).
5. **Validador e testes:** a Parte 2 inteira, com o CI do PR verde.
6. **Depois da aplicação real:** com dados de alunos, a análise de itens do app (facilidade e
   discriminação, a partir de 100 respostas) indica o que reescrever na próxima versão.
