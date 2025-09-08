import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_IMAGE_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { globalStyle, prompt, imageUrl, ratio, resolution } = body;

    const response = await client.responses.create({
      model: 'gpt-4.1',
      input: [
        {
          role: 'system',
          content: `Generate ${globalStyle} of this reference character ratio ${ratio} resolution ${resolution}p`,
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: 'high',
            },
          ],
        },
      ],
      tools: [{ type: 'image_generation' }],
    });

    console.log(response);

    return Response.json(response);
  } catch (err) {
    console.error(err);
    return Response.json({ error: err }, { status: 500 });
  }
}
