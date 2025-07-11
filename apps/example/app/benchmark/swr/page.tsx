"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { 
  PerformanceData, 
  FIXED_QUERY_CONFIGS, 
  COMMON_CACHE_CONFIG,
  commonFetcher,
  buildQueryUrl
} from "../shared-config";

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
  const wasValidatingRef = useRef(false);

  const { data, error, isValidating } = useSWR<PerformanceData>(
    enabled ? buildQueryUrl(id, delay) : null,
    commonFetcher,
    {
      // SWR에서 TanStack Query와 유사한 캐시 동작을 위한 설정
      dedupingInterval: COMMON_CACHE_CONFIG.staleTime, // staleTime과 유사
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const isLoading = enabled && !data && !error;

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

  // validating 상태 변화 감지를 통한 완료 확인
  useEffect(() => {
    if (enabled && !hasCompletedRef.current) {
      // validating이 true에서 false로 변했고, 데이터가 있거나 에러가 있으면 완료
      if (wasValidatingRef.current && !isValidating && (data || error)) {
        hasCompletedRef.current = true;
        const endTime = performance.now();
        const duration = endTime - (startTimeRef.current || endTime);
        const success = !!data && !error;

        onComplete(success, duration);
      }
      // 단, enabled가 방금 true로 변한 경우에는 무시 (캐시된 데이터로 인한 오탐지 방지)
      else if (
        !wasEnabledRef.current &&
        !isLoading &&
        !isValidating &&
        (data || error)
      ) {
        // enabled가 방금 켜졌고 캐시된 데이터가 있는 경우 무시
      }
    }
    wasValidatingRef.current = isValidating;
  }, [enabled, data, error, isLoading, isValidating, onComplete, id]);

  // enabled가 false가 되면 상태 리셋
  useEffect(() => {
    if (!enabled) {
      startTimeRef.current = 0;
      hasCompletedRef.current = false;
      wasValidatingRef.current = false;
    }
  }, [enabled]);

  // 처음 몇 개 쿼리의 디버깅 정보만 표시
  if (id <= 3) {
    return (
      <div className="text-xs p-2 border rounded mb-2">
        <div className="font-semibold">SWR Query {id}</div>
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
          isValidating:{" "}
          <span className={isValidating ? "text-purple-600" : "text-gray-400"}>
            {isValidating ? "TRUE" : "FALSE"}
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

function BenchmarkContent() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({
    completed: 0,
    successful: 0,
    failed: 0,
    totalTime: 0,
    averageTime: 0,
    cacheHits: 0,
  });

  const startTimeRef = useRef<number>(0);
  const queryTimesRef = useRef<number[]>([]);

  // 성능 통계를 window 객체에 노출 (테스트용)
  useEffect(() => {
    window.__SWR_PERFORMANCE_STATS__ = results;
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

        console.log("SWR - 모든 쿼리 완료! 실행 중지 중...");
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

    // SWR 캐시 클리어는 직접적인 방법이 없으므로 페이지 새로고침으로 처리
    // 실제 테스트에서는 브라우저를 새로 열거나 다른 방법 필요

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
      <h1 className="text-2xl font-bold mb-6">SWR + fetch 벤치마크</h1>

      <div className="flex gap-4 mb-6">
        <button
          data-testid="start-swr-concurrent-queries"
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
        <div data-testid="swr-all-queries-completed" className="mb-4">
          <p className="text-green-600 font-semibold">
            SWR - 모든 쿼리가 완료되었습니다!
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
          <li>SWR + fetch 조합으로 100개의 useSWR 요청 처리</li>
          <li>각 요청마다 미리 정의된 0-100ms 지연</li>
          <li>SWR의 캐시 시스템 활용</li>
          <li>성공/실패 비율 측정</li>
          <li>평균 응답 시간 계산</li>
          <li>캐시 히트율 추적 (10ms 미만 응답)</li>
          <li>기본 SWR 설정 사용 (중복 제거 5분)</li>
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
        * 이 테스트는 SWR + fetch를 사용하여 동시 요청 성능을 측정합니다.
        <br />* 공정한 비교를 위해 동일한 캐시 설정과 고정된 지연값을 사용합니다.
        <br />* 캐시 히트는 10ms 미만으로 응답된 쿼리의 수를 나타냅니다.
        <br />* 쿼리 설정은 페이지 로드 시 한 번만 생성되어 무한 요청을 방지합니다.
      </div>
    </div>
  );
}

export default function SWRBenchmarkPage() {
  return <BenchmarkContent />;
}