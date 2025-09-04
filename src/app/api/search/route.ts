import { NextResponse } from 'next/server';

/**
 * GET /api/search?q=...
 *
 * Searches Freepik for photos matching the query and generates AI images
 * using OpenAI’s GPT Image 1 model. This endpoint proxies both third‑party
 * services so that API keys remain hidden from the client. The number of
 * results returned from each source is controlled by the `MAX_RESULTS_PER_SOURCE`
 * environment variable (defaults to 4). See the README for details on how
 * environment variables are configured.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }

  const freepikApiKey = process.env.FREEPIK_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!freepikApiKey || !openaiApiKey) {
    return NextResponse.json(
      { error: 'API keys are not configured on the server' },
      { status: 500 },
    );
  }

  const maxResults = parseInt(process.env.MAX_RESULTS_PER_SOURCE || '4', 10);
  const safeSearch = process.env.SAFE_SEARCH || 'true';
  const licenseFilter = process.env.LICENSE_FILTER || 'free';

  // 1. Fetch Freepik search results
  const freepikResults: any[] = [];
  try {
    const searchRes = await fetch(
      `https://api.freepik.com/v1/resources?q=${encodeURIComponent(query)}&content_type=photo&order=relevance&safe_search=${safeSearch}&limit=${maxResults * 5}`,
      {
        headers: {
          'x-freepik-api-key': freepikApiKey,
        },
        cache: 'no-store',
      },
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const results = Array.isArray(data?.data) ? data.data : [];
      for (const item of results) {
        // Filter by licence if requested. If licence_filter is 'free', we only
        // return assets that have a licence type of 'free' or 'freepik'.
        const licences = item?.licenses ?? [];
        const hasFreeLicence = licences.some((lic: any) =>
          lic.type?.toLowerCase().includes('free'),
        );
        if (licenseFilter !== 'all' && !hasFreeLicence) continue;

        freepikResults.push({
          id: String(item.id),
          title: item.title,
          thumbnail: item?.assets?.preview?.url || item?.thumbnail_url || '',
          author: item?.author || '',
          license: licences?.[0]?.type || '',
        });
        if (freepikResults.length >= maxResults) break;
      }
    } else {
      console.error('Freepik search error', await searchRes.text());
    }
  } catch (err) {
    console.error('Freepik search exception', err);
  }

  // 2. Generate AI images using OpenAI
  const aiResults: any[] = [];
  try {
    // Choose an appropriate size based on aspect ratios available. We default
    // to a square 1024×1024 canvas and rely on the transform endpoint to crop
    // other aspect ratios later. GPT Image 1 supports 1024×1024, 1536×1024 and
    // 1024×1536 sizes【414314129573751†L186-L190】.
    const n = maxResults;
    const openAiPayload = {
      model: 'gpt-image-1',
      prompt: query,
      n,
      size: '1024x1024',
      response_format: 'b64_json',
    };
    const aiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAiPayload),
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      const results = Array.isArray(data?.data) ? data.data : [];
      for (const item of results) {
        aiResults.push({
          id: crypto.randomUUID(),
          base64: item.b64_json,
          seed: item?.seed ?? '',
        });
      }
    } else {
      console.error('OpenAI generation error', await aiRes.text());
    }
  } catch (err) {
    console.error('OpenAI generation exception', err);
  }

  return NextResponse.json({ freepik: freepikResults, ai: aiResults });
}
