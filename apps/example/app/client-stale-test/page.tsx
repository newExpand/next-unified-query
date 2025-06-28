"use client";

import { useQuery } from "../lib/query-client";
import { useEffect, useState } from "react";

interface TestData {
  message: string;
  timestamp: number;
  random: number;
}

export default function ClientStaleTestPage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const { data, isLoading, isStale, refetch, isPlaceholderData } =
    useQuery<TestData>({
      cacheKey: ["stale-test-data"],
      url: "/api/test-data",
      staleTime: 300000, // 5분(300초)으로 변경
      gcTime: 600000, // 10분으로 변경
    });

  useEffect(() => {
    // 현재 시간 업데이트
    const updateCurrentTime = () => {
      setCurrentTime(new Date().toLocaleString());
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // 데이터가 변경될 때마다 fetch 시간 기록 (placeholder 데이터 제외)
  useEffect(() => {
    if (data && !isPlaceholderData) {
      setLastFetchTime(Date.now());
    }
  }, [data, isPlaceholderData]);

  const handleForceRefetch = () => {
    console.log("🔄 Force Refetch: staleTime 무시하고 강제 refetch");
    refetch(); // 기본값은 force: true
  };

  const handleSmartRefetch = () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    const staleTime = 300000; // 5분(300초)

    console.log("🤔 Smart Refetch 시도:");
    console.log(`  - 마지막 fetch: ${lastFetchTime}`);
    console.log(`  - 현재 시간: ${now}`);
    console.log(`  - 경과 시간: ${timeSinceLastFetch}ms`);
    console.log(`  - StaleTime: ${staleTime}ms`);

    if (timeSinceLastFetch < staleTime) {
      console.log("✅ 데이터가 fresh 상태입니다. refetch 하지 않습니다.");
      alert(
        `데이터가 fresh 상태입니다!\n경과 시간: ${Math.round(
          timeSinceLastFetch / 1000
        )}초\nStaleTime: ${staleTime / 1000}초`
      );
      return;
    }

    console.log("🔄 데이터가 stale 상태입니다. refetch 합니다.");
    refetch();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const timeSinceLastFetch = lastFetchTime ? Date.now() - lastFetchTime : 0;
  const isDataFresh = timeSinceLastFetch < 300000;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        StaleTime Test (5분) - 개선된 버전
      </h1>

      <div data-testid="client-data" className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Query Status</h2>
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Stale: {isStale ? "Yes" : "No"}</p>
          <p>Placeholder Data: {isPlaceholderData ? "Yes" : "No"}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Data</h2>
          {data ? (
            <div>
              <p>
                <strong>Message:</strong> {data.message}
              </p>
              <p data-testid="data-timestamp">
                <strong>Timestamp:</strong>{" "}
                {new Date(data.timestamp).toLocaleString()}
              </p>
              {isPlaceholderData && (
                <p className="text-orange-600 text-sm mt-2">
                  ⚠️ 이전 데이터를 표시 중 (백그라운드에서 새 데이터 로딩)
                </p>
              )}
            </div>
          ) : (
            <p>데이터 없음</p>
          )}
        </div>

        <div className="border p-4 rounded bg-blue-50">
          <h2 className="font-semibold mb-2">Debug Info</h2>
          <p>
            <strong>StaleTime:</strong> 5분
          </p>
          <p>
            <strong>현재 시간:</strong> {currentTime || "로딩 중..."}
          </p>
          <p>
            <strong>마지막 Fetch 시간:</strong>{" "}
            {lastFetchTime ? new Date(lastFetchTime).toLocaleString() : "없음"}
          </p>
          <p>
            <strong>경과 시간:</strong>{" "}
            {lastFetchTime ? Math.round(timeSinceLastFetch / 1000) : 0}초
          </p>
          <p>
            <strong>데이터 상태:</strong>{" "}
            {isDataFresh ? "🟢 Fresh" : "🔴 Stale"}
          </p>
          <p>
            <strong>캐시 방식:</strong> 메모리 캐시 (next-unified-query 개선된
            버전)
          </p>
          <p className="text-sm text-gray-600">
            클라이언트 사이드 렌더링 + placeholderData 적용
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>• Smart Refetch: 5분 내 fresh 데이터는 refetch 하지 않음</p>
            <p>• Force Refetch: 항상 새로운 데이터 fetch</p>
            <p>• PlaceholderData: 뒤로가기 시 이전 데이터 즉시 표시</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleForceRefetch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Force Refetch (무시 staleTime)
          </button>

          <button
            onClick={handleSmartRefetch}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded hover:opacity-80 disabled:bg-gray-400 ${
              isDataFresh ? "bg-green-600" : "bg-orange-600"
            }`}
          >
            Smart Refetch (
            {isDataFresh ? "Fresh - 캐시 사용" : "Stale - 새로 fetch"})
          </button>

          <button
            onClick={handleReload}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
