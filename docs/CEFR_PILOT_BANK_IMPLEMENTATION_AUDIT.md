# CEFR Pilot Bank v0.1 — auditoria e implementação

## Resultado

O conteúdo de `LangSpot_CEFR_Pilot_Bank_v0.1.md` foi importado sem alteração pedagógica: 198 unidades avaliativas, 24 tasklets de Reading/Listening e todos os metadados globais `approved_for_pilot`, `uncalibrated` e `pilot-0.1`.

O adaptive engine não foi alterado nem ampliado.

## Arquitetura auditada antes da alteração

- `question_bank` já era o catálogo reutilizável e possuía UUID interno, nível, categoria, tipo, prompt, alternativas, resposta, skill, subskill, dificuldade, task type, tópico, gênero, público e estado de qualidade.
- `assessment_sections` representa uma seção/tasklet de uma prova específica. Ela não é adequada para guardar o input reutilizável do banco porque pertence a um `assessment` e é recriada durante o autosave.
- `assessment_questions` referencia `question_bank` e mantém um snapshot imutável do item usado pela prova.
- os fluxos de Listening, Writing, Speaking e Mediation já oferecem mídia privada, resposta longa, gravação e correção por rubrica.
- `assessment_rubric_scores` já persiste a correção analítica por dimensão.
- `cefr_descriptors` e `question_cefr_descriptors` já permitem relacionar itens a descritores, mas o Pilot Bank não fornece IDs de descritores oficiais.
- não existe uma camada repository separada; a leitura simples do banco está em `AuthApp.tsx`, e os workflows transacionais de avaliações estão em RPCs SQL consumidas por `assessmentService.ts`.

## Lacunas reais e menor extensão aplicada

1. O UUID técnico não preservava o ID pedagógico. Foi adicionado `question_bank.external_id`, único, sem substituir o UUID usado pelas FKs existentes.
2. Não havia entidade reutilizável para o texto/script pai. Foi criada `question_bank_tasklets`, e os 96 itens de Reading/Listening receberam FK e posição no pai.
3. O catálogo exigia `teacher_id`. O banco piloto passou a ser conteúdo compartilhado, somente leitura, com `source_origin = 'cefr_pilot'` e `teacher_id = null`; conteúdo autoral de professores continua privado e editável apenas pelo dono.
4. `answer` não aceitava `NULL`. Agora tarefas produtivas do Pilot Bank guardam `answer = NULL`, alternativas vazias e rubrica obrigatória.
5. Foram adicionados campos para `answer_key`, versão do banco, estado psicométrico, evidência primária, restrições de resposta, rubrica e material-fonte.
6. O estado exato `approved_for_pilot` e o público `teen_adult` não existiam e foram incorporados sem remover valores legados.
7. `save_assessment_draft` passou a aceitar snapshots de itens compartilhados aprovados para piloto, preservando o isolamento da avaliação pelo professor.

## Mapeamento

| Conteúdo do Markdown | Estrutura |
|---|---|
| ID `R-B1-001-Q3` (formato do documento) | `question_bank.external_id` |
| ID do tasklet `R-B1-001` | `question_bank_tasklets.external_id` |
| texto de Reading | `question_bank_tasklets.input_text`, `input_kind = text` |
| script de Listening | `question_bank_tasklets.input_text`, `input_kind = audio_script` |
| duração estimada do áudio | `question_bank_tasklets.estimated_duration_seconds` |
| posição Q1–Q4 | `question_bank.tasklet_position` |
| nível, skill, subskill, dificuldade, tópico, gênero e público | colunas homônimas do catálogo/tasklet |
| alternativas A–D | `question_bank.options` |
| letra da chave e texto correto | `answer_key` e `answer` |
| prompts produtivos | `question_bank.prompt` |
| target e duração-alvo | `question_bank.response_constraints` |
| primary evidence | `question_bank.primary_evidence` |
| fonte de Mediation | `question_bank.source_material` |
| rubricas | `question_bank.rubric`, copiada para o snapshot da avaliação |
| status/versionamento | `quality_status`, `psychometric_status`, `bank_version` |

Para itens objetivos, o documento não declara um campo separado chamado “task type”; o formato estrutural foi mapeado como `multiple_choice`, sem inventar uma classificação pedagógica adicional. Nos prompts produtivos, o valor após o ID foi preservado em `task_type` e `subskill`.

## Rubricas produtivas

- Writing: Task Achievement, Range, Accuracy, Organisation & Cohesion e Register & Pragmatic Appropriacy.
- Spoken Production: rubrica oral sem Interaction, conforme a instrução explícita do banco.
- Spoken Interaction: rubrica oral completa, incluindo Interaction.
- Mediation: Information Selection, Accuracy of Meaning, Reformulation, Organisation, Audience Appropriacy e Language Control.

## Inventário importado

| Skill | A1 | A2 | B1 | B2 | C1 | C2 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Reading | 8 | 8 | 8 | 8 | 8 | 8 | 48 |
| Listening | 8 | 8 | 8 | 8 | 8 | 8 | 48 |
| Language Use | 10 | 10 | 10 | 10 | 10 | 10 | 60 |
| Writing | 2 | 2 | 2 | 2 | 2 | 2 | 12 |
| Spoken Production | 2 | 2 | 2 | 2 | 2 | 2 | 12 |
| Spoken Interaction | 2 | 2 | 2 | 2 | 2 | 2 | 12 |
| Mediation | 1 | 1 | 1 | 1 | 1 | 1 | 6 |
| **Total** | **33** | **33** | **33** | **33** | **33** | **33** | **198** |

## Validações automatizadas

O parser e o validador SQL verificam IDs únicos, 198 unidades, 24 tasklets, contagem por skill/nível, associação tasklet-item, quatro alternativas distintas, resposta presente nas opções, chave A–D, skills e níveis conhecidos, subskill não vazia, rubricas produtivas e ausência de resposta objetiva em tarefas produtivas. O teste de banco executa o seed duas vezes e confirma que as contagens permanecem iguais.

## Observações do conteúdo-fonte

- Não foram encontradas divergências de contagem, IDs duplicados, alternativas duplicadas, chaves ausentes ou comprimentos declarados incorretos.
- O exemplo do pedido usa `R-B1-001-Q03`, mas a fonte pedagógica usa `R-B1-001-Q3`. Como o Markdown foi definido como fonte de verdade, o ID foi preservado exatamente como `R-B1-001-Q3`, sem zero adicional.
- O documento fornece scripts, mas não arquivos de áudio. Os itens de Listening ficam disponíveis no catálogo com o transcript integral; uma prova não pode ser publicada até que o áudio correspondente seja preparado e associado, mantendo a regra operacional existente.
- O documento não fornece IDs de descritores CEFR nem descritores operacionais individuais. Nenhum vínculo com `cefr_descriptors` foi inventado.
- As tarefas produtivas não declaram dificuldade numérica; o valor permanece `NULL`.
- Em Mediation, o prompt completo é preservado literalmente e o trecho-fonte também é separado em `source_material` para o renderer e a rubrica existentes.

## Execução local

```bash
npm run cefr:pilot:validate
npm run test:cefr:pilot
npm run cefr:pilot:build-seed
npx supabase db reset
```

Para aplicar somente o seed em um banco que já possui a migration:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seeds/cefr_pilot_bank_v0_1.sql
```

Validação completa usada no repositório:

```bash
npm test
npm run typecheck
npm run build
npm run test:assessments:db
```
