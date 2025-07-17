import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  // 항상 에러를 반환하는 테스트용 엔드포인트
  return NextResponse.json(
    {
      error: "This is a test error endpoint",
      code: "TEST_ERROR",
      timestamp: Date.now(),
    },
    {
      status: 500,
      headers: {
        "X-Response-Error": "true",
        "X-Response-Timestamp": Date.now().toString(),
      },
    }
  );
}
