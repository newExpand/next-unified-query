"use client";

import { useQuery } from "../lib/query-client";

interface TaggedData {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  tag: string;
  lastUpdated: number;
}

/**
 * Tagged Data 테스트 페이지
 * 태그 기반 재검증 기능 테스트
 */
export default function TaggedDataPage() {
  const { data, isLoading, error, refetch } = useQuery<TaggedData>({
    cacheKey: ["tagged-data"],
    url: "/api/tagged-data",
    fetchConfig: {
      next: { tags: ["user-data"] }, // Next.js의 태그 기반 재검증
    },
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
      <h1 className="text-2xl font-bold mb-4">Tagged Data 테스트</h1>

      <div data-testid="tagged-data" className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">{data?.title}</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p>ID: {data?.id}</p>
          <p data-testid="tagged-content">Content: {data?.content}</p>
          <p>Timestamp: {data?.timestamp}</p>
          <p>Tag: {data?.tag}</p>
          <p>Last Updated: {data?.lastUpdated}</p>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
        >
          수동 새로고침
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>이 페이지는 "user-data" 태그로 태그되어 있습니다.</p>
        <p>
          관리자 페이지에서 해당 태그를 재검증하면 이 데이터가 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
