"use client";

import { useQuery } from "../lib/query-client";
import { useState } from "react";

interface StaticData {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  cached: boolean;
}

/**
 * Force Cache 테스트 페이지
 * next-unified-query의 클라이언트 사이드 캐시를 테스트
 */
export default function ForceCachePage() {
  const [requestCount, setRequestCount] = useState(0);

  const { data, isLoading, error, refetch, isStale } = useQuery<StaticData>({
    cacheKey: ["static-data"],
    queryFn: async (fetcher) => {
      setRequestCount((prev) => prev + 1);
      const response = await fetcher.get("/api/static-data");
      if (!response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data as StaticData;
    },
    staleTime: Infinity, // 데이터를 절대 stale하다고 판단하지 않음
    gcTime: Infinity, // 가비지 컬렉션하지 않음
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div data-testid="loading">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div data-testid="error">에러가 발생했습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        next-unified-query 클라이언트 캐시 테스트
      </h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">캐시 설정</h2>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>staleTime:</strong> Infinity (절대 stale하지 않음)
          </li>
          <li>
            • <strong>gcTime:</strong> Infinity (가비지 컬렉션하지 않음)
          </li>
        </ul>
      </div>

      <div data-testid="cached-data" className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">{data?.title}</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p>Timestamp: {data?.timestamp}</p>
          <p>Cached: {data?.cached ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">캐시 통계</h2>
        <p data-testid="next-unified-request-count">
          <strong>요청 횟수:</strong> {requestCount}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          staleTime: Infinity로 설정되어 있어 Force Refetch시에도 캐시를
          사용해야 합니다.
        </p>
      </div>

      <div className="space-x-4 mb-6">
        <button
          data-testid="next-unified-force-refetch"
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

      <div className="text-sm text-gray-600">
        <p>
          <strong>테스트 방법:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>
            Force Refetch 버튼을 클릭해도 캐시로 인해 요청 횟수가 증가하지
            않아야 함
          </li>
          <li>다른 페이지로 이동 후 다시 돌아와도 캐시가 유지되어야 함</li>
          <li>페이지 새로고침 시에만 새로운 요청이 발생해야 함</li>
        </ol>
      </div>
    </div>
  );
}
