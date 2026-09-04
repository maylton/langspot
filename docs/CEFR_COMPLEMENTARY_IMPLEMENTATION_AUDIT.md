# Auditoria da implementação complementar CEFR

Data: 2026-09-04  
Especificação: `LangSpot_CEFR_Assessment_Specification.md` v0.1  
Plano: `LangSpot_CEFR_Implementation_Complementary_Plan.md`

## Resultado

O CEFR foi implementado como uma especialização aditiva do domínio genérico de avaliações. Avaliações escolares existentes continuam usando `framework = none`; avaliações de proficiência usam `framework = cefr`. Nenhum resultado ou histórico anterior é sobrescrito.

## Matriz de aderência

| Requisito | Situação | Evidência |
|---|---|---|
| Infraestrutura genérica, assignment, attempt, autosave e correção segura | Já existia e foi preservado | RPCs e tabelas de assessments anteriores à migração CEFR |
| `framework: none/cefr` e versões de form, decisão, routing e relatório | Implementado | `20260904104029_add_cefr_assessment_layer.sql` |
| Skills oficiais separadas | Implementado | tipos TS, constraint de seções e perfil CEFR |
| Metadados, filtros, qualidade, exposição e descritores | Implementado | Question Bank, editor e `cefr_descriptors` |
| Placement fixo 24 Reading + 24 Listening + 30 Language Use | Implementado como blueprint | botão “Placement CEFR”, 18 blocos A1–C2, total-alvo de 78 itens |
| Tasklets, confirmação e regra 0–3 / 4–5 / 6–8 | Implementado e testado | `cefr.ts`, metadados de seção e log adaptativo |
| Matching, multiple response e short answer | Implementado | motor compartilhado, renderer e correção server-side |
| Writing por dimensões CEFR | Implementado | rubrica analítica de cinco dimensões, bandas A1–C2 |
| Listening seguro | Já existia e foi integrado | áudio privado, limite atômico de plays, transcript restrito e Device Check |
| Speaking Production/Interaction | Adaptado | skills separadas, gravação privada e rubrica CEFR de sete dimensões |
| Mediation | Implementado | tipo, material-fonte, resposta longa, rubrica e perfil |
| Perfil por skill/dimensão, strengths, priorities, confidence e flags | Implementado | snapshots e `CefrProfileReport` |
| Override humano com justificativa e auditoria | Implementado | `assessment_cefr_overrides` e RPC de override |
| Histórico longitudinal imutável | Implementado | `student_cefr_profile_snapshots` |
| Analytics de item | Implementado com proteção | facility, tempo, amostra e discriminação somente com amostra mínima |
| Calibração psicométrica | Corretamente bloqueada | status `insufficient_data`; não são inventados cut scores, equating ou validade |
| IA como única avaliadora | Não utilizada | productive skills continuam dependendo do professor/rater |

## Salvaguardas pedagógicas

- O resultado principal de uma avaliação CEFR é o perfil, não a porcentagem.
- Language Use permanece evidência complementar.
- O overall usa nível central e proteção das habilidades produtivas; não é média simples.
- Perfis muito discrepantes, baixa evidência e lacunas produtivas geram revisão manual.
- Todas as telas CEFR exibem `PROVISIONAL INTERNAL STANDARD` e deixam claro que o resultado não é certificação oficial.
- Placement CEFR só publica itens com `qualityStatus = approved`.
- O modo adaptativo CEFR exige o banco mínimo previsto antes da publicação. A coleta e o log estão prontos, mas a alegação de calibração permanece bloqueada até haver dados reais.

## Pendências que dependem de conteúdo ou dados reais

Estas não são falhas de código e não podem ser fabricadas pela implementação:

1. Produzir, revisar e aprovar o banco mínimo de itens e tasklets por nível.
2. Popular descritores com texto licenciado ou paráfrases operacionais aprovadas.
3. Criar benchmarks e executar treinamento/padronização de raters.
4. Coletar volume suficiente para análise clássica, confiabilidade, IRT/Rasch, equating e revisão de cut scores.
5. Conduzir estudos formais de standard setting e validação antes de qualquer alegação externa forte.

## Validação automatizada

- TypeScript: `npm run typecheck`
- Unit/integration: `npm test`
- Build web: `npm run build`
- PostgreSQL/RLS/RPC: `npm run test:assessments:db`

O smoke test de banco cobre também placement CEFR fixo, multiple response, matching, geração do perfil, versões de regra, override auditável e snapshots históricos.
