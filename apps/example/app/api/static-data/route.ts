import { NextResponse } from "next/server";

/**
 * Static Data API
 * force-cache 테스트를 위한 정적 데이터 제공
 */
export async function GET() {
  const staticData = {
    id: "static-1",
    title: "정적 데이터",
    content: "이 데이터는 캐시되어야 합니다.",
    timestamp: new Date().toISOString(),
    cached: true,
  };

  return NextResponse.json(staticData, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
