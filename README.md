# LangSpot — 1.0.0

Workspace para professores independentes de idiomas, com portal do aluno e sincronização pelo Supabase.

## Funcionalidades

- autenticação de professor e aluno;
- primeiro acesso e perfil do professor;
- cadastro e convite de alunos e professores;
- agenda, conclusão, cancelamento e histórico de aulas;
- progresso por habilidades e relatórios por período;
- materiais, links e PDFs privados pelo Supabase Storage;
- tarefas, respostas, feedback e notas;
- financeiro básico;
- notificações internas;
- modo demonstração em ambiente de desenvolvimento;
- interface responsiva, tema claro/escuro e recuperação de erros.

## Requisitos

- Node.js 20 ou superior;
- projeto Supabase;
- Supabase CLI para migrations e Edge Functions.

## Configuração local

```bash
cp .env.example .env
npm ci
npm run dev
```

Preencha no `.env`:

```env
VITE_APP_MODE=development
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Para testar a experiência beta sem o modo demonstração, use:

```env
VITE_APP_MODE=beta
```

## Banco e funções

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase functions deploy invite-student
npx supabase functions deploy invite-teacher
npx supabase functions deploy accept-teacher-invite
```

## Validação de lançamento

```bash
npm run check
npm run preview
```

O roteiro completo está em [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

## Segurança

Nunca inclua `.env` no Git ou em pacotes distribuídos. O frontend usa apenas a chave pública do Supabase. Chaves administrativas devem permanecer nos secrets das Edge Functions.


## Recursos da versão 1.0.0

- Página de tarefas do aluno reorganizada com filtros, indicadores, prazos e feedback mais claro.
- Avatar do aluno pode ser alterado na área Perfil.


## Aplicativo desktop Linux

Esta versão inclui a configuração Tauri 2.

```bash
./scripts/setup-tauri-arch.sh
npm ci
npm run desktop
```

Para gerar o AppImage:

```bash
./scripts/build-appimage.sh
```

Consulte `docs/DESKTOP_LINUX.md` para o passo a passo completo e o build por GitHub Actions.
