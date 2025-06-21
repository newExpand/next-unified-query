"use client";

import { useQuery } from "../../lib/query-client";

interface ConfigResponse {
  receivedHeaders: Record<string, string>;
  timestamp: string;
  requestId: string;
}

export default function CustomHeadersPage() {
  const { data, error, isLoading } = useQuery<ConfigResponse, any>({
    cacheKey: ["custom-headers"],
    queryFn: async () => {
      const response = await fetch("/api/custom-config", {
        headers: {
          "X-Custom-Auth": "test-token-123",
          "X-Client-Version": "1.0.0",
          "X-Request-Source": "next-unified-query",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Custom headers request failed");
      }

      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>커스텀 헤더 요청 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-4">
              헤더 설정 오류
            </h1>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="custom-headers"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              커스텀 헤더 설정 테스트
            </h1>

            {/* 요청 정보 */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">
                ✅ 요청 성공
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>요청 ID:</strong>{" "}
                  <span data-testid="request-id">{data.requestId}</span>
                </div>
                <div>
                  <strong>처리 시간:</strong>{" "}
                  <span data-testid="timestamp">
                    {new Date(data.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 전송된 헤더들 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📤 전송된 커스텀 헤더
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <h4 className="font-medium text-blue-800 mb-2">
                      인증 헤더
                    </h4>
                    <code className="text-sm text-blue-700">
                      X-Custom-Auth: test-token-123
                    </code>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <h4 className="font-medium text-purple-800 mb-2">
                      클라이언트 버전
                    </h4>
                    <code className="text-sm text-purple-700">
                      X-Client-Version: 1.0.0
                    </code>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <h4 className="font-medium text-green-800 mb-2">
                      요청 소스
                    </h4>
                    <code className="text-sm text-green-700">
                      X-Request-Source: next-unified-query
                    </code>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-orange-400">
                    <h4 className="font-medium text-orange-800 mb-2">
                      컨텐츠 타입
                    </h4>
                    <code className="text-sm text-orange-700">
                      Content-Type: application/json
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* 서버에서 수신된 헤더들 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📥 서버에서 수신된 헤더
              </h3>
              <div
                className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto"
                data-testid="received-headers"
              >
                <pre>{JSON.stringify(data.receivedHeaders, null, 2)}</pre>
              </div>
            </div>

            {/* 헤더 검증 결과 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔍 헤더 검증 결과
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
                  <div className="text-2xl mb-2">
                    {data.receivedHeaders["x-custom-auth"] ? "✅" : "❌"}
                  </div>
                  <p className="font-medium text-blue-800">인증 헤더</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {data.receivedHeaders["x-custom-auth"]
                      ? "수신됨"
                      : "누락됨"}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded text-center">
                  <div className="text-2xl mb-2">
                    {data.receivedHeaders["x-client-version"] ? "✅" : "❌"}
                  </div>
                  <p className="font-medium text-purple-800">클라이언트 버전</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {data.receivedHeaders["x-client-version"]
                      ? "수신됨"
                      : "누락됨"}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded text-center">
                  <div className="text-2xl mb-2">
                    {data.receivedHeaders["x-request-source"] ? "✅" : "❌"}
                  </div>
                  <p className="font-medium text-green-800">요청 소스</p>
                  <p className="text-xs text-green-600 mt-1">
                    {data.receivedHeaders["x-request-source"]
                      ? "수신됨"
                      : "누락됨"}
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded text-center">
                  <div className="text-2xl mb-2">
                    {data.receivedHeaders["content-type"] ? "✅" : "❌"}
                  </div>
                  <p className="font-medium text-orange-800">컨텐츠 타입</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {data.receivedHeaders["content-type"] ? "수신됨" : "누락됨"}
                  </p>
                </div>
              </div>
            </div>

            {/* 사용 예제 */}
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-3">
                💡 사용 예제
              </h4>
              <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
                <pre>{`// fetchConfig에서 커스텀 헤더 설정
const { data } = useQuery({
  cacheKey: ["custom-headers"],
  queryFn: async () => {
    const response = await fetch("/api/custom-config", {
      headers: {
        "X-Custom-Auth": "test-token-123",
        "X-Client-Version": "1.0.0",
        "X-Request-Source": "next-unified-query",
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    return response.json();
  }
});`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
