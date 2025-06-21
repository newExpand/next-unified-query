import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // URL에서 스키마 검증 모드 확인
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "invalid") {
      // 스키마 검증 실패 시나리오
      return NextResponse.json({
        id: "invalid-id", // 숫자여야 함
        name: null, // 문자열이어야 함
        email: "invalid-email", // 이메일 형식이어야 함
        age: "thirty", // 숫자여야 함
        profile: {
          bio: 12345, // 문자열이어야 함
          avatar: "not-a-url", // URL 형식이어야 함
          socialLinks: "invalid" // 객체여야 함
        },
        preferences: {
          theme: "invalid-theme", // enum 값이어야 함
          notifications: "yes", // 불린이어야 함
          language: 123 // 문자열이어야 함
        },
        createdAt: "invalid-date", // ISO 날짜여야 함
        // updatedAt 필드 누락
      });
    }

    if (mode === "partial") {
      // 부분적 스키마 오류 시나리오 (기본 정보는 정상, 프로필/설정은 오류)
      return NextResponse.json({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        // profile 필드가 잘못됨
        profile: null,
        // preferences 필드 누락
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-12-01T10:30:00.000Z"
      });
    }

    // 정상적인 사용자 데이터 반환
    return NextResponse.json({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      profile: {
        bio: "Software Developer",
        avatar: "https://example.com/avatar.jpg",
        socialLinks: {
          github: "https://github.com/johndoe",
          linkedin: "https://linkedin.com/in/johndoe"
        }
      },
      preferences: {
        theme: "dark",
        notifications: true,
        language: "en"
      },
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-12-01T10:30:00.000Z"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}