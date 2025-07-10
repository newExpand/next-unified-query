import {
  ssrPrefetch,
  HydrationBoundary,
  createQueryFactory,
} from "../../lib/query-client";
import { PerformanceSSRTest } from "./performance-ssr-test";

// 대용량 데이터를 위한 쿼리들
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

export default async function SSRPerformanceTestPage() {
  const startTime = Date.now();

  // 성능 테스트를 위한 다양한 쿼리들
  const prefetchQueries = [
    [queries.largeDataset], // 대용량 데이터
    [queries.slowQuery], // 느린 쿼리
    [queries.fastQuery], // 빠른 쿼리
    ...multipleQueries.map((query) => [query]), // 다중 쿼리
  ];

  const dehydratedState = await ssrPrefetch(prefetchQueries as any);
  const endTime = Date.now();
  const prefetchTime = endTime - startTime;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">SSR 성능 테스트</h1>

      <div className="mb-4 p-4 bg-green-50 rounded">
        <h2 className="font-semibold mb-2">테스트 목적</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 대용량 데이터 SSR prefetch 성능 측정</li>
          <li>• 다중 쿼리 병렬 처리 성능 확인</li>
          <li>• 느린 쿼리와 빠른 쿼리 혼합 처리</li>
          <li>• 메모리 사용량 및 직렬화 성능 측정</li>
          <li>• SSR vs CSR 성능 비교</li>
        </ul>
      </div>

      <div className="mb-4 p-4 bg-yellow-50 rounded">
        <h2 className="font-semibold mb-2">성능 지표</h2>
        <div className="text-sm space-y-1">
          <div data-testid="prefetch-time">Prefetch Time: {prefetchTime}ms</div>
          <div data-testid="queries-count">
            Total Queries: {prefetchQueries.length}
          </div>
          <div data-testid="data-size">
            Dehydrated State Size: {JSON.stringify(dehydratedState).length}{" "}
            bytes
          </div>
        </div>
      </div>

      <HydrationBoundary state={dehydratedState}>
        <PerformanceSSRTest prefetchTime={prefetchTime} />
      </HydrationBoundary>
    </div>
  );
}
