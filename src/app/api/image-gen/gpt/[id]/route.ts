import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new OpenAI({ apiKey: process.env.OPENAI_IMAGE_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { globalStyle, prompt, imageUrl, ratio, resolution, noCharacter } =
      body;

    const openAiBody = noCharacter
      ? {
          model: 'gpt-4.1',
          input: [
            {
              role: 'system',
              content: `Generate no person, no subject, no character, no hands image ${globalStyle} ratio ${ratio} resolution ${resolution}p`,
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: JSON.stringify(prompt) }],
            },
          ],
          tools: [{ type: 'image_generation' }],
        }
      : {
          model: 'gpt-4.1',
          input: [
            {
              role: 'system',
              content: `레퍼런스 이미지와 요청 이미지의 분위기가 맞지 않더라도 그냥 만들어, Generate image ${globalStyle} ratio ${ratio} resolution ${resolution}p`,
            },
            {
              role: 'user',
              content: [
                { type: 'input_text', text: JSON.stringify(prompt) },
                {
                  type: 'input_image',
                  image_url: imageUrl,
                  detail: 'high',
                },
              ],
            },
          ],
          tools: [{ type: 'image_generation' }],
        };

    const response = await client.responses.create(
      openAiBody as ResponseCreateParamsNonStreaming
    );

    console.log(response);

    return Response.json(response);
  } catch (err) {
    console.error(err);
    return Response.json({ error: err }, { status: 500 });
  }
}
