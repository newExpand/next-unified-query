import { NextRequest, NextResponse } from "next/server";

/**
 * 알림 읽음 처리 API (조건부 무효화 트리거용)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, notificationId } = body;

  // 읽음 처리 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 200));

  return NextResponse.json({
    success: true,
    affectedUserId: userId,
    notificationId,
    markedAt: new Date().toISOString(),
    // 인터셉터가 이 정보를 사용하여 특정 사용자의 알림만 무효화
    invalidationTarget: `notifications-${userId}`,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { userId, notificationIds } = body;

  return NextResponse.json({
    success: true,
    affectedUserId: userId,
    markedNotifications: notificationIds,
    bulkMarkedAt: new Date().toISOString(),
    totalMarked: notificationIds?.length || 0,
  });
}
