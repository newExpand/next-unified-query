import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken, accessToken } = body;

    // 토큰 무효화 시뮬레이션
    // 실제로는 데이터베이스에서 토큰을 블랙리스트에 추가하거나 삭제

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
      invalidatedTokens: {
        accessToken: accessToken ? "invalidated" : "not_provided",
        refreshToken: refreshToken ? "invalidated" : "not_provided",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}