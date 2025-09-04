import { NextResponse } from 'next/server';

/**
 * GET /api/download?id=...
 *
 * Proxies Freepik’s download endpoint to hide the API key from the client. The
 * query string `id` must correspond to a Freepik resource identifier. The
 * response from Freepik includes a `location` property containing a signed URL
 * for the actual file. We return that URL directly so the client can fetch
 * the asset or hand it off to the transform endpoint.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const freepikApiKey = process.env.FREEPIK_API_KEY;
  if (!freepikApiKey) {
    return NextResponse.json({ error: 'Freepik API key not configured' }, { status: 500 });
  }
  try {
    const res = await fetch(`https://api.freepik.com/v1/resources/${id}/download`, {
      headers: {
        'x-freepik-api-key': freepikApiKey,
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Freepik download error', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
