"use client";

import { FetchError } from "next-unified-query";
import { useQuery } from "../../lib/query-client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  timestamp: number;
  testHeader: string | null;
  customHeader: string | null;
}

interface UserDetailProps {
  userId: string;
}

export default function UserDetail({ userId }: UserDetailProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const {
    data: user,
    isLoading,
    isStale,
    error,
    refetch,
  } = useQuery<User, FetchError>({
    cacheKey: ["user", userId],
    url: `/api/user/${userId}`,
    staleTime: 300000, // 5분
    gcTime: 600000, // 10분
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

  // 데이터가 변경될 때마다 fetch 시간 기록
  useEffect(() => {
    if (user) {
      setLastFetchTime(Date.now());
    }
  }, [user]);

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

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div data-testid="error-message" className="text-red-600">
          Error: {error.message}
        </div>
        <button
          data-testid="retry-btn"
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  const timeSinceLastFetch = lastFetchTime ? Date.now() - lastFetchTime : 0;
  const isDataFresh = timeSinceLastFetch < 300000;

  return (
    <div className="container mx-auto p-8" data-testid="user-detail">
      <h1 className="text-2xl font-bold mb-6">User {userId}</h1>
      <p className="text-gray-600">User ID: {userId}</p>

      <div data-testid="client-data" className="space-y-4 mt-6">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Query Status</h2>
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Stale: {isStale ? "Yes" : "No"}</p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Data</h2>
          {user ? (
            <div>
              <p>
                <strong>Name:</strong>{" "}
                <span data-testid="user-name">{user.name}</span>
              </p>
              <p data-testid="data-timestamp">
                <strong>Last Updated:</strong>{" "}
                {new Date(user.timestamp).toLocaleString()}
              </p>
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
            <strong>캐시 방식:</strong> 메모리 캐시 (next-unified-query 방식)
          </p>
          <p className="text-sm text-gray-600">
            페이지 새로고침 시 캐시 초기화 (데이터 신선도 보장)
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>• Smart Refetch: 5분 내 fresh 데이터는 refetch 하지 않음</p>
            <p>• Force Refetch: 항상 새로운 데이터 fetch</p>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Profile Information</h2>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Test Header:</strong> {user?.testHeader || "None"}
            </p>
            <p>
              <strong>Last Updated:</strong>{" "}
              {new Date(user?.timestamp || 0).toLocaleString("en-US")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            data-testid="refresh-btn"
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
