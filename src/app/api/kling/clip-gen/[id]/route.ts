import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface ImageToVideoRequest {
  image_url?: string; // 이미지 URL
  image_base64?: string; // Base64 인코딩된 이미지 start 프레임
  image_base64_tail?: string; // Base64 인코딩된 이미지 end 프레임
  prompt?: string; // 생성 프롬프트
  negative_prompt?: string; // 부정 프롬프트
  duration?: number; // 비디오 길이 (초)
  cfg_scale?: number; // CFG 스케일
}

export interface KlingImageToVideoResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    task_id: string;
    task_status: string;
    task_info: Record<string, any>;
    created_at: number;
    updated_at: number;
  };
}

// 작업 상태 조회 응답
export interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  fps?: number;
  resolution?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageToVideoRequest = await request.json();

    const ACCESS = process.env.KLING_ACCESS_KEY!;
    const SECRET = process.env.KLING_SECRET_KEY!;

    const apiKey = jwt.sign(
      {
        iss: ACCESS,
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5,
      },
      SECRET,
      { algorithm: 'HS256' }
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.KLING_BASE_URL}/v1/videos/image2video`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model_name: 'kling-v2-1',
          mode: 'std',
          duration: body.duration,
          image: body.image_base64,
          prompt: body.prompt,
          negative_prompt: body.negative_prompt,
          cfg_scale: body.cfg_scale,
        }),
      }
    );

    const data = (await response.json()) as KlingImageToVideoResponse;

    // 응답 상세 로깅
    console.log('Kling Response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Kling API Error:', error);
    return NextResponse.json(
      {
        error: '이미지 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ACCESS = process.env.KLING_ACCESS_KEY!;
    const SECRET = process.env.KLING_SECRET_KEY!;

    const apiKey = jwt.sign(
      {
        iss: ACCESS,
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5,
      },
      SECRET,
      { algorithm: 'HS256' }
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.KLING_BASE_URL}/v1/videos/image2video?pageNum=1&pageSize=30`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        cache: 'no-store',
      }
    );

    const list = await response.json();

    console.log(list);

    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
