# LangSpot 1.1.0 — confirmação e teste gratuito

## Aplicação

1. Preserve o `.env` atual.
2. Copie os arquivos desta versão para o repositório.
3. Rode `npm install` e `npm run check`.
4. No Supabase, habilite **Authentication → Providers → Email → Confirm email**.
5. Confirme que `https://langspot.app/**` está em **Authentication → URL Configuration → Redirect URLs**.
6. Aplique a migração com `npx supabase db push`.
7. Publique as funções:
   - `npx supabase functions deploy invite-student`
   - `npx supabase functions deploy invite-teacher`
8. Faça commit e push para o GitHub.

## Regras

- Novos professores precisam confirmar o e-mail.
- O teste de 30 dias começa no primeiro login após a confirmação.
- Durante o teste, todos os recursos permanecem liberados.
- Após o vencimento, os dados continuam visíveis, mas operações de escrita são bloqueadas no banco.
- A conta `maylton.fernandes@gmail.com` recebe acesso permanente de proprietário.
- A estrutura já possui campos para integração futura com Stripe.
