"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface StaticData {
  message: string;
  timestamp: number;
  cached: boolean;
}

export default function TanStackTest3Page() {
  const [requestCount, setRequestCount] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tanstack-static-data-infinite"],
    queryFn: async (): Promise<StaticData> => {
      setRequestCount((prev) => prev + 1);
      const response = await fetch("/api/static-data");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    staleTime: 10000, // 데이터를 절대 stale하다고 판단하지 않음
    gcTime: Infinity, // 가비지 컬렉션하지 않음
    refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 방지
    refetchOnReconnect: false, // 재연결 시 refetch 방지
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          TanStack Test 3 - Infinite Cache
        </h1>
        <div data-testid="tanstack-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          TanStack Test 3 - Infinite Cache
        </h1>
        <div data-testid="tanstack-error" className="text-red-500">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        TanStack Test 3 - Infinite Cache
      </h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">캐시 설정</h2>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>staleTime:</strong> 10000ms (10초 후 stale로 간주)
          </li>
          <li>
            • <strong>gcTime:</strong> Infinity (가비지 컬렉션하지 않음)
          </li>
          <li>
            • <strong>refetchOnWindowFocus:</strong> false
          </li>
          <li>
            • <strong>refetchOnReconnect:</strong> false
          </li>
        </ul>
      </div>

      {data && (
        <div
          className="bg-gray-50 p-4 rounded-lg mb-6"
          data-testid="tanstack-cached-data"
        >
          <h2 className="text-lg font-semibold mb-2">데이터</h2>
          <p>
            <strong>메시지:</strong> {data.message}
          </p>
          <p>
            <strong>타임스탬프:</strong>{" "}
            {new Date(data.timestamp).toLocaleString()}
          </p>
          <p>
            <strong>캐시 여부:</strong> {data.cached ? "예" : "아니오"}
          </p>
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">캐시 통계</h2>
        <p data-testid="tanstack-request-count">
          <strong>요청 횟수:</strong> {requestCount}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          staleTime: 10초로 설정되어 있어 10초 경과 후 새로운 요청이 발생합니다.
        </p>
      </div>

      <div className="space-x-4">
        <button
          data-testid="tanstack-force-refetch"
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Force Refetch
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          페이지 새로고침
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>
          <strong>테스트 방법:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>
            10초 이내에 Force Refetch 버튼을 클릭하면 캐시로 인해 요청 횟수가 증가하지 않아야 함
          </li>
          <li>10초 경과 후 Force Refetch 버튼을 클릭하면 새로운 요청이 발생해야 함</li>
          <li>다른 페이지로 이동 후 다시 돌아와도 캐시가 유지되어야 함</li>
        </ol>
      </div>
    </div>
  );
}
