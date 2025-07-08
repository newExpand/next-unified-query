"use client";

import { useState } from "react";
import { useQueryClient } from "../../lib/query-client";

export default function CacheLookupPage() {
  const [isCachePopulated, setIsCachePopulated] = useState(false);
  const [lookupResults, setLookupResults] = useState<string[]>([]);
  const [isLookupRunning, setIsLookupRunning] = useState(false);
  const queryClient = useQueryClient();

  // 대량 캐시 엔트리 생성 (100개) - 성능 테스트용으로 최적화
  const populateLargeCache = async () => {
    setIsCachePopulated(false);

    // 실제 API 요청을 통해 캐시를 채움
    const promises = Array.from({ length: 100 }, (_, i) => {
      const id = i + 1;
      return fetch(
        `/api/performance-data/bulk?count=1&type=cache-test&id=${id}`
      )
        .then((res) => res.json())
        .then((data) => {
          // 캐시에 직접 저장
          const cache = queryClient.getQueryCache();
          cache.set(["cache-lookup-data", id], {
            data,
            error: undefined,
            isLoading: false,
            isFetching: false,
            updatedAt: Date.now(),
          });
          return data;
        });
    });

    try {
      await Promise.all(promises);
      setIsCachePopulated(true);
    } catch (error) {
      console.error("캐시 생성 실패:", error);
    }
  };

  // 랜덤 캐시 조회 테스트
  const performRandomCacheLookup = () => {
    setIsLookupRunning(true);
    const randomId = Math.floor(Math.random() * 100) + 1; // 1-100 범위로 수정
    const cacheKey = ["cache-lookup-data", randomId];

    const startTime = performance.now();
    // QueryCache에서 직접 조회
    const cache = queryClient.getQueryCache();
    const queryState = cache.get(cacheKey);
    const result = queryState?.data;
    const endTime = performance.now();

    const lookupTime = endTime - startTime;
    const resultText = `조회 시간: ${lookupTime.toFixed(
      3
    )}ms (키: ${JSON.stringify(cacheKey)}, 결과: ${result ? "찾음" : "없음"})`;

    setLookupResults((prev) => [...prev.slice(-99), resultText]); // 최근 100개 결과만 유지
    setIsLookupRunning(false);
  };

  // 캐시 통계 가져오기
  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const keys = Object.keys(queries);
    return {
      totalEntries: keys.length,
      sampleKeys: keys.slice(0, 5),
    };
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">캐시 조회 성능 테스트</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="populate-large-cache"
          onClick={populateLargeCache}
          disabled={isCachePopulated}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isCachePopulated ? "캐시 생성 완료" : "100개 캐시 엔트리 생성"}
        </button>

        <button
          data-testid="random-cache-lookup"
          onClick={performRandomCacheLookup}
          disabled={!isCachePopulated || isLookupRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          랜덤 캐시 조회
        </button>
      </div>

      {isCachePopulated && (
        <div data-testid="cache-populated" className="mb-4">
          <p className="text-green-600 font-semibold">캐시가 생성되었습니다!</p>
        </div>
      )}

      {lookupResults.length > 0 && (
        <div data-testid="lookup-result" className="mb-6">
          <h3 className="text-lg font-semibold mb-2">조회 결과:</h3>
          <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
            {lookupResults.map((result, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">캐시 통계</h3>
          <p>총 엔트리 수: {getCacheStats().totalEntries}</p>
          <p className="text-sm text-gray-600 mt-2">
            샘플 키: {getCacheStats().sampleKeys.join(", ")}
          </p>
        </div>

        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800 mb-2">성능 메트릭</h3>
          <p>조회 횟수: {lookupResults.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            평균 조회 시간 목표: 5ms 이하
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 방법:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>첫 번째 버튼을 클릭하여 100개의 캐시 엔트리를 생성합니다.</li>
          <li>두 번째 버튼을 반복 클릭하여 랜덤 캐시 조회를 수행합니다.</li>
          <li>각 조회의 응답 시간을 측정하고 성능을 평가합니다.</li>
        </ol>
      </div>
    </div>
  );
}
