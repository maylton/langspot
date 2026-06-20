import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function isWhatsappColumnMissing(error: { message?: string; code?: string } | null) {
  return error?.code === 'PGRST204' || error?.code === 'PGRST205' || Boolean(error?.message?.includes('whatsapp_phone') || error?.message?.includes('schema cache'));
}

async function insertStudentProfile(admin: ReturnType<typeof createClient>, profile: Record<string, unknown>) {
  const { error } = await admin.from('profiles').insert(profile);
  if (!error || !isWhatsappColumnMissing(error)) return { error };
  const { whatsapp_phone, ...fallbackProfile } = profile;
  return await admin.from('profiles').insert(fallbackProfile);
}

Deno.serve(async (request) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = request.headers.get('Authorization') ?? '';
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401, headers: cors });

  const { data: teacher } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (teacher?.role !== 'teacher') return Response.json({ error: 'Apenas professores podem convidar alunos' }, { status: 403, headers: cors });

  const { data: hasAccess } = await admin.rpc('teacher_has_access', { target_teacher: user.id });
  if (!hasAccess) return Response.json({ error: 'Seu período de teste terminou. Ative uma assinatura para convidar alunos.' }, { status: 402, headers: cors });

  const { action = 'invite', email, fullName, age = null, level = 'A1', goal = '', notes = '', whatsappPhone = '' } = await request.json();
  if (action === 'create-with-password') {
    const temporaryPassword = createTemporaryPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'student', teacher_id: user.id },
    });
    if (error || !data.user) return Response.json({ error: error?.message }, { status: 400, headers: cors });

    const { error: profileError } = await insertStudentProfile(admin, { id: data.user.id, role: 'student', full_name: fullName, email, whatsapp_phone: whatsappPhone, teacher_id: user.id, must_change_password: true });
    const { error: recordError } = profileError ? { error: null } : await admin.from('student_records').insert({ teacher_id: user.id, student_id: data.user.id, age, level, goal, notes });
    if (profileError || recordError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return Response.json({ error: profileError?.message ?? recordError?.message }, { status: 400, headers: cors });
    }
    return Response.json({ ok: true, temporaryPassword, studentId: data.user.id }, { headers: cors });
  }

  const requestOrigin = request.headers.get('origin');
  const redirectTo = requestOrigin?.startsWith('http')
    ? requestOrigin
    : Deno.env.get('APP_URL') ?? 'https://langspot.app';

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      full_name: fullName,
      role: 'student',
      teacher_id: user.id,
      must_change_password: true,
    },
  });
  if (error || !data.user) return Response.json({ error: error?.message }, { status: 400, headers: cors });

  const { error: profileError } = await insertStudentProfile(admin, {
    id: data.user.id,
    role: 'student',
    full_name: fullName,
    email,
    whatsapp_phone: whatsappPhone,
    teacher_id: user.id,
    must_change_password: true,
  });
  const { error: recordError } = profileError
    ? { error: null }
    : await admin.from('student_records').insert({ teacher_id: user.id, student_id: data.user.id, age, level, goal, notes });

  if (profileError || recordError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return Response.json(
      { error: profileError?.message ?? recordError?.message ?? 'Não foi possível concluir o cadastro do aluno.' },
      { status: 400, headers: cors },
    );
  }

  return Response.json({ ok: true }, { headers: cors });
});

function createTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const values = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}
