# LangSpot 1.3.0 — Flashcards com repetição espaçada

## Novidades
- Nova área **Flashcards** no portal do aluno.
- Criação de baralhos pessoais.
- Criação e exclusão de cartões com pergunta, resposta e exemplo.
- Fila automática de cartões pendentes.
- Sessão de estudo com avaliações **Errei**, **Difícil**, **Acertei** e **Fácil**.
- Algoritmo de repetição espaçada inspirado no SM-2, com intervalos adaptativos.
- Estatísticas de baralhos, revisões pendentes e cartões estudados.
- Layout responsivo para web, AppImage e Android.

## Publicação
```bash
npm install
npm run check
npx supabase db push
git add .
git commit -m "Release LangSpot 1.3.0 flashcards"
git push
```

Não há Edge Function nova nesta versão.
