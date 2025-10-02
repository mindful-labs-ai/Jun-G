/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface TextBlock {
  type: 'text';
  text: string;
  role?: string;
}

/** 이미지 URL 블록 */
export interface ImageUrlBlock {
  type: 'image_url';
  image_url: {
    url: string;
  };
  role?: 'reference_image' | string;
}

export interface ImageToVideoRequest {
  prompt: string;
  baseImage: string;
  resolution: number;
  ratio: string;
  lastImage?: string;
  liteModel?: boolean;
  noSubject?: boolean;
}

export interface SeeDanceImageToVideoResponse {
  id: string;
}

// 작업 상태 조회 응답
export interface TaskResponse {
  id: string;
  model: string;
  status: string;
  error?: object;
  content: {
    video_url: string;
  };
  usage: {
    completion_tokens: number;
    total_tokens: number;
  };
  created_at: number;
  updated_at: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageToVideoRequest = await request.json();

    const apiKey = process.env.SEEDANCE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const contentBody = !!body.lastImage
      ? [
          {
            type: 'text',
            text: `${body.prompt} --resolution ${body.resolution}p --ratio ${body.ratio}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: body.baseImage,
            },
            role: 'first_frame',
          },
          {
            type: 'image_url',
            image_url: {
              url: body.lastImage,
            },
            role: 'last_frame',
          },
        ]
      : body.noSubject
      ? [
          {
            type: 'text',
            text: `Generate no person, no subject, no character, no hands video ${body.prompt} --resolution ${body.resolution}p --ratio ${body.ratio}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: body.baseImage,
            },
            role: 'first_frame',
          },
        ]
      : [
          {
            type: 'text',
            text: `${body.prompt} --resolution ${body.resolution} --ratio ${body.ratio}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: body.baseImage,
            },
            role: 'first_frame',
          },
        ];

    const clipModel =
      !!body.lastImage || body?.liteModel
        ? 'seedance-1-0-lite-i2v-250428'
        : 'seedance-1-0-pro-250528';
    const response = await fetch(
      `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: clipModel,
          content: contentBody,
        }),
      }
    );

    const data = await response.json();

    console.log(data)

    return NextResponse.json(data);
  } catch (error) {
    console.error('Seedance API Error:', error);
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
    const apiKey = process.env.SEEDANCE_API_KEY;

    const response = await fetch(
      `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks?page_size=10&filter.status=succeeded&`,
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
