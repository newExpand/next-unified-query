import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 항상 에러를 발생시킴 (에러 처리 인터셉터 테스트용)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
        details: "This is a simulated error for testing error interceptors"
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}