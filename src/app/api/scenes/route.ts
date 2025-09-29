import { scenePrompt } from '@/lib/maker/prompt';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_SCRIPT_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { script, customRule, globalStyle } = await req.json();
    if (!script || !script.trim()) {
      return Response.json({ error: 'script is required' }, { status: 400 });
    }

    const response = await client.responses.create({
      model: 'gpt-4.1',
      input: scenePrompt(script, customRule, globalStyle),
    });

    console.log(response);

    const saver = response.output_text;

    const tokenUsage = response.usage?.total_tokens;

    return NextResponse.json({
      text: JSON.parse(saver),
      usage: tokenUsage,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
