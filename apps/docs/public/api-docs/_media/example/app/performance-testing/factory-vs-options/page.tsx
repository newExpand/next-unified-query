"use client";

import { useState } from "react";
import { useQuery, createQueryFactory } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface PerformanceData {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

// 실제 Factory 패턴 사용
const performanceQueries = createQueryFactory({
  performanceData: {
    cacheKey: (id: number) => ["performance", "factory", id],
    url: (id: number) => `/api/performance-data/${id}`,
  },
});

export default function FactoryVsOptionsPerformance() {
  const [testResults, setTestResults] = useState<{
    factoryTime: number;
    optionsTime: number;
    factoryCount: number;
    optionsCount: number;
  }>({
    factoryTime: 0,
    optionsTime: 0,
    factoryCount: 0,
    optionsCount: 0,
  });

  const [currentDataId, setCurrentDataId] = useState(1);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Factory 기반 쿼리 (사전 정의된 타입과 URL)
  const factoryQuery = useQuery<PerformanceData, FetchError>(
    performanceQueries.performanceData,
    {
      params: currentDataId,
    }
  );

  // Options 기반 쿼리 (인라인 정의)
  const optionsQuery = useQuery<PerformanceData, FetchError>({
    cacheKey: ["performance", "options", currentDataId],
    queryFn: async () => {
      const response = await fetch(`/api/performance-data/${currentDataId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      return response.json() as Promise<PerformanceData>;
    },
  });

  // 성능 측정 테스트 실행
  const runPerformanceTest = async () => {
    setIsRunningTest(true);

    const iterations = 100;
    let factoryTotalTime = 0;
    let optionsTotalTime = 0;

    // Factory 패턴 성능 측정
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      // Factory 쿼리 참조 (이미 사전 정의됨)
      const factoryConfig = performanceQueries.performanceData;
      factoryConfig.cacheKey(i);
      factoryConfig.url(i);

      const endTime = performance.now();
      factoryTotalTime += endTime - startTime;
    }

    // Options 패턴 성능 측정
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      // Options 쿼리 구성 시뮬레이션 (매번 새로 생성)
      const _cacheKey = ["performance", "options", i];
      const _url = `/api/performance-data/${i}`;

      const endTime = performance.now();
      optionsTotalTime += endTime - startTime;
    }

    setTestResults({
      factoryTime: factoryTotalTime / iterations,
      optionsTime: optionsTotalTime / iterations,
      factoryCount: iterations,
      optionsCount: iterations,
    });

    setIsRunningTest(false);
  };

  // 메모리 사용량 시뮬레이션
  const simulateMemoryUsage = () => {
    // 많은 쿼리 생성으로 메모리 압박 시뮬레이션
    for (let i = 0; i < 1000; i++) {
      // Factory 방식: 사전 정의된 객체 재사용
      const factoryConfig = performanceQueries.performanceData;
      factoryConfig.cacheKey(i);
      factoryConfig.url(i);

      // Options 방식: 매번 새 객체 생성
      const _config = {
        cacheKey: ["memory-test", i],
        url: `/api/memory-test/${i}`,
      };
    }

    // 전역 상태에 메모리 사용량 정보 저장 (E2E 테스트용)
    (window as any).__MEMORY_USAGE_TEST__ = {
      factoryQueries: 1000,
      optionsQueries: 1000,
      timestamp: Date.now(),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Factory vs Options 성능 비교
          </h1>

          {/* 컨트롤 패널 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">테스트 제어</h3>
              <div className="space-y-2">
                <button
                  onClick={runPerformanceTest}
                  disabled={isRunningTest}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  data-testid="run-performance-test"
                >
                  {isRunningTest ? "실행 중..." : "성능 테스트 실행"}
                </button>
                <button
                  onClick={simulateMemoryUsage}
                  className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700"
                  data-testid="memory-usage-test"
                >
                  메모리 사용량 테스트
                </button>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">데이터 제어</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentDataId((prev) => prev + 1)}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  data-testid="next-data-btn"
                >
                  다음 데이터 ({currentDataId + 1})
                </button>
                <button
                  onClick={() => setCurrentDataId(1)}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                  data-testid="reset-data-btn"
                >
                  데이터 초기화
                </button>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">현재 상태</h3>
              <div className="space-y-1 text-sm">
                <p>
                  데이터 ID: <strong>{currentDataId}</strong>
                </p>
                <p>
                  Factory 상태:{" "}
                  <strong>{factoryQuery.isLoading ? "로딩" : "완료"}</strong>
                </p>
                <p>
                  Options 상태:{" "}
                  <strong>{optionsQuery.isLoading ? "로딩" : "완료"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 성능 결과 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Factory 패턴 결과
              </h3>
              {factoryQuery.isLoading ? (
                <div className="text-center py-4">
                  <p>로딩 중...</p>
                </div>
              ) : factoryQuery.error ? (
                <div className="text-center py-4 text-red-600">
                  <p>오류: {factoryQuery.error.message}</p>
                </div>
              ) : factoryQuery.data ? (
                <div data-testid="factory-result">
                  <p>
                    <strong>ID:</strong> {factoryQuery.data.id}
                  </p>
                  <p>
                    <strong>제목:</strong> {factoryQuery.data.title}
                  </p>
                  <p>
                    <strong>설명:</strong> {factoryQuery.data.description}
                  </p>
                  <p>
                    <strong>타임스탬프:</strong> {factoryQuery.data.timestamp}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Options 패턴 결과
              </h3>
              {optionsQuery.isLoading ? (
                <div className="text-center py-4">
                  <p>로딩 중...</p>
                </div>
              ) : optionsQuery.error ? (
                <div className="text-center py-4 text-red-600">
                  <p>오류: {optionsQuery.error.message}</p>
                </div>
              ) : optionsQuery.data ? (
                <div data-testid="options-result">
                  <p>
                    <strong>ID:</strong> {optionsQuery.data.id}
                  </p>
                  <p>
                    <strong>제목:</strong> {optionsQuery.data.title}
                  </p>
                  <p>
                    <strong>설명:</strong> {optionsQuery.data.description}
                  </p>
                  <p>
                    <strong>타임스탬프:</strong> {optionsQuery.data.timestamp}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* 성능 비교 차트 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-4">성능 비교 결과</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Factory 평균 시간
                </p>
                <p
                  className="text-2xl font-bold text-blue-600"
                  data-testid="factory-avg-time"
                >
                  {testResults.factoryTime.toFixed(3)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Options 평균 시간
                </p>
                <p
                  className="text-2xl font-bold text-green-600"
                  data-testid="options-avg-time"
                >
                  {testResults.optionsTime.toFixed(3)}ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">성능 차이</p>
                <p
                  className="text-2xl font-bold text-purple-600"
                  data-testid="performance-diff"
                >
                  {testResults.factoryTime && testResults.optionsTime
                    ? `${Math.abs(
                        testResults.factoryTime - testResults.optionsTime
                      ).toFixed(3)}ms`
                    : "0ms"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  더 빠른 패턴
                </p>
                <p
                  className="text-2xl font-bold text-orange-600"
                  data-testid="faster-pattern"
                >
                  {testResults.factoryTime && testResults.optionsTime
                    ? testResults.factoryTime < testResults.optionsTime
                      ? "Factory"
                      : "Options"
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 비교 설명 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-3">패턴 비교</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-yellow-800">
              <div>
                <h4 className="font-medium mb-2">Factory 패턴 장점</h4>
                <ul className="space-y-1">
                  <li>• 타입 안전성 향상</li>
                  <li>• 코드 재사용성 증가</li>
                  <li>• 일관된 캐시 키 관리</li>
                  <li>• 컴파일 타임 검증</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Options 패턴 장점</h4>
                <ul className="space-y-1">
                  <li>• 즉시 사용 가능</li>
                  <li>• 동적 쿼리 생성</li>
                  <li>• 작은 번들 크기</li>
                  <li>• 유연한 구성</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
