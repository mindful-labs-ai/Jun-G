import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, imageBase64, imageMimeType } = body;

    if (!prompt || !imageBase64 || !imageMimeType) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 더 명확한 이미지 생성 프롬프트
    const enhancedPrompt = `${prompt}. Generate a 1024x1024 pixel image .`;

    const promptParts = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      },
    ];

    const result = await genAI
      .getGenerativeModel({
        model: "gemini-2.5-flash-image-preview",
      })
      .generateContent({
        contents: [
          {
            role: "user",
            parts: promptParts,
          },
        ],
      });

    const response = await result.response;

    // 응답 상세 로깅
    console.log("Gemini Response:", {
      candidates: response.candidates?.length,
      parts: response.candidates?.[0]?.content?.parts,
    });

    // 응답 파싱
    let generatedImageBase64 = null;
    let textResponse = "";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        generatedImageBase64 = part.inlineData.data;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    // 이미지가 생성된 경우 크기 조정
    if (generatedImageBase64) {
      // Base64를 1024x1024로 리사이즈 (서버 사이드)
      generatedImageBase64 = await resizeImageToSquare(
        generatedImageBase64,
        1024
      );
    }

    return NextResponse.json({
      success: !!generatedImageBase64,
      generatedImage: generatedImageBase64,
      textResponse: textResponse,
      imageSize: "1024x1024",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      {
        error: "이미지 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 이미지 리사이즈 함수 (서버 사이드)
async function resizeImageToSquare(
  base64: string,
  size: number
): Promise<string> {
  // ESM 동적 import (require 사용 금지)
  const { default: sharp } = await import("sharp");

  try {
    // data URL도 허용: 'data:image/png;base64,....' → 순수 base64만 추출
    const comma = base64.indexOf(",");
    const pureBase64 = comma >= 0 ? base64.slice(comma + 1) : base64;

    const buffer = Buffer.from(pureBase64, "base64");
    const resizedBuffer = await sharp(buffer)
      .resize(size, size, { fit: "cover", position: "center" })
      .png()
      .toBuffer();

    return resizedBuffer.toString("base64"); // 필요 시 앞에 data URL 프리픽스 붙여 사용
  } catch (error) {
    console.error("Image resize error:", error);
    return base64; // 실패 시 원본 반환
  }
}
