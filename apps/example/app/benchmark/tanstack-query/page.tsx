"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  PerformanceData, 
  FIXED_QUERY_CONFIGS, 
  LIBRARY_OPTIMIZED_CONFIGS,
  commonFetcher,
  buildQueryUrl,
  StandardizedPerformanceTracker,
  QueryCompletionTracker,
  exposeStandardizedStats,
  exposeAdvancedMetrics
} from "../shared-config";

// 개별 쿼리 컴포넌트 (표준화된 성능 측정 적용)
function QueryItem({
  id,
  delay,
  enabled,
  onComplete,
}: {
  id: number;
  delay: number;
  enabled: boolean;
  onComplete: (success: boolean, time: number) => void;
}) {
  const completionTracker = useRef(new QueryCompletionTracker());

  const { data, isLoading, error, isFetching } = useQuery<PerformanceData>({
    queryKey: ["tanstack-concurrent-test", id, delay], // delay도 포함하여 각 쿼리별 캐시 키 분리
    queryFn: () => commonFetcher(buildQueryUrl(id, delay)),
    enabled,
    // TanStack Query 최적화된 설정: 조건부 캐싱 최적화
    ...LIBRARY_OPTIMIZED_CONFIGS.TANSTACK_QUERY,
    retry: 3,
    retryDelay: 1000,
  });

  // 표준화된 추적 시작
  useEffect(() => {
    completionTracker.current.startTracking(enabled);
  }, [enabled, id]);

  // 표준화된 완료 감지
  useEffect(() => {
    const result = completionTracker.current.updateAndCheckCompletion(
      enabled,
      data,
      error,
      isFetching, // TanStack Query의 isFetching 사용
      undefined // TanStack Query는 isValidating이 없음
    );

    if (result?.completed) {
      onComplete(result.success, result.duration);
    }
  }, [enabled, data, error, isFetching, onComplete]);

  // enabled가 false가 되면 상태 리셋
  useEffect(() => {
    if (!enabled) {
      completionTracker.current.reset();
    }
  }, [enabled]);

  // 처음 몇 개 쿼리의 디버깅 정보만 표시
  if (id <= 3) {
    return (
      <div className="text-xs p-2 border rounded mb-2">
        <div className="font-semibold">TanStack Query {id}</div>
        <div>
          enabled:{" "}
          <span className={enabled ? "text-green-600" : "text-red-600"}>
            {enabled ? "TRUE" : "FALSE"}
          </span>
        </div>
        <div>
          isLoading:{" "}
          <span className={isLoading ? "text-blue-600" : "text-gray-400"}>
            {isLoading ? "TRUE" : "FALSE"}
          </span>
        </div>
        <div>
          isFetching:{" "}
          <span className={isFetching ? "text-purple-600" : "text-gray-400"}>
            {isFetching ? "TRUE" : "FALSE"}
          </span>
        </div>
        <div>
          hasData:{" "}
          <span className={!!data ? "text-green-600" : "text-gray-400"}>
            {!!data ? "TRUE" : "FALSE"}
          </span>
        </div>
        <div>
          hasError:{" "}
          <span className={!!error ? "text-red-600" : "text-gray-400"}>
            {!!error ? "TRUE" : "FALSE"}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function BenchmarkContent() {
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();
  const performanceTracker = useRef(new StandardizedPerformanceTracker());
  const [results, setResults] = useState({
    completed: 0,
    successful: 0,
    failed: 0,
    totalTime: 0,
    averageTime: 0,
    cacheHits: 0,
  });

  // 성능 통계를 window 객체에 노출 (테스트용)
  useEffect(() => {
    // 기존 표준화된 통계 (하위 호환성)
    exposeStandardizedStats('TANSTACK_QUERY', results);
    
    // 새로운 고급 메트릭 (TanStack Query 최적화 측정)
    const advancedMetrics = performanceTracker.current.getAdvancedMetrics('TANSTACK_QUERY');
    exposeAdvancedMetrics('TANSTACK_QUERY', advancedMetrics);
    
    // 디버깅용 성능 트래커 노출
    (window as any).__TANSTACK_QUERY_PERFORMANCE_TRACKER__ = performanceTracker.current;
  }, [results]);

  // 표준화된 쿼리 완료 콜백
  const handleQueryComplete = useCallback((success: boolean, time: number) => {
    performanceTracker.current.recordQuery(success, time);
    
    const stats = performanceTracker.current.getStandardizedStats();
    setResults(stats);

    // 모든 쿼리가 완료되었을 때 실행 중지
    if (performanceTracker.current.isCompleted()) {
      console.log("TanStack Query - 모든 쿼리 완료! 실행 중지 중...");
      performanceTracker.current.stop();
      setTimeout(() => setIsRunning(false), 100);
    }
  }, []);

  const startTest = () => {
    // 표준화된 성능 추적 시작
    performanceTracker.current.reset();
    performanceTracker.current.start();
    
    setResults({
      completed: 0,
      successful: 0,
      failed: 0,
      totalTime: 0,
      averageTime: 0,
      cacheHits: 0,
    });

    // 캐시 완전 클리어 (첫 번째 실행에서 실제 성능 측정을 위해)
    queryClient.clear();

    // 테스트 시작
    setIsRunning(true);
  };

  const stopTest = () => {
    performanceTracker.current.stop();
    setIsRunning(false);
  };

  const isCompleted = performanceTracker.current.isCompleted() && !isRunning;
  const progress = performanceTracker.current.getProgress();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">TanStack Query + Axios 벤치마크</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="start-tanstack-concurrent-queries"
          onClick={startTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isRunning ? "실행 중..." : "100개 동시 쿼리 시작"}
        </button>

        <button
          onClick={stopTest}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          중단
        </button>
      </div>

      {isCompleted && (
        <div data-testid="tanstack-all-queries-completed" className="mb-4">
          <p className="text-green-600 font-semibold">
            TanStack Query - 모든 쿼리가 완료되었습니다!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold text-blue-800">완료</h3>
          <p className="text-2xl font-bold text-blue-600">
            {results.completed}
          </p>
        </div>

        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold text-green-800">성공</h3>
          <p className="text-2xl font-bold text-green-600">
            {results.successful}
          </p>
        </div>

        <div className="p-4 bg-red-100 rounded">
          <h3 className="font-semibold text-red-800">실패</h3>
          <p className="text-2xl font-bold text-red-600">{results.failed}</p>
        </div>

        <div className="p-4 bg-purple-100 rounded">
          <h3 className="font-semibold text-purple-800">평균 시간</h3>
          <p className="text-2xl font-bold text-purple-600">
            {results.averageTime.toFixed(1)}ms
          </p>
        </div>

        <div className="p-4 bg-yellow-100 rounded">
          <h3 className="font-semibold text-yellow-800">캐시 히트</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {results.cacheHits}
          </p>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold text-gray-800">총 시간</h3>
          <p className="text-2xl font-bold text-gray-600">
            {results.totalTime.toFixed(0)}ms
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">진행 상황:</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          완료: {results.completed}/100 ({progress.toFixed(0)}%)
        </p>
        {isRunning && (
          <p className="text-xs text-blue-600 mt-1">
            실행 중... {results.completed}개 완료됨
          </p>
        )}
        {isCompleted && (
          <p className="text-xs text-green-600 mt-1">
            ✅ 모든 쿼리 완료됨! 총 시간: {results.totalTime.toFixed(0)}ms
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">테스트 내용:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>TanStack Query + Axios 조합으로 100개의 useQuery 요청 처리</li>
          <li>각 요청마다 미리 정의된 0-100ms 지연</li>
          <li>TanStack Query의 조건부 캐시 시스템 활용</li>
          <li>성공/실패 비율 측정</li>
          <li>평균 응답 시간 계산</li>
          <li>캐시 히트율 추적 (10ms 미만 응답)</li>
          <li>TanStack Query 최적화 설정 사용 (5분 staleTime, 리페치 비활성화)</li>
        </ul>
      </div>

      {/* 처음 3개 쿼리는 보이게 하여 디버깅 */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">디버깅 정보 (처음 3개 쿼리):</h4>
        {FIXED_QUERY_CONFIGS.slice(0, 3).map(({ id, delay }, index) => (
          <QueryItem
            key={`debug-${id}-${index}`}
            id={id}
            delay={delay}
            enabled={isRunning}
            onComplete={handleQueryComplete}
          />
        ))}
      </div>

      {/* 나머지 97개의 쿼리 컴포넌트들 (숨김) */}
      <div className="hidden">
        {FIXED_QUERY_CONFIGS.slice(3).map(({ id, delay }, index) => (
          <QueryItem
            key={`hidden-${id}-${index + 3}`}
            id={id}
            delay={delay}
            enabled={isRunning}
            onComplete={handleQueryComplete}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-8">
        * 이 테스트는 TanStack Query + fetch를 사용하여 동시 요청 성능을 측정합니다.
        <br />* 공정한 비교를 위해 동일한 캐시 설정과 고정된 지연값을 사용합니다.
        <br />* 캐시 히트는 10ms 미만으로 응답된 쿼리의 수를 나타냅니다.
        <br />* 쿼리 설정은 페이지 로드 시 한 번만 생성되어 무한 요청을 방지합니다.
      </div>
    </div>
  );
}

export default function TanStackQueryBenchmarkPage() {
  return <BenchmarkContent />;
}