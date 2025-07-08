"use client";

import { useState, useEffect as _useEffect } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface MemoryTestData {
  id: number;
  data: string;
  size: number;
  timestamp: string;
}

export default function MemoryUsageTest() {
  const [activeQueries, setActiveQueries] = useState<number[]>([]);
  const [memoryStats, setMemoryStats] = useState({
    totalQueries: 0,
    cachedQueries: 0,
    memoryUsage: 0,
  });
  const [testRunning, setTestRunning] = useState(false);

  // 다중 쿼리 생성 및 관리
  const createMultipleQueries = (count: number) => {
    const queryIds = Array.from({ length: count }, (_, i) => i + 1);
    setActiveQueries(queryIds);

    // 메모리 통계 업데이트
    setMemoryStats((prev) => ({
      ...prev,
      totalQueries: prev.totalQueries + count,
    }));
  };

  // 메모리 압박 테스트 실행
  const runMemoryStressTest = async () => {
    setTestRunning(true);

    // 1단계: 소량의 쿼리 생성 (10개)
    createMultipleQueries(10);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2단계: 중간 규모 쿼리 생성 (50개)
    createMultipleQueries(50);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3단계: 대량 쿼리 생성 (200개)
    createMultipleQueries(200);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4단계: 메모리 정리
    setActiveQueries([]);

    setTestRunning(false);

    // 브라우저 메모리 정보 수집 (가능한 경우)
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      setMemoryStats((prev) => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize,
      }));
    }
  };

  // 개별 쿼리 정리
  const clearSpecificQueries = (count: number) => {
    setActiveQueries((prev) => prev.slice(0, prev.length - count));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            메모리 사용량 테스트
          </h1>

          {/* 컨트롤 패널 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">쿼리 생성</h3>
              <div className="space-y-2">
                <button
                  onClick={() => createMultipleQueries(10)}
                  className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  data-testid="create-10-queries"
                >
                  10개 생성
                </button>
                <button
                  onClick={() => createMultipleQueries(50)}
                  className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  data-testid="create-50-queries"
                >
                  50개 생성
                </button>
                <button
                  onClick={() => createMultipleQueries(200)}
                  className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  data-testid="create-200-queries"
                >
                  200개 생성
                </button>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">쿼리 정리</h3>
              <div className="space-y-2">
                <button
                  onClick={() => clearSpecificQueries(10)}
                  className="w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  data-testid="clear-10-queries"
                >
                  10개 정리
                </button>
                <button
                  onClick={() => setActiveQueries([])}
                  className="w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  data-testid="clear-all-queries"
                >
                  전체 정리
                </button>
                <button
                  onClick={() => {
                    setActiveQueries([]);
                    setMemoryStats({
                      totalQueries: 0,
                      cachedQueries: 0,
                      memoryUsage: 0,
                    });
                  }}
                  className="w-full bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  data-testid="reset-stats"
                >
                  통계 초기화
                </button>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">
                스트레스 테스트
              </h3>
              <div className="space-y-2">
                <button
                  onClick={runMemoryStressTest}
                  disabled={testRunning}
                  className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                  data-testid="memory-stress-test"
                >
                  {testRunning ? "실행 중..." : "메모리 스트레스 테스트"}
                </button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">현재 상태</h3>
              <div className="space-y-1 text-sm">
                <p>
                  활성 쿼리:{" "}
                  <strong data-testid="active-queries-count">
                    {activeQueries.length}
                  </strong>
                </p>
                <p>
                  총 생성:{" "}
                  <strong data-testid="total-queries-count">
                    {memoryStats.totalQueries}
                  </strong>
                </p>
                <p>
                  캐시된 쿼리: <strong>{memoryStats.cachedQueries}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 메모리 사용량 시각화 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-4">메모리 사용량</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className="text-3xl font-bold text-blue-600 mb-2"
                  data-testid="memory-usage-mb"
                >
                  {memoryStats.memoryUsage
                    ? `${(memoryStats.memoryUsage / 1024 / 1024).toFixed(2)} MB`
                    : "N/A"}
                </div>
                <p className="text-sm text-gray-600">JavaScript 힙 사용량</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {(
                    (activeQueries.length /
                      Math.max(memoryStats.totalQueries, 1)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-sm text-gray-600">캐시 적중률</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {activeQueries.length * 2}KB
                </div>
                <p className="text-sm text-gray-600">예상 캐시 크기</p>
              </div>
            </div>
          </div>

          {/* 활성 쿼리 목록 */}
          <div className="bg-white border rounded-lg p-4 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">
              활성 쿼리 목록 (최근 20개)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeQueries.slice(-20).map((queryId) => (
                <QueryComponent key={queryId} queryId={queryId} />
              ))}
            </div>
            {activeQueries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                활성 쿼리가 없습니다.
              </div>
            )}
          </div>

          {/* 테스트 안내 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">테스트 안내</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                • <strong>쿼리 생성</strong>: 다양한 수의 쿼리를 생성하여 메모리
                사용량 확인
              </p>
              <p>
                • <strong>쿼리 정리</strong>: 특정 개수의 쿼리를 정리하여 메모리
                해제 확인
              </p>
              <p>
                • <strong>스트레스 테스트</strong>: 단계적으로 쿼리 수를
                증가시켜 메모리 압박 상황 시뮬레이션
              </p>
              <p>
                • <strong>LRU 동작</strong>: 최대 캐시 한도에 도달했을 때 오래된
                쿼리 제거 확인
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 개별 쿼리 컴포넌트
function QueryComponent({ queryId }: { queryId: number }) {
  const { data, isLoading, error } = useQuery<MemoryTestData, FetchError>({
    cacheKey: ["memory-test", queryId],
    queryFn: async () => {
      // 실제 API 호출 대신 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        id: queryId,
        data: `Test data for query ${queryId}`,
        size: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date().toISOString(),
      };
    },
    gcTime: 30000, // 30초 후 정리
  });

  return (
    <div className="bg-gray-50 p-3 rounded border">
      <div className="text-sm">
        <p className="font-medium">쿼리 #{queryId}</p>
        {isLoading && <p className="text-blue-600">로딩 중...</p>}
        {error && <p className="text-red-600">오류</p>}
        {data && (
          <div className="mt-1 text-xs text-gray-600">
            <p>크기: {data.size}B</p>
            <p>시간: {new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
