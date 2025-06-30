"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function BackoffStrategy() {
  const [retryStats, setRetryStats] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState<number[]>([]);
  const [isRetrySuccess, setIsRetrySuccess] = useState(false);
  const [isRetryConfigured, setIsRetryConfigured] = useState(false);
  const queryClient = useQueryClient();
  const startTimeRef = useRef<number>(0);

  // 라이브러리의 내장 retry 기능을 사용한 쿼리
  const { refetch } = useQuery({
    cacheKey: ["unstable-endpoint-with-retry"],
    url: "/api/unstable-endpoint?forceFailure=true&attempt=1", // 강제 실패 모드
    enabled: false,
    // 👍 권장 방법: fetchConfig를 통한 retry 설정
    fetchConfig: {
      retry: {
        limit: 3, // 최대 3번 재시도
        statusCodes: [500, 503], // 500, 503 에러에서 재시도
        backoff: "exponential", // 지수 백오프 전략
      },
    },
  });

  const registerRetryInterceptor = () => {
    const fetcher = queryClient.getFetcher();
    let requestCount = 0;

    // Request 인터셉터에서 모든 요청 추적
    const requestHandle = fetcher.interceptors.request.use((config) => {
      if (config.url?.includes("/api/unstable-endpoint")) {
        requestCount++;

        // 첫 번째 요청이 아닌 경우는 재시도로 간주
        if (requestCount > 1) {
          setRetryAttempts((prev) => {
            const retryNumber = requestCount - 1;
            if (!prev.includes(retryNumber)) {
              return [...prev, retryNumber];
            }
            return prev;
          });
        }
      }
      return config;
    });

    // Response 인터셉터에서 성공 감지
    const responseHandle = fetcher.interceptors.response.use((response) => {
      if (response.config?.url?.includes("/api/unstable-endpoint")) {
        const endTime = Date.now();
        const totalTime = endTime - startTimeRef.current;

        setSuccessData(response.data);
        setIsRetrySuccess(true);

        const totalAttempts = requestCount;
        setRetryStats({
          totalAttempts,
          totalRetries: totalAttempts - 1,
          totalTime,
        });
      }
      return response;
    });

    // Error 인터셉터에서 실패한 재시도 추적
    const errorHandle = fetcher.interceptors.error.use((error) => {
      if (error.config?.url?.includes("/api/unstable-endpoint")) {
        // 에러가 발생해도 requestCount는 이미 증가했으므로 재시도 표시는 Request 인터셉터에서 처리됨
      }
      return error;
    });

    setIsRetryConfigured(true);
    alert("재시도 인터셉터가 등록되었습니다!");
  };

  const callUnstableApi = async () => {
    startTimeRef.current = Date.now();
    setRetryAttempts([]);
    setSuccessData(null);
    setRetryStats(null);
    setIsRetrySuccess(false);

    // registerRetryInterceptor에서 사용되는 requestCount 초기화를 위해
    // 새로운 인터셉터를 등록 (기존 것은 제거하고)
    const fetcher = queryClient.getFetcher();
    // 기존 인터셉터들을 제거하고 새로 등록
    registerRetryInterceptor();

    try {
      // ✅ useQuery의 refetch를 사용하여 내장 retry 기능 활용
      await refetch();
    } catch (error) {
      console.error("API call failed after all retries:", error);

      const endTime = Date.now();
      const totalTime = endTime - startTimeRef.current;

      setRetryStats({
        totalAttempts: retryAttempts.length + 1,
        totalRetries: retryAttempts.length,
        totalTime,
        finalError: (error as any).message || "Unknown error",
      });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>재시도 및 백오프 전략 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "15px",
            border: "1px solid #2196f3",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>
            📋 내장 Retry 설정 (fetchConfig)
          </h3>
          <div style={{ fontSize: "14px", color: "#424242" }}>
            <div>
              • <strong>재시도 제한:</strong> 3회
            </div>
            <div>
              • <strong>재시도 상태 코드:</strong> 500, 503
            </div>
            <div>
              • <strong>백오프 전략:</strong> 지수 백오프 (1초, 2초, 4초...)
            </div>
            <div>
              • <strong>사용 방법:</strong> useQuery → fetchConfig → retry
            </div>
            <div>
              • <strong>E2E 테스트 패턴:</strong> 처음 3번 실패(503) → 4번째
              성공(200)
            </div>
          </div>
        </div>

        <button
          data-testid="register-retry-interceptor-btn"
          onClick={registerRetryInterceptor}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          재시도 인터셉터 등록
        </button>

        <button
          data-testid="call-unstable-api-btn"
          onClick={callUnstableApi}
          disabled={!isRetryConfigured}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: isRetryConfigured ? "#dc3545" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isRetryConfigured ? "pointer" : "not-allowed",
          }}
        >
          불안정한 API 호출
        </button>
      </div>

      {/* 재시도 시도별 표시 */}
      {retryAttempts.map((attempt) => (
        <div
          key={attempt}
          data-testid={`retry-attempt-${attempt}`}
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "12px",
            margin: "8px 0",
            borderRadius: "6px",
            border: "1px solid #ffeaa7",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "18px" }}>🔄</div>
          <div>
            <strong>재시도 시도 #{attempt}</strong>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              지수 백오프 지연: ~
              {Math.min(1000 * Math.pow(2, attempt - 1), 10000)}ms
            </div>
          </div>
        </div>
      ))}

      {isRetrySuccess && (
        <div
          data-testid="retry-success"
          style={{
            backgroundColor: "#d4edda",
            color: "#155724",
            padding: "15px",
            margin: "15px 0",
            borderRadius: "6px",
            border: "1px solid #c3e6cb",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>✅ 재시도 성공!</h3>
          <div data-testid="success-data" style={{ display: "none" }}>
            {JSON.stringify(successData)}
          </div>
          <div style={{ fontSize: "14px", marginTop: "10px" }}>
            {successData && (
              <div>
                <strong>응답 데이터:</strong>{" "}
                {JSON.stringify(successData, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}

      {retryStats && (
        <div>
          <h3>📊 재시도 통계</h3>
          <div data-testid="retry-stats" style={{ display: "none" }}>
            {JSON.stringify(retryStats)}
          </div>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "14px",
              border: "1px solid #dee2e6",
            }}
          >
            <div>
              📊 총 시도 횟수: <strong>{retryStats.totalAttempts}</strong>
            </div>
            <div>
              🔄 재시도 횟수: <strong>{retryStats.totalRetries}</strong>
            </div>
            <div>
              ⏱️ 총 소요 시간: <strong>{retryStats.totalTime}ms</strong>
            </div>
            {retryStats.finalError && (
              <div style={{ color: "#dc3545", marginTop: "5px" }}>
                ❌ 최종 에러: {retryStats.finalError}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h4>🎯 테스트 시나리오:</h4>
        <ol>
          <li>재시도 인터셉터 등록 (추적용)</li>
          <li>useQuery + fetchConfig.retry로 내장 기능 사용</li>
          <li>E2E 모킹: 처음 3번 503 실패 → 4번째 200 성공</li>
          <li>지수 백오프 전략: 1초, 2초, 4초 지연</li>
          <li>최소 7초 이상 소요 (1+2+4 = 7초 + API 응답 시간)</li>
        </ol>

        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
            border: "1px solid #b0d4f1",
          }}
        >
          <strong>📚 라이브러리 사용법:</strong>
          <div
            style={{
              marginTop: "5px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            ✅ 권장: useQuery → fetchConfig.retry
            <br />
            ⚠️ 대안: fetcher.get(url, {`{retry: {...}}`})
          </div>
        </div>
      </div>
    </div>
  );
}
