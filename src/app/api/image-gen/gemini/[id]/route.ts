import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type CandidatePart = {
  inlineData?: { mimeType?: string; data?: string };
  text?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      globalStyle,
      prompt,
      imageBase64,
      imageMimeType,
      ratio,
      resolution,
      additions,
    } = body;

    if (!prompt || !imageBase64 || !imageMimeType) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const inputBody = !!additions
      ? [
          {
            role: 'model',
            parts: [
              {
                text: `Generate ${globalStyle} with this reference image ${ratio} ratio ${resolution}p resolution pixel image`,
              },
            ],
          },
          {
            role: 'user',
            parts: [
              { text: JSON.stringify(prompt) },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
          ...additions?.map(
            (a: {
              id: string;
              name: string;
              mimeType: string;
              size: number;
              dataUrl: string;
              base64: string;
              caption?: string;
              isPrimary?: boolean;
            }) => ({
              role: 'user',
              parts: [
                ...(a.caption ? [{ text: a.caption }] : []),
                { inlineData: { mimeType: a.mimeType, data: a.base64 } },
              ],
            })
          ),
        ]
      : [
          {
            role: 'model',
            parts: [
              {
                text: `Generate ${globalStyle} with this reference image ${ratio} ratio ${resolution}p resolution pixel image`,
              },
            ],
          },
          {
            role: 'user',
            parts: [
              { text: JSON.stringify(prompt) },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ];

    console.log(inputBody);

    const result = await genAI
      .getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' })
      .generateContent({
        contents: inputBody,
      });

    console.log(result);

    const response = await result.response;

    // 응답 파싱
    let generatedImageBase64: string | null = null;
    let textResponse = '';

    const parts: CandidatePart[] =
      (response.candidates?.[0]?.content?.parts as CandidatePart[]) ?? [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        generatedImageBase64 = part.inlineData.data;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    // 리사이즈 완전 제거: 그대로 반환
    return NextResponse.json({
      success: !!generatedImageBase64,
      generatedImage: generatedImageBase64,
      textResponse,
      imageSize: 'original',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '이미지 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
