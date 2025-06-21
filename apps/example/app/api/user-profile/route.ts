import { NextRequest, NextResponse } from "next/server";

let userDataVersion = 1;

/**
 * 사용자 프로필 API (쿼리 무효화 테스트용)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "1";

  return NextResponse.json({
    id: parseInt(userId),
    name: `User Name v${userDataVersion}`,
    email: `user${userId}@example.com`,
    version: userDataVersion,
    updatedAt: new Date().toISOString(),
    profile: {
      bio: `사용자 ${userId}의 프로필입니다.`,
      location: "Seoul, Korea",
      joinedAt: "2023-01-01T00:00:00Z",
    },
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  userDataVersion++; // 버전 증가

  return NextResponse.json({
    success: true,
    newVersion: userDataVersion,
    updatedData: body,
    updatedAt: new Date().toISOString(),
  });
}

// 버전 리셋용 (테스트 목적)
export async function DELETE() {
  userDataVersion = 1;

  return NextResponse.json({
    success: true,
    message: "User data version reset to 1",
    currentVersion: userDataVersion,
  });
}
