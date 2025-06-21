import { NextResponse } from "next/server";

export async function GET() {
  // 캐싱 테스트를 위한 사용자 1 데이터
  const userData = {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    profile: {
      bio: "Frontend Developer with 5 years of experience",
      avatar: "https://example.com/avatar/alice.jpg",
    },
    createdAt: "2023-01-15T10:30:00Z",
  };

  // 캐시 헤더 설정
  const response = NextResponse.json(userData);
  response.headers.set("Cache-Control", "public, max-age=60");

  return response;
}
