"use client";

import { useQuery } from "../../lib/query-client";

export default function TimeoutRetryPage() {
  const { data, isLoading, error } = useQuery<any>({
    cacheKey: ["slow-endpoint"],
    url: "/api/slow-endpoint",
    fetchConfig: {
      timeout: 2000, // 2초 타임아웃
      retry: 3, // 3번 재시도
    },
    onSuccess: () => {
      console.log("Request succeeded after retries");
    },
    onError: (error) => {
      console.log("Request failed:", error);
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Timeout & Retry Test</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">설정</h3>
          <ul className="text-sm space-y-1">
            <li>• Timeout: 2초</li>
            <li>• Retry: 3번</li>
            <li>• 첫 번째 요청은 3초 지연 (타임아웃 발생)</li>
            <li>• 재시도 요청은 빠른 응답</li>
          </ul>
        </div>

        {isLoading && (
          <div data-testid="loading-state" className="text-blue-600">
            요청 처리 중...
          </div>
        )}

        {error && (
          <div data-testid="error-state" className="text-red-600">
            에러 발생: {error.message}
          </div>
        )}

        {data && (
          <div
            data-testid="timeout-result"
            className="bg-green-50 p-4 rounded-lg"
          >
            <h3 className="font-semibold">응답 데이터:</h3>
            <div data-testid="response-data" className="text-sm">
              {JSON.stringify(data, null, 2)}
            </div>
            <div
              data-testid="attempt-count"
              className="mt-2 text-sm text-gray-600"
            >
              총 시도 횟수: {(data as any)?.attempt || 1}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>
            이 테스트는 첫 번째 요청이 타임아웃되고 재시도를 통해 성공하는
            시나리오를 검증합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
