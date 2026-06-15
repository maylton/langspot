# LangSpot 1.4.1 — Visualização do aluno

## Novidades

- Botão **Visualizar como aluno** no perfil de cada estudante.
- Portal carregado com os dados reais do aluno selecionado.
- Faixa persistente indicando o modo de visualização.
- Navegação completa entre as áreas do portal estudantil.
- Modo somente leitura: formulários, avaliações, envios e alterações ficam bloqueados.
- Botão para retornar ao painel do professor sem trocar a sessão autenticada.
- Consultas do portal filtradas explicitamente pelo aluno selecionado.

## Publicação

```bash
npm install
npm run check
git add .
git commit -m "Release LangSpot 1.4.1 student preview mode"
git push
```

Aplique a nova política de leitura dos flashcards antes de publicar:

```bash
npx supabase db push
```

Não há Edge Function nova nesta versão.
