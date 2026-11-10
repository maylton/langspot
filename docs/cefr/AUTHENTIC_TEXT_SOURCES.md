# Textos autênticos do Pilot Bank

Desde a versão 0.4, cada nível CEFR tem um texto de Reading autêntico, ou seja, escrito para leitores reais e não para a prova. Os itens (perguntas e alternativas) são originais do LangSpot.

## Regra para incluir um texto

A referência ABNT dá crédito, mas **não autoriza** a reprodução. Pela Lei n. 9.610/1998 (art. 46), sem autorização só se pode citar trechos curtos para estudo, crítica ou polêmica; um texto inteiro num banco de provas de uma plataforma comercial não se enquadra nisso. Por isso o banco aceita apenas textos que **podem ser reutilizados legalmente**:

- **domínio público**: obras do governo dos EUA, como NPS e VOA (17 U.S.C. § 105); conteúdo da Wikinews publicado antes de 25 set. 2005; obras cujo autor morreu há mais de 70 anos (Lei 9.610/1998, art. 41);
- **licenças abertas que permitem uso comercial e adaptação**: CC BY, ou CC BY-SA se aceitarmos compartilhar as derivações pela mesma licença.

Ficam de fora: matérias da VOA adaptadas de agências (AP, Reuters, AFP), textos sob licença “NoDerivatives” (ND) quando o texto for recortado, e qualquer texto sem licença explícita.

Cada tasklet externo registra no banco (`question_bank_tasklets`) a referência ABNT (NBR 6023:2018), a licença, o crédito curto exibido ao aluno embaixo do texto (exigência da CC BY) e o grau de adaptação. `scripts/cefr-pilot-bank.mjs` rejeita um tasklet externo sem qualquer um desses campos ou sem “Disponível em” e “Acesso em” na referência.

## Textos da versão 0.4

| Tasklet | Nível | Texto | Licença | Adaptação |
|---|---|---|---|---|
| `R-A1-004` | A1 | Grand Canyon Visitor Centers (42 palavras) | Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403). | Trecho com informações de dois centros de visitantes; texto original, diagramado como aviso. |
| `R-A2-004` | A2 | Making Healthy Choices (171 palavras) | Domínio público — conteúdo produzido pela Voice of America (VOA Terms of Use; Request Our Content). | Trecho inicial do diálogo, sem alterações; inclui a nota original sobre “Healthy” e “Junky”. |
| `R-B1-004` | B1 | Leave What You Find (243 palavras) | Domínio público — obra do governo dos Estados Unidos (17 U.S.C. § 105); reprodução de obra do U.S. Government (17 U.S.C. § 403). | Trecho; frases originais, omissões indicadas por […]. |
| `R-B2-004` | B2 | Soda Leaves High Schools (284 palavras) | Creative Commons Atribuição 2.5 Genérica (CC BY 2.5) — https://creativecommons.org/licenses/by/2.5/ — crédito: Wikinews. | Cinco primeiros parágrafos; texto sem alterações. |
| `R-C1-004` | C1 | Reading Lost Classics with Infrared Light (523 palavras) | Domínio público — artigo da Wikinews publicado antes de 25 set. 2005 (Wikinews:Copyright). | Trecho do início até a seção “Classical and Christian Writings”; intertítulos removidos, texto sem alterações. |
| `R-C2-004` | C2 | On Silencing an Opinion (723 palavras) | Domínio público — autor falecido em 1873 (Lei n. 9.610/1998, art. 41); obra em domínio público nos Estados Unidos. | Trecho do capítulo II; texto sem alterações (itálicos do original não reproduzidos). |

## Referências

- NATIONAL PARK SERVICE (Estados Unidos). Visitor centers, information desks, and museums. Grand Canyon National Park, 12 out. 2026. Disponível em: https://www.nps.gov/grca/planyourvisit/visitorcenters.htm. Acesso em: 6 nov. 2026.
- VOICE OF AMERICA. Lesson 44: making healthy choices. In: LET'S LEARN English: level 1. Washington, DC: VOA Learning English, 13 jul. 2019. Disponível em: https://learningenglish.voanews.com/a/lets-learn-english-lesson-44-making-healthy-choices/3688552.html. Acesso em: 6 nov. 2026.
- NATIONAL PARK SERVICE (Estados Unidos). I didn't know that!: Leave No Trace principle #4 – leave what you find. [S. l.]: NPS, 23 dez. 2024. Disponível em: https://www.nps.gov/articles/000/idkt_lnt4.htm. Acesso em: 6 nov. 2026.
- SOFT drink companies to stop high school soda sales. Wikinews, [s. l.], 4 maio 2006. Disponível em: https://en.wikinews.org/wiki/Soft_drink_companies_to_stop_high_school_soda_sales. Acesso em: 6 nov. 2026.
- INFRARED technology enables recovery of lost classical writings. Wikinews, [s. l.], 20 abr. 2005. Disponível em: https://en.wikinews.org/wiki/Infrared_technology_enables_recovery_of_lost_classical_writings. Acesso em: 6 nov. 2026.
- MILL, John Stuart. On liberty. London: The Walter Scott Publishing, [1901]. Obra publicada originalmente em 1859. Disponível em: https://www.gutenberg.org/ebooks/34901. Acesso em: 6 nov. 2026.

## Textos da versão 0.8 (seis textos de Reading por nível)

A v0.8 acrescentou dois textos por nível, para que um aluno possa fazer vários Level Checks sem rever
textos (um mesmo nível aparece como piso, alvo e teto em provas diferentes). Os itens seguem
[`ITEM_AUTHORING_PROMPT.md`](ITEM_AUTHORING_PROMPT.md); os textos estão em
`scripts/cefr_pilot_bank_v0_8_texts.py` e, literalmente, em `scripts/cefr_pilot_bank_v0_8_authentic_texts.json`.

| Tasklet | Texto | Fonte | Licença |
|---|---|---|---|
| R-A1-005 | City Park Bike Hire | LangSpot (original) | — |
| R-A1-006 | Lost Cat | LangSpot (original) | — |
| R-A2-005 | What Can You Do? (diálogo) | VOA Learning English, Let’s Learn English, lição 20 | Domínio público (17 U.S.C. § 105) |
| R-A2-006 | My First Cooking Class | LangSpot (original) | — |
| R-B1-005 | Staying Safe Around Wildlife | National Park Service, Yellowstone | Domínio público (17 U.S.C. § 105) |
| R-B1-006 | A Marathon Under Two Hours | Wikinews, 13 out. 2019 | CC BY 2.5 |
| R-B2-005 | Our Moon in Numbers | NASA Science, “Earth’s Moon: facts” | Domínio público (17 U.S.C. § 105) |
| R-B2-006 | Pianos in the Station | LangSpot (original) | — |
| R-C1-005 | Rising Seas | Rebecca Lindsey, NOAA Climate.gov, 2023 | Domínio público; reutilização livre com atribuição (FAQ do Climate.gov) |
| R-C1-006 | Holding a Class’s Attention | William James, *Talks to Teachers on Psychology* (1899) | Domínio público (autor † 1910) |
| R-C2-005 | Modern Fiction | Virginia Woolf, *The Common Reader* (1925) | Domínio público (autora † 1941; publicado em 1925) |
| R-C2-006 | On Running After One’s Hat | G. K. Chesterton, *All Things Considered* (1908) | Domínio público (autor † 1936) |

Fontes descartadas nesta rodada:
- **Tradução inglesa de *The Montessori Method* (Anne E. George, 1912):** o direito do tradutor no Brasil
  vale até 70 anos após a morte dele, e a data de morte da tradutora não foi confirmada.
- **Páginas do CDC e da Biblioteca do Congresso:** bloquearam o download automático do texto literal.

No A1 e em parte do A2, avisos e textos curtos foram escritos pelo LangSpot. É o padrão das provas de
referência para esses níveis, e as páginas oficiais encontradas eram longas ou complexas demais.
