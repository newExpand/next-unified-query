import { NextResponse } from "next/server";

export async function GET() {
  // 캐싱 테스트를 위한 사용자 3 데이터
  const userData = {
    id: 3,
    name: "Carol Davis",
    email: "carol@example.com",
    profile: {
      bio: "Full-stack Developer with React and Python expertise",
      avatar: "https://example.com/avatar/carol.jpg",
    },
    createdAt: "2023-03-10T09:45:00Z",
  };

  // 캐시 헤더 설정
  const response = NextResponse.json(userData);
  response.headers.set("Cache-Control", "public, max-age=60");

  return response;
}
