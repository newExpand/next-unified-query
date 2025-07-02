"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

// 실제로 마운트/언마운트될 컴포넌트 A
function ComponentA() {
  const { data, isLoading } = useQuery({
    cacheKey: ["multi-subscriber-data"],
    url: "/api/multi-subscriber-data",
    gcTime: 2000, // 2초 gcTime
  });

  if (isLoading) {
    return <div>Component A: Loading...</div>;
  }

  return (
    <div data-testid="component-a-data" className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-semibold">Component A:</h4>
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

// 실제로 마운트/언마운트될 컴포넌트 B
function ComponentB() {
  const { data, isLoading } = useQuery({
    cacheKey: ["multi-subscriber-data"],
    url: "/api/multi-subscriber-data",
    gcTime: 2000, // 2초 gcTime
  });

  if (isLoading) {
    return <div>Component B: Loading...</div>;
  }

  return (
    <div data-testid="component-b-data" className="bg-green-50 p-4 rounded-lg">
      <h4 className="font-semibold">Component B:</h4>
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function MultiSubscribersPage() {
  const [componentAMounted, setComponentAMounted] = useState(false);
  const [componentBMounted, setComponentBMounted] = useState(false);
  const queryClient = useQueryClient();

  // 캐시 통계를 window 객체에 노출하고 주기적으로 업데이트
  useEffect(() => {
    const updateCacheStats = () => {
      const cache = queryClient.getQueryCache();
      const stats = cache.getStats();

      // 실제 캐시 통계를 window 객체에 노출
      window.__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize: stats.cacheSize,
        maxSize: stats.maxSize,
        subscribersCount: stats.subscribersCount,
        listenersCount: stats.listenersCount,
        activeGcTimersCount: stats.activeGcTimersCount,
      };
    };

    // 초기 통계 설정
    updateCacheStats();

    // 100ms마다 통계 업데이트 (테스트의 실시간 확인을 위해)
    const interval = setInterval(updateCacheStats, 100);

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Multi Subscribers GC Test (2초 gcTime)
      </h1>

      {/* 컴포넌트 A 제어 */}
      <div className="space-y-4 mb-6">
        <div className="space-x-4">
          <button
            data-testid="mount-component-a-btn"
            onClick={() => setComponentAMounted(true)}
            disabled={componentAMounted}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Mount Component A
          </button>

          <button
            data-testid="unmount-component-a-btn"
            onClick={() => setComponentAMounted(false)}
            disabled={!componentAMounted}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            Unmount Component A
          </button>
        </div>

        {/* 조건부 렌더링으로 실제 컴포넌트 A 마운트/언마운트 */}
        {componentAMounted && <ComponentA />}
      </div>

      {/* 컴포넌트 B 제어 */}
      <div className="space-y-4 mb-6">
        <div className="space-x-4">
          <button
            data-testid="mount-component-b-btn"
            onClick={() => setComponentBMounted(true)}
            disabled={componentBMounted}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Mount Component B
          </button>

          <button
            data-testid="unmount-component-b-btn"
            onClick={() => setComponentBMounted(false)}
            disabled={!componentBMounted}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            Unmount Component B
          </button>
        </div>

        {/* 조건부 렌더링으로 실제 컴포넌트 B 마운트/언마운트 */}
        {componentBMounted && <ComponentB />}
      </div>

      {/* 실시간 캐시 통계 표시 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">실시간 캐시 통계</h3>
        <div className="text-sm space-y-1">
          <div>
            캐시 크기: <span id="cache-size">-</span>
          </div>
          <div>
            구독자 수: <span id="subscribers-count">-</span>
          </div>
          <div>
            리스너 수: <span id="listeners-count">-</span>
          </div>
          <div>
            활성 GC 타이머: <span id="gc-timers-count">-</span>
          </div>
        </div>
      </div>

      {/* 현재 마운트 상태 표시 */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">현재 상태</h3>
        <div className="text-sm space-y-1">
          <div>
            Component A: {componentAMounted ? "🟢 Mounted" : "🔴 Unmounted"}
          </div>
          <div>
            Component B: {componentBMounted ? "🟢 Mounted" : "🔴 Unmounted"}
          </div>
        </div>
      </div>

      {/* 실시간 통계 업데이트 스크립트 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setInterval(() => {
              if (window.__NEXT_UNIFIED_QUERY_CACHE_STATS__) {
                const stats = window.__NEXT_UNIFIED_QUERY_CACHE_STATS__;
                document.getElementById('cache-size').textContent = stats.cacheSize;
                document.getElementById('subscribers-count').textContent = stats.subscribersCount;
                document.getElementById('listeners-count').textContent = stats.listenersCount;
                document.getElementById('gc-timers-count').textContent = stats.activeGcTimersCount;
              }
            }, 200);
          `,
        }}
      />
    </div>
  );
}
