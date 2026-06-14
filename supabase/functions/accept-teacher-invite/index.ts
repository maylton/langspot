import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: accept-teacher-invite
 * 
 * Accepts a teacher invitation by creating a new user account
 * 
 * Request body:
 * {
 *   "token": "invitation_token",
 *   "email": "teacher@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response:
 * {
 *   "ok": true,
 *   "message": "Conta criada com sucesso"
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
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse request body
    const { token, email, password } = await request.json();
    if (!token || !email || !password) {
      return Response.json(
        { error: 'Token, email e senha são obrigatórios' },
        { status: 400, headers: cors }
      );
    }

    // Find and validate invitation
    const { data: invitation, error: fetchError } = await admin
      .from('teacher_invitations')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('used', false)
      .single();

    if (fetchError || !invitation) {
      return Response.json(
        { error: 'Convite não encontrado ou já foi utilizado' },
        { status: 404, headers: cors }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return Response.json(
        { error: 'Este convite expirou. Solicite um novo convite ao administrador' },
        { status: 400, headers: cors }
      );
    }

    // Create user in Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
        role: 'teacher',
      },
    });

    if (authError || !authData.user) {
      return Response.json(
        { error: 'Erro ao criar conta: ' + authError?.message },
        { status: 400, headers: cors }
      );
    }

    // Create profile for teacher
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'teacher',
        full_name: invitation.full_name,
      });

    if (profileError) {
      // Delete user if profile creation fails
      await admin.auth.admin.deleteUser(authData.user.id);
      return Response.json(
        { error: 'Erro ao configurar perfil: ' + profileError.message },
        { status: 400, headers: cors }
      );
    }

    // Mark invitation as used
    const { error: updateError } = await admin
      .from('teacher_invitations')
      .update({
        used: true,
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error marking invitation as used:', updateError);
      // This is non-critical, user was created successfully
    }

    return Response.json(
      {
        ok: true,
        message: 'Conta criada com sucesso! Você pode fazer login agora.',
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
