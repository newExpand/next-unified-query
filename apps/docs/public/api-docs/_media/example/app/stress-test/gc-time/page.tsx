"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 짧은 gcTime을 가진 컴포넌트
function ShortGcTimeComponent({
  id,
  onLoaded,
}: {
  id: number;
  onLoaded?: () => void;
}) {
  const { data, isLoading } = useQuery({
    cacheKey: ["short-gc-data", id],
    url: `/api/test-data`,
    params: { id, size: "small" },
    gcTime: 1000, // 1초로 설정
  });

  // 로딩 완료 시 부모에게 알림
  useEffect(() => {
    if (!isLoading && data && onLoaded) {
      onLoaded();
    }
  }, [isLoading, data, onLoaded]);

  return (
    <div className="p-4 border rounded">
      <h4>컴포넌트 {id}</h4>
      {isLoading ? (
        <div>로딩...</div>
      ) : (
        <div>데이터: {JSON.stringify(data)}</div>
      )}
    </div>
  );
}

export default function GcTimeTestPage() {
  const [components, setComponents] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(true);
  const [loadedComponents, setLoadedComponents] = useState<Set<number>>(
    new Set()
  );
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const stats = cache.getStats();

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize: stats.cacheSize,
        maxSize: stats.maxSize,
        subscribersCount: stats.subscribersCount, // 올바른 구독자 수
        listenersCount: stats.listenersCount, // 올바른 리스너 수
        activeGcTimersCount: stats.activeGcTimersCount,
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient]);

  const createShortGcQueries = () => {
    const newComponents = Array.from({ length: 10 }, (_, i) => i + 1);
    setComponents(newComponents);
    setLoadedComponents(new Set()); // 로딩 상태 초기화
    setIsMounted(true);
  };

  const unmountAllComponents = () => {
    setComponents([]);
    setLoadedComponents(new Set());
    setIsMounted(false);
  };

  const handleComponentLoaded = (id: number) => {
    setLoadedComponents((prev) => new Set([...prev, id]));
  };

  // 모든 컴포넌트 로딩 완료 여부
  const allQueriesLoaded =
    components.length > 0 && loadedComponents.size === components.length;

  const getCurrentCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const stats = cache.getStats();
    return {
      cacheSize: stats.cacheSize,
      subscribersCount: stats.subscribersCount,
      listenersCount: stats.listenersCount,
      activeGcTimersCount: stats.activeGcTimersCount,
    };
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">gcTime 동작 테스트</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="create-short-gc-queries"
          onClick={createShortGcQueries}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          짧은 gcTime 쿼리 생성
        </button>

        <button
          data-testid="unmount-all-components"
          onClick={unmountAllComponents}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          모든 컴포넌트 언마운트
        </button>
      </div>

      {components.length > 0 && !allQueriesLoaded && (
        <div className="mb-4">
          <p className="text-blue-600">
            쿼리 로딩 중... ({loadedComponents.size}/{components.length})
          </p>
        </div>
      )}

      {allQueriesLoaded && (
        <div data-testid="queries-created" className="mb-4">
          <p className="text-green-600">
            모든 쿼리 로딩 완료! 캐시에 저장되었습니다.
          </p>
        </div>
      )}

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">실시간 캐시 통계</h3>
        <p>캐시 크기: {getCurrentCacheStats().cacheSize}</p>
        <p>구독자 수: {getCurrentCacheStats().subscribersCount}</p>
        <p>리스너 수: {getCurrentCacheStats().listenersCount}</p>
        <p>활성 GC 타이머: {getCurrentCacheStats().activeGcTimersCount}</p>
        <p>마운트된 컴포넌트: {components.length}개</p>
        <p>구독 상태: {isMounted ? "활성" : "비활성"}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 방법:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>첫 번째 버튼을 클릭하여 짧은 gcTime(1초) 쿼리들을 생성합니다.</li>
          <li>두 번째 버튼을 클릭하여 모든 컴포넌트를 언마운트합니다.</li>
          <li>1초 후 캐시가 자동으로 정리되는지 확인합니다.</li>
        </ol>
      </div>

      {isMounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((id) => (
            <ShortGcTimeComponent
              key={id}
              id={id}
              onLoaded={() => handleComponentLoaded(id)}
            />
          ))}
        </div>
      )}

      {!isMounted && components.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          컴포넌트가 언마운트되었습니다. gcTime 후 캐시가 정리됩니다.
        </div>
      )}
    </div>
  );
}
