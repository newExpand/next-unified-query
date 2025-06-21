import { NextRequest, NextResponse } from "next/server";

let requestCount = 0;

export async function GET(request: NextRequest) {
  try {
    requestCount++;
    const authHeader = request.headers.get("authorization");
    
    // 첫 번째 요청은 인증 실패로 시뮬레이션
    if (requestCount === 1 && (!authHeader || authHeader.includes("invalid-token"))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 두 번째 요청부터는 성공
    return NextResponse.json({
      data: "Protected data",
      requestCount,
      headers: {
        authorization: authHeader,
        "x-request-id": request.headers.get("x-request-id"),
        "x-user-agent": request.headers.get("x-user-agent"),
      },
      timestamp: new Date().toISOString(),
      message: `Request ${requestCount} successful`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}