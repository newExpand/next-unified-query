"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 짧은 gcTime을 가진 컴포넌트
function ShortGcTimeComponent({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    cacheKey: ["short-gc-data", id],
    url: `/api/test-data`,
    params: { id, size: "small" },
    gcTime: 1000, // 1초로 설정
  });

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
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const cacheSize = Object.keys(queries).length;

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize,
        subscribersCount: isMounted ? cacheSize : 0,
        listenersCount: isMounted ? cacheSize : 0,
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient, isMounted]);

  const createShortGcQueries = () => {
    const newComponents = Array.from({ length: 10 }, (_, i) => i + 1);
    setComponents(newComponents);
    setIsMounted(true);
  };

  const unmountAllComponents = () => {
    setComponents([]);
    setIsMounted(false);
  };

  const getCurrentCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    return {
      cacheSize: Object.keys(queries).length,
      queries: Object.keys(queries),
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

      {components.length > 0 && (
        <div data-testid="queries-created" className="mb-4">
          <p className="text-green-600">쿼리가 생성되었습니다!</p>
        </div>
      )}

      <div className="mb-4">
        <p>현재 캐시 크기: {getCurrentCacheStats().cacheSize}</p>
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
            <ShortGcTimeComponent key={id} id={id} />
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
