"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

interface PerformanceData {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  delay: number;
}

// 100개의 고유한 쿼리로 실제 동시 요청 성능 테스트
const QUERY_CONFIGS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1, // 각 쿼리가 고유한 ID 1-100을 사용
  delay: Math.floor(Math.random() * 100), // 0-99ms 랜덤 지연으로 현실적인 로드 시뮬레이션
}));

// 개별 쿼리 컴포넌트
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
  const startTimeRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const wasEnabledRef = useRef(false);
  const wasFetchingRef = useRef(false);

  const { data, isLoading, error, isFetching } = useQuery<PerformanceData>({
    cacheKey: ["concurrent-test", id],
    url: `/api/performance-data`,
    params: { id, delay, type: "concurrent", size: "small" },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10분
  });

  // 쿼리 시작 시간 기록
  useEffect(() => {
    if (enabled && !hasCompletedRef.current && !startTimeRef.current) {
      startTimeRef.current = performance.now();
    }
  }, [enabled, id]);

  // enabled 상태 추적
  useEffect(() => {
    wasEnabledRef.current = enabled;
  }, [enabled]);

  // fetching 상태 변화 감지를 통한 완료 확인
  useEffect(() => {
    if (enabled && !hasCompletedRef.current) {
      // fetching이 true에서 false로 변했고, 데이터가 있거나 에러가 있으면 완료
      if (wasFetchingRef.current && !isFetching && (data || error)) {
        hasCompletedRef.current = true;
        const endTime = performance.now();
        const duration = endTime - (startTimeRef.current || endTime);
        const success = !!data && !error;

        onComplete(success, duration);
      }
      // 단, enabled가 방금 true로 변한 경우에는 무시 (캐시된 데이터로 인한 오탐지 방지)
      else if (!wasEnabledRef.current && !isLoading && !isFetching && (data || error)) {
        // enabled가 방금 켜졌고 캐시된 데이터가 있는 경우 무시
      }
    }
    wasFetchingRef.current = isFetching;
  }, [enabled, data, error, isLoading, isFetching, onComplete, id]);

  // enabled가 false가 되면 상태 리셋
  useEffect(() => {
    if (!enabled) {
      startTimeRef.current = 0;
      hasCompletedRef.current = false;
      wasFetchingRef.current = false;
    }
  }, [enabled]);

  // 처음 몇 개 쿼리의 디버깅 정보만 표시
  if (id <= 3) {
    return (
      <div className="text-xs p-2 border rounded mb-2">
        <div className="font-semibold">Query {id}</div>
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
        <div>
          completed:{" "}
          <span
            className={
              hasCompletedRef.current ? "text-green-600" : "text-gray-400"
            }
          >
            {hasCompletedRef.current ? "TRUE" : "FALSE"}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export default function ConcurrentQueriesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({
    completed: 0,
    successful: 0,
    failed: 0,
    totalTime: 0,
    averageTime: 0,
    cacheHits: 0,
  });

  const queryClient = useQueryClient();
  const startTimeRef = useRef<number>(0);
  const queryTimesRef = useRef<number[]>([]);

  // 성능 통계를 window 객체에 노출
  useEffect(() => {
    window.__QUERY_PERFORMANCE_STATS__ = results;
  }, [results]);

  // 쿼리 완료 콜백
  const handleQueryComplete = useCallback((success: boolean, time: number) => {
    queryTimesRef.current.push(time);

    setResults((prev) => {
      const newCompleted = prev.completed + 1;
      const newSuccessful = success ? prev.successful + 1 : prev.successful;
      const newFailed = success ? prev.failed : prev.failed + 1;

      // 모든 쿼리가 완료되었을 때 최종 계산
      if (newCompleted >= 100) {
        const totalTime = performance.now() - startTimeRef.current;
        const averageTime =
          queryTimesRef.current.reduce((a, b) => a + b, 0) /
          queryTimesRef.current.length;
        const cacheHits = queryTimesRef.current.filter((t) => t < 10).length;

        console.log("모든 쿼리 완료! 실행 중지 중...");
        // 실행 중지
        setTimeout(() => setIsRunning(false), 100);

        return {
          completed: newCompleted,
          successful: newSuccessful,
          failed: newFailed,
          totalTime,
          averageTime,
          cacheHits,
        };
      }

      return {
        ...prev,
        completed: newCompleted,
        successful: newSuccessful,
        failed: newFailed,
      };
    });
  }, []);

  const startTest = () => {
    // 상태 초기화
    setResults({
      completed: 0,
      successful: 0,
      failed: 0,
      totalTime: 0,
      averageTime: 0,
      cacheHits: 0,
    });

    queryTimesRef.current = [];
    startTimeRef.current = performance.now();

    // 캐시 완전 클리어 (첫 번째 실행에서 실제 성능 측정을 위해)
    queryClient.getQueryCache().clear();

    // 테스트 시작
    setIsRunning(true);
  };

  const stopTest = () => {
    setIsRunning(false);
  };

  const isCompleted = results.completed >= 100 && !isRunning;
  const progress = Math.min((results.completed / 100) * 100, 100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">동시 쿼리 요청 성능 테스트</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="start-concurrent-queries"
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
        <div data-testid="all-queries-completed" className="mb-4">
          <p className="text-green-600 font-semibold">
            모든 쿼리가 완료되었습니다!
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
          <li>100개의 고정된 useQuery 요청 처리</li>
          <li>각 요청마다 미리 정의된 0-100ms 지연</li>
          <li>next-unified-query 라이브러리의 캐시 시스템 활용</li>
          <li>성공/실패 비율 측정</li>
          <li>평균 응답 시간 계산</li>
          <li>캐시 히트율 추적 (10ms 미만 응답)</li>
          <li>QueryClient의 maxQueries: 1000 제한 테스트</li>
        </ul>
      </div>

      {/* 처음 3개 쿼리는 보이게 하여 디버깅 */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">디버깅 정보 (처음 3개 쿼리):</h4>
        {QUERY_CONFIGS.slice(0, 3).map(({ id, delay }, index) => (
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
        {QUERY_CONFIGS.slice(3).map(({ id, delay }, index) => (
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
        * 이 테스트는 next-unified-query 라이브러리의 useQuery 훅을 사용하여
        동시 요청 성능을 측정합니다.
        <br />* QueryClient는 maxQueries: 1000으로 설정되어 있으며, LRU 캐시를
        사용합니다.
        <br />* 캐시 히트는 10ms 미만으로 응답된 쿼리의 수를 나타냅니다.
        <br />* 쿼리 설정은 페이지 로드 시 한 번만 생성되어 무한 요청을
        방지합니다.
      </div>
    </div>
  );
}
