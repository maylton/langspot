export async function functionInvokeErrorMessage(error: unknown, fallbackData: unknown) {
  const fallback = error instanceof Error ? error.message : 'Não foi possível executar a função.';
  const fallbackBody = fallbackData as { error?: string; message?: string } | null;
  if (fallbackBody?.error || fallbackBody?.message) return fallbackBody.error ?? fallbackBody.message ?? fallback;
  const context = (error as { context?: { json?: () => Promise<unknown>; text?: () => Promise<string>; status?: number } } | null)?.context;
  try {
    if (context?.json) {
      const body = await context.json() as { error?: string; message?: string; code?: string };
      if (body.error || body.message) return body.error ?? body.message ?? fallback;
      if (body.code) return body.code;
    }
  } catch {
    try {
      const text = await context?.text?.();
      if (text) return text;
    } catch {
      // Keep the SDK fallback message.
    }
  }
  return fallback;
}
