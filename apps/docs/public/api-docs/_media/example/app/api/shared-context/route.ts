import { NextRequest, NextResponse } from "next/server";

/**
 * 인터셉터 간 데이터 공유 테스트용 API
 */
export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());

  return NextResponse.json({
    sharedData: headers["x-shared-context"],
    correlationId: headers["x-correlation-id"],
    processingTime: headers["x-processing-time"],
    requestId: headers["x-request-id"],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = Object.fromEntries(request.headers.entries());

  return NextResponse.json({
    receivedData: body,
    sharedContext: {
      correlationId: headers["x-correlation-id"],
      sharedData: headers["x-shared-context"],
      processingTime: headers["x-processing-time"],
    },
    processedAt: new Date().toISOString(),
  });
}
