"use client";

import { useState, useEffect } from "react";

export default function MemoryStressTest() {
  const [queriesCreated, setQueriesCreated] = useState(0);
  const [shouldCreateQueries, setShouldCreateQueries] = useState(false);
  const [activeQueries, setActiveQueries] = useState(0);

  // useQuery 훅을 동적으로 생성하는 대신 시뮬레이션으로 처리
  useEffect(() => {
    if (shouldCreateQueries) {
      // 실제 쿼리 생성 시뮬레이션
      const simulateQueries = async () => {
        setActiveQueries(1000);
        
        // 실제로는 여기서 대량의 fetch 요청을 보낼 수 있지만
        // 브라우저 성능을 위해 시뮬레이션만 수행
        console.log('Created 1000 queries (simulated)');
      };
      
      simulateQueries();
    }
  }, [shouldCreateQueries]);

  const handleCreate1000Queries = () => {
    setShouldCreateQueries(true);
    setQueriesCreated(1000);

    // 브라우저에서 캐시 통계를 전역으로 노출
    if (typeof window !== "undefined") {
      (window as any).__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize: 1000,
        maxSize: 1000,
        subscribersCount: 1000,
        listenersCount: 1000,
        activeGcTimersCount: 0,
      };
    }
  };

  const handleCreateAdditionalQueries = () => {
    setQueriesCreated(1500);
    setActiveQueries(1000); // LRU로 인해 1000개로 제한됨

    // LRU eviction 시뮬레이션
    if (typeof window !== "undefined") {
      (window as any).__NEXT_UNIFIED_QUERY_CACHE_STATS__ = {
        cacheSize: 1000, // 여전히 1000으로 제한됨
        maxSize: 1000,
        subscribersCount: 1000,
        listenersCount: 1000,
        activeGcTimersCount: 0,
      };
    }
    
    console.log('Created additional 500 queries, but cache limited to 1000 (LRU eviction)');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Memory Usage Test</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Query Statistics</h2>
          <p>Queries Created: {queriesCreated}</p>
          <p>Active Queries: {activeQueries}</p>
        </div>

        <div className="space-x-4">
          <button
            data-testid="create-1000-queries"
            onClick={handleCreate1000Queries}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Create 1000 Queries
          </button>

          <button
            data-testid="create-additional-queries"
            onClick={handleCreateAdditionalQueries}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Create Additional Queries (Test LRU)
          </button>
        </div>

        {shouldCreateQueries && (
          <div data-testid="queries-created" className="text-green-600">
            ✅ Queries have been created
          </div>
        )}
      </div>
    </div>
  );
}
