import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401, headers: cors });

    const { data: isAdmin } = await admin.rpc('is_platform_admin', { target_user: user.id });
    if (!isAdmin) return Response.json({ error: 'Apenas o administrador pode gerenciar professores' }, { status: 403, headers: cors });

    const { action = 'list', teacher_id: teacherId, enabled } = await request.json();

    if (action === 'list') {
      const [{ data: profiles, error: profileError }, { data: subscriptions, error: subscriptionError }, { data: records, error: recordsError }, { data: authUsers, error: authError }] = await Promise.all([
        admin.from('profiles').select('id, full_name, email, school_name, created_at').eq('role', 'teacher').order('created_at'),
        admin.from('teacher_subscriptions').select('teacher_id, plan, status, trial_ends_at, current_period_end'),
        admin.from('student_records').select('teacher_id'),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      const error = profileError || subscriptionError || recordsError || authError;
      if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });

      const subscriptionByTeacher = new Map((subscriptions ?? []).map((subscription) => [subscription.teacher_id, subscription]));
      const emailByTeacher = new Map((authUsers.users ?? []).map((authUser) => [authUser.id, authUser.email ?? '']));
      const studentCounts = new Map<string, number>();
      for (const record of records ?? []) studentCounts.set(record.teacher_id, (studentCounts.get(record.teacher_id) ?? 0) + 1);

      const teachers = (profiles ?? []).map((profile) => {
        const subscription = subscriptionByTeacher.get(profile.id);
        return {
          ...profile,
          email: profile.email || emailByTeacher.get(profile.id) || '',
          plan: subscription?.plan ?? 'trial',
          status: subscription?.status ?? 'pending_confirmation',
          trial_ends_at: subscription?.trial_ends_at ?? null,
          current_period_end: subscription?.current_period_end ?? null,
          student_count: studentCounts.get(profile.id) ?? 0,
          is_owner: subscription?.plan === 'owner',
        };
      });
      return Response.json({ teachers }, { headers: cors });
    }

    if (!teacherId) return Response.json({ error: 'Professor não informado' }, { status: 400, headers: cors });
    const { data: targetIsAdmin } = await admin.rpc('is_platform_admin', { target_user: teacherId });
    if (targetIsAdmin || teacherId === user.id) return Response.json({ error: 'A conta administrativa não pode ser alterada' }, { status: 400, headers: cors });

    if (action === 'set-access') {
      const updates = enabled
        ? { plan: 'professional', status: 'active', trial_ends_at: null, current_period_end: null, updated_at: new Date().toISOString() }
        : { status: 'expired', updated_at: new Date().toISOString() };
      const { error } = await admin.from('teacher_subscriptions').update(updates).eq('teacher_id', teacherId);
      if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
      return Response.json({ ok: true }, { headers: cors });
    }

    if (action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(teacherId);
      if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
      return Response.json({ ok: true }, { headers: cors });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400, headers: cors });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: cors });
  }
});
