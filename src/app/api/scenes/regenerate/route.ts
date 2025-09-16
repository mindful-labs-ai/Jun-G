import { sceneRegeneratePrompt } from '@/lib/maker/regeneratePrompt';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_SCRIPT_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { script, customRule, sceneExplain } = await req.json();
    if (!script || !script.trim()) {
      return Response.json({ error: 'script is required' }, { status: 400 });
    }

    if (!sceneExplain || !sceneExplain.trim()) {
      return Response.json(
        { error: 'scene explain is required' },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: 'gpt-4.1',
      input: sceneRegeneratePrompt(script, customRule, sceneExplain),
    });

    console.log(response);

    const saver = response.output_text;

    return Response.json(JSON.parse(saver));
  } catch (err) {
    console.error(err);
    return Response.json({ error: err }, { status: 500 });
  }
}
