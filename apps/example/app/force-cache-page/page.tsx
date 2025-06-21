"use client";

import { useQuery } from "../lib/query-client";

interface StaticData {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  cached: boolean;
}

/**
 * Force Cache 테스트 페이지
 * force-cache 옵션을 사용하여 브라우저 캐시를 활용
 */
export default function ForceCachePage() {
  const { data, isLoading, error } = useQuery<StaticData>({
    cacheKey: ["static-data"],
    url: "/api/static-data",
    fetchConfig: {
      cache: "force-cache",
    },
    staleTime: Infinity,
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
      <h1 className="text-2xl font-bold mb-4">Force Cache 테스트</h1>

      <div data-testid="cached-data" className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">{data?.title}</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p>Timestamp: {data?.timestamp}</p>
          <p>Cached: {data?.cached ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>
          이 페이지는 force-cache 옵션을 사용하여 브라우저 캐시를 활용합니다.
        </p>
        <p>새로고침해도 동일한 데이터가 표시되어야 합니다.</p>
      </div>
    </div>
  );
}
