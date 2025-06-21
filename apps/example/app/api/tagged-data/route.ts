import { NextResponse } from "next/server";

/**
 * Tagged Data API
 * 태그 기반 재검증 테스트를 위한 데이터 제공
 */
export async function GET() {
  const taggedData = {
    id: "tagged-1",
    title: "태그된 데이터",
    content: "이 데이터는 태그 기반으로 재검증됩니다.",
    timestamp: new Date().toISOString(),
    tag: "user-data",
    lastUpdated: Date.now(),
  };

  return NextResponse.json(taggedData, {
    headers: {
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
