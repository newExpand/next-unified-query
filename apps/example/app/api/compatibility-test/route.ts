import { NextResponse } from "next/server";

export async function GET() {
  // 호환성 테스트를 위한 데이터 (V1, V2, V3 모두 호환되는 구조)
  const compatibilityData = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    profile: {
      bio: "Test user for compatibility testing",
      avatar: "https://example.com/avatar/test.jpg",
    },
    settings: {
      theme: "light",
      notifications: true,
    },
    createdAt: "2023-01-01T00:00:00Z",
  };

  return NextResponse.json(compatibilityData);
}
