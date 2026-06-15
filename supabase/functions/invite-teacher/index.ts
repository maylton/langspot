import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: invite-teacher
 * 
 * Generates an invitation link for new teachers to join LangSpot
 * Only existing admins can create invitations
 * 
 * Request body:
 * {
 *   "email": "newteacher@example.com",
 *   "full_name": "Teacher Name"
 * }
 * 
 * Response:
 * {
 *   "ok": true,
 *   "invitation_id": "uuid",
 *   "invitation_link": "https://app.langspot.com/accept-invite?token=xxx&email=xxx",
 *   "expires_at": "2026-06-15T10:30:00.000Z"
 * }
 */

Deno.serve(async (request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get current user (must be authenticated)
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return Response.json(
        { error: 'Não autenticado' },
        { status: 401, headers: cors }
      );
    }

    // Only the platform owner may create teacher invitations.
    const { data: isAdmin, error: adminCheckError } = await admin.rpc(
      'is_platform_admin',
      { target_user: user.id }
    );

    if (adminCheckError || !isAdmin) {
      return Response.json(
        { error: 'Apenas administradores podem convidar novos professores' },
        { status: 403, headers: cors }
      );
    }

    const { data: hasAccess } = await admin.rpc('teacher_has_access', { target_teacher: user.id });
    if (!hasAccess) {
      return Response.json({ error: 'Seu período de teste terminou. Ative uma assinatura para convidar professores.' }, { status: 402, headers: cors });
    }

    // Parse request body
    const { email, full_name } = await request.json();
    if (!email || !full_name) {
      return Response.json(
        { error: 'Email e nome completo são obrigatórios' },
        { status: 400, headers: cors }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return Response.json(
        { error: 'Este email já está registrado' },
        { status: 400, headers: cors }
      );
    }

    // Generate random token (24 character alphanumeric)
    const token = generateInvitationToken();

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Save invitation to database
    const { data: invitation, error: insertError } = await admin
      .from('teacher_invitations')
      .insert({
        email,
        full_name,
        token,
        expires_at: expiresAt,
        created_by: user.id,
        used: false,
      })
      .select('id')
      .single();

    if (insertError || !invitation) {
      return Response.json(
        { error: 'Erro ao criar convite: ' + insertError?.message },
        { status: 400, headers: cors }
      );
    }

    // Build invitation link
    const appUrl = request.headers.get('origin') ??
      Deno.env.get('APP_URL') ??
      'http://localhost:1420';
    const invitationLink = new URL('/accept-invite', appUrl);
    invitationLink.searchParams.set('token', token);
    invitationLink.searchParams.set('email', email);

    return Response.json(
      {
        ok: true,
        invitation_id: invitation.id,
        invitation_link: invitationLink.toString(),
        expires_at: expiresAt,
        email,
      },
      { headers: cors }
    );
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500, headers: cors }
    );
  }
});

/**
 * Generate a random token for invitation links
 * 24 characters, alphanumeric
 */
function generateInvitationToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const values = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    ''
  );
}
