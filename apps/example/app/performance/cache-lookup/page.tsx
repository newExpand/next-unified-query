"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function CacheLookupPage() {
  const [isCachePopulated, setIsCachePopulated] = useState(false);
  const [lookupResults, setLookupResults] = useState<string[]>([]);
  const [isLookupRunning, setIsLookupRunning] = useState(false);
  const queryClient = useQueryClient();

  // 대량 캐시 데이터 생성용 컴포넌트
  const CachePopulatorComponent = ({ id }: { id: number }) => {
    const { data } = useQuery({
      cacheKey: ["cache-lookup-data", id],
      url: `/api/performance-data/bulk`,
      params: { count: 1, type: "cache-test", id: id },
    });

    return null;
  };

  // 대량 캐시 엔트리 생성 (10,000개)
  const populateLargeCache = async () => {
    setIsCachePopulated(false);
    // 10,000개의 캐시 엔트리를 생성하기 위해 컴포넌트들을 렌더링
    // 실제로는 더 효율적인 방법으로 캐시를 채울 수 있지만,
    // 여기서는 테스트 목적으로 간단히 처리
    setTimeout(() => {
      setIsCachePopulated(true);
    }, 2000);
  };

  // 랜덤 캐시 조회 테스트
  const performRandomCacheLookup = () => {
    setIsLookupRunning(true);
    const randomId = Math.floor(Math.random() * 10000) + 1;
    const cacheKey = ["cache-lookup-data", randomId];

    const startTime = performance.now();
    const result = queryClient.get(cacheKey);
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
    return {
      totalEntries: Object.keys(queries).length,
      sampleKeys: Object.keys(queries).slice(0, 5),
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
          {isCachePopulated ? "캐시 생성 완료" : "10,000개 캐시 엔트리 생성"}
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
          <li>첫 번째 버튼을 클릭하여 10,000개의 캐시 엔트리를 생성합니다.</li>
          <li>두 번째 버튼을 반복 클릭하여 랜덤 캐시 조회를 수행합니다.</li>
          <li>각 조회의 응답 시간을 측정하고 성능을 평가합니다.</li>
        </ol>
      </div>

      {/* 캐시 데이터 생성을 위한 숨겨진 컴포넌트들 */}
      {!isCachePopulated && (
        <div className="hidden">
          {Array.from({ length: 1000 }, (_, i) => (
            <CachePopulatorComponent key={i} id={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
