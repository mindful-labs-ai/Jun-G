import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type CandidatePart = {
  inlineData?: { mimeType?: string; data?: string };
  text?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, imageBase64, imageMimeType } = body;

    if (!prompt || !imageBase64 || !imageMimeType) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 사이즈에 대한 계속된 명령을 주되, 실제 리사이즈는 하지 않음
    const enhancedPrompt = `${prompt}. Generate a 1024x1024 pixel image.`;

    const result = await genAI
      .getGenerativeModel({ model: "gemini-2.5-flash-image-preview" })
      .generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: enhancedPrompt },
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

    const response = await result.response;

    // 응답 파싱
    let generatedImageBase64: string | null = null;
    let textResponse = "";

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
      imageSize: "original",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "이미지 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
