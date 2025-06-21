"use client";

import { useQuery } from "../lib/query-client";

interface CacheTestData {
  content: string;
  timestamp: string;
  cached: boolean;
}

/**
 * Fetch Cache 테스트 페이지
 * next-unified-query의 캐시 동작 테스트
 */
export default function FetchCacheTestPage() {
  const { data, isLoading, refetch } = useQuery<CacheTestData>({
    cacheKey: ["fetch-cache-test"],
    url: "/api/static-data",
    fetchConfig: {
      cache: "force-cache", // 브라우저 캐시 강제 사용
    },
    staleTime: 30000, // 30초 동안 fresh 상태 유지
    gcTime: 60000, // 60초 가비지 컬렉션
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Fetch Cache 테스트</h1>
        <div data-testid="loading">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Fetch Cache 테스트</h1>

      <div
        data-testid="cached-content"
        className="bg-gray-100 p-4 rounded mb-4"
      >
        <h2 className="text-lg font-semibold mb-2">캐시된 컨텐츠</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p data-testid="server-timestamp">
            Server Timestamp: {data?.timestamp}
          </p>
          <p>Cached: {data?.cached ? "Yes" : "No"}</p>
          <p>Client Rendered at: {new Date().toISOString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          수동 새로고침
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          페이지 새로고침
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <p>이 페이지는 next-unified-query의 useQuery 훅을 사용합니다.</p>
        <p>force-cache 옵션과 staleTime을 설정하여 캐시 동작을 테스트합니다.</p>
        <p>
          새로고침해도 staleTime 내에서는 같은 timestamp가 표시될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
