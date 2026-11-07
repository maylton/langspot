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
