# Guia de elaboração de itens de compreensão (Reading e Listening)

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
  `scripts/cefr_pilot_bank_v0_5_options.py` guarda as alternativas novas, e o gabarito mantém a letra,
  então a distribuição A/B/C/D não mudou.
- `scripts/cefr-pilot-bank-v0_5-distractors.py` gera `LangSpot_CEFR_Placement_Pilot_Bank_v0.5.md` a
  partir da v0.4.
- **Listening** (desativado no momento) ainda não foi revisado. Aplique este guia antes de reativá-lo.

## Referências

- CAMBRIDGE ASSESSMENT ENGLISH. *B2 First: handbook for teachers*. Cambridge: UCLES. Disponível em:
  https://www.cambridgeenglish.org/Images/167791-b2-first-handbook.PDF. Acesso em: 7 nov. 2026.
- CAMBRIDGE ASSESSMENT ENGLISH. *B1 Preliminary: handbook for teachers*. Cambridge: UCLES. Disponível em:
  https://www.cambridgeenglish.org/Images/168150-b1-preliminary-teachers-handbook.pdf. Acesso em: 7 nov. 2026.
- HALADYNA, T. M.; DOWNING, S. M.; RODRIGUEZ, M. C. A review of multiple-choice item-writing guidelines
  for classroom assessment. *Applied Measurement in Education*, v. 15, n. 3, p. 309-333, 2002.
- EUROPEAN BOARD OF MEDICAL ASSESSORS. *Guidelines for writing multiple-choice questions*. 2017.
  Disponível em: https://www.ebma.eu/wp-content/uploads/2019/02/EBMA-guidelines-for-item-writing-version-2017_3.pdf.
  Acesso em: 7 nov. 2026.

Os exemplos da Cambridge foram usados só para análise. Nenhum texto ou item deles foi copiado para o
banco.
