import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedTypes = ['multiple_choice', 'fill_blank', 'true_false', 'ordering'] as const;
type QuestionType = typeof allowedTypes[number];
type RawQuestion = { type?: string; prompt?: string; options?: string[]; answer?: string; explanation?: string };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors });
}

function splitOrdering(value: string) {
  const parts = value.includes('/') ? value.split('/') : value.split(',');
  return parts.map((item) => item.trim()).filter(Boolean);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function sanitizeQuestion(question: RawQuestion) {
  const type = allowedTypes.includes(question.type as QuestionType) ? question.type as QuestionType : 'multiple_choice';
  const prompt = String(question.prompt ?? '').trim();
  const explanation = String(question.explanation ?? '').trim();
  let options = Array.isArray(question.options) ? question.options.map((item) => String(item).trim()).filter(Boolean) : [];
  let answer = String(question.answer ?? '').trim();

  if (!prompt || !answer) return null;
  if (type === 'true_false') {
    options = ['Verdadeiro', 'Falso'];
    answer = answer.toLowerCase().startsWith('f') ? 'Falso' : 'Verdadeiro';
  }
  if (type === 'fill_blank') options = [];
  if (type === 'multiple_choice') {
    options = [...new Set(options)].slice(0, 4);
    if (options.length < 2) return null;
    if (!options.includes(answer)) answer = options[0];
  }
  if (type === 'ordering') {
    const ordered = splitOrdering(answer);
    if (ordered.length < 2) return null;
    answer = ordered.join(' / ');
    options = shuffle(ordered);
  }

  return { id: crypto.randomUUID(), type, prompt, options, answer, explanation };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) return json({ error: 'GEMINI_API_KEY não configurada no Supabase.' }, 500);

    const authHeader = request.headers.get('Authorization') ?? '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Não autenticado' }, 401);

    const { data: profile, error: profileError } = await userClient.from('profiles').select('role').eq('id', user.id).single();
    if (profileError) return json({ error: profileError.message }, 400);
    if (!['teacher', 'admin'].includes(String(profile?.role ?? ''))) return json({ error: 'Apenas professores podem gerar quizzes.' }, 403);

    const body = await request.json();
    const topic = String(body.topic ?? '').trim();
    const level = String(body.level ?? 'A1').trim();
    const category = String(body.category ?? 'Grammar').trim();
    const count = Math.max(1, Math.min(20, Number(body.count) || 5));
    if (!topic) return json({ error: 'Tema obrigatório.' }, 400);

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
    const prompt = [
      `Create ${count} interactive English quiz questions for level ${level}.`,
      `Topic: ${topic}. Category: ${category}.`,
      'Return only valid JSON with this exact shape: {"questions":[{"type":"multiple_choice|fill_blank|true_false|ordering","prompt":"...","options":["..."],"answer":"...","explanation":"..."}]}.',
      'Use Brazilian Portuguese only for short explanations when helpful.',
      'Use English in prompts, options and answers.',
      'Mix question types when appropriate: multiple_choice, fill_blank, true_false, ordering.',
      'For ordering questions, put the correct ordered chunks in answer separated by " / ". Keep commas inside chunks when punctuation is required.',
      'For fill_blank, include a blank in the prompt using ____ and put the exact expected word or phrase in answer.',
      'For multiple_choice, include 4 concise options and set answer equal to one option exactly.',
      'Avoid ambiguous questions and avoid cultural references that require external knowledge.',
    ].join('\n');

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are an expert English teacher who writes clear, level-appropriate quiz questions.' }],
        },
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    const payload = await aiResponse.json();
    if (!aiResponse.ok) return json({ error: payload.error?.message ?? 'Não foi possível gerar o quiz com Gemini.' }, aiResponse.status);

    const outputText = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('') ?? '';
    if (!outputText) return json({ error: 'O Gemini não retornou texto válido.' }, 422);
    const parsed = JSON.parse(outputText) as { questions?: RawQuestion[] };
    const questions = (parsed.questions ?? []).map(sanitizeQuestion).filter(Boolean).slice(0, count);
    if (!questions.length) return json({ error: 'A IA não retornou questões válidas.' }, 422);
    return json({ questions });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
