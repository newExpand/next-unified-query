import { NextResponse } from "next/server";

export async function GET() {
  // 캐싱 테스트를 위한 사용자 2 데이터
  const userData = {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    profile: {
      bio: "Backend Developer specializing in Node.js",
      avatar: "https://example.com/avatar/bob.jpg",
    },
    createdAt: "2023-02-20T14:15:00Z",
  };

  // 캐시 헤더 설정
  const response = NextResponse.json(userData);
  response.headers.set("Cache-Control", "public, max-age=60");

  return response;
}
