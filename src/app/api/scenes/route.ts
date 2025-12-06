import { scenePrompt } from '@/lib/maker/prompt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { script, customRule, globalStyle } = await req.json();
    if (!script || !script.trim()) {
      return Response.json({ error: 'script is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(
      scenePrompt(script, customRule, globalStyle)
    );

    console.log(result);

    const response = result.response;
    const text = response.text();
    const tokenUsage = response.usageMetadata?.totalTokenCount;

    return NextResponse.json({
      text: JSON.parse(text),
      usage: tokenUsage,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
