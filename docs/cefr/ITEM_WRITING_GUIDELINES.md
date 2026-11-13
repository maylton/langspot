# Guia de elaboração de itens do Pilot Bank

Vale para o Pilot Bank a partir da versão 0.5 e para qualquer item novo de múltipla escolha baseado
em texto. As regras marcadas com ✔ são verificadas automaticamente por `scripts/cefr-pilot-bank.mjs`.

## Por que este guia existe

Num teste simulado de B1 (nov. 2026), um professor fluente acertou quase todas as questões de texto
sem precisar ler com atenção: dava para descartar as alternativas erradas pela forma, sem entender o
texto. A auditoria do banco v0.4 confirmou o problema nas 96 questões de Reading:

| Pista que entrega a resposta | v0.4 | v0.5 |
|---|---|---|
| Palavra absoluta (all, every, only, never…) só nos distratores | 24% (B2: 62%) | 1% |
| Dois ou mais distratores sobre coisas que não estão no texto | 21% (B1: 44%) | 5% |
| Gabarito é a alternativa mais "copiada" do texto | 38% (B1: 62%) | 11% |

Os exames da Cambridge (B1 Preliminary, B2 First) e a literatura de elaboração de itens
(Haladyna, Downing & Rodriguez, 2002) apontam o mesmo caminho: um distrator só funciona se parecer
correto para quem **não** entendeu o texto.

## O que um bom distrator faz

Cada alternativa errada deve se apoiar em algo que **está no texto**, mas com a relação errada.
Exemplos do próprio banco (v0.5):

1. **Causa trocada.** R-B1-003-Q3: o texto explica que as atividades ficaram mais rápidas porque
   houve menos interrupções, e nega que os alunos tenham ficado mais esforçados; o distrator
   "Students had become more hardworking than they were before" oferece justamente a causa negada.
2. **Pessoa, lugar ou momento trocados.** R-A1-002-Q2: o texto diz "the café *opposite* the centre";
   o distrator diz "the café *inside* the centre".
3. **Verdadeiro, mas não responde à pergunta.** R-C2-001-Q4: "Vivid stories spread faster than the
   corrections that follow them" é dito no texto, mas a pergunta é sobre o sentido de *exempt from
   questions*.
4. **A posição que o autor critica, apresentada como dele.** R-C1-001-Q1: "Institutions should resolve
   uncertainty before acting" é exatamente o que o texto questiona.
5. **Generalização de um detalhe.** R-B1-001-Q1: "how a retired electrician repaired the writer's
   broken old toaster" é um episódio do texto, não o assunto principal.
6. **Isca de palavra (word spotting).** O distrator repete uma palavra marcante do texto
   ("concentrating", "pretend"); o gabarito diz a mesma ideia com outras palavras.

## Regras

- ✔ **Sem absolutos de graça.** Não use all / every / always / never / only / none / nothing /
  nobody / completely / entirely / totally num distrator se o texto não usa a palavra (ou se o
  gabarito não usa um absoluto também). O candidato descarta essas opções sem ler.
- ✔ **Tamanho não pode indicar a resposta.** Em cada nível, o gabarito pode ser a alternativa mais
  longa em no máximo 35% dos itens de compreensão. Mire em menos de 25%: alongue um distrator em vez
  de encurtar demais o gabarito.
- **Gabarito parafraseado.** A partir do A2, não copie a frase do texto na resposta certa. No A1 a
  habilidade é localizar a informação, então repetir o dado (um horário, um lugar) é aceitável; nesse
  caso os distratores devem ser **outros dados do mesmo texto** (outros horários, outros lugares).
- **Opções homogêneas.** As quatro alternativas têm a mesma forma gramatical, o mesmo registro e
  extensão parecida.
- **Um único gabarito defensável.** Se um distrator puder ser defendido com uma frase do texto como
  resposta à pergunta feita, reescreva-o. Peça a outra pessoa para responder sem ver o gabarito.
- **Sem conhecimento externo.** Nenhuma alternativa pode ser eliminada (ou escolhida) só por
  conhecimento de mundo, sem ler o texto.
- **Ordem do texto.** As perguntas seguem a ordem em que a informação aparece; a última pode tratar
  do texto como um todo.

## Checklist antes de incluir um item

1. Cada distrator usa algo que está no texto?
2. Alguém que leu só por cima escolheria algum distrator?
3. O gabarito diz a ideia com outras palavras (A2 ou acima)?
4. Nenhum distrator tem absoluto que o texto não usa?
5. O gabarito não é visivelmente o mais longo?
6. Um colega encontrou a mesma resposta sem ver o gabarito?

## Como a v0.5 foi feita

- As 96 questões de Reading foram revisadas: todas as de B1 a C2 e as fracas de A1 e A2.
  `scripts/pilot-bank/cefr_pilot_bank_v0_5_options.py` guarda as alternativas novas, e o gabarito mantém a letra,
  então a distribuição A/B/C/D não mudou.
- `scripts/pilot-bank/cefr-pilot-bank-v0_5-distractors.py` gera `history/LangSpot_CEFR_Placement_Pilot_Bank_v0.5.md` a
  partir da v0.4.
- **Listening** (desativado no momento) ainda não foi revisado. Aplique este guia antes de reativá-lo.

## Language Use (gramática e vocabulário)

### Como as provas de referência medem

| Prova | Formato | O que diferencia as opções |
|---|---|---|
| Cambridge B1 Preliminary / B2 First (Use of English) | Textos com lacunas: múltipla escolha, lacuna aberta, formação de palavras e reescrita com palavra-chave | As quatro opções são da mesma classe e quase sinônimas; só uma cabe por **colocação, regência ou padrão gramatical** (*It is **believed to** be* × *regarded as*) |
| Linguaskill (Cambridge) | Frases com lacuna (3–4 opções) e textos com lacuna, de múltipla escolha ou abertos | Opções reais, plausíveis, uma única correta |
| Aptis (British Council) | 25 frases de gramática (3 opções) e 25 de vocabulário: sinônimo, sentido no contexto, definição e colocação | Pontos gramaticais tirados do *British Council/EAQUALS Core Inventory* por nível |

O nosso formato (frase com lacuna, 4 opções) corresponde às "gapped sentences" do Linguaskill e à parte de
gramática do Aptis. O nível de cada estrutura e de cada palavra deve ser conferido no *English Grammar
Profile* e no *English Vocabulary Profile* (Cambridge), que registram em que nível CEFR os aprendizes passam
a usar cada item.

### Regras

- ✔ **Tamanho não pode indicar a resposta**, como em Reading: no máximo 35% por nível.
- **Só formas reais.** Toda opção é uma palavra, forma ou frase que existe em inglês e está errada **só
  naquele contexto**. Invenções como *create up*, *increases up*, *whose it*, *did we have seen* são
  eliminadas sem conhecer a estrutura testada.
- **Distratores vindos de erros reais.** Os melhores distratores são os erros que os alunos cometem. Para
  falantes de português: *lose the bus*, *make a photo*, *take a conclusion*, *is believed that*, *it can
  rain later*, *rise* × *raise*, *succeed to*.
- **Mesma classe e mesma função.** Em vocabulário, as quatro opções são da mesma classe (quatro adjetivos,
  quatro verbos). Em gramática, todas preenchem a mesma posição sintática.
- **Um único gabarito, no inglês britânico e no americano.** Elimine a opção que algum desses usos aceita
  (*take a decision* é britânico; *I didn't finish it yet* é americano; *criticism diluted by praise* é
  correto). Na dúvida, troque a opção.
- **Itens funcionais** (respostas em diálogo): os distratores são respostas coerentes e gramaticais para a
  função errada. Exemplo: *Do you mind if I open the window?* → *Yes, please do.* (sim = "me incomoda").
  Respostas absurdas ou com erro gramatical não servem.
- **Itens de registro:** as quatro frases são gramaticais e de tom parecido. A diferença está em um ou dois
  traços (imperativo sem atenuação, quantificador informal, certeza excessiva), nunca em caricaturas como
  *like*, *totally* ou *terrible*.

A v0.6 revisou 46 dos 90 itens de Language Use com essas regras. Os demais já as seguiam.

## Tarefas de produção (Writing, Speaking e Mediation)

### Como as provas de referência fazem

- **Writing (Cambridge):** a tarefa sempre diz **para quem** e **por quê** se escreve e lista os pontos de
  conteúdo. B1 Preliminary: e-mail de cerca de 100 palavras, respondendo a uma mensagem com quatro
  anotações. B2 First: ensaio de 140–190 palavras com **duas ideias dadas e uma terceira do candidato**.
  C1 Advanced: 220–260 palavras. C2 Proficiency: 240–320 palavras.
- **Speaking (Cambridge):** monólogos curtos e focados (cerca de 1 minuto no B1 e no B2, 2 minutos no C2),
  com uma pergunta clara para responder. As tarefas de interação têm um examinador que conduz.
- **Mediation (CEFR Companion Volume, 2020):** o aluno retransmite informação específica, explica dados ou
  processa um texto **para outra pessoa**, com um propósito, e muitas vezes passa de uma língua para outra
  (por exemplo, de um aviso em português para uma mensagem em inglês).

### Regras

- ✔ **Writing e Mediation com meta em palavras.** O app recolhe texto escrito; meta em segundos ou minutos
  não faz sentido para o aluno.
- ✔ **Tarefa escrita para o aluno.** Use "you" e "the examiner". Nunca descreva a tarefa em terceira pessoa
  ("the learner and the assessor…"): na prova gravada o aluno lê exatamente esse texto.
- **Extensões alinhadas à Cambridge:** A1 20–35 palavras, A2 40–70, B1 100–120, B2 140–190, C1 220–260 e
  C2 280–320. Mediation escrita: A1 20–35, A2 30–50, B1 60–90, B2 90–130, C1 130–180 e C2 160–220.
- **Destinatário, propósito e gênero sempre explícitos**: "Write an email to Alex…", "Write a report for the
  centre's management committee…".
- **Instrução abaixo do nível testado.** Em A1/A2 o enunciado só usa vocabulário de A1/A2 (nada de *host
  family*). Quem não entende a instrução não mostra o que sabe escrever.
- **Pontos de conteúdo numerados ou em lista.** Três ou quatro, todos avaliáveis. No ensaio B2, use duas ideias
  dadas mais "your own idea".
- **Nenhum tema repetido dentro da mesma forma.** O tema de uma tarefa de produção não pode ser o de um texto
  de Reading nem o de outra tarefa que a mesma prova pode sortear (mesmo nível, piso e teto). Na v0.7 saíram,
  por exemplo, "decisões reversíveis" (estava no Reading C1 e em duas tarefas de fala) e "interrupções no
  trabalho" (em três tarefas do B2).
- **Spoken Interaction depende de um interlocutor.** Ela funciona melhor **ao vivo**, conduzida pelo professor
  (opção "Ao vivo" no editor). Gravada, a tarefa precisa ser um cartão completo para o aluno.
- **Formatação:** listas com "-" e negrito com `**…**` aparecem formatados para o aluno. Não use outros
  recursos de markdown.

## Referências

- CAMBRIDGE ASSESSMENT ENGLISH. *B2 First: handbook for teachers*. Cambridge: UCLES. Disponível em:
  https://www.cambridgeenglish.org/Images/167791-b2-first-handbook.PDF. Acesso em: 7 nov. 2026.
- CAMBRIDGE ASSESSMENT ENGLISH. *B1 Preliminary: handbook for teachers*. Cambridge: UCLES. Disponível em:
  https://www.cambridgeenglish.org/Images/168150-b1-preliminary-teachers-handbook.pdf. Acesso em: 7 nov. 2026.
- HALADYNA, T. M.; DOWNING, S. M.; RODRIGUEZ, M. C. A review of multiple-choice item-writing guidelines
  for classroom assessment. *Applied Measurement in Education*, v. 15, n. 3, p. 309-333, 2002.
- BRITISH COUNCIL. *Aptis grammar and vocabulary test*. Disponível em:
  https://www.britishcouncil.org/exam/aptis/practice-materials/grammar-vocabulary. Acesso em: 7 nov. 2026.
- CAMBRIDGE ASSESSMENT ENGLISH. *Linguaskill: exam format and task types*. Disponível em:
  https://www.cambridgeenglish.org/exams-and-tests/linguaskill/information-about-the-exam/exam-formats-and-task-types/.
  Acesso em: 7 nov. 2026.
- O'KEEFFE, A.; MARK, G. The English Grammar Profile of learner competence: methodology and key findings.
  *International Journal of Corpus Linguistics*, v. 22, n. 4, p. 457-489, 2017.
- CAPEL, A. The English Vocabulary Profile. In: HARRISON, J.; BARKER, F. (ed.). *English Profile in
  practice*. Cambridge: Cambridge University Press, 2015.
- NORTH, B.; ORTEGA, A.; SHEEHAN, S. *British Council – EAQUALS Core Inventory for General English*.
  London: British Council, 2010.
- EUROPEAN BOARD OF MEDICAL ASSESSORS. *Guidelines for writing multiple-choice questions*. 2017.
  Disponível em: https://www.ebma.eu/wp-content/uploads/2019/02/EBMA-guidelines-for-item-writing-version-2017_3.pdf.
  Acesso em: 7 nov. 2026.

Os exemplos da Cambridge foram usados só para análise. Nenhum texto ou item deles foi copiado para o
banco.
