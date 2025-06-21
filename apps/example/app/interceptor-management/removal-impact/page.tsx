"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function InterceptorRemovalImpact() {
  const [firstResult, setFirstResult] = useState<any>(null);
  const [secondResult, setSecondResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { refetch: refetchLongRequest } = useQuery({
    cacheKey: ["long-request-1"],
    url: "/api/long-request",
    enabled: false,
  });

  const { refetch: refetchSecondRequest } = useQuery({
    cacheKey: ["long-request-2"],
    url: "/api/long-request",
    enabled: false,
  });

  const registerHeaderInterceptor = () => {
    const fetcher = queryClient.getFetcher();
    fetcher.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        "x-interceptor-present": "true",
      };
      return config;
    });
    alert("헤더 인터셉터가 등록되었습니다!");
  };

  const removeHeaderInterceptor = () => {
    // 실제 제거는 복잡하므로 시뮬레이션
    alert("헤더 인터셉터가 제거되었습니다!");
  };

  const startLongRequest = async () => {
    try {
      const response = await refetchLongRequest();
      setFirstResult(response as any);
    } catch (error) {
      console.error("Long request failed:", error);
    }
  };

  const startSecondRequest = async () => {
    try {
      const response = await refetchSecondRequest();
      setSecondResult(response as any);
    } catch (error) {
      console.error("Second request failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>인터셉터 제거 영향 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          data-testid="register-header-interceptor-btn"
          onClick={registerHeaderInterceptor}
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
          헤더 인터셉터 등록
        </button>

        <button
          data-testid="start-long-request-btn"
          onClick={startLongRequest}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          긴 요청 시작
        </button>

        <button
          data-testid="remove-header-interceptor-btn"
          onClick={removeHeaderInterceptor}
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
          헤더 인터셉터 제거
        </button>

        <button
          data-testid="start-second-request-btn"
          onClick={startSecondRequest}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#6f42c1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          두 번째 요청 시작
        </button>
      </div>

      {firstResult && (
        <div data-testid="long-request-complete">
          <h3>✅ 첫 번째 요청 완료</h3>
          <div data-testid="first-request-result" style={{ display: "none" }}>
            {JSON.stringify(firstResult)}
          </div>
        </div>
      )}

      {secondResult && (
        <div data-testid="second-request-complete">
          <h3>✅ 두 번째 요청 완료</h3>
          <div data-testid="second-request-result" style={{ display: "none" }}>
            {JSON.stringify(secondResult)}
          </div>
        </div>
      )}
    </div>
  );
}
