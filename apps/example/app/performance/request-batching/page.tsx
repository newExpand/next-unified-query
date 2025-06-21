"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "../../lib/query-client";

// 관련 쿼리 설정 (15개)
const RELATED_QUERY_CONFIGS = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  type: "batch",
}));

export default function RequestBatchingPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [batchingStats, setBatchingStats] = useState({
    potentialRequests: 0,
    actualRequests: 0,
    batchingRatio: 0,
  });

  const completedCountRef = useRef(0);
  const networkRequestCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const hasUpdatedRef = useRef(false);

  const RelatedQuery = ({
    id,
    type,
    enabled,
  }: {
    id: number;
    type: string;
    enabled: boolean;
  }) => {
    const hasCompletedRef = useRef(false);

    const { data, error, isLoading } = useQuery({
      cacheKey: ["related-query", id, type], // 고정된 캐시 키
      url: `/api/performance-data`,
      params: {
        id,
        batch: true,
        type,
        delay: 50,
      },
      enabled,
      staleTime: 30000,
    });

    useEffect(() => {
      if (!hasCompletedRef.current && !isLoading && (data || error)) {
        hasCompletedRef.current = true;

        completedCountRef.current++;

        // 배치 업데이트 (한 번만)
        if (!hasUpdatedRef.current) {
          hasUpdatedRef.current = true;

          const updateStats = () => {
            const currentCompleted = completedCountRef.current;
            const currentNetworkRequests = networkRequestCountRef.current;
            const potentialRequests = 15;
            const batchingRatio =
              currentNetworkRequests > 0
                ? Math.max(
                    0,
                    (potentialRequests - currentNetworkRequests) /
                      potentialRequests
                  )
                : 0;

            setBatchingStats({
              potentialRequests,
              actualRequests: currentNetworkRequests,
              batchingRatio,
            });

            // window 객체에 노출
            (window as any).__REQUEST_BATCHING_STATS__ = {
              potentialRequests,
              actualRequests: currentNetworkRequests,
              batchingRatio,
              completedQueries: currentCompleted,
            };

            // 15개 완료 시 테스트 종료
            if (currentCompleted >= 15) {
              setIsRunning(false);
            } else {
              // 아직 완료되지 않았으면 다음 업데이트 허용
              hasUpdatedRef.current = false;
            }
          };

          // 배치 처리를 위한 지연
          setTimeout(updateStats, 20);
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

  // 전역 요청 카운터 (실제 네트워크 요청 추적)
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = (...args) => {
      // API 요청만 카운트
      if (
        args[0]?.toString().includes("/api/performance-data") &&
        args[0]?.toString().includes("batch=true")
      ) {
        networkRequestCountRef.current++;
      }
      return originalFetch.apply(window, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const triggerRelatedQueries = () => {
    setIsRunning(true);
    completedCountRef.current = 0;
    networkRequestCountRef.current = 0;
    hasUpdatedRef.current = false;
    startTimeRef.current = Date.now();

    setBatchingStats({
      potentialRequests: 0,
      actualRequests: 0,
      batchingRatio: 0,
    });
  };

  const isCompleted = completedCountRef.current >= 15 && !isRunning;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">요청 배칭 효율성 테스트</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="trigger-related-queries"
          onClick={triggerRelatedQueries}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isRunning ? "테스트 실행 중..." : "관련 쿼리 트리거"}
        </button>
      </div>

      {isCompleted && (
        <div data-testid="all-data-loaded" className="mb-4">
          <p className="text-green-600 font-semibold">
            모든 데이터가 로드되었습니다!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">잠재적 요청</h3>
          <p className="text-2xl font-bold text-blue-600">
            {batchingStats.potentialRequests}
          </p>
          <p className="text-sm text-gray-600">개별 요청 시</p>
        </div>

        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">실제 요청</h3>
          <p className="text-2xl font-bold text-green-600">
            {batchingStats.actualRequests}
          </p>
          <p className="text-sm text-gray-600">배칭 후</p>
        </div>

        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800">배칭 효율</h3>
          <p className="text-2xl font-bold text-purple-600">
            {(batchingStats.batchingRatio * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">절약율</p>
        </div>

        <div className="p-4 bg-orange-100 rounded">
          <h3 className="font-semibold text-orange-800">완료된 쿼리</h3>
          <p className="text-2xl font-bold text-orange-600">
            {Math.min(completedCountRef.current, 15)}
          </p>
          <p className="text-sm text-gray-600">/ 15개</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">배칭 효율성 평가:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded border-2 ${
              batchingStats.batchingRatio > 0.6
                ? "bg-green-50 border-green-200"
                : batchingStats.batchingRatio > 0.3
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <h4
              className={`font-semibold ${
                batchingStats.batchingRatio > 0.6
                  ? "text-green-800"
                  : batchingStats.batchingRatio > 0.3
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              {batchingStats.batchingRatio > 0.6
                ? "우수"
                : batchingStats.batchingRatio > 0.3
                ? "보통"
                : "개선 필요"}
            </h4>
            <p className="text-sm text-gray-600">
              60% 이상: 우수
              <br />
              30% 이상: 보통
              <br />
              30% 미만: 개선 필요
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-800">배칭 전략</h4>
            <p className="text-sm text-gray-600">
              • 동일 엔드포인트 그룹화
              <br />
              • 타임윈도우 기반 배칭
              <br />• 우선순위 기반 처리
            </p>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded">
            <h4 className="font-semibold text-indigo-800">성능 향상</h4>
            <p className="text-sm text-gray-600">
              • 네트워크 요청 수 감소
              <br />
              • 서버 부하 감소
              <br />• 응답 시간 개선
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 시나리오:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>15개의 관련 쿼리를 동시에 실행</li>
          <li>동일한 엔드포인트에 대한 요청들을 배칭으로 최적화</li>
          <li>실제 네트워크 요청 수 vs 잠재적 요청 수 비교</li>
          <li>배칭 효율성을 백분율로 계산</li>
        </ul>
      </div>

      {/* 진행률 표시 */}
      {isRunning && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  (completedCountRef.current / 15) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            진행률: {Math.min(completedCountRef.current, 15)}/15 (
            {Math.min((completedCountRef.current / 15) * 100, 100).toFixed(0)}%)
          </p>
        </div>
      )}

      {/* 숨겨진 관련 쿼리 컴포넌트들 */}
      <div className="hidden">
        {RELATED_QUERY_CONFIGS.map((config) => (
          <RelatedQuery
            key={config.id}
            id={config.id}
            type={config.type}
            enabled={isRunning}
          />
        ))}
      </div>
    </div>
  );
}
