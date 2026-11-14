# LangSpot 1.6.2

Plataforma para professores independentes de idiomas: agenda, alunos, tarefas, quizzes, avaliações de nível CEFR,
materiais, financeiro e relatórios para o professor, e um portal para o aluno. Tudo sincronizado pelo Supabase.

Há quatro formas de usar a mesma conta e os mesmos dados:

| App | Onde | Tecnologia |
|---|---|---|
| **Site** (professor e aluno) | [langspot.vercel.app](https://langspot.vercel.app) | React + Vite (`src/`) |
| **App Android** | `android/` | Capacitor sobre o site |
| **Desktop (Web)** | `src-tauri/` | Tauri 2 sobre o site |
| **LangSpot para Linux** (professor) | `linux/` | Python, GTK4 e libadwaita, nativo — veja [`linux/README.md`](linux/README.md) |

## Funcionalidades

**Professor**
- visão geral, agenda (semana, mês e lista), conclusão de aulas com registro e pedidos de cancelamento;
- alunos: cadastro com senha temporária ou convite por e-mail, perfil, habilidades, sequência de estudos;
- tarefas com correção e comentários por trecho; quizzes interativos com banco de questões e geração por IA;
- **avaliações**: provas prontas de nível CEFR montadas para cada aluno (evitando o que ele já viu), editor completo,
  atribuição, provas atribuídas, acompanhamento ao vivo, aplicação ao vivo, fila de correção com rubrica CEFR,
  relatório do aluno, evolução e analytics;
- materiais (arquivos e links), financeiro, progresso da turma, relatórios e notificações;
- configurações do perfil e, para o administrador, convite e gestão de professores.

**Aluno**
- painel, aulas e pedidos de cancelamento, materiais, tarefas e quizzes, avaliações, metas, diário, flashcards,
  conquistas e perfil.

## Requisitos

- Node.js 20 ou superior;
- projeto Supabase e a Supabase CLI (migrations e Edge Functions);
- Docker, para o teste do banco de avaliações.

## Configuração local

```bash
cp .env.example .env
npm ci
npm run dev
```

No `.env`:

```env
VITE_APP_MODE=development          # development (com modo demonstração) | beta | production
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
VITE_ASSESSMENTS_ENABLED=true      # false só como rollback emergencial
```

## Banco e funções

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push --dry-run     # confira antes
npx supabase db push
npx supabase functions deploy invite-student invite-teacher accept-teacher-invite admin-teachers generate-quiz send-notification-emails
```

O banco piloto CEFR vem de `docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.10.md`: `npm run cefr:pilot:validate` confere
o documento e `npm run cefr:pilot:build-seed` gera `supabase/seed.sql`.

## Validação

```bash
npm run typecheck
npm test                       # Vitest
npm run test:cefr:pilot        # banco piloto
npm run test:assessments:db    # migrations e funções de avaliação num PostgreSQL descartável (Docker)
npm run build
```

O CI (`.github/workflows/validate-pr.yml`) roda tudo isso e os testes do app Linux em cada pull request. O roteiro de
lançamento está em [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

## Estrutura

```
src/
  main.tsx, AuthApp.tsx    entrada e roteamento por perfil (professor, aluno, convites, senha)
  App.tsx                  painel do professor (estado e navegação)
  types.ts                 tipos do domínio do professor
  supabase.ts              cliente e tipos das tabelas
  auth/                    login, primeiro acesso, troca de senha, onboarding do professor
  teacher/                 portal do professor: TeacherPortal (dados), teacherApi (gravações), pages/, modals/
  student/                 portal do aluno: StudentPortal, pages/, components/, sequência de estudos
  domains/assessments/     avaliações (editor, aplicação, correção, relatórios, CEFR) e seus testes
  domains/questions/       correção e validação de questões
  components/              componentes comuns (diálogos, comentários por trecho, convites)
  lib/                     funções sem interface: datas, formatos, uploads, quiz, mapeamentos do banco
  styles/                  CSS em ordem de cascata (index.css importa todos; a ordem importa)
  config/                  ambiente, modos e dados de demonstração
supabase/
  migrations/              esquema, RLS e funções (RPC)
  functions/               Edge Functions
  tests/                   testes SQL do módulo de avaliações
scripts/                   banco piloto, testes do banco, build desktop, paleta
  pilot-bank/              etapas que geraram cada versão do banco piloto
docs/                      guias, auditorias, banco piloto CEFR (versões antigas em docs/cefr/history), releases
linux/                     app nativo do professor para Linux
```

## Desktop (Tauri)

```bash
./scripts/setup-tauri-arch.sh
npm ci
npm run desktop                # desenvolvimento
./scripts/build-appimage.sh    # AppImage
```

Passo a passo em [`docs/DESKTOP_LINUX.md`](docs/DESKTOP_LINUX.md); Android em [`docs/ANDROID.md`](docs/ANDROID.md).

## Segurança

Nunca inclua `.env` no Git nem em pacotes. O frontend usa só a chave pública do Supabase; o acesso aos dados é
controlado pelas políticas RLS e pelas funções do banco. Chaves administrativas ficam nos secrets das Edge Functions.
