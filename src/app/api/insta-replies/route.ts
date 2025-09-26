import { AIReplyItem } from '@/components/insta/InstaHelper';
import { buildInstagramReplyPrompt } from '@/lib/insta/replyPrompt';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractFirstJsonArray(text: string) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  return s >= 0 && e > s ? text.slice(s, e + 1) : text;
}

export async function POST(req: NextRequest) {
  try {
    const { raw, options } = await req.json();
    if (typeof raw !== 'string' || !raw.trim()) {
      return Response.json({ error: 'raw is required' }, { status: 400 });
    }

    const { system, user } = buildInstagramReplyPrompt(raw, {
      stylePrompt:
        options?.stylePrompt ?? '부드러운 존댓말, 공감 위로, 2~3문장',
      language: options?.language ?? 'ko',
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const r = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const text = r.output_text ?? '';

    const jsonOnly = extractFirstJsonArray(text);
    const parsed = JSON.parse(jsonOnly) as AIReplyItem[];

    const items: AIReplyItem[] = parsed.map((it, i) => ({
      id: it?.id || `c${i + 1}`,
      author: it?.author || 'anonymous',
      content: it?.content || '',
      reply: it?.reply || '',
      content_ko: it?.content_ko || undefined,
      reply_ko: it?.reply_ko || undefined,
    }));

    return Response.json(items, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return Response.json(
      { error: e?.message || 'Server error' },
      { status: 500 }
    );
  }
}
