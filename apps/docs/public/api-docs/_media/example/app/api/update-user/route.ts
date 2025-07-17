import { NextRequest, NextResponse } from "next/server";

/**
 * 사용자 업데이트 API (자동 무효화 트리거용)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 업데이트 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json({
    success: true,
    userId: body.userId || 1,
    updatedFields: body,
    updatedAt: new Date().toISOString(),
    // 인터셉터가 이 헤더를 감지하여 user-profile 쿼리를 무효화함
    triggerInvalidation: "user-profile",
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    userId: body.userId,
    previousData: body.previousData,
    newData: body.newData,
    changeLog: {
      modifiedAt: new Date().toISOString(),
      modifiedBy: "system",
      changes: Object.keys(body.newData || {}),
    },
  });
}
