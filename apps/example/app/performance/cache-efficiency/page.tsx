"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

interface LoadStats {
  totalTime: number;
  networkRequests: number;
  cacheHits: number;
  totalRequests: number;
}

// 고정된 테스트 설정
const TEST_CONFIGS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  delay: 50, // 고정된 지연시간
}));

export default function CacheEfficiencyPage() {
  const [firstLoadStats, setFirstLoadStats] = useState<LoadStats>({
    totalTime: 0,
    networkRequests: 0,
    cacheHits: 0,
    totalRequests: 0,
  });

  const [secondLoadStats, setSecondLoadStats] = useState<LoadStats>({
    totalTime: 0,
    networkRequests: 0,
    cacheHits: 0,
    totalRequests: 0,
  });

  const [testPhase, setTestPhase] = useState<
    "idle" | "first" | "second" | "complete"
  >("idle");

  const queryClient = useQueryClient();
  const networkRequestCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const completedQueriesRef = useRef(0);

  // 개별 쿼리 컴포넌트
  const TestDataLoader = ({
    id,
    enabled,
    onComplete,
  }: {
    id: number;
    enabled: boolean;
    onComplete: (success: boolean) => void;
  }) => {
    const hasCompletedRef = useRef(false);

    const { data, error, isLoading } = useQuery({
      cacheKey: ["cache-efficiency-test", id],
      url: `/api/performance-data`,
      params: { id, efficiency: true },
      enabled,
      staleTime: 30000, // 30초간 fresh로 유지
    });

    useEffect(() => {
      if (!hasCompletedRef.current && !isLoading && (data || error)) {
        hasCompletedRef.current = true;
        onComplete(!!data);
      }
    }, [data, error, isLoading, onComplete]);

    // enabled가 false로 변경되면 완료 상태 리셋
    useEffect(() => {
      if (!enabled) {
        hasCompletedRef.current = false;
      }
    }, [enabled]);

    return null;
  };

  // 네트워크 요청 추적
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = (...args) => {
      if (
        args[0]?.toString().includes("/api/performance-data") &&
        args[0]?.toString().includes("efficiency=true")
      ) {
        networkRequestCountRef.current++;
      }
      return originalFetch.apply(window, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // 캐시 통계를 window 객체에 노출
  useEffect(() => {
    window.__CACHE_PERFORMANCE_STATS__ = {
      firstLoad: firstLoadStats,
      secondLoad: secondLoadStats,
    };
  }, [firstLoadStats, secondLoadStats]);

  const handleQueryComplete = useCallback(
    (success: boolean) => {
      completedQueriesRef.current++;

      if (completedQueriesRef.current >= 10) {
        const endTime = Date.now();
        const totalTime = endTime - startTimeRef.current;
        const currentNetworkRequests = networkRequestCountRef.current;

        if (testPhase === "first") {
          const stats: LoadStats = {
            totalTime,
            networkRequests: currentNetworkRequests,
            cacheHits: 0,
            totalRequests: 10,
          };
          setFirstLoadStats(stats);
          setTestPhase("idle");
        } else if (testPhase === "second") {
          const networkRequests =
            currentNetworkRequests - firstLoadStats.networkRequests;
          const cacheHits = 10 - networkRequests;

          const stats: LoadStats = {
            totalTime,
            networkRequests,
            cacheHits,
            totalRequests: 10,
          };
          setSecondLoadStats(stats);
          setTestPhase("complete");
        }
      }
    },
    [testPhase, firstLoadStats.networkRequests]
  );

  const clearAllCache = () => {
    queryClient.clear();
    networkRequestCountRef.current = 0;
    completedQueriesRef.current = 0;
    setFirstLoadStats({
      totalTime: 0,
      networkRequests: 0,
      cacheHits: 0,
      totalRequests: 0,
    });
    setSecondLoadStats({
      totalTime: 0,
      networkRequests: 0,
      cacheHits: 0,
      totalRequests: 0,
    });
    setTestPhase("idle");
  };

  const loadTestData = () => {
    if (testPhase === "idle" && firstLoadStats.totalTime === 0) {
      // 첫 번째 로드
      completedQueriesRef.current = 0;
      startTimeRef.current = Date.now();
      setTestPhase("first");
    } else if (testPhase === "idle" && firstLoadStats.totalTime > 0) {
      // 두 번째 로드
      completedQueriesRef.current = 0;
      startTimeRef.current = Date.now();
      setTestPhase("second");
    }
  };

  // 효율성 계산
  const getEfficiencyMetrics = () => {
    if (!firstLoadStats.totalTime || !secondLoadStats.totalTime) return null;

    const speedImprovement =
      firstLoadStats.totalTime / secondLoadStats.totalTime;
    const cacheHitRatio =
      secondLoadStats.cacheHits / secondLoadStats.totalRequests;
    const networkReduction =
      1 - secondLoadStats.networkRequests / firstLoadStats.networkRequests;

    return {
      speedImprovement,
      cacheHitRatio,
      networkReduction,
    };
  };

  const efficiencyMetrics = getEfficiencyMetrics();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">캐시 효율성 측정</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="clear-all-cache"
          onClick={clearAllCache}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          모든 캐시 지우기
        </button>

        <button
          data-testid="load-test-data"
          onClick={loadTestData}
          disabled={testPhase !== "idle"}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {firstLoadStats.totalTime === 0
            ? "첫 번째 로드"
            : "두 번째 로드 (캐시)"}
        </button>

        <div className="px-4 py-2 bg-gray-100 rounded">
          현재 단계:{" "}
          {testPhase === "idle"
            ? "대기"
            : testPhase === "first"
            ? "첫 번째 로드 중"
            : testPhase === "second"
            ? "두 번째 로드 중"
            : "완료"}
        </div>
      </div>

      {firstLoadStats.totalTime > 0 && (
        <div data-testid="first-load-complete" className="mb-4">
          <p className="text-green-600 font-semibold">
            첫 번째 로드가 완료되었습니다!
          </p>
        </div>
      )}

      {secondLoadStats.totalTime > 0 && (
        <div data-testid="second-load-complete" className="mb-4">
          <p className="text-green-600 font-semibold">
            두 번째 로드가 완료되었습니다!
          </p>
        </div>
      )}

      {/* 로드 통계 비교 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800 mb-3">
            첫 번째 로드 (네트워크)
          </h3>
          <div className="space-y-2">
            <p>
              소요 시간:{" "}
              <span className="font-bold">{firstLoadStats.totalTime}ms</span>
            </p>
            <p>
              네트워크 요청:{" "}
              <span className="font-bold">
                {firstLoadStats.networkRequests}
              </span>
            </p>
            <p>
              캐시 히트:{" "}
              <span className="font-bold">{firstLoadStats.cacheHits}</span>
            </p>
            <p>
              총 요청:{" "}
              <span className="font-bold">{firstLoadStats.totalRequests}</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-3">
            두 번째 로드 (캐시)
          </h3>
          <div className="space-y-2">
            <p>
              소요 시간:{" "}
              <span className="font-bold">{secondLoadStats.totalTime}ms</span>
            </p>
            <p>
              네트워크 요청:{" "}
              <span className="font-bold">
                {secondLoadStats.networkRequests}
              </span>
            </p>
            <p>
              캐시 히트:{" "}
              <span className="font-bold">{secondLoadStats.cacheHits}</span>
            </p>
            <p>
              총 요청:{" "}
              <span className="font-bold">{secondLoadStats.totalRequests}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 효율성 메트릭 */}
      {efficiencyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`p-4 rounded ${
              efficiencyMetrics.speedImprovement >= 2
                ? "bg-green-100"
                : efficiencyMetrics.speedImprovement >= 1.5
                ? "bg-yellow-100"
                : "bg-red-100"
            }`}
          >
            <h3
              className={`font-semibold ${
                efficiencyMetrics.speedImprovement >= 2
                  ? "text-green-800"
                  : efficiencyMetrics.speedImprovement >= 1.5
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              속도 향상
            </h3>
            <p className="text-2xl font-bold">
              {efficiencyMetrics.speedImprovement.toFixed(1)}x
            </p>
            <p className="text-sm text-gray-600">목표: 2x 이상</p>
          </div>

          <div
            className={`p-4 rounded ${
              efficiencyMetrics.cacheHitRatio >= 0.8
                ? "bg-green-100"
                : efficiencyMetrics.cacheHitRatio >= 0.6
                ? "bg-yellow-100"
                : "bg-red-100"
            }`}
          >
            <h3
              className={`font-semibold ${
                efficiencyMetrics.cacheHitRatio >= 0.8
                  ? "text-green-800"
                  : efficiencyMetrics.cacheHitRatio >= 0.6
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              캐시 히트율
            </h3>
            <p className="text-2xl font-bold">
              {(efficiencyMetrics.cacheHitRatio * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">목표: 80% 이상</p>
          </div>

          <div
            className={`p-4 rounded ${
              efficiencyMetrics.networkReduction >= 0.8
                ? "bg-green-100"
                : efficiencyMetrics.networkReduction >= 0.6
                ? "bg-yellow-100"
                : "bg-red-100"
            }`}
          >
            <h3
              className={`font-semibold ${
                efficiencyMetrics.networkReduction >= 0.8
                  ? "text-green-800"
                  : efficiencyMetrics.networkReduction >= 0.6
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              네트워크 절약
            </h3>
            <p className="text-2xl font-bold">
              {(efficiencyMetrics.networkReduction * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">목표: 80% 이상</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 절차:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>모든 캐시 지우기 버튼을 클릭하여 깨끗한 상태로 시작</li>
          <li>첫 번째 로드 버튼을 클릭하여 네트워크에서 데이터 로드</li>
          <li>
            첫 번째 로드 완료 후 두 번째 로드 버튼을 클릭하여 캐시에서 데이터
            로드
          </li>
          <li>두 로드 결과를 비교하여 캐시 효율성 평가</li>
        </ol>
      </div>

      {/* 진행률 표시 */}
      {(testPhase === "first" || testPhase === "second") && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedQueriesRef.current / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            진행률: {completedQueriesRef.current}/10 (
            {((completedQueriesRef.current / 10) * 100).toFixed(0)}%)
          </p>
        </div>
      )}

      {/* 숨겨진 테스트 데이터 로더 컴포넌트들 */}
      <div className="hidden">
        {TEST_CONFIGS.map((config) => (
          <TestDataLoader
            key={config.id}
            id={config.id}
            enabled={testPhase === "first" || testPhase === "second"}
            onComplete={handleQueryComplete}
          />
        ))}
      </div>
    </div>
  );
}
