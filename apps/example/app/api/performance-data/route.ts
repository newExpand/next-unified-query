import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 다양한 파라미터 지원
    const mode = searchParams.get("mode") || "factory";
    const id = searchParams.get("id") || "1";
    const delay = parseInt(searchParams.get("delay") || "0");
    const type = searchParams.get("type") || "default";
    const batch = searchParams.get("batch") === "true";
    const efficiency = searchParams.get("efficiency") === "true";
    const size = searchParams.get("size") || "medium";

    // 기본 처리 시간 계산
    let processingTime =
      mode === "factory"
        ? Math.random() * 50 + 10 // 10-60ms
        : Math.random() * 60 + 15; // 15-75ms

    // 추가 지연 시간 적용
    processingTime += delay;

    // 크기에 따른 추가 지연
    const sizeMultiplier =
      {
        small: 0.5,
        medium: 1,
        large: 2,
      }[size] || 1;

    processingTime *= sizeMultiplier;

    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // 데이터 크기 결정
    const itemCount =
      {
        small: 10,
        medium: 50,
        large: 200,
      }[size] || 50;

    // 데이터 생성
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: `${type}-${id}-${i + 1}`,
      name: `${type} Item ${i + 1}`,
      value: Math.random() * 1000,
      category: mode,
      type,
      timestamp: new Date().toISOString(),
      metadata: {
        batchRequest: batch,
        efficiency: efficiency,
        size: size,
        processingOrder: i + 1,
      },
    }));

    // 배칭 시뮬레이션 (실제로는 여러 요청을 하나로 처리)
    if (batch) {
      return NextResponse.json({
        mode,
        type,
        batchId: `batch-${Date.now()}`,
        items,
        totalCount: items.length,
        processingTime: Math.round(processingTime),
        batching: {
          enabled: true,
          efficiency: 0.7, // 70% 효율성
          requestsSaved: Math.floor(items.length * 0.3),
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          requestMode: mode,
          requestType: type,
          isBatched: true,
          optimizations:
            mode === "factory"
              ? ["type-safety", "caching", "reusability", "batching"]
              : ["flexibility", "simplicity"],
        },
      });
    }

    // 효율성 테스트용 응답
    if (efficiency) {
      return NextResponse.json({
        mode,
        type: "efficiency-test",
        id: parseInt(id),
        data: items[0], // 단일 아이템만 반환
        cacheInfo: {
          cacheable: true,
          ttl: 30000, // 30초
          key: `efficiency-${id}`,
        },
        performance: {
          processingTime: Math.round(processingTime),
          networkLatency: Math.round(processingTime * 0.3),
          cacheTime: 5, // 캐시에서 가져올 때는 5ms
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          requestMode: mode,
          isEfficiencyTest: true,
        },
      });
    }

    // 기본 응답
    return NextResponse.json({
      mode,
      type,
      id: parseInt(id),
      items,
      totalCount: items.length,
      processingTime: Math.round(processingTime),
      metadata: {
        generatedAt: new Date().toISOString(),
        requestMode: mode,
        requestType: type,
        size: size,
        delay: delay,
        optimizations:
          mode === "factory"
            ? ["type-safety", "caching", "reusability"]
            : ["flexibility", "simplicity"],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Performance test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
