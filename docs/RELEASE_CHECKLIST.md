# Checklist de lançamento — LangSpot 1.0.0

Use este roteiro em uma conta de professor e uma conta de aluno antes de publicar uma nova versão.

## 1. Instalação limpa

- [ ] Copiar `.env.example` para `.env` e preencher as chaves.
- [ ] Executar `npm ci` sem erros.
- [ ] Executar `npm run check` sem erros.
- [ ] Vincular o projeto com `npx supabase link --project-ref ...`.
- [ ] Executar `npx supabase db push` sem migrations pendentes inesperadas.
- [ ] Publicar as Edge Functions `invite-student`, `invite-teacher` e `accept-teacher-invite`.

## 2. Professor

- [ ] Criar conta e concluir o primeiro acesso.
- [ ] Confirmar nome, e-mail, avatar e escola após novo login.
- [ ] Convidar/criar aluno e copiar a senha temporária.
- [ ] Criar, editar, concluir e cancelar uma aula.
- [ ] Confirmar a aula na visão geral, agenda e perfil do aluno.
- [ ] Registrar presença, observações, tarefa e habilidades.
- [ ] Enviar PDF e link; compartilhar e remover compartilhamento.
- [ ] Criar tarefa, corrigir resposta e registrar nota.
- [ ] Criar cobrança, marcar como paga e reabrir.
- [ ] Conferir notificações, relatórios e exportação/impressão.

## 3. Aluno

- [ ] Entrar com a senha temporária.
- [ ] Ver apenas os próprios dados.
- [ ] Conferir aulas futuras e histórico.
- [ ] Solicitar cancelamento quando permitido.
- [ ] Abrir materiais atribuídos, incluindo PDF privado.
- [ ] Enviar tarefa e visualizar feedback/nota.
- [ ] Conferir progresso e perfil.

## 4. Segurança e isolamento

- [ ] Um professor não enxerga alunos de outro professor.
- [ ] Um aluno não acessa materiais ou tarefas de outro aluno.
- [ ] URLs de PDFs privados expiram e não são públicas.
- [ ] Chaves `service_role` não aparecem no frontend nem no `.env.example`.
- [ ] O arquivo `.env` não está incluído no ZIP ou Git.

## 5. Interface

- [ ] Desktop, tablet e celular sem rolagem horizontal indevida.
- [ ] Menu sanduíche abre, fecha ao tocar fora e fecha com `Esc`.
- [ ] Tema claro e escuro legíveis.
- [ ] Estados vazios não exibem dados fictícios no modo autenticado.
- [ ] Botões e textos não quebram em larguras pequenas.
- [ ] Aviso offline e tela de recuperação de erro funcionam.

## 6. Resultado

Registre versão testada, navegador, sistema operacional, data e problemas encontrados para registrar a validação da versão estável.
