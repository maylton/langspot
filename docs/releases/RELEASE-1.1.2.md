# LangSpot 1.1.2

Correção da ativação e exibição do teste gratuito de professores.

## Publicação

```bash
npm install
npm run check
npx supabase db push
git add .
git commit -m "Fix teacher trial activation"
git push
```

A migração `20260617150000_fix_teacher_trial_activation.sql`:

- cria automaticamente a assinatura ausente;
- inicia o teste quando o e-mail é confirmado;
- corrige contas confirmadas que ficaram em `pending_confirmation`;
- adiciona um gatilho no banco para não depender apenas do frontend.
