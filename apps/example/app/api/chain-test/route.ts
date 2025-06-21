import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 인터셉터에서 추가된 헤더들 확인
    const headers = {
      authorization: request.headers.get("authorization"),
      "x-request-id": request.headers.get("x-request-id"),
      "x-interceptor-chain": request.headers.get("x-interceptor-chain"),
    };

    return NextResponse.json({
      receivedHeaders: headers,
      success: true,
      timestamp: new Date().toISOString(),
      message: "Chain test successful",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}