import { NextRequest } from "next/server";

let callCount = 0;

export async function POST(request: NextRequest) {
  // 동시 요청에 대해 고유한 ID 생성
  const requestId = ++callCount;
  const requestTimestamp = Date.now();
  const uniqueId = `${requestId}-${requestTimestamp}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const delay = body?.delay || 1000;
    const data = body?.data || `Data ${requestId}`;

    // 지연 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, delay));

    return Response.json({
      id: requestId,
      uniqueId: uniqueId,
      data: data,
      processedAt: Date.now(),
      requestTimestamp: requestTimestamp,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
