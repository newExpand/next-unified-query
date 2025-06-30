"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";
import { type RequestConfig, type NextTypeResponse } from "next-unified-query";

interface InterceptorResponse {
  receivedHeaders: {
    authorization?: string;
    "x-request-id"?: string;
    "x-interceptor-chain"?: string;
  };
  success: boolean;
  processedBy?: string[];
}

export default function InterceptorExecutionOrder() {
  const [interceptorsRegistered, setInterceptorsRegistered] = useState(false);
  const [requestTriggered, setRequestTriggered] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // QueryClient의 fetcher에서 인터셉터 가져오기
  const queryClient = useQueryClient();
  const fetcher = queryClient.getFetcher();
  const interceptors = fetcher.interceptors;

  // 실제 인터셉터 등록
  const registerInterceptors = () => {
    // 실행 로그 초기화
    setExecutionLog([]);

    // 글로벌 로그 초기화
    (window as any).__INTERCEPTOR_LOGS__ = [];

    // Request Interceptor 1: Authorization 헤더 추가
    const requestInterceptor1 = interceptors.request.use(
      (config: RequestConfig) => {
        const log = "1. request-interceptor-1";
        (window as any).__INTERCEPTOR_LOGS__.push(log);
        console.log("✅ Request Interceptor 1 실행");

        config.headers = config.headers || {};
        config.headers["Authorization"] = "Bearer interceptor-token";

        return config;
      }
    );

    // Request Interceptor 2: Request ID 및 체인 정보 추가
    const requestInterceptor2 = interceptors.request.use(
      (config: RequestConfig) => {
        const log = "2. request-interceptor-2";
        (window as any).__INTERCEPTOR_LOGS__.push(log);
        console.log("✅ Request Interceptor 2 실행");

        config.headers = config.headers || {};
        config.headers["X-Request-ID"] = `req_${Date.now()}`;
        config.headers["X-Interceptor-Chain"] = "req1,req2";

        return config;
      }
    );

    // Response Interceptor 1: 응답 데이터 첫 번째 처리
    const responseInterceptor1 = interceptors.response.use(
      (response: NextTypeResponse<any>) => {
        const log = "3. response-interceptor-1";
        (window as any).__INTERCEPTOR_LOGS__.push(log);
        console.log("✅ Response Interceptor 1 실행");

        // 응답 데이터에 처리 정보 추가
        if (response.data && typeof response.data === "object") {
          response.data.processedBy = response.data.processedBy || [];
          response.data.processedBy.push("response-interceptor-1");
        }

        return response;
      }
    );

    // Response Interceptor 2: 응답 데이터 두 번째 처리
    const responseInterceptor2 = interceptors.response.use(
      (response: NextTypeResponse<any>) => {
        const log = "4. response-interceptor-2";
        (window as any).__INTERCEPTOR_LOGS__.push(log);
        console.log("✅ Response Interceptor 2 실행");

        // 응답 데이터에 처리 정보 추가
        if (response.data && typeof response.data === "object") {
          response.data.processedBy = response.data.processedBy || [];
          response.data.processedBy.push("response-interceptor-2");
        }

        return response;
      }
    );

    setInterceptorsRegistered(true);

    // 인터셉터 핸들을 글로벌에 저장 (필요시 제거용)
    (window as any).__INTERCEPTOR_HANDLES__ = {
      requestInterceptor1,
      requestInterceptor2,
      responseInterceptor1,
      responseInterceptor2,
    };

    console.log("인터셉터 등록 완료");
  };

  const { data, refetch, isLoading } = useQuery<InterceptorResponse>({
    cacheKey: ["chain-test"],
    url: "/api/chain-test",
    enabled: false, // 수동으로 트리거
  });

  const makeRequest = async () => {
    setRequestTriggered(true);

    // 로그 초기화 (새로운 요청 시작)
    (window as any).__INTERCEPTOR_LOGS__ = [];
    setExecutionLog([]);

    // 실제 API 호출 (인터셉터가 알아서 로그를 기록함)
    await refetch();

    // 응답 후 최종 로그 업데이트 (React 상태 업데이트 타이밍 고려)
    setTimeout(() => {
      const finalLogs = [...(window as any).__INTERCEPTOR_LOGS__];
      setExecutionLog([...finalLogs]);
      (window as any).__INTERCEPTOR_EXECUTION_LOG__ = finalLogs;
    }, 50);
  };

  // 인터셉터 제거 함수
  const clearInterceptors = () => {
    interceptors.request.clear();
    interceptors.response.clear();
    setInterceptorsRegistered(false);
    setExecutionLog([]);
    setRequestTriggered(false);
    (window as any).__INTERCEPTOR_LOGS__ = [];
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
              <div className="space-x-2">
                <button
                  onClick={registerInterceptors}
                  disabled={interceptorsRegistered}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  data-testid="register-interceptors-btn"
                >
                  {interceptorsRegistered ? "인터셉터 등록됨" : "인터셉터 등록"}
                </button>
                <button
                  onClick={clearInterceptors}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  data-testid="clear-interceptors-btn"
                >
                  인터셉터 초기화
                </button>
              </div>
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
                <li>
                  Response 처리:{" "}
                  {data.processedBy ? data.processedBy.join(" → ") : "없음"}
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
            <p>
              인터셉터 등록 상태:{" "}
              {interceptorsRegistered ? "활성화됨" : "비활성화됨"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
