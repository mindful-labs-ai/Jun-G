// app/api/tts/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      stability = 0.5,
      voiceId = 'JBFqnCBsd6RMkjVDRZzb',
      modelId = 'eleven_v3',
    } = await req.json();

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
      });
    }

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          output_format: 'mp3_44100_128',
          voice_settings: { stability },
        }),
      }
    );

    if (!r.ok) {
      const errText = await r.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: r.status,
      });
    }

    return new Response(r.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="narration.mp3"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
