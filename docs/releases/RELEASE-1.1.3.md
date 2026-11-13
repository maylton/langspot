# LangSpot 1.1.4

## Alteração de interface

- O aviso persistente de **Acesso permanente** foi removido do topo do dashboard.
- Ao entrar, contas com acesso permanente recebem uma notificação flutuante que desaparece automaticamente após alguns segundos.
- O status da conta agora fica disponível em **Configurações → Perfil do professor**.
- Contas em teste, ativas ou expiradas também exibem seu status nessa área.

## Publicação

```bash
npm install
npm run check
git add .
git commit -m "Release LangSpot 1.1.4 account access UI"
git push
```

Não há nova migration nem Edge Function nesta versão.
