import { NextResponse } from 'next/server';

/**
 * POST /api/ai-generate
 *
 * Generates images using OpenAI’s GPT Image 1 model. Expects a JSON body
 * containing at least a `prompt` field. Optionally you can provide
 * `aspect` ("1:1", "9:16", "16:9") and `n` (number of images). The size
 * parameter is mapped from the aspect ratio to one of the supported sizes
 * (1024×1024, 1536×1024 or 1024×1536)【414314129573751†L186-L190】. The response
 * contains an array of objects with `base64` data and seeds.
 */
export async function POST(request: Request) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }
  const body = await request.json().catch(() => null);
  const prompt = body?.prompt;
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  const aspect: string = body?.aspect || '1:1';
  const n: number = Math.min(body?.n || 4, 10);
  // Map aspect ratio to supported size
  let size = '1024x1024';
  if (aspect === '16:9') size = '1536x1024';
  if (aspect === '9:16') size = '1024x1536';
  // Build payload
  const payload = {
    model: 'gpt-image-1',
    prompt,
    n,
    size,
    response_format: 'b64_json',
  };
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('OpenAI API error', text);
      return NextResponse.json({ error: 'OpenAI error', detail: text }, { status: res.status });
    }
    const data = await res.json();
    const results = Array.isArray(data?.data) ? data.data : [];
    const out = results.map((item: any) => ({
      id: crypto.randomUUID(),
      base64: item.b64_json,
      seed: item?.seed ?? '',
    }));
    return NextResponse.json({ images: out });
  } catch (err) {
    console.error('OpenAI exception', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
