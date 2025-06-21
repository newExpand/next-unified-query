import { NextRequest, NextResponse } from "next/server";

/**
 * 인터셉터 실행 순서 테스트용 API
 */
export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  const executionOrder = headers["x-execution-order"];

  return NextResponse.json({
    executionOrder: executionOrder?.split(",") || [],
    receivedHeaders: {
      "x-interceptor-a": headers["x-interceptor-a"],
      "x-interceptor-b": headers["x-interceptor-b"],
      "x-interceptor-c": headers["x-interceptor-c"],
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = Object.fromEntries(request.headers.entries());

  return NextResponse.json({
    executionOrder: headers["x-execution-order"]?.split(",") || [],
    receivedData: body,
    success: true,
  });
}
