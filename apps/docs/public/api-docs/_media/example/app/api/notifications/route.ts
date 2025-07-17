import { NextRequest, NextResponse } from "next/server";

/**
 * 알림 API (조건부 쿼리 무효화 테스트용)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const notifications = [
    {
      id: 1,
      userId: parseInt(userId),
      message: `사용자 ${userId}에게 새로운 메시지가 있습니다.`,
      type: "message",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
    },
    {
      id: 2,
      userId: parseInt(userId),
      message: `사용자 ${userId}의 프로필이 업데이트되었습니다.`,
      type: "profile",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
    },
    {
      id: 3,
      userId: parseInt(userId),
      message: `사용자 ${userId}에게 새로운 팔로워가 있습니다.`,
      type: "follow",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    },
  ];

  return NextResponse.json({
    notifications,
    userId: parseInt(userId),
    unreadCount: notifications.filter((n) => !n.read).length,
    totalCount: notifications.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newNotification = {
    id: Date.now(),
    userId: body.userId,
    message: body.message,
    type: body.type || "general",
    read: false,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    notification: newNotification,
  });
}
