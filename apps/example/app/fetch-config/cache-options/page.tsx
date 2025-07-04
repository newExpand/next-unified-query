"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function CacheOptionsPage() {
  const [apiCallCount, setApiCallCount] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    cacheKey: ["cached-data"],
    url: "/api/cached-data",
    fetchConfig: {
      // Next.js 서버사이드 캐시 옵션은 클라이언트에서 의미 없음
      // cache: "force-cache", // 브라우저 캐시 정책이지만 서버사이드에서만 효과적
      headers: {
        "Cache-Control": "max-age=60",
      },
    },
    onSuccess: () => {
      setApiCallCount((prev) => prev + 1);
    },
  });

  const handleInvalidateCache = () => {
    queryClient.invalidateQueries(["cached-data"]);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Cache Options Test</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">캐시 설정</h3>
          <ul className="text-sm space-y-1">
            <li>• Cache-Control: max-age=60 (HTTP 헤더)</li>
            <li>• 클라이언트 사이드 캐시만 사용</li>
            <li>• Next.js 서버사이드 캐시 옵션 제거됨</li>
          </ul>
        </div>

        <div data-testid="cache-info" className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm">
            <strong>캐시 정책:</strong> HTTP Cache-Control 헤더 사용
          </p>
          <p className="text-sm">
            <strong>API 호출 횟수:</strong>{" "}
            <span data-testid="api-call-count">{apiCallCount}</span>
          </p>
        </div>

        {isLoading && <div className="text-blue-600">로딩 중...</div>}

        {data && (
          <div data-testid="cached-data" className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold">캐시된 데이터:</h3>
            <pre className="text-sm mt-2">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        <div className="space-x-4">
          <button
            data-testid="invalidate-cache-btn"
            onClick={handleInvalidateCache}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            캐시 무효화
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            페이지 새로고침
          </button>
        </div>

        <div className="text-sm text-gray-500">
          <p>
            이 테스트는 HTTP Cache-Control 헤더를 통한 브라우저 캐시 정책을
            검증합니다.
          </p>
          <p>클라이언트 사이드에서만 동작하는 캐시 설정입니다.</p>
        </div>
      </div>
    </div>
  );
}
