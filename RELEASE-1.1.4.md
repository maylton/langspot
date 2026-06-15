# LangSpot 1.1.4

## Alteração

- O status de contas em teste gratuito não fica mais fixo no topo do painel.
- Ao entrar, professores em período de teste veem uma notificação flutuante com os dias restantes.
- A notificação desaparece automaticamente após 5 segundos.
- O status completo continua disponível em **Configurações → Perfil do professor**.
- Avisos persistentes continuam aparecendo apenas quando há confirmação de e-mail pendente, teste expirado ou erro ao carregar a assinatura.

## Publicação

```bash
npm install
npm run check
git add .
git commit -m "Release LangSpot 1.1.4 trial access toast"
git push
```

Não há migration nem Edge Function nova nesta versão.
