"use client";

import { useQuery } from "../lib/query-client";

interface RevalidateData {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  generatedAt: number;
  cacheStatus?: string;
  cacheStatusKr?: string;
  remainingCacheTime?: number;
}

/**
 * Revalidate 테스트 페이지
 * 시간 기반 재검증 기능 테스트
 */
export default function RevalidatePage() {
  const { data, isLoading, error, refetch } = useQuery<RevalidateData>({
    cacheKey: ["revalidate-data"],
    url: "/api/revalidate-data",
    staleTime: 15000, // 15초 동안 fresh 상태 유지 (이 시간 동안은 refetch 안함)
    fetchConfig: {
      next: { revalidate: 15 }, // Next.js의 15초마다 재검증
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
      <h1 className="text-2xl font-bold mb-4">Revalidate 테스트</h1>

      <div data-testid="revalidate-data" className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">{data?.title}</h2>
        <p className="mb-2">{data?.content}</p>
        <div className="text-sm text-gray-600">
          <p>ID: {data?.id}</p>
          <p data-testid="data-timestamp">Timestamp: {data?.timestamp}</p>
          <p>Generated At: {data?.generatedAt}</p>
          <p className="text-blue-600 font-semibold">
            현재 시간: {new Date().toLocaleString("ko-KR")}
          </p>
          {data?.cacheStatusKr && (
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <p
                className={`font-semibold ${
                  data.cacheStatusKr === "새로 생성됨"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                🔍 캐시 상태: {data.cacheStatusKr}
              </p>
              {data.remainingCacheTime && (
                <p className="text-sm text-gray-600">
                  ⏰ 남은 캐시 시간: {Math.ceil(data.remainingCacheTime / 1000)}
                  초
                </p>
              )}
            </div>
          )}
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
        <p className="font-semibold text-red-600">🔍 테스트 방법:</p>
        <p>1. 현재 시간과 데이터 타임스탬프를 비교해보세요</p>
        <p>
          2. 15초 이내에 새로고침하면 →{" "}
          <span className="font-semibold text-green-600">
            캐시된 데이터 (같은 타임스탬프)
          </span>
        </p>
        <p>
          3. 15초 후에 새로고침하면 →{" "}
          <span className="font-semibold text-blue-600">
            새로운 데이터 (새로운 타임스탬프)
          </span>
        </p>
        <p>4. 페이지를 새로고침(F5)해도 동일한 규칙이 적용됩니다</p>
        <p className="mt-2 font-semibold text-purple-600">
          💡 캐시 상태와 남은 시간을 실시간으로 확인할 수 있습니다!
        </p>
      </div>
    </div>
  );
}
