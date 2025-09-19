import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { buildInstagramCaptionPrompt } from '@/lib/insta/captionPrompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeCaptionText(text: string) {
  return text.replace(/```[\s\S]*?```/g, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const { script, options } = await req.json();
    if (typeof script !== 'string' || !script.trim()) {
      return new Response('script is required', { status: 400 });
    }

    const { system, user } = buildInstagramCaptionPrompt(script, {
      stylePrompt:
        options?.stylePrompt ??
        '따뜻한 공감 톤, 사람 간 대화체, 이모티콘 적극 사용',
      language: options?.language ?? 'ko',
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const r = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    });

    const raw = r.output_text ?? '';
    const caption = normalizeCaptionText(raw);

    if (!caption) {
      return new Response('empty caption', { status: 500 });
    }

    return new Response(caption, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(e?.message || 'Server error', { status: 500 });
  }
}
