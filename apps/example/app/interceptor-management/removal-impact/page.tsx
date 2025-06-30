"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

export default function InterceptorRemovalImpact() {
  const [firstResult, setFirstResult] = useState<any>(null);
  const [secondResult, setSecondResult] = useState<any>(null);
  const [interceptorHandle, setInterceptorHandle] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: longRequestData, refetch: refetchLongRequest } = useQuery({
    cacheKey: ["long-request-1"],
    url: "/api/long-request",
    enabled: false,
  });

  const { data: secondRequestData, refetch: refetchSecondRequest } = useQuery({
    cacheKey: ["long-request-2"],
    url: "/api/long-request",
    enabled: false,
  });

  // 첫 번째 요청 데이터가 업데이트되면 결과 저장
  useEffect(() => {
    if (longRequestData) {
      setFirstResult(longRequestData);
    }
  }, [longRequestData]);

  // 두 번째 요청 데이터가 업데이트되면 결과 저장
  useEffect(() => {
    if (secondRequestData) {
      setSecondResult(secondRequestData);
    }
  }, [secondRequestData]);

  const registerHeaderInterceptor = () => {
    const fetcher = queryClient.getFetcher();

    const handle = fetcher.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        "x-interceptor-present": "true",
      };
      return config;
    });

    setInterceptorHandle(handle);
    alert("헤더 인터셉터가 등록되었습니다!");
  };

  const removeHeaderInterceptor = () => {
    if (interceptorHandle) {
      interceptorHandle.remove();
      setInterceptorHandle(null);
      alert("헤더 인터셉터가 제거되었습니다!");
    } else {
      alert("제거할 인터셉터가 없습니다!");
    }
  };

  const startLongRequest = async () => {
    try {
      refetchLongRequest();
    } catch (error) {
      console.error("Long request failed:", error);
    }
  };

  const startSecondRequest = async () => {
    try {
      refetchSecondRequest();
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
          <div data-testid="first-request-result" style={{ display: "block" }}>
            {JSON.stringify(firstResult)}
          </div>
        </div>
      )}

      {secondResult && (
        <div data-testid="second-request-complete">
          <h3>✅ 두 번째 요청 완료</h3>
          <div data-testid="second-request-result" style={{ display: "block" }}>
            {JSON.stringify(secondResult)}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h4>테스트 시나리오:</h4>
        <ol>
          <li>헤더 인터셉터 등록</li>
          <li>긴 요청 시작 (2초 소요)</li>
          <li>요청 진행 중에 인터셉터 제거</li>
          <li>첫 번째 요청은 인터셉터 적용된 상태로 완료</li>
          <li>두 번째 요청은 인터셉터가 적용되지 않음</li>
        </ol>
      </div>
    </div>
  );
}
