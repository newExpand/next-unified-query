import { NextResponse } from "next/server";

/**
 * Revalidate Data API
 * 시간 기반 재검증 테스트를 위한 데이터 제공
 * 5초마다 새로운 데이터 생성
 */

// 서버 메모리에 데이터 캐싱 (15초마다 갱신)
let cachedData: any = null;
let lastGenerated = 0;
const CACHE_DURATION = 15000; // 15초

export async function GET() {
  const now = Date.now();

  // 캐시된 데이터가 없거나 5초가 지났으면 새로운 데이터 생성
  if (!cachedData || now - lastGenerated >= CACHE_DURATION) {
    console.log("🔄 Generating new revalidate data (cache expired)");
    cachedData = {
      id: "revalidate-1",
      title: "재검증 데이터",
      content: "이 데이터는 15초마다 재검증됩니다.",
      timestamp: new Date().toISOString(),
      generatedAt: now,
      cacheStatus: "newly-generated",
      cacheStatusKr: "새로 생성됨",
    };
    lastGenerated = now;
  } else {
    console.log("✅ Returning cached revalidate data");
    // 캐시된 데이터에 현재 상태 추가
    cachedData = {
      ...cachedData,
      cacheStatus: "from-cache",
      cacheStatusKr: "캐시에서 제공됨",
      remainingCacheTime: CACHE_DURATION - (now - lastGenerated),
    };
  }

  return NextResponse.json(cachedData, {
    headers: {
      "Cache-Control": "public, max-age=15, s-maxage=15",
      "X-Cache-Status": cachedData.cacheStatus,
      "X-Generated-At": lastGenerated.toString(),
      "X-Current-Time": now.toString(),
    },
  });
}
