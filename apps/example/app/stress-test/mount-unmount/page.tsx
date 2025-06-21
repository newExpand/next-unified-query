"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 테스트용 컴포넌트
function TestComponent({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    cacheKey: ["test-data", id],
    url: `/api/test-data`,
    params: { id, size: "small" },
    gcTime: 100, // 짧은 gc 시간으로 설정
  });

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 정리 작업
      console.log(`TestComponent ${id} unmounted`);
    };
  }, [id]);

  return (
    <div data-testid="test-component">
      <h3>테스트 컴포넌트 {id}</h3>
      {isLoading ? (
        <div>로딩 중...</div>
      ) : (
        <div>데이터: {JSON.stringify(data)}</div>
      )}
    </div>
  );
}

export default function MountUnmountTestPage() {
  const [components, setComponents] = useState<number[]>([]);
  const [nextId, setNextId] = useState(1);
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const cacheSize = Object.keys(queries).length;

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize,
        subscribersCount: cacheSize, // 단순화된 계산
        listenersCount: cacheSize, // 동일한 값으로 설정
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient]);

  const mountComponent = () => {
    setComponents((prev) => [...prev, nextId]);
    setNextId((prev) => prev + 1);
  };

  const unmountComponent = () => {
    setComponents((prev) => prev.slice(0, -1));
  };

  const mountAll = () => {
    const newComponents = Array.from({ length: 10 }, (_, i) => nextId + i);
    setComponents((prev) => [...prev, ...newComponents]);
    setNextId((prev) => prev + 10);
  };

  const unmountAll = () => {
    setComponents([]);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        컴포넌트 마운트/언마운트 테스트
      </h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="mount-component"
          onClick={mountComponent}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          컴포넌트 마운트
        </button>

        <button
          data-testid="unmount-component"
          onClick={unmountComponent}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          컴포넌트 언마운트
        </button>

        <button
          data-testid="mount-all-components"
          onClick={mountAll}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          10개 컴포넌트 마운트
        </button>

        <button
          data-testid="unmount-all-components"
          onClick={unmountAll}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          모든 컴포넌트 언마운트
        </button>
      </div>

      <div className="mb-4">
        <p>현재 마운트된 컴포넌트 수: {components.length}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((id) => (
          <TestComponent key={id} id={id} />
        ))}
      </div>

      {components.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          마운트된 컴포넌트가 없습니다.
        </div>
      )}
    </div>
  );
}
