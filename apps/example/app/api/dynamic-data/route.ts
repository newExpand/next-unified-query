import { NextResponse } from "next/server";

/**
 * Dynamic Data API
 * no-store 테스트를 위한 동적 데이터 제공
 */
export async function GET() {
  const dynamicData = {
    id: `dynamic-${Date.now()}`,
    title: "동적 데이터",
    content: "이 데이터는 매번 새로 생성됩니다.",
    timestamp: new Date().toISOString(),
    randomValue: Math.random(),
    cached: false,
  };

  return NextResponse.json(dynamicData, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
