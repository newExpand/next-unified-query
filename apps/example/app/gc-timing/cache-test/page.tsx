"use client";

import { useState, useEffect } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface CacheTestData {
  id: number;
  timestamp: string;
  data: string;
}

export default function GcTimingCacheTest() {
  const [queryCount, setQueryCount] = useState(0);
  const [currentQueryId, setCurrentQueryId] = useState(1);
  const [gcTime, setGcTime] = useState(5000); // 5초 기본값

  // 다양한 gcTime 값으로 쿼리 테스트
  const { data, isLoading, error } = useQuery<CacheTestData, FetchError>({
    cacheKey: ["cache-test", currentQueryId],
    queryFn: async () => {
      const response = await fetch(`/api/cache-test/${currentQueryId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cache test data");
      }
      return response.json() as Promise<CacheTestData>;
    },
    gcTime: gcTime, // 동적 gcTime 값
  });

  // 자동으로 다른 쿼리 실행하여 캐시 동작 관찰
  const { data: backgroundData } = useQuery<CacheTestData>({
    cacheKey: ["background-cache", Math.floor(Date.now() / 10000)], // 10초마다 변경
    queryFn: async () => {
      const response = await fetch("/api/cache-test/background");
      if (!response.ok) {
        throw new Error("Failed to fetch background data");
      }
      return response.json() as Promise<CacheTestData>;
    },
    gcTime: 2000, // 짧은 gcTime으로 빠른 제거 테스트
  });

  useEffect(() => {
    setQueryCount((prev) => prev + 1);
  }, [data]);

  const handleNewQuery = () => {
    setCurrentQueryId((prev) => prev + 1);
  };

  const handleGcTimeChange = (newGcTime: number) => {
    setGcTime(newGcTime);
    // gcTime 변경 후 새 쿼리 실행
    handleNewQuery();
  };

  const triggerMemoryPressure = () => {
    // 메모리 압박 상황 시뮬레이션
    for (let i = 0; i < 100; i++) {
      // 많은 쿼리를 빠르게 생성하여 LRU 캐시 동작 확인
      setCurrentQueryId((prev) => prev + i);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            GC Timing 캐시 테스트
          </h1>

          {/* 컨트롤 패널 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">GC Time 설정</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleGcTimeChange(1000)}
                  className={`w-full px-3 py-1 rounded text-sm ${
                    gcTime === 1000
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 border border-blue-300"
                  }`}
                  data-testid="gc-1s-btn"
                >
                  1초
                </button>
                <button
                  onClick={() => handleGcTimeChange(5000)}
                  className={`w-full px-3 py-1 rounded text-sm ${
                    gcTime === 5000
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 border border-blue-300"
                  }`}
                  data-testid="gc-5s-btn"
                >
                  5초
                </button>
                <button
                  onClick={() => handleGcTimeChange(30000)}
                  className={`w-full px-3 py-1 rounded text-sm ${
                    gcTime === 30000
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 border border-blue-300"
                  }`}
                  data-testid="gc-30s-btn"
                >
                  30초
                </button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">캐시 동작</h3>
              <div className="space-y-2">
                <button
                  onClick={handleNewQuery}
                  className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  data-testid="new-query-btn"
                >
                  새 쿼리 실행
                </button>
                <button
                  onClick={triggerMemoryPressure}
                  className="w-full bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                  data-testid="memory-pressure-btn"
                >
                  메모리 압박 시뮬레이션
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">현재 상태</h3>
              <div className="space-y-1 text-sm">
                <p>
                  현재 GC Time: <strong>{gcTime}ms</strong>
                </p>
                <p>
                  쿼리 ID: <strong>{currentQueryId}</strong>
                </p>
                <p>
                  실행 횟수: <strong>{queryCount}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 메인 쿼리 결과 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">메인 쿼리 결과</h3>
              {isLoading ? (
                <div className="text-center py-4" data-testid="main-loading">
                  <p>로딩 중...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-600">
                  <p>오류: {error.message}</p>
                </div>
              ) : data ? (
                <div data-testid="main-cache-data">
                  <p>
                    <strong>ID:</strong> {data.id}
                  </p>
                  <p>
                    <strong>타임스탬프:</strong> {data.timestamp}
                  </p>
                  <p>
                    <strong>데이터:</strong> {data.data}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                백그라운드 쿼리 (짧은 GC Time)
              </h3>
              {backgroundData ? (
                <div data-testid="background-cache-data">
                  <p>
                    <strong>ID:</strong> {backgroundData.id}
                  </p>
                  <p>
                    <strong>타임스탬프:</strong> {backgroundData.timestamp}
                  </p>
                  <p>
                    <strong>데이터:</strong> {backgroundData.data}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    이 데이터는 2초 후 캐시에서 제거됩니다.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>백그라운드 데이터 로딩 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 캐시 상태 정보 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">캐시 동작 설명</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                • <strong>gcTime</strong>: 쿼리가 더 이상 사용되지 않을 때
                캐시에서 제거되기까지의 시간
              </p>
              <p>
                • <strong>1초 설정</strong>: 빠른 캐시 제거로 메모리 절약 확인
              </p>
              <p>
                • <strong>30초 설정</strong>: 긴 캐시 유지로 성능 최적화 확인
              </p>
              <p>
                • <strong>메모리 압박</strong>: LRU 정책에 따른 오래된 캐시 제거
                확인
              </p>
            </div>
          </div>

          {/* 성능 모니터링 */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">성능 지표</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-600">총 쿼리 수</p>
                <p
                  className="text-lg font-bold text-blue-600"
                  data-testid="total-queries"
                >
                  {queryCount}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600">현재 GC Time</p>
                <p
                  className="text-lg font-bold text-green-600"
                  data-testid="current-gc-time"
                >
                  {gcTime}ms
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600">현재 쿼리 상태</p>
                <p className="text-lg font-bold text-purple-600">
                  {isLoading ? "로딩" : data ? "완료" : "대기"}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-600">메모리 사용량</p>
                <p className="text-lg font-bold text-orange-600">시뮬레이션</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
