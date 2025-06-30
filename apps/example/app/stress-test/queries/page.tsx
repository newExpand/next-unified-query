"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 실제 쿼리를 생성하는 컴포넌트
function QueryComponent({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    cacheKey: ["stress-test-query", id],
    url: `/api/test-data`,
    params: { id, size: "small" },
    gcTime: 300000, // 5분
  });

  return null; // UI는 렌더링하지 않음 (성능상)
}

export default function MemoryStressTest() {
  const [queryIds, setQueryIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const stats = cache.getStats();

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize: stats.cacheSize,
        maxSize: stats.maxSize,
        subscribersCount: stats.subscribersCount,
        listenersCount: stats.listenersCount,
        activeGcTimersCount: stats.activeGcTimersCount,
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient]);

  const handleCreate1000Queries = async () => {
    setIsCreating(true);

    // 1000개 쿼리 ID 생성
    const ids = Array.from({ length: 1000 }, (_, i) => i + 1);
    setQueryIds(ids);

    // 약간의 지연 후 완료 표시
    setTimeout(() => {
      setIsCreating(false);
    }, 2000);
  };

  const handleCreateAdditionalQueries = async () => {
    setIsCreating(true);

    // 추가로 500개 더 생성 (총 1500개)
    // LRU eviction으로 인해 캐시는 maxQueries(1000) 제한 내에 유지되어야 함
    const additionalIds = Array.from({ length: 500 }, (_, i) => i + 1001);
    setQueryIds((prev) => [...prev, ...additionalIds]);

    setTimeout(() => {
      setIsCreating(false);
    }, 2000);
  };

  const clearAllQueries = () => {
    setQueryIds([]);
    queryClient.getQueryCache().clear();
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">실제 메모리 사용량 테스트</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">실제 쿼리 통계</h2>
          <p>생성된 쿼리 컴포넌트: {queryIds.length}개</p>
          <p>상태: {isCreating ? "생성 중..." : "완료"}</p>
        </div>

        <div className="space-x-4">
          <button
            data-testid="create-1000-queries"
            onClick={handleCreate1000Queries}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            1000개 실제 쿼리 생성
          </button>

          <button
            data-testid="create-additional-queries"
            onClick={handleCreateAdditionalQueries}
            disabled={isCreating || queryIds.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            추가 500개 생성 (LRU 테스트)
          </button>

          <button
            onClick={clearAllQueries}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            모든 쿼리 삭제
          </button>
        </div>

        {queryIds.length > 0 && !isCreating && (
          <div data-testid="queries-created" className="text-green-600">
            ✅ {queryIds.length}개 쿼리가 실제로 생성되었습니다
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>⚠️ 이 테스트는 실제 API를 호출하므로 시간이 걸릴 수 있습니다.</p>
          <p>
            📊 브라우저 개발자 도구에서 네트워크 탭을 확인하여 실제 요청을
            확인할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 실제 쿼리 컴포넌트들 렌더링 */}
      <div style={{ display: "none" }}>
        {queryIds.map((id) => (
          <QueryComponent key={id} id={id} />
        ))}
      </div>
    </div>
  );
}
