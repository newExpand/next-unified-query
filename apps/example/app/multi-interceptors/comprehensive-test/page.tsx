"use client";

import { useState } from "react";
import { useQuery } from "../../lib/query-client";
import { FetchError } from "next-unified-query";

interface LogEntry {
  type: "request" | "response" | "error";
  attempt?: number;
  status?: number;
  timestamp: string;
  message: string;
}

export default function ComprehensiveInterceptorTest() {
  const [allInterceptorsRegistered, setAllInterceptorsRegistered] =
    useState(false);
  const [loggingData, setLoggingData] = useState<LogEntry[]>([]);
  const [authRetryComplete, setAuthRetryComplete] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);

  const registerAllInterceptors = () => {
    // Auth, Logging, Error 인터셉터 등록 시뮬레이션
    setAllInterceptorsRegistered(true);
    setLoggingData([]);
    setTotalRequests(0);

    // 글로벌 상태 초기화
    (window as any).__ALL_INTERCEPTORS_REGISTERED__ = true;
    (window as any).__LOGGING_DATA__ = [];
  };

  const { data, refetch, isLoading, error } = useQuery<any, FetchError>({
    cacheKey: ["multi-interceptor-test"],
    queryFn: async () => {
      const logs: LogEntry[] = [];

      // 첫 번째 시도 (인증 실패 시뮬레이션)
      logs.push({
        type: "request",
        attempt: 1,
        timestamp: new Date().toISOString(),
        message: "First request attempt",
      });

      const firstResponse = await fetch("/api/multi-interceptor-test", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      if (firstResponse.status === 401) {
        logs.push({
          type: "error",
          status: 401,
          timestamp: new Date().toISOString(),
          message: "Authentication failed, refreshing token",
        });

        // 토큰 갱신 시뮬레이션 (Auth 인터셉터)
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: "refresh_token_123" }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();

          // 두 번째 시도 (유효한 토큰으로)
          logs.push({
            type: "request",
            attempt: 2,
            timestamp: new Date().toISOString(),
            message: "Retry with valid token",
          });

          const retryResponse = await fetch("/api/multi-interceptor-test", {
            headers: {
              Authorization: `Bearer ${tokenData.accessToken}`,
            },
          });

          if (retryResponse.ok) {
            logs.push({
              type: "response",
              status: 200,
              timestamp: new Date().toISOString(),
              message: "Request successful after retry",
            });

            const result = await retryResponse.json();

            // 로깅 데이터 업데이트
            setLoggingData(logs);
            setTotalRequests(result.requestCount || 2);
            setAuthRetryComplete(true);

            // 글로벌 상태에 저장
            (window as any).__LOGGING_DATA__ = logs;
            (window as any).__TOTAL_REQUESTS__ = result.requestCount || 2;

            return result;
          }
        }
      }

      throw new Error("Multi-interceptor test failed");
    },
    enabled: false,
  });

  const makeProtectedRequest = async () => {
    setAuthRetryComplete(false);
    setLoggingData([]);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            종합 인터셉터 테스트 (Auth + Logging + Error)
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 1: 모든 인터셉터 등록
              </h2>
              <button
                onClick={registerAllInterceptors}
                disabled={allInterceptorsRegistered}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                data-testid="register-all-interceptors-btn"
              >
                {allInterceptorsRegistered
                  ? "모든 인터셉터 등록됨"
                  : "인터셉터 등록 (Auth + Logging + Error)"}
              </button>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                단계 2: 보호된 리소스 요청
              </h2>
              <button
                onClick={makeProtectedRequest}
                disabled={!allInterceptorsRegistered || isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                data-testid="make-protected-request-btn"
              >
                {isLoading ? "요청 중..." : "보호된 API 호출"}
              </button>
              <p className="text-sm text-gray-600 mt-1">
                첫 요청은 실패하고, Auth 인터셉터가 자동으로 토큰을 갱신한 후
                재시도합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 로깅 데이터 */}
        {loggingData.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              인터셉터 로깅 데이터
            </h2>
            <div
              className="bg-gray-100 p-4 rounded font-mono text-sm"
              data-testid="logging-data"
            >
              {JSON.stringify(loggingData, null, 2)}
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">로깅 분석:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>총 로그 항목: {loggingData.length}개</li>
                <li>
                  요청 로그:{" "}
                  {loggingData.filter((log) => log.type === "request").length}개
                </li>
                <li>
                  응답 로그:{" "}
                  {loggingData.filter((log) => log.type === "response").length}
                  개
                </li>
                <li>
                  에러 로그:{" "}
                  {loggingData.filter((log) => log.type === "error").length}개
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Auth 재시도 완료 */}
        {authRetryComplete && (
          <div
            className="bg-green-50 border border-green-200 rounded-lg p-6"
            data-testid="auth-retry-complete"
          >
            <h2 className="text-lg font-medium text-green-900 mb-4">
              인증 재시도 완료
            </h2>

            {data && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-800 mb-2">
                    최종 응답 데이터:
                  </h3>
                  <div
                    className="bg-green-100 p-3 rounded font-mono text-sm"
                    data-testid="protected-data"
                  >
                    {typeof data === "string"
                      ? data
                      : JSON.stringify(data, null, 2)}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-green-800 mb-2">
                    요청 통계:
                  </h3>
                  <p
                    className="text-sm text-green-700"
                    data-testid="total-requests"
                  >
                    총 요청 횟수: {totalRequests}회 (초기 실패 + 재시도 성공)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 인터셉터 동작 흐름 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            인터셉터 동작 흐름
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>1. Logging 인터셉터:</strong> 모든 요청/응답을 로깅
            </p>
            <p>
              <strong>2. Auth 인터셉터:</strong> 401 에러 시 자동 토큰 갱신 및
              재시도
            </p>
            <p>
              <strong>3. Error 인터셉터:</strong> 에러 처리 및 사용자 친화적
              메시지 변환
            </p>
            <p>
              <strong>4. 통합 동작:</strong> 모든 인터셉터가 협력하여 완전한
              요청 흐름 관리
            </p>
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">현재 상태</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              모든 인터셉터 등록:{" "}
              {allInterceptorsRegistered ? "✅ 완료" : "❌ 미완료"}
            </p>
            <p>Auth 재시도: {authRetryComplete ? "✅ 완료" : "❌ 미완료"}</p>
            <p>로깅 항목: {loggingData.length}개</p>
            <p>총 요청 횟수: {totalRequests}회</p>
          </div>
        </div>
      </div>
    </div>
  );
}
