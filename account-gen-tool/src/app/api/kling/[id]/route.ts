import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface KlingImageToVideoStatusResponse {
  code: number; // 0 = 성공
  message: string; // "SUCCEED" 등
  request_id: string;
  data: KlingTaskData;
}

export type KlingTaskStatus =
  | "pending"
  | "processing"
  | "submitted"
  | "running"
  | "succeed"
  | "failed"
  | "canceled";

export interface KlingTaskData {
  task_id: string; // "791749406890147886"
  task_status: KlingTaskStatus; // "succeed" 등
  task_info: Record<string, unknown>; // 현재는 {}
  task_result?: {
    videos: KlingVideo[];
    // 필요 시 다른 필드가 올 수 있으니 확장 가능
    [k: string]: unknown;
  };
  task_status_msg?: string; // 실패 메시지 등
  created_at: number; // epoch ms
  updated_at: number; // epoch ms
}

export interface KlingVideo {
  id: string; // "791749408236519505"
  url: string; // 서명된 MP4 URL
  duration: string | number; // "5.041" 또는 숫자일 수도 있음
  thumbnail_url?: string;
  fps?: number;
  resolution?: string; // "720p" 등 제공될 수 있음
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const taskId = (await ctx.params).id;

  if (!taskId)
    return NextResponse.json({ error: "id required" }, { status: 400 });

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
      { algorithm: "HS256" }
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.KLING_BASE_URL}/v1/videos/image2video/${taskId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
