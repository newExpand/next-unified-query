"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

import { FetchError, z } from "next-unified-query";

// 제품 스키마 정의
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  tags: z.array(z.string()),
  metadata: z.object({
    weight: z.number(),
    dimensions: z.object({
      width: z.number(),
      height: z.number(),
      depth: z.number(),
    }),
  }),
  createdAt: z.string().datetime(),
});

const BulkProductSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

type BulkProductData = z.infer<typeof BulkProductSchema>;

interface PerformanceStats {
  totalItems: number;
  validationTime: number;
  itemsPerSecond: number;
  renderTime: number;
  queryTime: number;
  cacheTime: number;
}

export default function PerformanceTestPage() {
  const [performanceStats, setPerformanceStats] =
    useState<PerformanceStats | null>(null);

  const { data, error, isLoading, refetch } = useQuery<
    BulkProductData,
    FetchError
  >({
    cacheKey: ["products", "bulk", "performance"],
    enabled: false, // 자동 실행 비활성화
    queryFn: async () => {
      const queryStartTime = performance.now();

      // API 호출
      const response = await fetch("/api/products/bulk");
      if (!response.ok) {
        throw new Error("Failed to fetch bulk products");
      }

      const rawData = await response.json();
      const queryEndTime = performance.now();
      const queryTime = queryEndTime - queryStartTime;

      // 스키마 검증 시작 시간
      const validationStartTime = performance.now();

      try {
        const validatedData = BulkProductSchema.parse(rawData);
        const validationEndTime = performance.now();

        const validationTime = validationEndTime - validationStartTime;
        const itemsPerSecond = Math.round(
          validatedData.products.length / (validationTime / 1000)
        );

        // 성능 통계 계산
        const stats: PerformanceStats = {
          totalItems: validatedData.total,
          validationTime: Math.round(validationTime),
          itemsPerSecond,
          renderTime: 0, // 렌더링 후 업데이트됨
          queryTime: Math.round(queryTime),
          cacheTime: 0, // 캐시 테스트 시 업데이트됨
        };

        // 글로벌 상태에 성능 데이터 저장 (테스트용)
        (window as any).__SCHEMA_VALIDATION_STATS__ = {
          validationExecutions:
            ((window as any).__SCHEMA_VALIDATION_STATS__
              ?.validationExecutions || 0) + 1,
          cacheHits:
            (window as any).__SCHEMA_VALIDATION_STATS__?.cacheHits || 0,
        };

        // 렌더링 성능 측정을 위해 다음 틱에서 업데이트
        setTimeout(() => {
          const renderEndTime = performance.now();
          const renderTime = renderEndTime - validationEndTime;

          setPerformanceStats({
            ...stats,
            renderTime: Math.round(renderTime),
          });

          // 전역 변수에 저장 (테스트용)
          (window as any).__RENDER_PERFORMANCE_STATS__ = {
            renderTime: Math.round(renderTime),
          };
        }, 0);

        return validatedData;
      } catch (error) {
        console.error("Schema validation failed:", error);
        throw new Error("스키마 검증에 실패했습니다");
      }
    },
    schema: BulkProductSchema, // next-unified-query의 스키마 검증 기능 사용
    staleTime: 30000, // 30초
    gcTime: 60000, // 1분
  });

  const loadBulkData = () => {
    refetch();
  };

  const testCachePerformance = async () => {
    if (!data) return;

    const cacheStartTime = performance.now();
    await refetch(); // 캐시된 데이터 다시 가져오기
    const cacheEndTime = performance.now();
    const cacheTime = cacheEndTime - cacheStartTime;

    // 캐시 히트 통계 업데이트
    const currentStats = (window as any).__SCHEMA_VALIDATION_STATS__;
    (window as any).__SCHEMA_VALIDATION_STATS__ = {
      ...currentStats,
      cacheHits: currentStats.cacheHits + 1,
    };

    if (performanceStats) {
      setPerformanceStats({
        ...performanceStats,
        cacheTime: Math.round(cacheTime),
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          대용량 데이터 스키마 검증 성능 테스트
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">테스트 설정</h2>
          <div className="space-y-2 text-gray-600 mb-4">
            <p>• 데이터 크기: 1,000개 제품</p>
            <p>• 스키마 복잡도: 중첩 객체, 배열, 다양한 타입</p>
            <p>• 측정 항목: 쿼리 시간, 검증 시간, 처리량, 렌더링 시간</p>
            <p>• next-unified-query: 스키마 검증, 캐싱, 상태 관리</p>
          </div>

          <div className="space-x-4">
            <button
              data-testid="load-bulk-data-btn"
              onClick={loadBulkData}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "로딩 중..." : "대용량 데이터 로드"}
            </button>

            {data && (
              <button
                data-testid="test-cache-btn"
                onClick={testCachePerformance}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                캐시 성능 테스트
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              ❌ 검증 실패
            </h2>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {data && (
          <div
            data-testid="bulk-data-loaded"
            className="bg-green-50 rounded-lg p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              ✅ 데이터 로드 완료
            </h2>
            <p className="text-green-700">
              <span data-testid="validated-items-count">
                {data.products.length}
              </span>
              개의 제품이 성공적으로 검증되었습니다.
            </p>
          </div>
        )}

        {performanceStats && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">성능 통계</h2>
            <div data-testid="performance-stats" className="hidden">
              {JSON.stringify(performanceStats)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceStats.totalItems}
                </div>
                <div className="text-sm text-gray-600">총 아이템</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceStats.queryTime}ms
                </div>
                <div className="text-sm text-gray-600">쿼리 시간</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceStats.validationTime}ms
                </div>
                <div className="text-sm text-gray-600">검증 시간</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceStats.itemsPerSecond}
                </div>
                <div className="text-sm text-gray-600">초당 처리량</div>
              </div>
            </div>

            {performanceStats.cacheTime > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {performanceStats.cacheTime}ms
                  </div>
                  <div className="text-sm text-gray-600">캐시 조회 시간</div>
                </div>
              </div>
            )}
          </div>
        )}

        {data && data.products.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              검증된 제품 목록 (처음 10개)
            </h2>
            <div className="grid gap-2">
              {data.products.slice(0, 10).map((product) => (
                <div key={product.id} className="border rounded p-3 text-sm">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-gray-600">
                    ${product.price} - {product.category}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-gray-500">
              ... 그리고 {data.products.length - 10}개 더
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
