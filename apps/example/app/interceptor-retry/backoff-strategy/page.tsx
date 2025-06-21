"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function BackoffStrategy() {
  const [retryStats, setRetryStats] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const queryClient = useQueryClient();

  const { refetch } = useQuery({
    cacheKey: ["unstable-endpoint"],
    url: "/api/unstable-endpoint",
    enabled: false,
  });

  const registerRetryInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    // Error 인터셉터에서 재시도 로직 구현
    fetcher.interceptors.error.use((error) => {
      const attempts = ((error as any).config?.__retryCount || 0) + 1;
      setCurrentAttempt(attempts);

      if (attempts <= 3) {
        // 백오프 지연 (1초, 2초, 3초)
        const delay = attempts * 1000;

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            (error as any).config.__retryCount = attempts;
            // 재시도를 위해 에러를 그대로 반환하여 재시도 로직이 계속되도록 함
            reject(error);
          }, delay);
        });
      }

      return Promise.reject(error);
    });

    alert("재시도 인터셉터가 등록되었습니다!");
  };

  const callUnstableApi = async () => {
    const startTime = Date.now();
    setCurrentAttempt(0);

    try {
      const response = await refetch();
      const endTime = Date.now();

      setSuccessData(response);
      setRetryStats({
        totalAttempts: currentAttempt || 1,
        totalRetries: Math.max(0, currentAttempt - 1),
        totalTime: endTime - startTime,
      });
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>재시도 및 백오프 전략 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
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
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          불안정한 API 호출
        </button>
      </div>

      {currentAttempt > 0 && currentAttempt <= 3 && (
        <div data-testid={`retry-attempt-${currentAttempt}`}>
          재시도 시도 #{currentAttempt}
        </div>
      )}

      {successData && (
        <div data-testid="retry-success">
          <h3>✅ 재시도 성공!</h3>
          <div data-testid="success-data" style={{ display: "none" }}>
            {JSON.stringify(successData)}
          </div>
        </div>
      )}

      {retryStats && (
        <div>
          <h3>재시도 통계</h3>
          <div data-testid="retry-stats" style={{ display: "none" }}>
            {JSON.stringify(retryStats)}
          </div>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            <div>총 시도 횟수: {retryStats.totalAttempts}</div>
            <div>재시도 횟수: {retryStats.totalRetries}</div>
            <div>총 소요 시간: {retryStats.totalTime}ms</div>
          </div>
        </div>
      )}
    </div>
  );
}
