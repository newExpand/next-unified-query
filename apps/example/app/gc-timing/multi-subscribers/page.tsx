"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

function ComponentA({ isVisible }: { isVisible: boolean }) {
  const { data, isLoading } = useQuery({
    cacheKey: ["multi-subscriber-data"],
    url: "/api/multi-subscriber-data",
    enabled: isVisible,
  });

  if (!isVisible) return null;

  return (
    <div data-testid="component-a-data">
      Component A: {isLoading ? "Loading..." : JSON.stringify(data)}
    </div>
  );
}

function ComponentB({ isVisible }: { isVisible: boolean }) {
  const { data, isLoading } = useQuery({
    cacheKey: ["multi-subscriber-data"],
    url: "/api/multi-subscriber-data",
    enabled: isVisible,
  });

  if (!isVisible) return null;

  return (
    <div data-testid="component-b-data">
      Component B: {isLoading ? "Loading..." : JSON.stringify(data)}
    </div>
  );
}

export default function MultiSubscribersPage() {
  const [componentAVisible, setComponentAVisible] = useState(false);
  const [componentBVisible, setComponentBVisible] = useState(false);
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      const cacheSize = Object.keys(queries).length;

      let subscribersCount = 0;
      if (componentAVisible) subscribersCount++;
      if (componentBVisible) subscribersCount++;

      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize,
        subscribersCount,
        listenersCount: subscribersCount,
      };
    };

    const interval = setInterval(updateCacheStats, 100);
    return () => clearInterval(interval);
  }, [queryClient, componentAVisible, componentBVisible]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Multi Subscribers GC Test</h1>

      <div className="space-y-4">
        <div className="space-x-4">
          <button
            data-testid="mount-component-a-btn"
            onClick={() => setComponentAVisible(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mount Component A
          </button>

          <button
            data-testid="unmount-component-a-btn"
            onClick={() => setComponentAVisible(false)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Unmount Component A
          </button>
        </div>

        <div className="space-x-4">
          <button
            data-testid="mount-component-b-btn"
            onClick={() => setComponentBVisible(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Mount Component B
          </button>

          <button
            data-testid="unmount-component-b-btn"
            onClick={() => setComponentBVisible(false)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Unmount Component B
          </button>
        </div>

        <ComponentA isVisible={componentAVisible} />
        <ComponentB isVisible={componentBVisible} />
      </div>
    </div>
  );
}
