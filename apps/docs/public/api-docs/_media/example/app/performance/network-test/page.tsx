"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "../../lib/query-client";

// 고정된 테스트 설정 (20개)
const TEST_CONFIGS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  delay: Math.floor((i * 10) % 200), // 0-190ms 고정 패턴
}));

export default function NetworkTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    loadTime: number;
    requestCount: number;
    successRate: number;
  }>({
    loadTime: 0,
    requestCount: 0,
    successRate: 0,
  });

  const startTimeRef = useRef(0);
  const completedCountRef = useRef(0);
  const successCountRef = useRef(0);
  const hasUpdatedRef = useRef(false);

  // 네트워크 테스트용 쿼리 컴포넌트
  const NetworkTestQuery = ({
    id,
    delay,
    enabled,
  }: {
    id: number;
    delay: number;
    enabled: boolean;
  }) => {
    const hasCompletedRef = useRef(false);

    const { data, error, isLoading } = useQuery({
      cacheKey: ["network-test", id, delay], // 고정된 캐시 키
      url: `/api/performance-data`,
      params: {
        id,
        delay,
        size: "medium",
        type: "network",
      },
      enabled,
      staleTime: 30000, // 30초간 fresh로 유지
    });

    useEffect(() => {
      if (!hasCompletedRef.current && !isLoading && (data || error)) {
        hasCompletedRef.current = true;

        completedCountRef.current++;
        if (data) {
          successCountRef.current++;
        }

        // 즉시 상태 업데이트 (한 번만)
        if (!hasUpdatedRef.current) {
          hasUpdatedRef.current = true;

          // 상태 업데이트를 배치로 처리
          const updateResults = () => {
            const currentCount = completedCountRef.current;
            const currentSuccess = successCountRef.current;

            setResults((prev) => ({
              ...prev,
              requestCount: currentCount,
              successRate: currentCount > 0 ? currentSuccess / currentCount : 0,
            }));

            // 20개 완료 시 테스트 종료
            if (currentCount >= 20) {
              const endTime = Date.now();
              setResults((prev) => ({
                ...prev,
                loadTime: endTime - startTimeRef.current,
              }));
              setIsRunning(false);
            } else {
              // 아직 완료되지 않았으면 다음 업데이트 허용
              hasUpdatedRef.current = false;
            }
          };

          // 약간의 지연을 두고 업데이트 (배치 처리)
          setTimeout(updateResults, 10);
        }
      }
    }, [data, error, isLoading]);

    // enabled가 false로 변경되면 완료 상태 리셋
    useEffect(() => {
      if (!enabled) {
        hasCompletedRef.current = false;
      }
    }, [enabled]);

    return null;
  };

  const startNetworkTest = () => {
    setIsRunning(true);
    completedCountRef.current = 0;
    successCountRef.current = 0;
    hasUpdatedRef.current = false;
    startTimeRef.current = Date.now();

    setResults({
      loadTime: 0,
      requestCount: 0,
      successRate: 0,
    });
  };

  const isCompleted = results.requestCount >= 20 && !isRunning;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">네트워크 성능 테스트</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="start-network-test"
          onClick={startNetworkTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isRunning ? "테스트 실행 중..." : "네트워크 테스트 시작"}
        </button>
      </div>

      {isCompleted && (
        <div data-testid="network-test-complete" className="mb-4">
          <p className="text-green-600 font-semibold">
            네트워크 테스트가 완료되었습니다!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">총 소요 시간</h3>
          <p className="text-2xl font-bold text-blue-600">
            {results.loadTime}ms
          </p>
        </div>

        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">요청 수</h3>
          <p className="text-2xl font-bold text-green-600">
            {results.requestCount}/20
          </p>
        </div>

        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800">성공률</h3>
          <p className="text-2xl font-bold text-purple-600">
            {(results.successRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          네트워크 조건별 기대 성능:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800">3G Fast</h4>
            <p className="text-sm text-gray-600">기대 시간: 3초 이하</p>
            <p className="text-sm text-gray-600">다운로드: 1.6Mbps</p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800">3G Slow</h4>
            <p className="text-sm text-gray-600">기대 시간: 8초 이하</p>
            <p className="text-sm text-gray-600">다운로드: 500Kbps</p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-800">2G</h4>
            <p className="text-sm text-gray-600">기대 시간: 15초 이하</p>
            <p className="text-sm text-gray-600">다운로드: 280Kbps</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 내용:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>20개의 병렬 HTTP 요청</li>
          <li>각 요청마다 0-190ms 고정 패턴 지연</li>
          <li>중간 크기 응답 데이터</li>
          <li>성공률 및 총 소요 시간 측정</li>
        </ul>
      </div>

      {/* 진행률 표시 */}
      {isRunning && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((results.requestCount / 20) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            진행률: {Math.min(results.requestCount, 20)}/20 (
            {Math.min((results.requestCount / 20) * 100, 100).toFixed(0)}%)
          </p>
        </div>
      )}

      {/* 숨겨진 네트워크 테스트 컴포넌트들 */}
      <div className="hidden">
        {TEST_CONFIGS.map((config) => (
          <NetworkTestQuery
            key={config.id}
            id={config.id}
            delay={config.delay}
            enabled={isRunning}
          />
        ))}
      </div>
    </div>
  );
}
