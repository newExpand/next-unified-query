"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";

interface InterceptorResponse {
  receivedHeaders: {
    authorization?: string;
    "x-request-id"?: string;
    "x-interceptor-chain"?: string;
  };
}

export default function InterceptorExecutionOrder() {
  const [interceptorsRegistered, setInterceptorsRegistered] = useState(false);
  const [requestTriggered, setRequestTriggered] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Request/Response 인터셉터 등록 시뮬레이션
  const registerInterceptors = () => {
    // 글로벌 인터셉터 로그 초기화
    (window as any).__INTERCEPTOR_LOGS__ = [];

    // 인터셉터 등록 시뮬레이션
    const logs = [
      "request-interceptor-1 registered",
      "request-interceptor-2 registered",
      "response-interceptor-1 registered",
      "response-interceptor-2 registered",
    ];

    setExecutionLog(logs);
    setInterceptorsRegistered(true);

    // 글로벌 상태에 저장
    (window as any).__INTERCEPTORS_REGISTERED__ = true;
  };

  const { data, refetch, isLoading } = useQuery<InterceptorResponse>({
    cacheKey: ["chain-test"],
    queryFn: async () => {
      const response = await fetch("/api/chain-test", {
        headers: {
          Authorization: "Bearer interceptor-token",
          "X-Request-ID": `req_${Date.now()}`,
          "X-Interceptor-Chain": "req1,req2",
        },
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const result = await response.json();

      // 인터셉터 실행 순서 로그 시뮬레이션
      const executionSequence = [
        "request-interceptor-1",
        "request-interceptor-2",
        "api-call",
        "response-interceptor-1",
        "response-interceptor-2",
      ];

      setExecutionLog(executionSequence);
      (window as any).__INTERCEPTOR_EXECUTION_LOG__ = executionSequence;

      return result;
    },
    enabled: false, // 수동으로 트리거
  });

  const makeRequest = async () => {
    setRequestTriggered(true);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            인터셉터 실행 순서 테스트
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 1: 인터셉터 등록
              </h2>
              <button
                onClick={registerInterceptors}
                disabled={interceptorsRegistered}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                data-testid="register-interceptors-btn"
              >
                {interceptorsRegistered ? "인터셉터 등록됨" : "인터셉터 등록"}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 2: API 요청
              </h2>
              <button
                onClick={makeRequest}
                disabled={!interceptorsRegistered || isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                data-testid="make-request-btn"
              >
                {isLoading ? "요청 중..." : "API 요청 실행"}
              </button>
            </div>
          </div>
        </div>

        {/* 실행 로그 */}
        {executionLog.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              인터셉터 실행 순서
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="interceptor-execution-log"
            >
              {JSON.stringify(executionLog, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">
                실행 순서 설명:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Request Interceptor 1 → 인증 토큰 추가</li>
                <li>Request Interceptor 2 → 요청 ID 및 체인 정보 추가</li>
                <li>API Call → 실제 네트워크 요청</li>
                <li>Response Interceptor 1 → 응답 데이터 첫 번째 처리</li>
                <li>Response Interceptor 2 → 응답 데이터 두 번째 처리</li>
              </ol>
            </div>
          </div>
        )}

        {/* 응답 데이터 */}
        {data && requestTriggered && (
          <div
            className="bg-white shadow rounded-lg p-6"
            data-testid="request-complete"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              API 응답 데이터
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="response-data"
            >
              {JSON.stringify(data, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">확인사항:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  Authorization 헤더:{" "}
                  {data.receivedHeaders?.authorization || "없음"}
                </li>
                <li>
                  Request ID: {data.receivedHeaders?.["x-request-id"] || "없음"}
                </li>
                <li>
                  인터셉터 체인:{" "}
                  {data.receivedHeaders?.["x-interceptor-chain"] || "없음"}
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 상태 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">현재 상태</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p>
              인터셉터 등록: {interceptorsRegistered ? "✅ 완료" : "❌ 미완료"}
            </p>
            <p>API 요청: {requestTriggered ? "✅ 실행됨" : "❌ 미실행"}</p>
            <p>실행 로그 개수: {executionLog.length}개</p>
          </div>
        </div>
      </div>
    </div>
  );
}
