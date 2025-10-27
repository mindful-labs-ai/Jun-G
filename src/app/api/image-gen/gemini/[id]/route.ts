import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { uploadBase64Image } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

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
              caption: string;
              inlineData: {
                mimeType: string;
                data: string;
              };
            }) => ({
              role: 'user',
              parts: [
                a.caption ? [{ text: a.caption }] : [],
                {
                  inlineData: {
                    mimeType: a.inlineData.mimeType,
                    data: a.inlineData.data,
                  },
                },
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
        generationConfig: {
          temperature: 0.3,
        },
      });

    console.log(result);

    const tokenUsage = result.response.usageMetadata?.totalTokenCount;

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

    // Save to history if image was generated successfully
    let historyId: string | null = null;
    if (generatedImageBase64) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const storageUrl = await uploadBase64Image(
            supabase,
            user.id,
            generatedImageBase64
          );

          const history = await AssetHistoryRepository.create(user.id, {
            original_content: prompt,
            storage_url: storageUrl,
            asset_type: 'image',
            metadata: {
              globalStyle,
              ratio,
              resolution,
              tokenUsage,
              hasReferenceImage: true,
              additionsCount: additions?.length || 0,
            },
          });

          historyId = history.id;
        }
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
        // Don't fail the request if history saving fails
      }
    }

    // 리사이즈 완전 제거: 그대로 반환
    return NextResponse.json({
      success: !!generatedImageBase64,
      generatedImage: generatedImageBase64,
      textResponse,
      imageSize: 'original',
      timestamp: new Date().toISOString(),
      tokenUsage: tokenUsage,
      historyId, // Include history ID in response
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
