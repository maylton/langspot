import { supabase } from '../supabase';

export function isSchemaCacheMiss(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || Boolean(error?.message?.includes('schema cache'));
}

export async function updateProfileContact(
  id: string,
  updates: Record<string, unknown>,
  filters?: (query: any) => any,
) {
  if (!supabase) return { data: null, error: null, whatsappSkipped: false };
  const client = supabase;
  const run = (payload: Record<string, unknown>) => {
    let query = client.from('profiles').update(payload).eq('id', id);
    if (filters) query = filters(query);
    return query.select('*').single();
  };
  const result = await run(updates);
  if (!result.error || !('whatsapp_phone' in updates) || !isSchemaCacheMiss(result.error)) return { ...result, whatsappSkipped: false };
  const { whatsapp_phone, ...fallbackUpdates } = updates;
  const fallback = await run(fallbackUpdates);
  return { ...fallback, whatsappSkipped: !fallback.error };
}

export async function functionErrorMessage(error: { message: string; context?: unknown }) {
  if (error.context instanceof Response) {
    const payload = await error.context.clone().json().catch(() => null);
    return payload?.error ?? error.message;
  }
  return error.message;
}
