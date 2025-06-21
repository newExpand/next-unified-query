import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "100");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const delay = parseInt(searchParams.get("delay") || "0");
  const type = searchParams.get("type") || "products";
  const includeMetadata = searchParams.get("metadata") !== "false";

  // 처리 시간 시뮬레이션
  const processingTime = Math.max(delay, count * 0.5); // 최소 지연시간 적용
  await new Promise((resolve) => setTimeout(resolve, processingTime));

  // 타입에 따른 다른 데이터 생성
  if (type === "cache-test") {
    // 캐시 조회 성능 테스트용 데이터
    const cacheData = Array.from({ length: count }, (_, i) => ({
      key: `cache-key-${i + 1}`,
      value: `cached-value-${i + 1}`,
      data: includeMetadata
        ? {
            metadata: {
              created: new Date().toISOString(),
              accessed: 0,
              size: Math.floor(Math.random() * 1000),
            },
            content: `Large content for cache testing: ${"x".repeat(100)}`,
          }
        : null,
      priority: Math.floor(Math.random() * 10),
      ttl: Math.floor(Math.random() * 3600), // 0-3600초
    }));

    return NextResponse.json({
      type: "cache-test",
      data: cacheData,
      total: count,
      page,
      pageSize,
      processingTime: Math.round(processingTime),
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheEntries: cacheData.length,
        estimatedMemoryUsage: JSON.stringify(cacheData).length,
      },
    });
  }

  if (type === "concurrent") {
    // 동시 쿼리 테스트용 데이터
    const concurrentData = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      queryId: `concurrent-${i + 1}`,
      data: `Result for concurrent query ${i + 1}`,
      timestamp: new Date().toISOString(),
      executionTime: Math.floor(Math.random() * 200) + 10, // 10-210ms
      status: Math.random() > 0.1 ? "success" : "error", // 90% 성공률
      metadata: includeMetadata
        ? {
            requestOrder: i + 1,
            parallelGroup: Math.floor(i / 10), // 10개씩 그룹
            priority: ["high", "medium", "low"][i % 3],
          }
        : null,
    }));

    return NextResponse.json({
      type: "concurrent",
      queries: concurrentData,
      total: count,
      page,
      pageSize,
      processingTime: Math.round(processingTime),
      stats: {
        successful: concurrentData.filter((q) => q.status === "success").length,
        failed: concurrentData.filter((q) => q.status === "error").length,
        averageExecutionTime:
          concurrentData.reduce((sum, q) => sum + q.executionTime, 0) /
          concurrentData.length,
      },
    });
  }

  // 기본 제품 데이터 생성 (기존 로직 개선)
  const products = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.round((Math.random() * 1000 + 10) * 100) / 100,
    category: ["Electronics", "Books", "Clothing", "Home", "Sports"][
      Math.floor(Math.random() * 5)
    ],
    tags: [
      `tag${Math.floor(Math.random() * 10)}`,
      `feature${Math.floor(Math.random() * 5)}`,
      `brand${Math.floor(Math.random() * 3)}`,
    ],
    metadata: includeMetadata
      ? {
          weight: Math.round((Math.random() * 5 + 0.1) * 100) / 100,
          dimensions: {
            width: Math.round((Math.random() * 100 + 1) * 100) / 100,
            height: Math.round((Math.random() * 100 + 1) * 100) / 100,
            depth: Math.round((Math.random() * 100 + 1) * 100) / 100,
          },
          description: `Detailed description for product ${i + 1}. `.repeat(5),
          reviews: Array.from(
            { length: Math.floor(Math.random() * 10) },
            (_, j) => ({
              id: j + 1,
              rating: Math.floor(Math.random() * 5) + 1,
              comment: `Review ${j + 1} for product ${i + 1}`,
            })
          ),
        }
      : null,
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  const bulkData = {
    type: "products",
    products,
    total: count,
    page,
    pageSize,
    processingTime: Math.round(processingTime),
    metadata: {
      generatedAt: new Date().toISOString(),
      dataSize: JSON.stringify(products).length,
      includeMetadata,
      estimatedMemoryUsage: JSON.stringify(products).length,
    },
  };

  return NextResponse.json(bulkData);
}
