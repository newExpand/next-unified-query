import { NextRequest, NextResponse } from "next/server";

// 토큰 유효성 검사 API
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // 토큰 유효성 검사 로직
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }
    
    // 만료된 토큰 시뮬레이션
    if (token === "expired-token") {
      return NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
    }
    
    // 유효한 토큰
    return NextResponse.json({
      valid: true,
      userId: 1,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1시간 후 만료
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}