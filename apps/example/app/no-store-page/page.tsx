"use client";

import { useQuery } from "../lib/query-client";

interface DynamicData {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  randomValue: number;
  cached: boolean;
}

/**
 * No Store 테스트 페이지
 * no-store 옵션을 사용하여 캐시를 방지
 */
export default function NoStorePage() {
  const { data, isLoading, error, refetch } = useQuery<DynamicData>({
    cacheKey: ["dynamic-data"],
    url: "/api/dynamic-data",
    fetchConfig: {
      cache: "no-store", // Next.js의 no-store 캐시 옵션
    },
    staleTime: 0, // 즉시 stale 처리
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
      <h1 className="text-2xl font-bold mb-4">No Store 테스트</h1>

      <div data-testid="dynamic-data" className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">{data?.title}</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p>ID: {data?.id}</p>
          <p>Timestamp: {data?.timestamp}</p>
          <p>Random Value: {data?.randomValue?.toFixed(4)}</p>
          <p>Cached: {data?.cached ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          새로고침
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>이 페이지는 no-store 옵션을 사용하여 캐시를 방지합니다.</p>
        <p>새로고침할 때마다 새로운 데이터가 표시되어야 합니다.</p>
      </div>
    </div>
  );
}
