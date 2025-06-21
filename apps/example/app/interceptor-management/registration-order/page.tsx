"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "../../lib/query-client";

/**
 * 인터셉터 등록 순서 관리 테스트 페이지
 */
export default function InterceptorRegistrationOrder() {
  const [executionOrder, setExecutionOrder] = useState<string[]>([]);
  const [isOrderTestComplete, setIsOrderTestComplete] = useState(false);
  const [interceptorHandles, setInterceptorHandles] = useState<{
    A?: any;
    B?: any;
    C?: any;
  }>({});
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    cacheKey: ["order-test"],
    url: "/api/order-test",
    enabled: false,
  });

  const registerInterceptorA = () => {
    const fetcher = queryClient.getFetcher();

    const handle = fetcher.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        "x-interceptor-a": "true",
        "x-execution-order": config.headers?.["x-execution-order"]
          ? `${config.headers["x-execution-order"]},interceptor-a`
          : "interceptor-a",
      };
      return config;
    });

    setInterceptorHandles((prev) => ({ ...prev, A: handle }));
    alert("인터셉터 A가 등록되었습니다!");
  };

  const registerInterceptorB = () => {
    const fetcher = queryClient.getFetcher();

    const handle = fetcher.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        "x-interceptor-b": "true",
        "x-execution-order": config.headers?.["x-execution-order"]
          ? `${config.headers["x-execution-order"]},interceptor-b`
          : "interceptor-b",
      };
      return config;
    });

    setInterceptorHandles((prev) => ({ ...prev, B: handle }));
    alert("인터셉터 B가 등록되었습니다!");
  };

  const registerInterceptorC = () => {
    const fetcher = queryClient.getFetcher();

    const handle = fetcher.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        "x-interceptor-c": "true",
        "x-execution-order": config.headers?.["x-execution-order"]
          ? `${config.headers["x-execution-order"]},interceptor-c`
          : "interceptor-c",
      };
      return config;
    });

    setInterceptorHandles((prev) => ({ ...prev, C: handle }));
    alert("인터셉터 C가 등록되었습니다!");
  };

  const removeInterceptorB = () => {
    if (interceptorHandles.B) {
      interceptorHandles.B.remove();
      setInterceptorHandles((prev) => ({ ...prev, B: undefined }));
      alert("인터셉터 B가 제거되었습니다!");
    } else {
      alert("인터셉터 B가 등록되지 않았습니다!");
    }
  };

  const testExecutionOrder = async () => {
    try {
      refetch();
      // 데이터는 useQuery의 data를 통해 자동으로 업데이트됨
      setTimeout(() => {
        if (data) {
          const orderData = data as any;
          setExecutionOrder(orderData.executionOrder || []);
        }
        setIsOrderTestComplete(true);
      }, 100);
    } catch (error) {
      console.error("Order test failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>인터셉터 등록 순서 관리 테스트</h1>

      <div style={{ marginBottom: "20px" }}>
        <h3>인터셉터 등록</h3>
        <button
          data-testid="register-interceptor-a-btn"
          onClick={registerInterceptorA}
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
          인터셉터 A 등록
        </button>

        <button
          data-testid="register-interceptor-b-btn"
          onClick={registerInterceptorB}
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
          인터셉터 B 등록
        </button>

        <button
          data-testid="register-interceptor-c-btn"
          onClick={registerInterceptorC}
          style={{
            padding: "10px 15px",
            margin: "5px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          인터셉터 C 등록
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>인터셉터 관리</h3>
        <button
          data-testid="remove-interceptor-b-btn"
          onClick={removeInterceptorB}
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
          인터셉터 B 제거
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>실행 순서 테스트</h3>
        <button
          data-testid="test-execution-order-btn"
          onClick={testExecutionOrder}
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
          실행 순서 테스트
        </button>
      </div>

      {isOrderTestComplete && (
        <div data-testid="order-test-complete">
          <h3>✅ 실행 순서 테스트 완료</h3>
        </div>
      )}

      {executionOrder.length > 0 && (
        <div>
          <h3>인터셉터 실행 순서</h3>
          <div data-testid="execution-order" style={{ display: "none" }}>
            {JSON.stringify(executionOrder)}
          </div>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            {executionOrder.map((interceptor, index) => (
              <div key={index} style={{ marginBottom: "5px" }}>
                {index + 1}. {interceptor}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <h4>사용법:</h4>
        <ol>
          <li>인터셉터 A, B, C를 순서대로 등록</li>
          <li>실행 순서 테스트 버튼 클릭</li>
          <li>등록 순서대로 실행되는지 확인 (A → B → C)</li>
          <li>인터셉터 B 제거 후 다시 테스트</li>
          <li>A → C 순서로 실행되는지 확인</li>
        </ol>
      </div>
    </div>
  );
}
