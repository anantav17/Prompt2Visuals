import { NextResponse } from 'next/server';
import sharp from 'sharp';

interface TransformOptions {
  /** A base64 data URI or a remote URL. */
  image: string;
  /** Crop rectangle expressed in pixels relative to the original image. */
  crop?: { x: number; y: number; width: number; height: number };
  /** Target dimensions for the output image. */
  width: number;
  height: number;
  /** How to fit the image into the target rectangle. */
  fit?: 'cover' | 'contain';
  /** Output format. Defaults to jpeg. */
  format?: 'jpeg' | 'png';
}

/**
 * POST /api/transform
 *
 * Accepts an image (either base64 or URL) and returns a cropped/resized
 * version according to the provided options. This endpoint uses sharp to
 * perform high quality transformations on the server. The original image is
 * never modified; a new buffer is produced and streamed back to the client.
 */
export async function POST(request: Request) {
  let options: TransformOptions;
  try {
    options = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { image, crop, width, height, fit = 'cover', format = 'jpeg' } = options;
  if (!image || !width || !height) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    let buffer: Buffer;
    if (image.startsWith('data:')) {
      const comma = image.indexOf(',');
      const b64 = image.slice(comma + 1);
      buffer = Buffer.from(b64, 'base64');
    } else if (image.startsWith('http')) {
      const resp = await fetch(image);
      if (!resp.ok) throw new Error('Failed to download image');
      const arrayBuffer = await resp.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json({ error: 'Unsupported image source' }, { status: 400 });
    }
    let img = sharp(buffer, { failOnError: false });
    const metadata = await img.metadata();
    if (crop) {
      const left = Math.max(0, Math.min(crop.x, (metadata.width || crop.x) - 1));
      const top = Math.max(0, Math.min(crop.y, (metadata.height || crop.y) - 1));
      const w = Math.min(crop.width, (metadata.width || crop.width) - left);
      const h = Math.min(crop.height, (metadata.height || crop.height) - top);
      img = img.extract({ left: Math.round(left), top: Math.round(top), width: Math.round(w), height: Math.round(h) });
    }
    const resized = await img
      .resize({ width, height, fit: fit === 'contain' ? sharp.fit.contain : sharp.fit.cover })
      .toFormat(format, { quality: 90 })
      .toBuffer();
    const headers = new Headers();
    headers.set('Content-Type', format === 'png' ? 'image/png' : 'image/jpeg');
    return new Response(resized, { status: 200, headers });
  } catch (err) {
    console.error('Transform error', err);
    return NextResponse.json({ error: 'Transform failed' }, { status: 500 });
  }
}
