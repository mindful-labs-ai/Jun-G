import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
