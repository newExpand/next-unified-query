"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface PerformanceData {
  mode: string;
  items: any[];
  processingTime: number;
}

export default function PerformanceComparison() {
  const [_testMode, setTestMode] = useState<"factory" | "options">("factory");
  const [performanceResults, setPerformanceResults] = useState<{
    factory: { time: number; calls: number } | null;
    options: { time: number; calls: number } | null;
  }>({ factory: null, options: null });

  // Factory 방식 쿼리
  const { data: factoryData, refetch: refetchFactory } =
    useQuery<PerformanceData>({
      cacheKey: ["performance", "factory"],
      queryFn: async () => {
        const startTime = performance.now();
        const response = await fetch("/api/performance-data?mode=factory");

        if (!response.ok) {
          throw new Error("Factory query failed");
        }

        const result = await response.json();
        const endTime = performance.now();

        setPerformanceResults((prev) => ({
          ...prev,
          factory: {
            time: endTime - startTime,
            calls: (prev.factory?.calls || 0) + 1,
          },
        }));

        return result;
      },
      enabled: false,
    });

  // Options 방식 쿼리
  const { data: optionsData, refetch: refetchOptions } =
    useQuery<PerformanceData>({
      cacheKey: ["performance", "options"],
      queryFn: async () => {
        const startTime = performance.now();
        const response = await fetch("/api/performance-data?mode=options");

        if (!response.ok) {
          throw new Error("Options query failed");
        }

        const result = await response.json();
        const endTime = performance.now();

        setPerformanceResults((prev) => ({
          ...prev,
          options: {
            time: endTime - startTime,
            calls: (prev.options?.calls || 0) + 1,
          },
        }));

        return result;
      },
      enabled: false,
    });

  const runFactoryTest = async () => {
    setTestMode("factory");
    await refetchFactory();
  };

  const runOptionsTest = async () => {
    setTestMode("options");
    await refetchOptions();
  };

  const resetTests = () => {
    setPerformanceResults({ factory: null, options: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Factory vs Options 성능 비교
          </h1>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={runFactoryTest}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                data-testid="run-factory-test-btn"
              >
                Factory 방식 테스트
              </button>
              <button
                onClick={runOptionsTest}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                data-testid="run-options-test-btn"
              >
                Options 방식 테스트
              </button>
              <button
                onClick={resetTests}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                data-testid="reset-tests-btn"
              >
                테스트 초기화
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Factory 방식:</strong> 미리 정의된 쿼리 설정 사용
              </p>
              <p>
                <strong>Options 방식:</strong> 인라인으로 쿼리 옵션 정의
              </p>
            </div>
          </div>
        </div>

        {/* 성능 결과 비교 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Factory 방식 결과 */}
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="factory-results"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Factory 방식
            </h2>

            {performanceResults.factory ? (
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-900 mb-2">성능 지표</h3>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>
                      <strong>실행 시간:</strong>{" "}
                      {performanceResults.factory.time.toFixed(2)}ms
                    </p>
                    <p>
                      <strong>호출 횟수:</strong>{" "}
                      {performanceResults.factory.calls}회
                    </p>
                  </div>
                </div>

                {factoryData && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium text-gray-900 mb-2">
                      응답 데이터
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>모드: {factoryData.mode}</p>
                      <p>데이터 개수: {factoryData.items?.length || 0}개</p>
                      <p>처리 시간: {factoryData.processingTime}ms</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Factory 테스트를 실행해주세요
              </div>
            )}
          </div>

          {/* Options 방식 결과 */}
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="options-results"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Options 방식
            </h2>

            {performanceResults.options ? (
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-900 mb-2">성능 지표</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>
                      <strong>실행 시간:</strong>{" "}
                      {performanceResults.options.time.toFixed(2)}ms
                    </p>
                    <p>
                      <strong>호출 횟수:</strong>{" "}
                      {performanceResults.options.calls}회
                    </p>
                  </div>
                </div>

                {optionsData && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-medium text-gray-900 mb-2">
                      응답 데이터
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p>모드: {optionsData.mode}</p>
                      <p>데이터 개수: {optionsData.items?.length || 0}개</p>
                      <p>처리 시간: {optionsData.processingTime}ms</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Options 테스트를 실행해주세요
              </div>
            )}
          </div>
        </div>

        {/* 성능 비교 분석 */}
        {performanceResults.factory && performanceResults.options && (
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="performance-comparison"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              성능 비교 분석
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-medium text-purple-900 mb-1">시간 차이</h3>
                <p
                  className="text-2xl font-bold text-purple-700"
                  data-testid="time-difference"
                >
                  {Math.abs(
                    performanceResults.factory.time -
                      performanceResults.options.time
                  ).toFixed(2)}
                  ms
                </p>
                <p className="text-sm text-purple-600">
                  {performanceResults.factory.time <
                  performanceResults.options.time
                    ? "Factory가 빠름"
                    : "Options가 빠름"}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-medium text-yellow-900 mb-1">성능 비율</h3>
                <p
                  className="text-2xl font-bold text-yellow-700"
                  data-testid="performance-ratio"
                >
                  {(
                    Math.max(
                      performanceResults.factory.time,
                      performanceResults.options.time
                    ) /
                    Math.min(
                      performanceResults.factory.time,
                      performanceResults.options.time
                    )
                  ).toFixed(2)}
                  x
                </p>
                <p className="text-sm text-yellow-600">더 느린 방식의 배율</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded">
                <h3 className="font-medium text-indigo-900 mb-1">총 호출</h3>
                <p className="text-2xl font-bold text-indigo-700">
                  {performanceResults.factory.calls +
                    performanceResults.options.calls}
                  회
                </p>
                <p className="text-sm text-indigo-600">
                  Factory: {performanceResults.factory.calls} / Options:{" "}
                  {performanceResults.options.calls}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">분석 결과</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• Factory 방식은 타입 안전성과 재사용성에서 우위</p>
                <p>• Options 방식은 유연성과 일회성 쿼리에서 유리</p>
                <p>
                  • 성능 차이는 브라우저와 데이터 크기에 따라 달라질 수 있음
                </p>
                <p>• 대규모 애플리케이션에서는 Factory 방식이 권장됨</p>
              </div>
            </div>
          </div>
        )}

        {/* 권장사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            사용 권장사항
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>Factory 방식 추천:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>대규모 애플리케이션</li>
              <li>반복적으로 사용되는 쿼리</li>
              <li>팀 개발 환경에서 일관성이 중요한 경우</li>
            </ul>

            <p>
              <strong>Options 방식 추천:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>소규모 프로젝트 또는 프로토타입</li>
              <li>일회성 또는 매우 특수한 쿼리</li>
              <li>빠른 개발이 필요한 경우</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
