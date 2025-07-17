import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt((await params).id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // Mock 사용자 상세 정보
  const userDetails = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    lastLogin: "2023-01-01T10:00:00Z",
    profile: {
      department: "Engineering",
      position: "Developer",
    },
  };

  return NextResponse.json(userDetails);
}
