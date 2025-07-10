"use client";

import { useQuery, createQueryFactory } from "../../lib/query-client";
import { useState, useEffect, useCallback } from "react";

const queries = createQueryFactory({
  largeDataset: {
    cacheKey: () => ["ssr-test", "large-dataset"] as const,
    url: () => "/api/ssr-test/large-dataset",
  },
  slowQuery: {
    cacheKey: () => ["ssr-test", "slow"] as const,
    url: () => "/api/ssr-test/slow",
  },
  fastQuery: {
    cacheKey: () => ["ssr-test", "fast"] as const,
    url: () => "/api/ssr-test/fast",
  },
});

const multipleQueries = Array.from(
  { length: 10 },
  (_, i) =>
    createQueryFactory({
      [`batch${i}`]: {
        cacheKey: () => ["ssr-test", "batch", i] as const,
        url: () => `/api/ssr-test/batch/${i}`,
      },
    })[`batch${i}`]
);

// 개별 배치 쿼리 컴포넌트
function BatchQueryItem({
  query,
  index,
  onResult
}: {
  query: any;
  index: number;
  onResult: (index: number, result: { isLoading: boolean; data?: any; error?: any }) => void;
}) {
  const { data, isLoading, error } = useQuery(query, {});
  
  useEffect(() => {
    onResult(index, { isLoading, data, error });
  }, [data, isLoading, error, index, onResult]);
  
  return null;
}

interface PerformanceSSRTestProps {
  prefetchTime: number;
}

export function PerformanceSSRTest({ prefetchTime }: PerformanceSSRTestProps) {
  const [renderStartTime] = useState(() => Date.now());
  const [hydrationTime, setHydrationTime] = useState<number | null>(null);

  const { data: largeData, isLoading: largeLoading } = useQuery(
    queries.largeDataset,
    {}
  );
  const { data: slowData, isLoading: slowLoading } = useQuery(
    queries.slowQuery,
    {}
  );
  const { data: fastData, isLoading: fastLoading } = useQuery(
    queries.fastQuery,
    {}
  );

  // 다중 쿼리 결과 상태
  const [batchResults, setBatchResults] = useState<Array<{
    isLoading: boolean;
    data?: any;
    error?: any;
  }>>(Array.from({ length: 10 }, () => ({ isLoading: true })));
  
  // 배치 쿼리 결과 업데이트 핸들러
  const handleBatchResult = useCallback((index: number, result: { isLoading: boolean; data?: any; error?: any }) => {
    setBatchResults(prev => {
      const newResults = [...prev];
      newResults[index] = result;
      return newResults;
    });
  }, []);

  useEffect(() => {
    if (!largeLoading && !slowLoading && !fastLoading) {
      const endTime = Date.now();
      setHydrationTime(endTime - renderStartTime);
    }
  }, [largeLoading, slowLoading, fastLoading, renderStartTime]);

  const allBatchLoading = batchResults.some((result) => result.isLoading);

  return (
    <div className="space-y-6">
      {/* 성능 지표 */}
      <div className="border p-4 rounded bg-blue-50">
        <h2 className="font-semibold mb-2">성능 지표</h2>
        <div className="text-sm space-y-1">
          <div data-testid="performance-prefetch-time">
            SSR Prefetch Time: {prefetchTime}ms
          </div>
          <div data-testid="performance-hydration-time">
            Hydration Time:{" "}
            {hydrationTime ? `${hydrationTime}ms` : "Calculating..."}
          </div>
          <div data-testid="performance-total-time">
            Total Time:{" "}
            {hydrationTime
              ? `${prefetchTime + hydrationTime}ms`
              : "Calculating..."}
          </div>
        </div>
      </div>

      {/* 대용량 데이터 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">대용량 데이터 테스트</h2>
        <div data-testid="large-dataset-section">
          {largeLoading ? (
            <div data-testid="large-dataset-loading">Loading...</div>
          ) : (
            <div data-testid="large-dataset-data">
              <div data-testid="large-dataset-count">
                Items: {largeData?.length || 0}
              </div>
              <div data-testid="large-dataset-size">
                Size: {JSON.stringify(largeData).length} bytes
              </div>
              <div className="text-sm text-gray-600">
                First item: {largeData?.[0]?.name || "N/A"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 다중 쿼리 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">다중 쿼리 테스트 (10개 쿼리)</h2>
        <div data-testid="batch-queries-section">
          {allBatchLoading ? (
            <div data-testid="batch-queries-loading">Loading...</div>
          ) : (
            <div data-testid="batch-queries-data">
              <div data-testid="batch-queries-count">
                Completed: {batchResults.filter((r) => !r.isLoading).length}/10
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {batchResults.map((result, index) => (
                  <div
                    key={index}
                    data-testid={`batch-item-${index}`}
                    className="text-sm"
                  >
                    Query {index}:{" "}
                    {result.isLoading
                      ? "Loading..."
                      : result.error
                      ? "Error"
                      : result.data?.message || "Done"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 속도 비교 테스트 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">속도 비교 테스트</h2>
        <div className="grid grid-cols-2 gap-4">
          <div data-testid="slow-query-section">
            <h3 className="font-medium mb-1">느린 쿼리</h3>
            {slowLoading ? (
              <div data-testid="slow-query-loading">Loading...</div>
            ) : (
              <div data-testid="slow-query-data">
                <div>Message: {slowData?.message}</div>
                <div>Delay: {slowData?.delay}ms</div>
              </div>
            )}
          </div>
          <div data-testid="fast-query-section">
            <h3 className="font-medium mb-1">빠른 쿼리</h3>
            {fastLoading ? (
              <div data-testid="fast-query-loading">Loading...</div>
            ) : (
              <div data-testid="fast-query-data">
                <div>Message: {fastData?.message}</div>
                <div>Delay: {fastData?.delay}ms</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메모리 사용량 (근사치) */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">메모리 사용량 (근사치)</h2>
        <div data-testid="memory-usage-section">
          <div data-testid="memory-large-data">
            Large Data: ~{JSON.stringify(largeData).length} bytes
          </div>
          <div data-testid="memory-batch-data">
            Batch Data: ~
            {batchResults.reduce(
              (sum, r) => sum + JSON.stringify(r.data || {}).length,
              0
            )}{" "}
            bytes
          </div>
          <div data-testid="memory-total">
            Total: ~
            {
              JSON.stringify({
                largeData: largeData || {},
                batchResults: batchResults.map((r) => r.data || {}),
              }).length
            }{" "}
            bytes
          </div>
        </div>
      </div>

      {/* 디버그 정보 */}
      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">디버그 정보</h2>
        <div className="text-sm space-y-1">
          <div data-testid="debug-large-loading">
            Large Data Loading: {largeLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-slow-loading">
            Slow Query Loading: {slowLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-fast-loading">
            Fast Query Loading: {fastLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-batch-loading">
            Batch Queries Loading: {allBatchLoading ? "Yes" : "No"}
          </div>
          <div data-testid="debug-render-time">
            Render Start: {new Date(renderStartTime).toISOString()}
          </div>
        </div>
      </div>

      {/* 숨겨진 배치 쿼리 컴포넌트들 */}
      <div style={{ display: "none" }}>
        {multipleQueries.map((query, index) => (
          <BatchQueryItem
            key={`batch-${index}`}
            query={query}
            index={index}
            onResult={handleBatchResult}
          />
        ))}
      </div>
    </div>
  );
}
