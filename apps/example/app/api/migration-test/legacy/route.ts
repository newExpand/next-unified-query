import { NextResponse } from "next/server";

export async function GET() {
  // 레거시 스키마 형식의 데이터 (user_id, user_name, user_email, user_created)
  const legacyData = {
    user_id: 1,
    user_name: "Legacy User",
    user_email: "legacy@example.com",
    user_created: "2023-01-01T00:00:00Z",
    bio: "This is a legacy user profile",
    avatar: "https://example.com/avatar/legacy.jpg",
  };

  return NextResponse.json(legacyData);
}
