import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 타입 coercion 테스트를 위해 문자열로 전송
    return NextResponse.json({
      totalViews: "12345", // 숫자로 변환될 예정
      conversionRate: "3.45", // 숫자로 변환될 예정
      isActive: "true", // 불린으로 변환될 예정
      lastUpdated: "2023-01-01T00:00:00.000Z", // Date 객체로 변환될 예정
      categories: "web,mobile,api", // 배열로 변환될 예정
      metadata: {
        version: "1.0",
        flags: "feature1,feature2,feature3" // 배열로 변환될 예정
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}