"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function ShortGcTimePage() {
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();

  // 2초 gcTime을 가진 쿼리
  const { data, isLoading } = useQuery({
    cacheKey: ["gc-test-data"],
    url: "/api/gc-test-data",
    gcTime: 2000, // 2초
    enabled: isMounted,
  });

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const cacheSize = Object.keys(queries).length;

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize,
        subscribersCount: isMounted ? 1 : 0,
        listenersCount: isMounted ? 1 : 0,
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient, isMounted]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Short GC Time Test</h1>

      <div className="space-y-4">
        <button
          data-testid="mount-component-btn"
          onClick={() => setIsMounted(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Mount Component
        </button>

        <button
          data-testid="unmount-component-btn"
          onClick={() => setIsMounted(false)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Unmount Component
        </button>

        {isMounted && (
          <div data-testid="gc-test-data">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <div>Data: {JSON.stringify(data)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
