import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationEmailRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  description: string;
  target: string;
  scheduled_for: string;
  metadata: Record<string, unknown> | null;
  profiles?: {
    email: string | null;
    full_name: string | null;
  } | null;
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function emailHtml(notification: NotificationEmailRow, appUrl: string) {
  const name = notification.profiles?.full_name?.trim() || 'Olá';
  const title = escapeHtml(notification.title);
  const description = escapeHtml(notification.description);
  const targetUrl = `${appUrl.replace(/\/$/, '')}/`;

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f5f7fb;font-family:Inter,Arial,sans-serif;color:#172033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7eaf0;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 26px;background:linear-gradient(120deg,#7655f3,#5b43c8);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;opacity:.75;">LangSpot</div>
                <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${escapeHtml(name)},</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4d596d;">${description}</p>
                <a href="${targetUrl}" style="display:inline-block;background:#7655f3;color:#ffffff;text-decoration:none;font-weight:800;border-radius:12px;padding:12px 18px;">Abrir LangSpot</a>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8792a4;">Você também pode ver esta notificação dentro da plataforma.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(notification: NotificationEmailRow, appUrl: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) throw new Error('RESEND_API_KEY não configurada.');

  const to = notification.profiles?.email?.trim();
  if (!to) throw new Error('Usuário sem e-mail cadastrado.');

  const from = Deno.env.get('EMAIL_FROM') || 'LangSpot <onboarding@resend.dev>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `LangSpot: ${notification.title}`,
      html: emailHtml(notification, appUrl),
      text: `${notification.title}\n\n${notification.description}\n\nAbra a LangSpot: ${appUrl}`,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? 'Falha ao enviar e-mail.');
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Método não permitido.' }, 405);

  const workerSecret = Deno.env.get('EMAIL_WORKER_SECRET');
  if (workerSecret && request.headers.get('x-email-worker-secret') !== workerSecret) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  if (!Deno.env.get('RESEND_API_KEY')) {
    return json({ error: 'RESEND_API_KEY não configurada. Nenhum e-mail foi processado.' }, 500);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const appUrl = Deno.env.get('APP_URL') || request.headers.get('origin') || 'https://langspot.app';
  const limit = Math.max(1, Math.min(50, Number(new URL(request.url).searchParams.get('limit')) || 20));

  const { data, error } = await admin
    .from('notifications')
    .select('id,user_id,kind,title,description,target,scheduled_for,metadata,profiles:user_id(email,full_name)')
    .contains('delivery_channels', ['email'])
    .eq('email_status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) return json({ error: error.message }, 500);

  const rows = (data ?? []) as unknown as NotificationEmailRow[];
  const results = [];

  for (const notification of rows) {
    try {
      const providerResponse = await sendEmail(notification, appUrl);
      await admin
        .from('notifications')
        .update({ email_status: 'sent', metadata: { ...(notification.metadata ?? {}), email_sent_at: new Date().toISOString(), email_provider: 'resend', email_provider_response: providerResponse } })
        .eq('id', notification.id);
      results.push({ id: notification.id, status: 'sent' });
    } catch (error) {
      await admin
        .from('notifications')
        .update({ email_status: 'failed', metadata: { ...(notification.metadata ?? {}), email_failed_at: new Date().toISOString(), email_error: (error as Error).message } })
        .eq('id', notification.id);
      results.push({ id: notification.id, status: 'failed', error: (error as Error).message });
    }
  }

  return json({ ok: true, processed: results.length, results });
});
