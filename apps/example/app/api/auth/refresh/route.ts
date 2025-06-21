import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // 리프레시 토큰 검증 시뮬레이션
    if (!refreshToken || !refreshToken.startsWith("refresh_token_")) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // 새로운 액세스 토큰 생성
    const newAccessToken = `access_token_${Date.now()}`;
    const newRefreshToken = `refresh_token_${Date.now()}`;

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600, // 1시간
      tokenType: "Bearer",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}