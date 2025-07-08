import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // 토큰 검증 시뮬레이션
    if (token === "null" || !token.startsWith("access_token_")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 사용자 프로필 반환
    return NextResponse.json({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      avatar: "https://example.com/avatar.jpg",
      createdAt: "2023-01-01T00:00:00.000Z",
      lastLogin: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}