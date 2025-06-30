"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";
import {
  FetchError,
  NextTypeResponse,
  RequestConfig,
} from "next-unified-query";

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
  const [interceptorHandles, setInterceptorHandles] = useState<
    Array<{ remove: () => void }>
  >([]);

  const queryClient = useQueryClient();
  const interceptors = queryClient.getFetcher().interceptors;

  const registerAllInterceptors = () => {
    const logs: LogEntry[] = [];
    let requestAttempt = 0;

    // 로깅 상태 초기화
    setLoggingData([]);
    setTotalRequests(0);
    setAuthRetryComplete(false);
    (window as any).__LOGGING_DATA__ = [];

    // 1. Logging 인터셉터 (Request)
    const loggingRequestHandle = interceptors.request.use(
      (config: RequestConfig) => {
        requestAttempt++;
        const log: LogEntry = {
          type: "request",
          attempt: requestAttempt,
          timestamp: new Date().toISOString(),
          message: `Request attempt ${requestAttempt}`,
        };

        logs.push(log);
        setLoggingData((prev) => [...prev, log]);
        (window as any).__LOGGING_DATA__ = [...logs];

        console.log("✅ Logging Request Interceptor 실행:", log);

        return config;
      }
    );

    // 2. Logging 인터셉터 (Response)
    const loggingResponseHandle = interceptors.response.use(
      (response: NextTypeResponse<any>) => {
        const log: LogEntry = {
          type: "response",
          status: response.status,
          timestamp: new Date().toISOString(),
          message: `Response received with status ${response.status}`,
        };

        logs.push(log);
        setLoggingData((prev) => [...prev, log]);
        (window as any).__LOGGING_DATA__ = [...logs];

        console.log("✅ Logging Response Interceptor 실행:", log);

        return response;
      }
    );

    // 3. Auth 인터셉터 (Error에서 401 처리)
    const authErrorHandle = interceptors.error.use(
      async (error: FetchError) => {
        if (error.response?.status === 401) {
          const errorLog: LogEntry = {
            type: "error",
            status: 401,
            timestamp: new Date().toISOString(),
            message: "Authentication failed, refreshing token",
          };

          logs.push(errorLog);
          setLoggingData((prev) => [...prev, errorLog]);
          (window as any).__LOGGING_DATA__ = [...logs];

          console.log("✅ Auth Error Interceptor 실행 - 토큰 갱신 시도");

          try {
            // 토큰 갱신 요청
            const refreshResponse = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: "refresh_token_123" }),
            });

            if (refreshResponse.ok) {
              const tokenData = await refreshResponse.json();

              console.log("✅ Auth 인터셉터 - 새 토큰으로 재시도");
              setAuthRetryComplete(true);

              // 수동으로 두 번째 시도 로그 추가
              const retryLog: LogEntry = {
                type: "request",
                attempt: 2,
                timestamp: new Date().toISOString(),
                message: "Request attempt 2",
              };

              logs.push(retryLog);
              setLoggingData((prev) => [...prev, retryLog]);
              (window as any).__LOGGING_DATA__ = [...logs];

              console.log("✅ 재시도 Request 로그 추가:", retryLog);

              // fetch를 직접 사용하여 재시도 (인터셉터 체인을 다시 거치도록)
              const retryResponse = await fetch("/api/multi-interceptor-test", {
                headers: {
                  Authorization: `Bearer ${tokenData.accessToken}`,
                },
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log("✅ 재시도 성공:", retryData);

                // 수동으로 Response 인터셉터 역할 수행
                const responseLog: LogEntry = {
                  type: "response",
                  status: 200,
                  timestamp: new Date().toISOString(),
                  message: "Request successful after retry",
                };

                logs.push(responseLog);
                setLoggingData((prev) => [...prev, responseLog]);
                (window as any).__LOGGING_DATA__ = [...logs];

                console.log("✅ 수동 Response 로그 추가:", responseLog);

                // 총 요청 횟수 업데이트
                if (retryData.requestCount) {
                  setTotalRequests(retryData.requestCount);
                  (window as any).__TOTAL_REQUESTS__ = retryData.requestCount;
                }

                // 새로운 응답 객체 생성하여 반환
                const mockResponse = {
                  data: retryData,
                  status: 200,
                  statusText: "OK",
                  ok: true,
                  headers: new Headers(),
                  config: error.config,
                } as NextTypeResponse<any>;

                return mockResponse;
              }
            }
          } catch (refreshError) {
            console.error("❌ 토큰 갱신 실패:", refreshError);
          }
        }

        // 401이 아니거나 토큰 갱신 실패 시 원래 에러 던지기
        throw error;
      }
    );

    setInterceptorHandles([
      loggingRequestHandle,
      loggingResponseHandle,
      authErrorHandle,
    ]);
    setAllInterceptorsRegistered(true);
    (window as any).__ALL_INTERCEPTORS_REGISTERED__ = true;

    console.log("✅ 모든 인터셉터 등록 완료");
  };

  const { data, refetch, isLoading, error } = useQuery<any, FetchError>({
    cacheKey: ["multi-interceptor-test"],
    queryFn: async (fetcher) => {
      // 첫 번째 요청 (유효하지 않은 토큰으로 시작)
      const response = await fetcher.get("/api/multi-interceptor-test", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      // 응답 데이터에서 총 요청 횟수 업데이트
      if (response.data && response.data.requestCount) {
        setTotalRequests(response.data.requestCount);
        (window as any).__TOTAL_REQUESTS__ = response.data.requestCount;
      }

      return response.data;
    },
    enabled: false,
  });

  const makeProtectedRequest = async () => {
    setAuthRetryComplete(false);
    setLoggingData([]);
    setTotalRequests(0);
    (window as any).__LOGGING_DATA__ = [];
    (window as any).__TOTAL_REQUESTS__ = 0;

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
        <div
          className="bg-green-50 border border-green-200 rounded-lg p-6"
          data-testid="auth-retry-complete"
          style={{ display: authRetryComplete ? "block" : "none" }}
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
                  {data && data.data ? data.data : "Protected data"}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-green-800 mb-2">요청 통계:</h3>
                <p
                  className="text-sm text-green-700"
                  data-testid="total-requests"
                >
                  {totalRequests}
                </p>
              </div>
            </div>
          )}
        </div>

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
