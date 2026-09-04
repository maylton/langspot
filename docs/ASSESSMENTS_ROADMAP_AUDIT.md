# Auditoria do roadmap de Assessments

Data da auditoria: 2026-09-04
Branch: `feature/assessments-foundation`

## Resultado por fase

| Fase | Resultado | Evidência principal |
|---|---|---|
| 0 — baseline | Conforme | branch isolada, `node_modules` fora do tracking, build e typecheck verdes |
| 1 — Question Engine | Conforme | domínio compartilhado em `src/domains/questions`, grading/normalização/validação/randomização e testes |
| 2 — fundação | Conforme | domínio modular, services, navegação e flag de rollback sem lógica grande nova nos monólitos |
| 3 — banco | Conforme | sete entidades-base, FKs, constraints, índices, timestamps, RLS e aplicação limpa das migrations |
| 4 — Teacher Builder | Conforme | draft, seções, quatro tipos objetivos, validação, preview, publicação e atribuição |
| 5 — Student Runner | Conforme | início, timer do servidor, navegação, autosave, fila IndexedDB, retomada e envio |
| 6 — grading seguro | Conforme | RPCs autenticados; payload ativo não contém `answer` nem gabarito |
| 7 — resultados | Conforme | notas por questão/seção, visibilidade configurável e revisão manual |
| 8 — integridade | Conforme | randomização seeded, pools, eventos, conflito de sessão e painel sem punição automática |
| 9 — placement adaptativo | Conforme | estado no servidor, estimador, seletor, stopping rules, CEFR/modelo versionados e testes de percursos variáveis |
| 10 — Listening | Implementado e validado em web/build | Storage privado, URL temporária, plays atômicos, evento por play e transcrição filtrada durante a tentativa |
| 11 — Writing | Conforme | resposta longa, autosave offline, paste event, rubrica e bloqueio em `grading` até review |
| 12 — Speaking | Implementado; validação nativa pendente | permissão sob demanda, preparação, MediaRecorder, upload privado, playback, rubrica e retenção de 180 dias |
| 13 — progresso | Conforme | histórico longitudinal, comparação por skill, integração em `student_records` e confirmação auditável de nível |
| 14 — hardening | Parcial por ambiente | auditoria RLS e E2E SQL verdes, build web e inspeção visual verdes, code splitting aplicado; APK e AppImage bloqueados por toolchains ausentes |

## Verificações executadas

- 35 testes Vitest em oito arquivos.
- TypeScript sem erros.
- build Vite de produção sem alerta de chunk acima de 500 kB após lazy loading do domínio.
- migrations de Assessments aplicadas do zero em PostgreSQL 17 descartável.
- smoke E2E SQL: teacher/student/outro aluno, publicação, tentativa, não vazamento de transcript, limite de plays, Listening objetivo, Writing, Speaking, Storage RLS, rubricas, revisão, retenção, progresso e confirmação de nível.
- `cap sync android` concluído com assets e manifesto atualizados.
- tela inicial carregada no navegador interno sem overlay de erro e com conteúdo significativo.

## Segurança e arquitetura

- Gabarito só aparece no relatório autenticado do professor.
- Transcript só entra no payload ativo quando configurado como `always`; `after_submit` é liberado apenas no resultado visível e concluído.
- Bucket `assessment-audio` é privado; policies validam professor, aluno, tentativa, questão, tipo e caminho exato.
- Contador de Listening usa update atômico com lock da tentativa e grava evento auditável.
- Caminho de Speaking é calculado no servidor; o registro rejeita formato, duração, questão ou objeto ausente.
- Writing e Speaking nunca recebem score oficial do cliente: a nota é validada no servidor e a rubrica é conferida contra o snapshot publicado.
- Mídia de Speaking recebe `retention_until` de 180 dias e função privada para limpeza agendada por processo confiável.
- Nenhum proctoring invasivo ou captura contínua foi adicionado.
- Assessments continuam isolados em `src/domains/assessments`; `App.tsx` e `AuthApp.tsx` apenas integram navegação/lazy loading.

## Pendências externas para certificação nativa

1. Instalar JDK e executar `npm run android:build`; nesta máquina o Gradle parou por ausência de `JAVA_HOME`/`java`.
2. Executar em aparelho/emulador Android real para conceder microfone, gravar, enviar e reproduzir áudio.
3. Instalar Rust/Cargo e executar `npm run desktop:build`; nesta máquina o Tauri parou porque `cargo` não existe.
4. Aplicar as migrations no projeto Supabase remoto em uma janela controlada e repetir o E2E autenticado. Nenhum deploy remoto foi feito nesta implementação.

Essas pendências impedem declarar os DoDs nativos das fases 12 e 14 como certificados, mas não deixam código ou migration conhecidos por corrigir no repositório.
