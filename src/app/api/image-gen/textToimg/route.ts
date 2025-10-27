import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { uploadBase64Image } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type CandidatePart = {
  inlineData?: { mimeType?: string; data?: string };
  text?: string;
};

type AdditionItem = {
  caption?: string;
  inlineData: {
    mimeType: string;
    data: string;
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, ratio, resolution, imageBase64, imageMimeType, additions } =
      body as {
        prompt: string;
        ratio: string;
        resolution: number;
        imageBase64?: string;
        imageMimeType?: string;
        additions?: AdditionItem[];
      };

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const userParts: any[] = [];

    userParts.push({
      text: `Generate ${resolution}p pixel image based on the following prompt: ${prompt}`,
    });

    if (imageBase64 && imageMimeType) {
      userParts.push(base64ToGenerativePart(imageBase64, imageMimeType));
    }

    if (additions && additions.length > 0) {
      for (const item of additions) {
        if (item.caption) {
          userParts.push({ text: item.caption });
        }
        userParts.push(
          base64ToGenerativePart(item.inlineData.data, item.inlineData.mimeType)
        );
      }
    }

    const contents = [
      {
        role: 'user',
        parts: userParts,
      },
    ];

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
      config: {
        responseModalities: ['Image'],
        imageConfig: {
          aspectRatio: ratio,
        },
      },
    });

    console.log(contents);

    console.log(response);

    const tokenUsage = response.usageMetadata?.totalTokenCount;

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
              ratio,
              resolution,
              tokenUsage,
              hasReferenceImage: !!imageBase64,
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
