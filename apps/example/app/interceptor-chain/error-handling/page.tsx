"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";
import { FetchError, RequestConfig } from "next-unified-query";

export default function InterceptorErrorHandling() {
  const [errorInterceptorsRegistered, setErrorInterceptorsRegistered] =
    useState(false);
  const [errorExecutionLog, setErrorExecutionLog] = useState<string[]>([]);
  const [errorHandled, setErrorHandled] = useState(false);
  const [interceptorHandles, setInterceptorHandles] = useState<
    Array<{ remove: () => void }>
  >([]);

  const queryClient = useQueryClient();
  const interceptors = queryClient.getFetcher().interceptors;

  const registerErrorInterceptors = () => {
    // 로그 초기화
    setErrorExecutionLog([]);
    (window as any).__ERROR_EXECUTION_LOG__ = [];

    // Request Interceptor: 요청 전처리
    const requestInterceptorHandle = interceptors.request.use(
      (config: RequestConfig) => {
        const log = "request-interceptor";
        setErrorExecutionLog((prev) => [...prev, log]);
        (window as any).__ERROR_EXECUTION_LOG__.push(log);
        console.log("✅ Request Interceptor 실행");

        config.headers = config.headers || {};
        config.headers["X-Request-Source"] = "error-test";

        return config;
      }
    );

    // Error Interceptor: 에러 처리
    const errorInterceptorHandle = interceptors.error.use(
      (error: FetchError) => {
        const log = "error-interceptor-handled";
        setErrorExecutionLog((prev) => [...prev, "api-error-occurred", log]);
        (window as any).__ERROR_EXECUTION_LOG__.push("api-error-occurred", log);
        console.log("✅ Error Interceptor 실행");

        setErrorHandled(true);

        // 에러를 다시 던져서 useQuery의 error 상태로 전달
        throw error;
      }
    );

    setInterceptorHandles([requestInterceptorHandle, errorInterceptorHandle]);
    setErrorInterceptorsRegistered(true);
    (window as any).__ERROR_INTERCEPTORS_REGISTERED__ = true;
  };

  const { error, refetch, isLoading } = useQuery<any, FetchError>({
    cacheKey: ["error-chain-test"],
    url: "/api/error-chain-test",
    enabled: false,
  });

  const triggerError = async () => {
    setErrorHandled(false);
    await refetch();
  };

  const resetInterceptors = () => {
    // 인터셉터 제거
    interceptorHandles.forEach((handle) => handle.remove());
    setInterceptorHandles([]);
    setErrorInterceptorsRegistered(false);
    setErrorExecutionLog([]);
    setErrorHandled(false);
    (window as any).__ERROR_EXECUTION_LOG__ = [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            에러 처리 인터셉터 테스트
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 1: 에러 인터셉터 등록
              </h2>
              <div className="space-x-2">
                <button
                  onClick={registerErrorInterceptors}
                  disabled={errorInterceptorsRegistered}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  data-testid="register-error-interceptors-btn"
                >
                  {errorInterceptorsRegistered
                    ? "에러 인터셉터 등록됨"
                    : "에러 인터셉터 등록"}
                </button>
                <button
                  onClick={resetInterceptors}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  data-testid="reset-interceptors-btn"
                >
                  인터셉터 초기화
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 2: 에러 발생 API 호출
              </h2>
              <button
                onClick={triggerError}
                disabled={!errorInterceptorsRegistered || isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                data-testid="trigger-error-btn"
              >
                {isLoading ? "요청 중..." : "에러 발생시키기"}
              </button>
            </div>
          </div>
        </div>

        {/* 에러 실행 로그 */}
        {errorExecutionLog.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              에러 처리 실행 순서
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="error-execution-log"
            >
              {JSON.stringify(errorExecutionLog, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">
                에러 처리 흐름:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Request Interceptor → 요청 전처리</li>
                <li>API Call (Error) → 서버에서 500 에러 발생</li>
                <li>
                  Error Interceptor → 에러 감지 및 사용자 친화적 메시지 생성
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* 에러 처리 완료 상태 */}
        {errorHandled && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-6"
            data-testid="error-handled"
          >
            <h2 className="text-lg font-medium text-red-900 mb-4">
              에러 처리 완료
            </h2>

            {error && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-red-800 mb-2">원본 에러:</h3>
                  <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                    {error.message}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-red-800 mb-2">
                    사용자 친화적 메시지:
                  </h3>
                  <p
                    className="text-sm text-red-700 bg-red-100 p-2 rounded"
                    data-testid="user-error-message"
                  >
                    서버에 일시적인 문제가 발생했습니다. 잠시 후 다시
                    시도해주세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상태 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">현재 상태</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p>
              에러 인터셉터 등록:{" "}
              {errorInterceptorsRegistered ? "✅ 완료" : "❌ 미완료"}
            </p>
            <p>에러 처리: {errorHandled ? "✅ 완료" : "❌ 미완료"}</p>
            <p>에러 로그 개수: {errorExecutionLog.length}개</p>
          </div>
        </div>
      </div>
    </div>
  );
}
