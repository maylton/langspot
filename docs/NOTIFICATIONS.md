# Notificações

A fase atual usa duas camadas:

- notificações internas na tabela `public.notifications`;
- envio opcional por e-mail via Edge Function `send-notification-emails`.

## Secrets necessários

Configure na Supabase Function:

```bash
npx supabase secrets set RESEND_API_KEY="sua_chave_resend"
npx supabase secrets set EMAIL_FROM="LangSpot <contato@seudominio.com>"
npx supabase secrets set APP_URL="https://seu-dominio.com"
npx supabase secrets set EMAIL_WORKER_SECRET="um-segredo-longo-opcional"
```

`EMAIL_FROM` precisa usar um remetente validado no Resend. Em desenvolvimento, o remetente padrão `onboarding@resend.dev` pode funcionar apenas para testes limitados.

`EMAIL_WORKER_SECRET` é opcional, mas recomendado. Se configurado, chamadas HTTP precisam enviar o header `x-email-worker-secret` com o mesmo valor.

## Processar e-mails pendentes

```bash
npx supabase functions invoke send-notification-emails
```

A função envia notificações com `delivery_channels` contendo `email`, `email_status = 'pending'` e `scheduled_for <= now()`.

Em produção, agende essa chamada a cada poucos minutos usando cron externo, GitHub Actions, Supabase Scheduler, ou outro agendador HTTP.
