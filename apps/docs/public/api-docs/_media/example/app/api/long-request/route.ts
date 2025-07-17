import { NextRequest, NextResponse } from "next/server";

/**
 * 긴 요청 시뮬레이션 API (인터셉터 제거 영향 테스트용)
 */
export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  const hasInterceptor = headers["x-interceptor-present"];

  // 2초 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return NextResponse.json({
    hadInterceptor: hasInterceptor === "true",
    completedAt: Date.now(),
    duration: 2000,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = Object.fromEntries(request.headers.entries());

  // 요청된 지연 시간만큼 대기 (기본값: 2초)
  const delay = body.delay || 2000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return NextResponse.json({
    hadInterceptor: headers["x-interceptor-present"] === "true",
    requestedDelay: delay,
    actualDelay: delay,
    completedAt: Date.now(),
    receivedData: body,
  });
}
